const DROPELYA_YONETIM_ORIGIN = 'http://localhost:3000'
const STUDIO_JUMP_MS = 180

export const STUDIO_ADMIN_PAGES = [
  { href: '/yonetim', label: 'Güncel Durum', exact: true },
  { href: '/yonetim/kategoriler', label: 'Kategoriler' },
  { href: '/yonetim/urunler', label: 'Ürünler' },
  { href: '/yonetim/siparisler', label: 'Siparişler' },
  { href: '/yonetim/profil', label: 'Mağaza profili' },
  { href: '/yonetim/odeme', label: 'Ödeme ayarları' },
]

export function getDropelyaAdminBase() {
  return DROPELYA_YONETIM_ORIGIN
}

export function getDropelyaPageUrl(pathname = '/yonetim') {
  const back =
    typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'https://uygulama.bachmain.com/'
  const url = new URL(pathname, `${DROPELYA_YONETIM_ORIGIN}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('embed', '1')
  url.searchParams.set('back', back)
  return url.toString()
}

export function getDropelyaYonetimUrl() {
  return getDropelyaPageUrl('/yonetim')
}

export function startStudioJump(event, pathname = '/yonetim') {
  event?.preventDefault?.()
  const url = getDropelyaPageUrl(pathname)
  window.setTimeout(() => {
    window.location.assign(url)
  }, STUDIO_JUMP_MS)
}
