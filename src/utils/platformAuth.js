/**
 * CRM ↔ Platform membership API (yonetim.bachmain.com).
 */
import { setAuthCookie, getAuthCookie, clearAuthCookie } from './authCookies'

const TOKEN_KEY = 'bachmain_auth_token'
const USER_KEY = 'bachmain_auth_user'

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
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    window.dispatchEvent(new CustomEvent('bachmain:auth-changed', { detail: { user } }))
  }
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

export async function fetchAccessibleCompanies() {
  const data = await authRequest('auth/companies')
  return {
    companies: Array.isArray(data.companies) ? data.companies : [],
    activeTenantCode: data.activeTenantCode || null,
  }
}

export async function switchActiveCompany(tenantCode) {
  const data = await authRequest('auth/company/switch', {
    method: 'POST',
    body: { tenantCode },
  })
  persistSession({ token: data.token, user: data.user })
  return data
}

export async function fetchCompanyUsers() {
  const data = await authRequest('auth/company/users')
  return Array.isArray(data.users) ? data.users : []
}

export async function updateCompanyUserAccess({ email, accessLevel }) {
  const data = await authRequest('auth/company/access', {
    method: 'PUT',
    body: { email, accessLevel },
  })
  return Array.isArray(data.users) ? data.users : []
}

export async function publishB2bPortal({
  accessToken,
  customerId,
  customerName,
  email,
  snapshot,
  sendEmail,
}) {
  return authRequest('auth/b2b/portal', {
    method: 'POST',
    body: {
      accessToken,
      customerId,
      customerName,
      email,
      snapshot,
      sendEmail: Boolean(sendEmail),
    },
  })
}

export async function fetchB2bPortalSnapshot(accessToken) {
  const data = await authRequest(`b2b/portal/${encodeURIComponent(accessToken)}`)
  return data.snapshot || null
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
