export const WEB_HOME_PATH = '/web'
export const WEB_STUDIO_PATH = '/web/studio'

export const WEB_STUDIO_MANAGEMENT_PATH = '/web/studio/yonetim'
export const WEB_STUDIO_ADMIN_PATH = '/web/studio/yonetim/yonetim'
export const WEB_STUDIO_CATEGORY_CREATE_PATH = '/web/studio/yonetim/kategori-olustur'
export const WEB_STUDIO_PRODUCT_CREATE_PATH = '/web/studio/yonetim/urun-olustur'

export const WEB_STUDIO_FULLSCREEN_PATHS = [
  '/web/studio/yonetim/panel',
  '/web/studio/yonetim/domain-bagla',
  '/web/studio/yonetim/kategoriler',
  '/web/studio/yonetim/urunler',
  '/web/studio/yonetim/siparisler',
  '/web/studio/yonetim/profil',
  '/web/studio/yonetim/odeme',
]

export const webSubMenus = [
  { label: 'Güncel Durum', path: WEB_STUDIO_MANAGEMENT_PATH, icon: 'gauge' },
]

export const webAdminChildMenus = [
  { label: 'Kategori oluştur', path: WEB_STUDIO_CATEGORY_CREATE_PATH },
  { label: 'Ürün oluştur', path: WEB_STUDIO_PRODUCT_CREATE_PATH },
]

export function isWebRoute(pathname) {
  return pathname === WEB_HOME_PATH || pathname.startsWith(`${WEB_HOME_PATH}/`)
}

export function isWebAdminRoute(pathname) {
  return (
    pathname === WEB_STUDIO_ADMIN_PATH ||
    pathname === WEB_STUDIO_CATEGORY_CREATE_PATH ||
    pathname === WEB_STUDIO_PRODUCT_CREATE_PATH
  )
}

export function isStudioFullscreenRoute(pathname) {
  return WEB_STUDIO_FULLSCREEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
