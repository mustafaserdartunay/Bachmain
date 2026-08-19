export function getDropelyaAdminBase() {
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'
  if (isLocal) return 'http://localhost:3000'
  const envUrl = String(import.meta.env.VITE_DROPELYA_ADMIN_URL || '')
    .trim()
    .replace(/\/$/, '')
  if (
    envUrl &&
    !envUrl.includes('localhost') &&
    !/https?:\/\/(www\.)?dropelya\.com$/i.test(envUrl)
  ) {
    return envUrl
  }
  return 'http://localhost:3000'
}

export function getDropelyaYonetimUrl() {
  const back =
    typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'https://uygulama.bachmain.com/'
  const url = new URL('/yonetim', `${getDropelyaAdminBase()}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('embed', '1')
  url.searchParams.set('back', back)
  return url.toString()
}
