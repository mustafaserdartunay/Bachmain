function readEnv(key) {
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key]
    }
  } catch {
    /* ignore */
  }
  return ''
}

const DEFAULT_YONETIM_API = 'https://yonetim.bachmain.com/api'
const DEFAULT_V1_API = readEnv('NEXT_PUBLIC_API_URL') || readEnv('VITE_API_URL') || ''
const APP_URL = 'https://uygulama.bachmain.com'
const LOGIN_URL = 'https://bachmain.com/giris'
const NETWORK_ERROR_MESSAGE =
  'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'

function stripSlash(url) {
  return String(url || '').replace(/\/$/, '')
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

function isMarketingHost(hostname) {
  return (
    hostname === 'bachmain.com' ||
    hostname === 'www.bachmain.com' ||
    (hostname.endsWith('.vercel.app') && hostname.includes('bachmain'))
  )
}

function uniqueBases(list) {
  const out = []
  for (const item of list) {
    const clean = stripSlash(item)
    if (clean && !out.includes(clean)) out.push(clean)
  }
  return out
}

/** Prefer centralized apps/api (/v1). Fall back to legacy yonetim API. */
export function getPlatformApiBase() {
  if (DEFAULT_V1_API) return stripSlash(DEFAULT_V1_API)
  const platform = readEnv('NEXT_PUBLIC_PLATFORM_API_URL') || readEnv('VITE_PLATFORM_API_URL')
  if (platform) return stripSlash(platform)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (isLocalHost(host)) {
      return 'http://127.0.0.1:8080'
    }
  }
  return DEFAULT_YONETIM_API
}

/**
 * SaaS üyelik + faturalama SoT: yonetim.
 * Local WEB (5180) → yerel yönetim; production → yonetim, same-origin /api yedek.
 */
export function getYonetimApiBases() {
  const yonetim = readEnv('NEXT_PUBLIC_YONETIM_API_URL') || readEnv('VITE_YONETIM_API_URL')
  if (yonetim) return uniqueBases([yonetim])
  if (typeof window === 'undefined') return [DEFAULT_YONETIM_API]

  const { hostname, origin } = window.location
  if (isLocalHost(hostname)) {
    return uniqueBases(['http://127.0.0.1:5200/api', `${origin}/api`, DEFAULT_YONETIM_API])
  }
  if (isMarketingHost(hostname)) {
    return uniqueBases([DEFAULT_YONETIM_API, `${origin}/api`])
  }
  return [DEFAULT_YONETIM_API]
}

export function getYonetimApiBase() {
  return getYonetimApiBases()[0] || DEFAULT_YONETIM_API
}

function isV1Base(base) {
  return /:8080$|api\.bachmain\.com|\/v1$/.test(base) || Boolean(DEFAULT_V1_API)
}

function isNetworkFetchError(err) {
  if (!err) return false
  if (err.name === 'TypeError' || err.name === 'AbortError' || err.name === 'TimeoutError') {
    return true
  }
  const msg = String(err.message || err)
  return /failed to fetch|networkerror|load failed|network request failed|aborted/i.test(msg)
}

function withTimeout(init) {
  if (init?.signal) return init
  if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return init
  return { ...init, signal: AbortSignal.timeout(15000) }
}

async function parseJsonSafe(res) {
  return res.json().catch(() => ({}))
}

function throwHttpError(res, data) {
  const err = new Error(data.message || data.error || `HTTP_${res.status}`)
  err.code = data.error
  err.status = res.status
  throw err
}

async function fetchWithFallback(bases, buildUrl, init) {
  let lastNetworkError = null
  for (let i = 0; i < bases.length; i += 1) {
    const apiBase = bases[i]
    try {
      const res = await fetch(buildUrl(apiBase), withTimeout(init))
      const type = String(res.headers.get('content-type') || '')
      const canRetry = i < bases.length - 1 && !res.ok && (res.status === 404 || res.status === 405)
      if (canRetry && !type.includes('json')) {
        lastNetworkError = new Error(`HTTP_${res.status}`)
        continue
      }
      return { res, apiBase }
    } catch (err) {
      if (!isNetworkFetchError(err)) throw err
      lastNetworkError = err
    }
  }
  const wrapped = new Error(NETWORK_ERROR_MESSAGE)
  wrapped.cause = lastNetworkError
  wrapped.code = 'NETWORK_ERROR'
  throw wrapped
}

