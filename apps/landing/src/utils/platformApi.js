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

/** Prefer centralized apps/api (/v1). Fall back to legacy yonetim API. */
export function getPlatformApiBase() {
  if (DEFAULT_V1_API) return String(DEFAULT_V1_API).replace(/\/$/, '')
  const platform = readEnv('NEXT_PUBLIC_PLATFORM_API_URL') || readEnv('VITE_PLATFORM_API_URL')
  if (platform) return String(platform).replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8080'
    }
  }
  return DEFAULT_YONETIM_API
}

/** SaaS üyelik + faturalama SoT: yonetim (havale onay / müşteri paket) */
export function getYonetimApiBase() {
  const yonetim = readEnv('NEXT_PUBLIC_YONETIM_API_URL') || readEnv('VITE_YONETIM_API_URL')
  if (yonetim) return String(yonetim).replace(/\/$/, '')
  return DEFAULT_YONETIM_API
}

function isV1Base(base) {
  return /:8080$|api\.bachmain\.com|\/v1$/.test(base) || Boolean(DEFAULT_V1_API)
}

export async function platformPost(path, body, { token, base } = {}) {
  const apiBase = (base || getPlatformApiBase()).replace(/\/$/, '')
  const clean = String(path).replace(/^\//, '')

  let urlPath = clean
  if (!base && (isV1Base(apiBase) || apiBase.includes('8080'))) {
    if (clean === 'leads/demo' || clean === 'demo-requests') urlPath = 'v1/leads/demo'
    else if (clean === 'auth/register') urlPath = 'v1/auth/register'
    else if (clean === 'auth/login') urlPath = 'v1/auth/login'
    else if (!clean.startsWith('v1/')) {
      urlPath = clean.startsWith('auth/') || clean.startsWith('leads/') ? `v1/${clean}` : clean
    }
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${apiBase}/${urlPath}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body || {}),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error
    err.status = res.status
    throw err
  }

  if (data.tokens?.accessToken && !data.token) {
    data.token = data.tokens.accessToken
  }
  return data
}

/** Register + billing checkout against yonetim (payment approval plane). */
export function yonetimPost(path, body, opts = {}) {
  return platformPost(path, body, { ...opts, base: getYonetimApiBase() })
}

function safeAppPath(next) {
  if (!next || typeof next !== 'string') return '/'
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export function redirectToAppWithToken(token) {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const path = safeAppPath(params.get('next'))
  const url = new URL(path, APP_URL)
  if (token) url.searchParams.set('authToken', token)
  window.location.href = url.toString()
}

export function redirectToAppLogin() {
  window.location.href = LOGIN_URL
}

export { APP_URL, LOGIN_URL }
