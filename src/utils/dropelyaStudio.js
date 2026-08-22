const TRANSITION_MS = 560

export function getDropelyaAdminBase() {
  const envUrl = String(import.meta.env.VITE_DROPELYA_ADMIN_URL || '')
    .trim()
    .replace(/\/$/, '')
  if (envUrl) return envUrl
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000'
  }
  return 'https://dropelya.com'
}

export function getDropelyaYonetimUrl() {
  const back =
    typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://uygulama.bachmain.com/'
  const url = new URL('/yonetim', `${getDropelyaAdminBase()}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('back', back)
  return url.toString()
}

let studioJumpLocked = false

export function startStudioJump() {
  if (studioJumpLocked) return false
  studioJumpLocked = true
  window.dispatchEvent(new CustomEvent('bach:studio-enter-start'))
  window.setTimeout(() => {
    window.location.assign(getDropelyaYonetimUrl())
  }, TRANSITION_MS)
  return true
}

export const STUDIO_JUMP_MS = TRANSITION_MS
