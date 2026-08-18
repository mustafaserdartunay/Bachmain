export const WEB_HOME_PATH = '/web'
export const WEB_STUDIO_PATH = '/web/studio'

export const webSubMenus = [{ label: 'Web Sitesi Yöneticisi', path: WEB_STUDIO_PATH, icon: 'globe' }]

export function isWebRoute(pathname) {
  return pathname === WEB_HOME_PATH || pathname.startsWith(`${WEB_HOME_PATH}/`)
}
