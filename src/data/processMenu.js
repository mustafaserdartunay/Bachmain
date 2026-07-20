export const processSubMenus = [
  { label: 'Teklifler', path: '/teklifler' },
  { label: 'Siparişler', path: '/siparisler' },
  { label: 'Üretim Takibi', path: '/uretim' },
  { label: 'Depo', path: '/depo' },
  { label: 'Teslim Edilenler', path: '/teslim-edilenler' },
  { label: 'Workflow Engine', path: '/otomasyon' },
]

export function isProcessRoute(pathname) {
  if (pathname === '/otomasyon' || pathname.startsWith('/otomasyon/')) return true
  return processSubMenus.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
}
