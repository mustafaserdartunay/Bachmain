export const INTEGRATION_CENTER_HOME = '/entegrasyon'
export const INTEGRATION_CENTER_MODULE = 'integrations'

export const integrationCenterSubMenus = [
  { label: 'Tüm Bağlantılar', path: '/entegrasyon', icon: 'plug', end: true },
  { label: 'Mesaj Kanalları', path: '/sosyal-medya/baglantilar', icon: 'message-circle' },
  { label: 'Loglar', path: '/entegrasyon/loglar', icon: 'scroll-text' },
]

export function isIntegrationCenterRoute(pathname) {
  return (
    pathname === INTEGRATION_CENTER_HOME ||
    pathname.startsWith(`${INTEGRATION_CENTER_HOME}/`) ||
    pathname === '/integration-hub' ||
    pathname.startsWith('/integration-hub/')
  )
}
