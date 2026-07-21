export const AI_GROWTH_HOME_PATH = '/ai-buyume'
export const AI_GROWTH_MODULE_CODE = 'ai_growth'

/**
 * AI Growth Center — Instagram-only surface (2026-07).
 * Other studios remain in repo but are redirected to home.
 */
export const aiGrowthSubMenus = [
  { label: 'Instagram', path: '/ai-buyume', icon: 'instagram', end: true },
  { label: 'Hesap Bağla', path: '/ai-buyume/instagram', icon: 'plug' },
  { label: 'Reel Örneği', path: '/ai-buyume/reel', icon: 'clapperboard' },
]

/** Archived extras — not shown in sidebar */
export const aiGrowthStudioExtras = []

export function isAiGrowthRoute(pathname) {
  return pathname === AI_GROWTH_HOME_PATH || pathname.startsWith(`${AI_GROWTH_HOME_PATH}/`)
}
