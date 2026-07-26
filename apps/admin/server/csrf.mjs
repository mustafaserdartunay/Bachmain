/**
 * Double-submit CSRF for cookie-authenticated admin / membership API.
 */
import crypto from 'node:crypto'

const CSRF_COOKIE = 'bachmain_csrf'
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

const CSRF_EXEMPT = new Set([
  'auth/login',
  'auth/register',
  'auth/forgot-password',
  'auth/reset-password',
  'auth/verify-email',
  'staff/login',
  'billing/webhook',
  'billing/webhooks/stripe',
  'payments/webhook',
  'auth/csrf',
])

function parseCookies(req) {
  const header = req.headers?.cookie || ''
  const out = {}
  String(header)
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf('=')
      if (idx < 0) return
      out[decodeURIComponent(part.slice(0, idx).trim())] = decodeURIComponent(
        part.slice(idx + 1).trim(),
      )
    })
  return out
}

function tokensMatch(a, b) {
  try {
    const left = Buffer.from(String(a))
    const right = Buffer.from(String(b))
    if (left.length !== right.length) return false
    return crypto.timingSafeEqual(left, right)
  } catch {
    return false
  }
}

export function buildCsrfCookie(token, { clear = false } = {}) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  const parts = [
    `${CSRF_COOKIE}=${clear ? '' : encodeURIComponent(token || '')}`,
    'Path=/',
    clear ? 'Max-Age=0' : `Max-Age=${60 * 60 * 24}`,
    secure ? 'Secure' : '',
    'SameSite=Lax',
  ].filter(Boolean)
  if (secure) parts.push('Domain=.bachmain.com')
  return parts.join('; ')
}

export function issueCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hasBearer(req) {
  const auth = req.headers?.authorization || ''
  return auth.startsWith('Bearer ') && auth.length > 20
}

function hasSessionCookie(req) {
  const cookies = parseCookies(req)
  return Boolean(cookies.bachmain_session || cookies.bachmain_staff)
}

/**
 * @returns {{ ok: true } | { ok: false, status: number, body: object, cookie?: string }}
 */
export function assertCsrf(req, apiPath = '') {
  const method = req.method || 'GET'
  if (SAFE.has(method)) return { ok: true }

  const path = String(apiPath || '').replace(/^\//, '')
  if (CSRF_EXEMPT.has(path) || path.startsWith('billing/webhooks/')) return { ok: true }
  if (path.includes('webhook')) return { ok: true }

  // Bearer-only callers (no session cookie) skip CSRF
  if (hasBearer(req) && !hasSessionCookie(req)) return { ok: true }
  if (!hasSessionCookie(req)) return { ok: true }

  const cookies = parseCookies(req)
  const cookieToken = cookies[CSRF_COOKIE] || ''
  const headerToken = String(
    req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || '',
  ).trim()

  if (!cookieToken || !headerToken || !tokensMatch(cookieToken, headerToken)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'CSRF_REJECTED',
        message: 'CSRF doğrulaması başarısız — GET /api/auth/csrf',
      },
    }
  }
  return { ok: true }
}
