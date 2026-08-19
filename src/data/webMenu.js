export const WEB_HOME_PATH = '/web'
export const WEB_STUDIO_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_MANAGEMENT_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_ADMIN_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_CATEGORY_CREATE_PATH = '/web/studio/yonetim/kategoriler'
export const WEB_STUDIO_PRODUCT_CREATE_PATH = '/web/studio/yonetim/urunler'
export const WEB_STUDIO_ORDERS_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_TEMPLATE_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_SETTINGS_PATH = '/web/studio/yonetim/profil'
export const WEB_STUDIO_DOMAIN_CONNECT_PATH = '/web/studio/yonetim/profil'

/** @deprecated — yönlendirme için tutulur */
export const WEB_STUDIO_LEGACY_DOMAIN_PATH = '/web/studio/yonetim/domain-bagla'

export const WEB_STUDIO_FULLSCREEN_PATHS = [
  '/web/studio/yonetim/panel',
  '/web/studio/yonetim/kategoriler',
  '/web/studio/yonetim/urunler',
  '/web/studio/yonetim/profil',
  '/web/studio/yonetim/odeme',
]

export const webSubMenus = []

export const webAdminChildMenus = []

export const webSettingsChildMenus = []

export function isWebRoute(pathname) {
  return pathname === WEB_HOME_PATH || pathname.startsWith(`${WEB_HOME_PATH}/`)
}

export function isWebAdminRoute() {
  return false
}

export function isWebSettingsRoute() {
  return false
}

export function isStudioFullscreenRoute(pathname) {
  return WEB_STUDIO_FULLSCREEN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}
