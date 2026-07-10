export const expensesSubMenus = [
  { label: 'Gider Listesi', path: '/giderler/liste', icon: 'list' },
  { label: 'Kredi Ödemeleri', path: '/giderler/kredi-odemeleri', icon: 'landmark' },
  { label: 'Gelen E-Faturalar', path: '/giderler/gelen-e-faturalar', icon: 'inbox' },
  { label: 'Tedarikçiler', path: '/giderler/tedarikciler', icon: 'handshake' },
  { label: 'Çalışanlar', path: '/giderler/calisanlar', icon: 'users' },
  { label: 'Giderler Raporu', path: '/giderler/giderler-raporu', icon: 'bar-chart' },
  { label: 'Ödemeler Raporu', path: '/giderler/odemeler-raporu', icon: 'wallet' },
  { label: 'KDV Raporu', path: '/giderler/kdv-raporu', icon: 'percent' },
]

export function isExpensesRoute(pathname) {
  return pathname.startsWith('/giderler') || pathname === '/suppliers'
}