export async function platformPost(path, body, { token, base, bases } = {}) {
  const clean = String(path).replace(/^\//, '')
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const resolvedBases = uniqueBases(bases || [base || getPlatformApiBase()])
  const mapV1 = !base && !bases
  const { res } = await fetchWithFallback(
    resolvedBases,
    (apiBase) => {
      let urlPath = clean
      if (mapV1 && (isV1Base(apiBase) || apiBase.includes('8080'))) {
        if (clean === 'leads/demo' || clean === 'demo-requests') urlPath = 'v1/leads/demo'
        else if (clean === 'auth/register') urlPath = 'v1/auth/register'
        else if (clean === 'auth/login') urlPath = 'v1/auth/login'
        else if (!clean.startsWith('v1/')) {
          urlPath = clean.startsWith('auth/') || clean.startsWith('leads/') ? `v1/${clean}` : clean
        }
      }
      return `${stripSlash(apiBase)}/${urlPath}`
    },
    {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body || {}),
    },
  )

  const data = await parseJsonSafe(res)
  if (!res.ok) throwHttpError(res, data)
  if (data.tokens?.accessToken && !data.token) {
    data.token = data.tokens.accessToken
  }
  return data
}

/** Register + billing checkout against yonetim (payment approval plane). */
export function yonetimPost(path, body, opts = {}) {
  const bases = opts.base ? uniqueBases([opts.base]) : getYonetimApiBases()
  return platformPost(path, body, { ...opts, bases })
}

export async function yonetimGet(path, { token } = {}) {
  const clean = String(path).replace(/^\//, '')
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const { res } = await fetchWithFallback(
    getYonetimApiBases(),
    (apiBase) => `${stripSlash(apiBase)}/${clean}`,
    {
      method: 'GET',
      credentials: 'include',
      headers,
    },
  )
  const data = await parseJsonSafe(res)
  if (!res.ok) throwHttpError(res, data)
  return data
}

function safeAppPath(next) {
  if (!next || typeof next !== 'string') return '/'
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

/** Website-local paths that should not SSO into the app shell. */
function isWebsiteLocalPath(path) {
  return (
    path.startsWith('/paketler/') ||
    path.startsWith('/fiyatlar') ||
    path.startsWith('/register') ||
    path.startsWith('/uye-ol')
  )
}

function persistClientToken(token) {
  try {
    localStorage.setItem('bachmain_token', token)
    localStorage.setItem('bachmain_access_token', token)
  } catch {
    /* ignore */
  }
  try {
    const cookie = [
      `bachmain_token=${encodeURIComponent(token)}`,
      'Path=/',
      'Max-Age=604800',
      'SameSite=None',
      'Secure',
    ]
    if (
      typeof location !== 'undefined' &&
      (location.hostname === 'bachmain.com' || location.hostname.endsWith('.bachmain.com'))
    ) {
      cookie.push('Domain=.bachmain.com')
    }
    document.cookie = cookie.join('; ')
  } catch {
    /* ignore */
  }
}

async function issueStudioSsoCode(token) {
  try {
    const data = await yonetimPost('auth/sso-ticket', { token }, { token })
    return String(data?.code || '').trim()
  } catch {
    return ''
  }
}

async function resolveStudioOrigin() {
  try {
    await fetch('https://studio.bachmain.com/', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(1200),
    })
    return 'https://studio.bachmain.com'
  } catch {
    return 'https://bachmain-studio.vercel.app'
  }
}

export async function redirectToAppWithToken(token) {
  if (!token) {
    console.warn('[bachmain] redirectToAppWithToken called without token')
    window.location.replace(LOGIN_URL)
    return
  }
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const nextRaw = params.get('next')

  const nextNorm = String(nextRaw || '').trim()
  if (nextNorm === 'studio' || nextNorm === '/studio' || nextNorm.startsWith('/studio/')) {
    persistClientToken(token)
    const code = await issueStudioSsoCode(token)
    const origin = await resolveStudioOrigin()
    const url = new URL(`${origin}/`)
    if (code) url.searchParams.set('sso', code)
    else url.searchParams.set('authToken', token)
    window.location.replace(url.toString())
    return
  }

  persistClientToken(token)
  const path = safeAppPath(nextRaw)

  if (isWebsiteLocalPath(path)) {
    window.location.replace(path)
    return
  }

  const url = new URL(path, APP_URL)
  const code = await issueStudioSsoCode(token)
  if (code) url.searchParams.set('sso', code)
  url.searchParams.set('authToken', token)
  window.location.replace(url.toString())
}

export function redirectToAppLogin() {
  window.location.href = LOGIN_URL
}

export { APP_URL, LOGIN_URL }
