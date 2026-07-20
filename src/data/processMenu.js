export const processSubMenus = [
  { label: 'Teklifler', path: '/teklifler' },
  { label: 'Siparişler', path: '/siparisler' },
  { label: 'Üretim Takibi', path: '/uretim' },
  { label: 'Depo', path: '/depo' },
  { label: 'Teslim Edilenler', path: '/teslim-edilenler' },
  { label: 'Workflow Engine', path: '/otomasyon' },
  { label: 'AI Operating System', path: '/aios' },
  { label: 'Knowledge Center', path: '/bilgi-merkezi' },
  { label: 'Digital Twin', path: '/dijital-ikiz' },
  { label: 'Commerce Center', path: '/ticaret' },
]

export function isProcessRoute(pathname) {
  if (pathname === '/otomasyon' || pathname.startsWith('/otomasyon/')) return true
  if (pathname === '/aios' || pathname.startsWith('/aios/')) return true
  if (pathname === '/bilgi-merkezi' || pathname.startsWith('/bilgi-merkezi/')) return true
  if (pathname === '/dijital-ikiz' || pathname.startsWith('/dijital-ikiz/')) return true
  if (pathname === '/ticaret' || pathname.startsWith('/ticaret/')) return true
  return processSubMenus.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
}
