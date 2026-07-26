/** Canonical tenant login lives on the marketing site (bachmain.com/giris). */
export const MARKETING_LOGIN_URL = 'https://bachmain.com/giris'

export function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/** Soft open-redirect guard: only same-origin app paths. */
export function safeReturnPath(path) {
  if (!path || typeof path !== 'string') return ''
  if (!path.startsWith('/') || path.startsWith('//')) return ''
  return path
}

export function redirectToMarketingLogin(fromPath) {
  const url = new URL(MARKETING_LOGIN_URL)
  const next = safeReturnPath(fromPath)
  if (next && next !== '/giris' && next !== '/login') {
    url.searchParams.set('next', next)
  }
  window.location.replace(url.toString())
}
