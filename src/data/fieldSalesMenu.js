export const FIELD_SALES_HOME_PATH = '/saha-satis'

export const fieldSalesSubMenus = [
  { label: 'Saha Satış Planlama', path: FIELD_SALES_HOME_PATH, icon: 'map-pinned' },
  { label: 'Müşteri Bul', path: '/saha-satis/musteri-bul', icon: 'user-search' },
  { label: 'Satış Temsilcileri', path: '/saha-satis/temsilciler', icon: 'users' },
  { label: 'Temsilci Raporları', path: '/saha-satis/temsilci-raporlari', icon: 'bar-chart' },
]

export function isFieldSalesRoute(pathname) {
  return pathname === FIELD_SALES_HOME_PATH
    || pathname.startsWith(`${FIELD_SALES_HOME_PATH}/`)
}
