export const SHIPPING_HOME_PATH = '/nakliye'
export const SHIPPING_CREATE_PATH = '/nakliye/yukleme-olustur'

export const shippingSubMenus = [
  { label: 'Yükleme Oluştur', path: SHIPPING_CREATE_PATH, icon: 'package-plus' },
  { label: 'Yükleme Listesi', path: SHIPPING_HOME_PATH, icon: 'list' },
]

export function isShippingRoute(pathname = '') {
  return pathname.startsWith('/nakliye')
}
