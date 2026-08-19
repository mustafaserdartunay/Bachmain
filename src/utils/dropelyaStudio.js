const DROPELYA_YONETIM_ORIGIN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DROPELYA_ADMIN_URL) ||
  'http://localhost:3000'

const DROPELYA_PATH_BY_STUDIO = {
  '/web/studio/yonetim/panel': '/yonetim',
  '/web/studio/yonetim/kategoriler': '/yonetim/kategoriler',
  '/web/studio/yonetim/urunler': '/yonetim/urunler',
  '/web/studio/yonetim/profil': '/yonetim/profil',
  '/web/studio/yonetim/odeme': '/yonetim/odeme',
}

export const STUDIO_ADMIN_PAGES = [
  { path: '/web/studio/yonetim/panel', href: '/yonetim', label: 'Güncel Durum', exact: true, icon: 'dashboard' },
  { path: '/web/studio/yonetim/kategoriler', href: '/yonetim/kategoriler', label: 'Kategoriler', icon: 'folder' },
  { path: '/web/studio/yonetim/urunler', href: '/yonetim/urunler', label: 'Ürünler', icon: 'bag' },
  { path: '/web/studio/yonetim/profil', href: '/yonetim/profil', label: 'Mağaza profili', icon: 'store' },
  { path: '/web/studio/yonetim/odeme', href: '/yonetim/odeme', label: 'Ödeme ayarları', icon: 'card' },
]

export function dropelyaPathForStudio(pathname = '') {
  return DROPELYA_PATH_BY_STUDIO[pathname] || '/yonetim'
}

export function getDropelyaAdminBase() {
  return String(DROPELYA_YONETIM_ORIGIN).replace(/\/$/, '')
}

export function getDropelyaPageUrl(pathname = '/yonetim') {
  const back =
    typeof window !== 'undefined'
      ? `${window.location.origin}/`
      : 'https://uygulama.bachmain.com/'
  const url = new URL(pathname, `${getDropelyaAdminBase()}/`)
  url.searchParams.set('from', 'bachmain')
  url.searchParams.set('embed', '1')
  url.searchParams.set('back', back)
  return url.toString()
}

export function getDropelyaYonetimUrl() {
  return getDropelyaPageUrl('/yonetim')
}

/** @deprecated in-app embed kullanılıyor */
export function startStudioJump() {}
