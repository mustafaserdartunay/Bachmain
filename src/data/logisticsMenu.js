export const LOGISTICS_HOME_PATH = '/lojistik'

export const logisticsSubMenus = [
  { label: 'Araçlar', path: '/lojistik/araclar', icon: 'truck' },
  { label: 'Dorse Tipleri', path: '/lojistik/dorse-tipleri', icon: 'container' },
  { label: 'Paletler', path: '/lojistik/paletler', icon: 'pallet' },
  { label: 'Koli Tipleri', path: '/lojistik/koli-tipleri', icon: 'box' },
  { label: 'Paket Tipleri', path: '/lojistik/paket-tipleri', icon: 'package' },
  { label: 'Sevkiyatlar', path: '/lojistik/sevkiyatlar', icon: 'shipments' },
  { label: 'Yükleme Planı', path: '/lojistik/yukleme-plani', icon: 'plan' },
  { label: 'Tır Yerleşimi', path: '/lojistik/tir-yerlesimi', icon: 'layout' },
  { label: 'Rotalar', path: '/lojistik/rotalar', icon: 'route' },
  { label: 'Teslimatlar', path: '/lojistik/teslimatlar', icon: 'delivery' },
  { label: 'Evraklar', path: '/lojistik/evraklar', icon: 'docs' },
  { label: 'Nakliye Raporları', path: '/lojistik/raporlar', icon: 'report' },
]

export function isLogisticsRoute(pathname) {
  return pathname === LOGISTICS_HOME_PATH
    || pathname.startsWith(`${LOGISTICS_HOME_PATH}/`)
}
