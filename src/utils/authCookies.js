/**
 * Production cookie helpers for .bachmain.com subdomains.
 */
const COOKIE_DOMAIN = '.bachmain.com'

const isProdHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'bachmain.com' ||
    window.location.hostname.endsWith('.bachmain.com'))

export function setAuthCookie(name, value, { maxAgeSeconds = 60 * 60 * 24 * 7 } = {}) {
  if (typeof document === 'undefined') return
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    'SameSite=None',
    'Secure',
  ]
  if (isProdHost) parts.push(`Domain=${COOKIE_DOMAIN}`)
  document.cookie = parts.join('; ')
}

export function getAuthCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function clearAuthCookie(name) {
  if (typeof document === 'undefined') return
  const parts = [`${encodeURIComponent(name)}=`, 'Path=/', 'Max-Age=0', 'SameSite=None', 'Secure']
  if (isProdHost) parts.push(`Domain=${COOKIE_DOMAIN}`)
  document.cookie = parts.join('; ')
}
