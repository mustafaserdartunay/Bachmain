export const CASH_BASE_PATH = '/nakit/kasa-bankalar'

export const treasurySubMenus = [
  { label: 'Kasa ve Bankalar', path: CASH_BASE_PATH, icon: 'landmark' },
  { label: 'Çekler', path: '/nakit/cekler', icon: 'scroll-text' },
  { label: 'Kasa / Banka Raporu', path: '/nakit/kasa-banka-raporu', icon: 'bar-chart' },
  { label: 'Nakit Akışı Raporu', path: '/nakit/nakit-akisi-raporu', icon: 'arrow-left-right' },
]

export function isTreasuryRoute(pathname) {
  return pathname.startsWith('/nakit') || pathname.startsWith('/kasa')
}
