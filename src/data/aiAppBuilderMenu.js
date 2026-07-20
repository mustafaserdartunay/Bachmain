export const APP_BUILDER_BASE = '/ai-uygulama'

export const appBuilderSubMenus = [
  { id: 'home', label: 'App Center' },
  { id: 'applications', label: 'Applications' },
  { id: 'modules', label: 'Module Builder' },
  { id: 'pages', label: 'Page Builder' },
  { id: 'forms', label: 'Form Builder' },
  { id: 'tables', label: 'Table Builder' },
  { id: 'dashboards', label: 'Dashboard Builder' },
  { id: 'workflow', label: 'Workflow Builder' },
  { id: 'automation', label: 'Automation' },
  { id: 'api', label: 'API Builder' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'designer', label: 'AI Designer' },
  { id: 'preview', label: 'Preview' },
  { id: 'publish', label: 'Publish' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'templates', label: 'Templates' },
  { id: 'versions', label: 'Versions' },
]

export function isAppBuilderRoute(pathname) {
  return (
    pathname === APP_BUILDER_BASE ||
    pathname === '/ai-app-builder' ||
    pathname.startsWith(`${APP_BUILDER_BASE}/`)
  )
}
