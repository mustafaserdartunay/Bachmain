export const LOGISTICS_HOME_PATH = '/lojistik'

export const logisticsSubMenus = [
  { label: 'Dashboard', path: '/lojistik', icon: 'report' },
  { label: 'Yük Hesaplama', path: '/lojistik/yukleme-plani', icon: 'plan' },
  { label: 'Planlanan Lojistik', path: '/lojistik/planlanan', icon: 'shipments' },
  { label: 'Teslimatta', path: '/lojistik/teslimatta', icon: 'delivery' },
  { label: 'Teslim Edildi', path: '/lojistik/teslim-edildi', icon: 'docs' },
]

export function isLogisticsRoute(pathname) {
  return pathname === LOGISTICS_HOME_PATH
    || pathname.startsWith(`${LOGISTICS_HOME_PATH}/`)
}
