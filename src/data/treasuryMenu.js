export const CASH_BASE_PATH = '/nakit/kasa-bankalar'
export const TREASURY_REPORTS_PATH = '/nakit/raporlar'

export const treasurySubMenus = [
  { label: 'Tüm Kasalar', path: CASH_BASE_PATH, icon: 'landmark' },
  { label: 'Nakit Kasa', path: '/nakit/nakit-kasa', icon: 'banknote' },
  { label: 'Bankalar', path: '/nakit/bankalar', icon: 'landmark' },
  { label: 'Çekler', path: '/nakit/cekler', icon: 'scroll-text' },
  { label: 'Senetler', path: '/nakit/senetler', icon: 'scroll-text' },
  { label: 'Tüm Kasa Raporları', path: TREASURY_REPORTS_PATH, icon: 'bar-chart' },
  { label: 'Nakit Kasa Raporu', path: '/nakit/raporlar/nakit-kasa', icon: 'bar-chart' },
  { label: 'Banka Raporu', path: '/nakit/raporlar/banka', icon: 'bar-chart' },
  { label: 'Çek Raporu', path: '/nakit/raporlar/cek', icon: 'bar-chart' },
  { label: 'Senet Raporu', path: '/nakit/raporlar/senet', icon: 'bar-chart' },
  { label: 'Nakit Akışı Raporu', path: '/nakit/nakit-akisi-raporu', icon: 'arrow-left-right' },
]

export function isTreasuryRoute(pathname) {
  return pathname.startsWith('/nakit') || pathname.startsWith('/kasa')
}
