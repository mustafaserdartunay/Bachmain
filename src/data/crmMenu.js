export const CRM_HOME_PATH = '/crm'

export const crmSubMenus = [
  { label: 'Tüm Görevler', path: '/crm', end: true, icon: 'layout-list' },
  { label: 'Note Defteri', path: '/crm/notlar', icon: 'notebook-pen' },
  { label: 'Görevler', path: '/crm/gorevler', icon: 'check-square' },
  { label: 'Randevular', path: '/crm/randevular', icon: 'calendar' },
]

export function isCrmMenuRoute(pathname) {
  return pathname === CRM_HOME_PATH || pathname.startsWith(`${CRM_HOME_PATH}/`)
}
