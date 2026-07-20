export const MARKETPLACE_BASE = '/marketplace'

export const marketplaceSubMenus = [
  { id: 'discover', label: 'Discover' },
  { id: 'featured', label: 'Featured' },
  { id: 'industry', label: 'Industry Packs' },
  { id: 'applications', label: 'Applications' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'extensions', label: 'Extensions' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'workflows', label: 'Workflow Packs' },
  { id: 'documents', label: 'Document Packs' },
  { id: 'dashboards', label: 'Dashboard Packs' },
  { id: 'themes', label: 'Theme Store' },
  { id: 'printers', label: 'Printer Packs' },
  { id: 'languages', label: 'Language Packs' },
  { id: 'prompts', label: 'AI Prompts' },
  { id: 'assets', label: 'Asset Library' },
  { id: 'recommend', label: 'AI Recommend' },
  { id: 'installed', label: 'Installed' },
  { id: 'updates', label: 'Updates' },
  { id: 'licenses', label: 'Licenses' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'developer', label: 'Developer' },
  { id: 'partner', label: 'Partner' },
  { id: 'enterprise', label: 'Enterprise' },
]

export function isMarketplaceRoute(pathname) {
  return (
    pathname === MARKETPLACE_BASE ||
    pathname === '/magaza' ||
    pathname.startsWith(`${MARKETPLACE_BASE}/`)
  )
}
