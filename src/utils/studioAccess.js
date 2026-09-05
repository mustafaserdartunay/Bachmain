/** Cross-product Studio URLs and license (separate from CRM packages). */

export const STUDIO_ORIGIN = 'https://studio.bachmain.com'
export const STUDIO_CANONICAL = 'https://studio.bachmain.com'
export const STUDIO_TRIAL_PATH = '/paketler?urun=studio'
export const STUDIO_PACKAGES_URL = 'https://bachmain.com/paketler?urun=studio'
export const STUDIO_DEMO_URL = 'https://bachmain.com/demo?next=studio'
const PLATFORM_API = 'https://yonetim.bachmain.com/api'

export function hasStudioAccess(user) {
  const status = user?.linkedStudio?.status || user?.studioStatus
  if (status === 'expired' || status === 'none' || status === 'pending') return false
  if (user?.hasStudioAccess === true) return true
  if (user?.product === 'studio' && (status === 'active' || status === 'trial')) return true
  return false
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

function goStudioPackages(navigate, message) {
  if (message) window.alert(message)
  if (typeof navigate === 'function') navigate(STUDIO_TRIAL_PATH)
  else window.location.href = `https://uygulama.bachmain.com${STUDIO_TRIAL_PATH}`
}

export async function openStudioOrTrial(user, navigate) {
  if (!user) {
    window.location.href = studioLoginUrl()
    return
  }
  const token = readCrmToken()
  if (!token) {
    window.location.href = studioLoginUrl()
    return
  }
  try {
    const res = await fetch(`${PLATFORM_API}/auth/studio-sso`, {
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
    if (res.ok && code) {
      window.location.href = `${STUDIO_ORIGIN}/?sso=${encodeURIComponent(code)}`
      return
    }
    goStudioPackages(
      navigate,
      data.message ||
        'Studio üyeliğiniz yok veya süresi dolmuş. Paket sayfasından Studio alın veya 7 gün demo açın.',
    )
  } catch {
    goStudioPackages(
      navigate,
      'Studio üyeliği doğrulanamadı. Paket sayfasından Studio alın veya 7 gün demo açın.',
    )
  }
}
