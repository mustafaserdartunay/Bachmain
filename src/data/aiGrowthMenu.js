export const AI_GROWTH_HOME_PATH = '/ai-buyume'
export const AI_GROWTH_MODULE_CODE = 'ai_growth'

/** Enterprise IA (AG-0) — existing studios kept under these paths */
export const aiGrowthSubMenus = [
  { label: 'Dashboard', path: '/ai-buyume', icon: 'layout-dashboard', end: true },
  { label: 'SEO Center', path: '/ai-buyume/seo', icon: 'search' },
  { label: 'Content Studio', path: '/ai-buyume/icerik', icon: 'sparkles' },
  { label: 'Social Media', path: '/ai-buyume/sosyal', icon: 'share-2' },
  { label: 'Ads Manager', path: '/ai-buyume/reklam', icon: 'megaphone' },
  { label: 'Email Marketing', path: '/ai-buyume/email', icon: 'mail' },
  { label: 'WhatsApp Marketing', path: '/ai-buyume/whatsapp', icon: 'message-circle' },
  { label: 'SMS Marketing', path: '/ai-buyume/sms', icon: 'smartphone' },
  { label: 'Campaign Center', path: '/ai-buyume/kampanya', icon: 'target' },
  { label: 'Landing Pages', path: '/ai-buyume/landing', icon: 'panels-top-left' },
  { label: 'Funnels', path: '/ai-buyume/funnel', icon: 'git-branch' },
  { label: 'Lead Center', path: '/ai-buyume/lead', icon: 'user-plus' },
  { label: 'CRM Marketing', path: '/ai-buyume/crm-marketing', icon: 'users' },
  { label: 'Analytics', path: '/ai-buyume/analitik', icon: 'bar-chart-3' },
  { label: 'Competitor Center', path: '/ai-buyume/rakip', icon: 'binoculars' },
  { label: 'AI Studio', path: '/ai-buyume/ai-studio', icon: 'bot' },
  { label: 'Automation', path: '/ai-buyume/otomasyon', icon: 'workflow' },
  { label: 'Growth Reports', path: '/ai-buyume/raporlar', icon: 'file-bar-chart' },
  { label: 'Ayarlar', path: '/ai-buyume/ayarlar', icon: 'settings' },
]

/** Extra studio shortcuts (still routed; not all in primary Enterprise IA) */
export const aiGrowthStudioExtras = [
  { label: 'Blog Merkezi', path: '/ai-buyume/blog' },
  { label: 'Video Merkezi', path: '/ai-buyume/video' },
  { label: 'Trend Analizi', path: '/ai-buyume/trend' },
  { label: 'Anahtar Kelime', path: '/ai-buyume/anahtar-kelime' },
  { label: 'Tasarım', path: '/ai-buyume/tasarim' },
  { label: 'Görsel', path: '/ai-buyume/gorsel' },
  { label: 'Banner', path: '/ai-buyume/banner' },
  { label: 'Ürün Fotoğrafı', path: '/ai-buyume/urun-fotografi' },
  { label: 'Video Senaryosu', path: '/ai-buyume/video-senaryosu' },
  { label: 'AI Asistan', path: '/ai-buyume/asistan' },
  { label: 'AI Ajanları', path: '/ai-buyume/ajanlar' },
]

export function isAiGrowthRoute(pathname) {
  return pathname === AI_GROWTH_HOME_PATH || pathname.startsWith(`${AI_GROWTH_HOME_PATH}/`)
}
