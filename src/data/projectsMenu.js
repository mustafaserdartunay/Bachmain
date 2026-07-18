export const PROJECTS_HOME_PATH = '/projeler'
export const PROJECTS_CREATE_PATH = '/projeler/yeni'

export const projectsSubMenus = [
  { label: 'Yeni Proje', path: PROJECTS_CREATE_PATH, icon: 'folder-plus' },
  { label: 'Projeler Listesi', path: PROJECTS_HOME_PATH, icon: 'list' },
  { label: 'Devam Eden Projeler', path: '/projeler/devam-eden', icon: 'play' },
  { label: 'Tamamlanan Projeler', path: '/projeler/tamamlanan', icon: 'check' },
  { label: 'İptal Projeler', path: '/projeler/iptal', icon: 'cancel' },
]

export function isProjectsRoute(pathname) {
  return pathname === PROJECTS_HOME_PATH
    || pathname.startsWith(`${PROJECTS_HOME_PATH}/`)
}
