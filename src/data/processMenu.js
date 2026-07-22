export const processSubMenus = [
  { label: 'Teklifler', path: '/teklifler' },
  { label: 'Siparişler', path: '/siparisler' },
  { label: 'Üretim Takibi', path: '/uretim' },
  // Shelved from sidebar (not deleted) — restore: set hidden:false
  { label: 'Manufacturing Center', path: '/mes', hidden: true },
  { label: 'Depo', path: '/depo' },
  { label: 'Teslim Edilenler', path: '/teslim-edilenler' },
  { label: 'Workflow Engine', path: '/otomasyon', hidden: true },
  { label: 'AI Operating System', path: '/aios', hidden: true },
  { label: 'Knowledge Center', path: '/bilgi-merkezi', hidden: true },
  { label: 'Digital Twin', path: '/dijital-ikiz', hidden: true },
]

/** Sidebar-visible process submenu items */
export const visibleProcessSubMenus = processSubMenus.filter((item) => !item.hidden)

export function isProcessRoute(pathname) {
  if (pathname === '/otomasyon' || pathname.startsWith('/otomasyon/')) return true
  if (pathname === '/aios' || pathname.startsWith('/aios/')) return true
  if (pathname === '/bilgi-merkezi' || pathname.startsWith('/bilgi-merkezi/')) return true
  if (pathname === '/dijital-ikiz' || pathname.startsWith('/dijital-ikiz/')) return true
  return processSubMenus.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  )
}
