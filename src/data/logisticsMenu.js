export const LOGISTICS_HOME_PATH = '/lojistik/yukleme-plani'

export const logisticsSubMenus = [
  { label: 'Yük Hesaplama', path: LOGISTICS_HOME_PATH, icon: 'plan' },
]

export function isLogisticsRoute(pathname) {
  return pathname === '/lojistik'
    || pathname === LOGISTICS_HOME_PATH
    || pathname.startsWith('/lojistik/')
}
