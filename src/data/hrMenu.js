import { fieldSalesSubMenus, isFieldSalesRoute } from './fieldSalesMenu'

export const HR_HOME_PATH = '/ik'

export const hrSubMenus = [
  { label: 'Devam Kontrol', path: '/ik', icon: 'gauge' },
  { label: 'Personeller', path: '/ik/personeller', icon: 'users' },
  { label: 'Giriş Çıkış Takibi', path: '/ik/giris-cikis', icon: 'log-in' },
  { label: 'Vardiyalar', path: '/ik/vardiyalar', icon: 'clock' },
  { label: 'İzinler', path: '/ik/izinler', icon: 'calendar' },
  { label: 'Mesailer', path: '/ik/mesailer', icon: 'timer' },
  { label: 'Devamsızlıklar', path: '/ik/devamsizliklar', icon: 'user-x' },
  { label: 'Görev Takibi', path: '/ik/gorevler', icon: 'check-square' },
  { label: 'Harita Takibi', path: '/ik/harita', icon: 'map' },
  { label: 'Mobil Giriş', path: '/ik/mobil', icon: 'smartphone' },
  { label: 'PDKS Ayarları', path: '/ik/ayarlar', icon: 'settings' },
  ...fieldSalesSubMenus,
]

export function isHrRoute(pathname) {
  if (pathname === HR_HOME_PATH || pathname.startsWith(`${HR_HOME_PATH}/`)) return true
  return isFieldSalesRoute(pathname)
}
