export const AI_GROWTH_HOME_PATH = '/ai-buyume'
export const AI_GROWTH_MODULE_CODE = 'ai_growth'

export const aiGrowthSubMenus = [
  { label: 'AI Dashboard', path: '/ai-buyume', icon: 'layout-dashboard' },
  { label: 'İçerik Merkezi', path: '/ai-buyume/icerik', icon: 'sparkles' },
  { label: 'Sosyal Medya', path: '/ai-buyume/sosyal', icon: 'share-2' },
  { label: 'Blog Merkezi', path: '/ai-buyume/blog', icon: 'book-open' },
  { label: 'SEO Merkezi', path: '/ai-buyume/seo', icon: 'search' },
  { label: 'Reklam Merkezi', path: '/ai-buyume/reklam', icon: 'megaphone' },
  { label: 'Video Merkezi', path: '/ai-buyume/video', icon: 'clapperboard' },
  { label: 'E-Mail Marketing', path: '/ai-buyume/email', icon: 'mail' },
  { label: 'Whatsapp Kampanyaları', path: '/ai-buyume/whatsapp', icon: 'message-circle' },
  { label: 'Landing Page', path: '/ai-buyume/landing', icon: 'panels-top-left' },
  { label: 'Rakip Analizi', path: '/ai-buyume/rakip', icon: 'binoculars' },
  { label: 'Trend Analizi', path: '/ai-buyume/trend', icon: 'trending-up' },
  { label: 'Anahtar Kelime Merkezi', path: '/ai-buyume/anahtar-kelime', icon: 'key-round' },
  { label: 'Yapay Zeka Tasarım', path: '/ai-buyume/tasarim', icon: 'palette' },
  { label: 'Yapay Zeka Görsel', path: '/ai-buyume/gorsel', icon: 'image' },
  { label: 'Yapay Zeka Banner', path: '/ai-buyume/banner', icon: 'frame' },
  { label: 'Ürün Fotoğrafı', path: '/ai-buyume/urun-fotografi', icon: 'camera' },
  { label: 'Video Senaryosu', path: '/ai-buyume/video-senaryosu', icon: 'film' },
  { label: 'AI Asistan', path: '/ai-buyume/asistan', icon: 'bot' },
  { label: 'AI Ajanları', path: '/ai-buyume/ajanlar', icon: 'network' },
  { label: 'Otomasyon', path: '/ai-buyume/otomasyon', icon: 'workflow' },
  { label: 'Analitik', path: '/ai-buyume/analitik', icon: 'bar-chart-3' },
  { label: 'Ayarlar', path: '/ai-buyume/ayarlar', icon: 'settings' },
]

export function isAiGrowthRoute(pathname) {
  return pathname === AI_GROWTH_HOME_PATH || pathname.startsWith(`${AI_GROWTH_HOME_PATH}/`)
}
