export const SOCIAL_MEDIA_HOME_PATH = '/sosyal-medya'
export const SOCIAL_MEDIA_MODULE_CODE = 'ai_growth'

export const socialMediaSubMenus = [
  { label: 'Dashboard', path: '/sosyal-medya', icon: 'layout-dashboard', end: true },
  { label: 'Instagram Hesapları', path: '/sosyal-medya/hesaplar', icon: 'instagram' },
  { label: 'Content Studio', path: '/sosyal-medya/studio', icon: 'sparkles' },
  { label: 'AI Creator', path: '/sosyal-medya/ai-creator', icon: 'bot' },
  { label: 'Media Library', path: '/sosyal-medya/medya', icon: 'image' },
  { label: 'Campaigns', path: '/sosyal-medya/kampanyalar', icon: 'megaphone' },
  { label: 'Scheduler', path: '/sosyal-medya/zamanlama', icon: 'clock' },
  { label: 'Calendar', path: '/sosyal-medya/takvim', icon: 'calendar' },
  { label: 'Templates', path: '/sosyal-medya/sablonlar', icon: 'panels-top-left' },
  { label: 'Brand Kit', path: '/sosyal-medya/marka', icon: 'palette' },
  { label: 'Approval', path: '/sosyal-medya/onay', icon: 'check-square' },
  { label: 'Publishing Queue', path: '/sosyal-medya/kuyruk', icon: 'workflow' },
  { label: 'Analytics', path: '/sosyal-medya/analitik', icon: 'bar-chart-3' },
  { label: 'Comments', path: '/sosyal-medya/yorumlar', icon: 'message-circle' },
  { label: 'Messages', path: '/sosyal-medya/mesajlar', icon: 'mail' },
  { label: 'Settings', path: '/sosyal-medya/ayarlar', icon: 'settings' },
]

export function isSocialMediaRoute(pathname) {
  return (
    pathname === SOCIAL_MEDIA_HOME_PATH ||
    pathname.startsWith(`${SOCIAL_MEDIA_HOME_PATH}/`) ||
    pathname === '/ai-buyume' ||
    pathname.startsWith('/ai-buyume/')
  )
}
