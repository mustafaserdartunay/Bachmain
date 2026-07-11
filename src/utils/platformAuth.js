/**
 * CRM ↔ Platform membership API (yonetim.bachmain.com).
 */
import { setAuthCookie, getAuthCookie, clearAuthCookie } from './authCookies'

const TOKEN_KEY = 'bachmain_auth_token'
const USER_KEY = 'bachmain_auth_user'

export function getPlatformApiBase() {
  if (import.meta.env.VITE_PLATFORM_API_URL) return import.meta.env.VITE_PLATFORM_API_URL.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')) {
    return 'https://yonetim.bachmain.com/api'
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
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

export function getStoredSession() {
  const token = localStorage.getItem(TOKEN_KEY) || getAuthCookie('bachmain_token')
  const user = readStoredUser()
  return { token, user }
}

export function persistSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    setAuthCookie('bachmain_token', token)
  }
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new CustomEvent('bachmain:auth-changed', { detail: { user } }))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  clearAuthCookie('bachmain_token')
  window.dispatchEvent(new CustomEvent('bachmain:auth-changed', { detail: { user: null } }))
}

async function authRequest(path, { method = 'GET', body } = {}) {
  const base = getPlatformApiBase()
  const { token } = getStoredSession()
  const res = await fetch(`${base}/${path.replace(/^\//, '')}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function logoutAccount() {
  try {
    await authRequest('auth/logout', { method: 'POST', body: {} })
  } catch {
    // ignore network errors on logout
  }
  clearSession()
}
