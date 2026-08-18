export const WEB_HOME_PATH = '/web'
export const WEB_STUDIO_PATH = '/web/studio'

export const WEB_STUDIO_MANAGEMENT_PATH = '/web/studio/yonetim'

export const webSubMenus = [
  { label: 'Studio Yönetim', path: WEB_STUDIO_MANAGEMENT_PATH, icon: 'sparkles' },
]

export function isWebRoute(pathname) {
  return pathname === WEB_HOME_PATH || pathname.startsWith(`${WEB_HOME_PATH}/`)
}
