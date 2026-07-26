/**
 * CRM ↔ Platform membership API (yonetim.bachmain.com).
 *
 * Security note: access tokens in localStorage remain XSS-sensitive.
 * Prefer server HttpOnly session (admin) + short-lived access; do not mirror
 * tokens into document.cookie (readable by JS = worse CSRF/XSS surface).
 */
import { getAuthCookie, clearAuthCookie } from './authCookies'

const TOKEN_KEY = 'bachmain_auth_token'
const USER_KEY = 'bachmain_auth_user'
const MEMORY_ONLY = String(import.meta.env.VITE_AUTH_MEMORY_TOKEN || '').trim() === '1'

/** In-memory access token (optional hardening when VITE_AUTH_MEMORY_TOKEN=1). */
let memoryToken = null

export function getPlatformApiBase() {
  if (import.meta.env.VITE_PLATFORM_API_URL)
    return import.meta.env.VITE_PLATFORM_API_URL.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')) {
    return 'https://yonetim.bachmain.com/api'
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://127.0.0.1:5201/api'
  }
  return 'https://yonetim.bachmain.com/api'
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readCsrfToken() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )bachmain_csrf=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function getStoredSession() {
  const token =
    memoryToken ||
    (!MEMORY_ONLY ? localStorage.getItem(TOKEN_KEY) : null) ||
    getAuthCookie('bachmain_token')
  const user = readStoredUser()
  return { token, user }
}

export function persistSession({ token, user }) {
  if (token) {
    memoryToken = token
    if (!MEMORY_ONLY) localStorage.setItem(TOKEN_KEY, token)
    // Intentionally NOT writing token to document.cookie (non-HttpOnly XSS vector).
  }
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent('bachmain:auth-changed', { detail: { user } }))
}

export function clearSession() {
  memoryToken = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  clearAuthCookie('bachmain_token')
  window.dispatchEvent(new CustomEvent('bachmain:auth-changed', { detail: { user: null } }))
}

async function authRequest(path, { method = 'GET', body } = {}) {
  const base = getPlatformApiBase()
  const { token } = getStoredSession()
  const csrf = readCsrfToken()
  const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.code = data.error
    err.status = res.status
    throw err
  }
  return data
}

export async function registerAccount(payload) {
  const data = await authRequest('auth/register', { method: 'POST', body: payload })
  persistSession({ token: data.token, user: data.user })
  return data
}

export async function loginAccount(payload) {
  const data = await authRequest('auth/login', { method: 'POST', body: payload })
  persistSession({ token: data.token, user: data.user })
  return data
}

export async function fetchCurrentUser() {
  const data = await authRequest('auth/me')
  if (data.user) persistSession({ token: getStoredSession().token, user: data.user })
  return data.user
}

export async function completeOnboarding() {
  const data = await authRequest('auth/onboarding/complete', { method: 'POST', body: {} })
  if (data.user) persistSession({ token: getStoredSession().token, user: data.user })
  return data.user
}

export async function logoutAccount() {
  try {
    await authRequest('auth/logout', { method: 'POST', body: {} })
  } catch {
    // ignore network errors on logout
  }
  clearSession()
}

export async function requestPasswordReset(email) {
  return authRequest('auth/forgot-password', { method: 'POST', body: { email } })
}

export async function resetPasswordWithToken({ token, password }) {
  return authRequest('auth/reset-password', { method: 'POST', body: { token, password } })
}

export async function verifyEmailWithToken(token) {
  return authRequest('auth/verify-email', { method: 'POST', body: { token } })
}

/** Fetch CSRF cookie for cookie-authenticated mutating calls. */
export async function ensureCsrfToken() {
  try {
    await authRequest('auth/csrf')
  } catch {
    /* optional until server ships endpoint */
  }
  return readCsrfToken()
}
