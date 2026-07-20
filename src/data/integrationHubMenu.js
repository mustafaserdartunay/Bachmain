export const INTEGRATION_HUB_BASE = '/entegrasyon'

export const integrationHubSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'connections', label: 'Connections' },
  { id: 'api', label: 'API Manager' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'etl', label: 'ETL Studio' },
  { id: 'edi', label: 'EDI Center' },
  { id: 'files', label: 'File Transfer' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'queues', label: 'Queues' },
  { id: 'transform', label: 'Transform' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'logs', label: 'Logs' },
  { id: 'retry', label: 'Retry Center' },
  { id: 'wizard', label: 'AI Wizard' },
  { id: 'flow', label: 'Flow Builder' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'security', label: 'Security' },
  { id: 'docs', label: 'Docs' },
  { id: 'sandbox', label: 'Sandbox' },
  { id: 'settings', label: 'Settings' },
]

export function isIntegrationHubRoute(pathname) {
  return (
    pathname === INTEGRATION_HUB_BASE ||
    pathname === '/integration-hub' ||
    pathname.startsWith(`${INTEGRATION_HUB_BASE}/`)
  )
}
