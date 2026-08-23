export const MARKETS_BASE = '/piyasa'

export const marketsSubMenus = [
  { id: 'overview', label: 'Genel Bakış', path: MARKETS_BASE },
  { id: 'markets', label: 'Piyasalar', path: `${MARKETS_BASE}?tab=markets` },
  { id: 'equities', label: 'Hisseler', path: `${MARKETS_BASE}?tab=equities` },
  { id: 'indices', label: 'Endeksler', path: `${MARKETS_BASE}?tab=indices` },
  { id: 'fx', label: 'Döviz', path: `${MARKETS_BASE}?tab=fx` },
  { id: 'gold', label: 'Altın', path: `${MARKETS_BASE}?tab=gold` },
  { id: 'crypto', label: 'Kripto', path: `${MARKETS_BASE}?tab=crypto` },
  { id: 'portfolios', label: 'Portföyler', path: `${MARKETS_BASE}?tab=portfolios` },
  { id: 'favorites', label: 'Favorilerim', path: `${MARKETS_BASE}?tab=favorites` },
  { id: 'alerts', label: 'Alarm Merkezi', path: `${MARKETS_BASE}?tab=alerts` },
  { id: 'news', label: 'Haberler', path: `${MARKETS_BASE}?tab=news` },
  { id: 'calendar', label: 'Ekonomik Takvim', path: `${MARKETS_BASE}?tab=calendar` },
  { id: 'boards', label: 'Takip Panolarım', path: `${MARKETS_BASE}?tab=boards` },
  { id: 'settings', label: 'Ayarlar', path: `${MARKETS_BASE}?tab=settings` },
]

export function isMarketsRoute(pathname) {
  return pathname === MARKETS_BASE || pathname.startsWith(`${MARKETS_BASE}/`)
}
