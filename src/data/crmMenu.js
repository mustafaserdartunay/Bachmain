export const CRM_HOME_PATH = '/crm'

export const crmSubMenus = [
  { label: 'Tüm Görevler', path: '/crm', end: true },
  { label: 'Note Defteri', path: '/crm/notlar' },
  { label: 'Görev Oluştur', path: '/crm/gorevler' },
  { label: 'Randevu Oluştur', path: '/crm/randevular' },
  { label: 'Mesaj Merkezi', path: '/mesajlar', badge: 'messages' },
]

export function isCrmMenuRoute(pathname) {
  if (!pathname) return false
  if (pathname === '/mesajlar' || pathname.startsWith('/mesajlar/')) return true
  return pathname === CRM_HOME_PATH || pathname.startsWith(`${CRM_HOME_PATH}/`)
}
