export const processSubMenus = [
  { label: 'Teklifler', path: '/teklifler', icon: 'file-text' },
  { label: 'Siparişler', path: '/siparisler', icon: 'shopping-cart' },
  { label: 'Üretim Takibi', path: '/uretim', icon: 'factory' },
  // Shelved from sidebar (not deleted) — restore: set hidden:false
  { label: 'Manufacturing Center', path: '/mes', icon: 'boxes', hidden: true },
  { label: 'Depo', path: '/depo', icon: 'warehouse' },
  { label: 'Teslim Edilenler', path: '/teslim-edilenler', icon: 'package-check' },
  { label: 'Workflow Engine', path: '/otomasyon', icon: 'workflow', hidden: true },
  { label: 'AI Operating System', path: '/aios', icon: 'bot', hidden: true },
  { label: 'Knowledge Center', path: '/bilgi-merkezi', icon: 'book-open', hidden: true },
  { label: 'Digital Twin', path: '/dijital-ikiz', icon: 'network', hidden: true },
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
