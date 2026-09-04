export const WEB_HOME_PATH = '/web'
export const WEB_STUDIO_PATH = '/web/studio'
export const WEB_STUDIO_BUILDER_PATH = '/web/studio'
export const WEB_STUDIO_MANAGEMENT_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_ADMIN_PATH = '/web/studio/yonetim/panel'
export const WEB_STUDIO_DESIGN_PATH = '/web/studio/yonetim/tasarim'
export const WEB_STUDIO_CATEGORY_CREATE_PATH = '/web/studio/yonetim/kategoriler'
export const WEB_STUDIO_PRODUCT_CREATE_PATH = '/web/studio/yonetim/urunler'
export const WEB_STUDIO_ORDERS_PATH = '/web/studio/yonetim/siparisler'
export const WEB_STUDIO_TEMPLATE_PATH = '/web/studio/yonetim/tasarim'
export const WEB_STUDIO_SETTINGS_PATH = '/web/studio/yonetim/profil'
export const WEB_STUDIO_PAYMENT_PATH = '/web/studio/yonetim/odeme'
export const WEB_STUDIO_DOMAIN_CONNECT_PATH = '/web/studio/yonetim/domain-bagla'

/** @deprecated — yönlendirme için tutulur */
export const WEB_STUDIO_LEGACY_DOMAIN_PATH = '/web/studio/yonetim/domain-bagla'

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

export function isStudioFullscreenRoute(pathname = '') {
  return pathname === WEB_STUDIO_PATH || pathname === '/web/studio/builder'
}
