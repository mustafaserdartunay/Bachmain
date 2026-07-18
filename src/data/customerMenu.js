import { isProcessRoute } from './processMenu'

export const customerSubMenus = [
  { label: 'Müşteriler', path: '/musteriler', icon: 'users' },
  { label: 'Faturalar', path: '/musteriler/faturalar', icon: 'receipt' },
  { label: 'Satışlar Raporu', path: '/musteriler/satis-raporu', icon: 'bar-chart' },
  { label: 'Tahsilatlar Raporu', path: '/musteriler/tahsilat-raporu', icon: 'wallet' },
  { label: 'Gelir Gider Raporu', path: '/musteriler/gelir-gider-raporu', icon: 'pie-chart' },
]

export function isCustomerRoute(pathname) {
  return pathname === '/musteriler'
    || pathname === '/musteriler/faturalar'
    || pathname === '/musteriler/satis-raporu'
    || pathname === '/musteriler/tahsilat-raporu'
    || pathname === '/musteriler/gelir-gider-raporu'
    || pathname.startsWith('/musteriler/')
}

/** Satışlar menüsü: müşteri + süreç yönetimi */
export function isSalesRoute(pathname) {
  return isCustomerRoute(pathname) || isProcessRoute(pathname)
}
