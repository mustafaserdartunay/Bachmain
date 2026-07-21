/**
 * Product hubs temporarily shelved from CRM UI (2026-07-21).
 * Code/pages/API remain in repo — restore via docs/109_SHELVED_HUBS.md
 */
export const SHELVED_HUBS = [
  {
    id: 'ai-command',
    label: 'AI Command Center',
    routes: ['/', '/ai-komut', '/command-center'],
    page: 'src/pages/AiCommandCenterPage.jsx',
    storeKeys: ['bach_command_center'],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    routes: ['/marketplace', '/magaza'],
    page: 'src/pages/MarketplacePage.jsx',
    storeKeys: ['bach_marketplace_mp0_v1'],
  },
  {
    id: 'integration-hub',
    label: 'Entegrasyon',
    routes: ['/entegrasyon', '/integration-hub'],
    page: 'src/pages/IntegrationHubPage.jsx',
    storeKeys: ['bach_integration_hub_ih0_v1'],
  },
  {
    id: 'commerce-cloud',
    label: 'Commerce Cloud',
    routes: ['/ticaret', '/commerce', '/bayi'],
    page: 'src/pages/CommerceCenterPage.jsx',
    storeKeys: ['bach_commerce_gc0_v1'],
  },
  {
    id: 'platform',
    label: 'Platform',
    routes: ['/platform', '/cekirdek'],
    page: 'src/pages/PlatformCenterPage.jsx',
    storeKeys: ['bach_platform_pc0_v1'],
  },
  {
    id: 'workflow-engine',
    label: 'Workflow Engine',
    routes: ['/otomasyon'],
    page: 'src/pages/WorkflowHubPage.jsx',
    note: 'Sidebar hidden only; route kept. Restore: processMenu hidden:false',
  },
  {
    id: 'aios',
    label: 'AI Operating System',
    routes: ['/aios'],
    page: 'src/pages/AiosHubPage.jsx',
    note: 'Sidebar hidden only; route kept. Restore: processMenu hidden:false',
  },
  {
    id: 'knowledge-center',
    label: 'Knowledge Center',
    routes: ['/bilgi-merkezi'],
    page: 'src/pages/KnowledgeCenterPage.jsx',
    note: 'Sidebar hidden only; route kept. Restore: processMenu hidden:false',
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin',
    routes: ['/dijital-ikiz'],
    page: 'src/pages/DigitalTwinCenterPage.jsx',
    note: 'Sidebar hidden only; route kept. Restore: processMenu hidden:false',
  },
]

export const SHELVED_ROUTE_SET = new Set(SHELVED_HUBS.flatMap((h) => h.routes))

export function isShelvedHubRoute(pathname) {
  if (!pathname) return false
  if (SHELVED_ROUTE_SET.has(pathname)) return true
  return SHELVED_HUBS.some((h) => h.routes.some((r) => r !== '/' && pathname.startsWith(`${r}/`)))
}
