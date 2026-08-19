const DROPELYA_YONETIM_ORIGIN = 'http://localhost:3000'
const STUDIO_JUMP_MS = 280

export function getDropelyaAdminBase() {
  return DROPELYA_YONETIM_ORIGIN
}

export function getDropelyaYonetimUrl() {
  const back =
    typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'https://uygulama.bachmain.com/'
  const url = new URL('/yonetim', `${DROPELYA_YONETIM_ORIGIN}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('embed', '1')
  url.searchParams.set('back', back)
  return url.toString()
}

export function startStudioJump(event) {
  event?.preventDefault?.()
  const url = getDropelyaYonetimUrl()
  window.setTimeout(() => {
    window.location.assign(url)
  }, STUDIO_JUMP_MS)
}
