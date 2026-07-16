export const CRM_HOME_PATH = '/crm'

export const crmSubMenus = [
  { label: 'Tüm Görevler', path: '/crm', end: true },
  { label: 'Note Defteri', path: '/crm/notlar' },
  { label: 'Görevler', path: '/crm/gorevler' },
  { label: 'Randevular', path: '/crm/randevular' },
]

export function isCrmMenuRoute(pathname) {
  return pathname === CRM_HOME_PATH || pathname.startsWith(`${CRM_HOME_PATH}/`)
}
