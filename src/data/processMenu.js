export const processSubMenus = [
  { label: 'Teklifler', path: '/teklifler' },
  { label: 'Siparişler', path: '/siparisler' },
  { label: 'Üretim Takibi', path: '/uretim' },
  { label: 'Depo', path: '/depo' },
  { label: 'Teslim Edilenler', path: '/teslim-edilenler' },
]

export function isProcessRoute(pathname) {
  return processSubMenus.some((item) => (
    pathname === item.path || pathname.startsWith(`${item.path}/`)
  ))
}
