export const E_DOCUMENTS_BASE = '/e-belgeler'

export const eDocumentsSubMenus = [
  { label: 'Özet', path: '/e-belgeler', icon: 'gauge' },
  { label: 'Yeni E-Fatura', path: '/e-belgeler/yeni', icon: 'receipt' },
  { label: 'E-Fatura', path: '/e-belgeler/e-fatura', icon: 'receipt' },
  { label: 'E-Arşiv', path: '/e-belgeler/e-arsiv', icon: 'file' },
  { label: 'Gelen Faturalar', path: '/e-belgeler/gelen', icon: 'inbox' },
  { label: 'Giden Faturalar', path: '/e-belgeler/giden', icon: 'send' },
  { label: 'Taslaklar', path: '/e-belgeler/taslaklar', icon: 'draft' },
  { label: 'İptaller / İade', path: '/e-belgeler/iptaller', icon: 'ban' },
  { label: 'Belge Sorgulama', path: '/e-belgeler/sorgula', icon: 'search' },
  { label: 'E-Belge Ayarları', path: '/e-belgeler/ayarlar', icon: 'settings' },
]

export function isEDocumentsRoute(pathname) {
  return pathname === E_DOCUMENTS_BASE || pathname.startsWith(`${E_DOCUMENTS_BASE}/`)
}
