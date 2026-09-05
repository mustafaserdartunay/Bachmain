/** Cross-product Studio URLs and license (separate from CRM packages). */

export const STUDIO_ORIGIN = 'https://bachmain-studio.vercel.app'
export const STUDIO_CANONICAL = 'https://studio.bachmain.com'
export const STUDIO_TRIAL_PATH = '/paketler?urun=studio'
export const STUDIO_LICENSE_KEY = 'bach-studio-license'
export const STUDIO_COOKIE = 'bach_studio_access'
const TRIAL_MS = 7 * 24 * 60 * 60 * 1000
const PLATFORM_API = 'https://yonetim.bachmain.com/api'

function readLicense() {
  try {
    const raw = localStorage.getItem(STUDIO_LICENSE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function hasStudioAccess(user) {
  if (user?.role === 'demo_lead' || user?.isDemo === true) return true
  const entitlements = user?.entitlements
  if (
    Array.isArray(entitlements) &&
    (entitlements.includes('studio') || entitlements.includes('all'))
  ) {
    return true
  }
  if (Array.isArray(user?.products) && user.products.includes('studio')) return true
  try {
    const cookie = document.cookie.match(/(?:^|; )bach_studio_access=([^;]*)/)
    if (cookie && (cookie[1] === 'trial' || cookie[1] === 'active')) {
      const lic = readLicense()
      if (!lic) return true
      if (lic.status === 'active') return true
      if (lic.status === 'trial' && Number(lic.endsAt) > Date.now()) return true
    }
  } catch {
    /* ignore */
  }
  const lic = readLicense()
  if (!lic) return false
  if (lic.status === 'active') return true
  return lic.status === 'trial' && Number(lic.endsAt) > Date.now()
}

export function activateStudioLicense(user, status = 'active') {
  const lic = {
    status,
    product: 'studio',
    userId: user?.id || user?.email || '',
    startedAt: Date.now(),
    endsAt: status === 'trial' ? Date.now() + TRIAL_MS : Date.now() + 365 * 24 * 60 * 60 * 1000,
  }
  try {
    localStorage.setItem(STUDIO_LICENSE_KEY, JSON.stringify(lic))
  } catch {
    /* ignore */
  }
  try {
    const maxAge = status === 'trial' ? Math.floor(TRIAL_MS / 1000) : 60 * 60 * 24 * 365
    const parts = [
      `${STUDIO_COOKIE}=${status === 'trial' ? 'trial' : 'active'}`,
      'Path=/',
      `Max-Age=${maxAge}`,
      'SameSite=None',
      'Secure',
    ]
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')) {
      parts.push('Domain=.bachmain.com')
    }
    document.cookie = parts.join('; ')
  } catch {
    /* ignore */
  }
  return lic
}

export function startStudioTrial(user) {
  return activateStudioLicense(user, 'trial')
}

export function studioLoginUrl() {
  return 'https://bachmain.com/giris?next=studio'
}

function readCrmToken() {
  try {
    return (
      localStorage.getItem('bachmain_auth_token') || localStorage.getItem('bachmain_token') || ''
    )
  } catch {
    return ''
  }
}

export async function openStudioOrTrial(user, navigate) {
  if (!user) {
    window.location.href = studioLoginUrl()
    return
  }
  const token = readCrmToken()
  if (token && (hasStudioAccess(user) || user?.role === 'demo_lead' || user?.isDemo)) {
    startStudioTrial(user)
    try {
      const res = await fetch(`${PLATFORM_API}/auth/sso-ticket`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = await res.json().catch(() => ({}))
      const code = String(data?.code || '').trim()
      if (code) {
        window.location.href = `${STUDIO_ORIGIN}/?sso=${encodeURIComponent(code)}`
        return
      }
    } catch {
      /* fall through */
    }
    window.location.href = `${STUDIO_ORIGIN}/?authToken=${encodeURIComponent(token)}`
    return
  }
  if (hasStudioAccess(user)) {
    window.location.href = STUDIO_ORIGIN
    return
  }
  if (typeof navigate === 'function') navigate(STUDIO_TRIAL_PATH)
  else window.location.href = `https://uygulama.bachmain.com${STUDIO_TRIAL_PATH}`
}
