export const customerSubMenus = [
  // Shelved from sidebar (not deleted) — restore: set hidden:false
  { label: 'Müşteri Deneyimi', path: '/musteri-deneyimi', icon: 'sparkles', hidden: true },
  { label: 'Müşteriler', path: '/musteriler', icon: 'users' },
  { label: 'Faturalar', path: '/musteriler/faturalar', icon: 'receipt' },
  { label: 'Satışlar Raporu', path: '/musteriler/satis-raporu', icon: 'bar-chart' },
  { label: 'Tahsilatlar Raporu', path: '/musteriler/tahsilat-raporu', icon: 'wallet' },
  { label: 'Gelir Gider Raporu', path: '/musteriler/gelir-gider-raporu', icon: 'pie-chart' },
]

/** Sidebar-visible Satışlar submenu items */
export const visibleCustomerSubMenus = customerSubMenus.filter((item) => !item.hidden)

export function isCustomerRoute(pathname) {
  return (
    pathname === '/musteri-deneyimi' ||
    pathname === '/cxc' ||
    pathname === '/musteriler' ||
    pathname === '/musteriler/faturalar' ||
    pathname === '/musteriler/satis-raporu' ||
    pathname === '/musteriler/tahsilat-raporu' ||
    pathname === '/musteriler/gelir-gider-raporu' ||
    pathname.startsWith('/musteriler/') ||
    pathname.startsWith('/musteri-deneyimi')
  )
}

/** Satışlar menüsü (süreç yönetimi ayrı top-level grup) */
export function isSalesRoute(pathname) {
  return isCustomerRoute(pathname)
}
