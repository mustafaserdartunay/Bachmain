export const STOCK_PRODUCTS_PATH = '/stok/urunler'

export const stockSubMenus = [
  { label: 'Hizmet ve Ürünler', path: STOCK_PRODUCTS_PATH, icon: 'package', openProductsList: true },
  { label: 'Depolar', path: '/stok/depolar', icon: 'warehouse' },
  { label: 'Depolar Arası Transfer', path: '/stok/depolar-arasi-transfer', icon: 'arrow-left-right' },
  { label: 'Giden İrsaliyeler', path: '/stok/giden-irsaliye', icon: 'truck' },
  { label: 'Gelen İrsaliyeler', path: '/stok/gelen-irsaliye', icon: 'inbox' },
  { label: 'Fiyat Listeleri', path: '/stok/fiyat-listeleri', icon: 'tags' },
  { label: 'Stok Geçmişi', path: '/stok/stok-gecmisi', icon: 'history' },
  { label: 'Stoktaki Ürünler Raporu', path: '/stok/stoktaki-urunler-raporu', icon: 'bar-chart' },
]

export function isStockRoute(pathname) {
  return pathname.startsWith('/stok')
}
