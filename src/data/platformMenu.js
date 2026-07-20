export const PLATFORM_BASE = '/platform'

export const platformSubMenus = [
  { id: 'core', label: 'Core' },
  { id: 'identity', label: 'Identity' },
  { id: 'authorization', label: 'Authorization' },
  { id: 'settings', label: 'Settings' },
  { id: 'modules', label: 'Modules' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'notification', label: 'Notification' },
  { id: 'automation', label: 'Automation' },
  { id: 'events', label: 'Events' },
  { id: 'queue', label: 'Queue' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'audit', label: 'Audit' },
  { id: 'files', label: 'Files' },
  { id: 'media', label: 'Media' },
  { id: 'localization', label: 'Localization' },
  { id: 'themes', label: 'Themes' },
  { id: 'plugins', label: 'Plugin Center' },
  { id: 'ai', label: 'AI Gateway' },
  { id: 'api', label: 'API Gateway' },
  { id: 'integrations', label: 'Integration Center' },
  { id: 'health', label: 'Health Monitor' },
  { id: 'flags', label: 'Feature Flags' },
  { id: 'license', label: 'License' },
  { id: 'installer', label: 'Installer' },
  { id: 'backup', label: 'Backup' },
  { id: 'update', label: 'Update Manager' },
  { id: 'developer', label: 'Developer Mode' },
]

export function isPlatformRoute(pathname) {
  return (
    pathname === PLATFORM_BASE ||
    pathname === '/cekirdek' ||
    pathname.startsWith(`${PLATFORM_BASE}/`)
  )
}
