/**
 * Product hubs temporarily shelved from CRM UI (2026-07-21 / expanded 2026-07-26).
 * Code/pages/API remain in repo — restore via docs/109_SHELVED_HUBS.md
 * Routes are redirected home so stub surfaces are not sold as production features.
 */
export const SHELVED_HUBS = [
  {
    id: 'ai-command',
    label: 'AI Command Center',
    routes: ['/', '/ai-komut', '/command-center'],
    page: 'src/pages/AiCommandCenterPage.jsx',
    storeKeys: ['bach_command_center'],
    note: 'Root "/" is Dashboard — do not treat as shelved route redirect',
    skipRedirect: true,
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
    label: 'Integration Hub (legacy)',
    routes: ['/integration-hub'],
    page: 'src/pages/IntegrationHubPage.jsx',
    storeKeys: ['bach_integration_hub_ih0_v1'],
    note: 'In-memory stub — not durable. SaaS Entegrasyon Merkezi (/entegrasyon) is separate.',
  },
  {
    id: 'finance-center-stub',
    label: 'Finance Center (FS-0 stub)',
    routes: ['/finans'],
    page: 'src/pages/FinanceCenterPage.jsx',
    note: 'localStore stub — treasury/cash routes remain production UI',
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
    note: 'Sidebar hidden; hard redirect until production-ready',
  },
  {
    id: 'aios',
    label: 'AI Operating System',
    routes: ['/aios'],
    page: 'src/pages/AiosHubPage.jsx',
    note: 'Sidebar hidden; hard redirect until production-ready',
  },
  {
    id: 'knowledge-center',
    label: 'Knowledge Center',
    routes: ['/bilgi-merkezi'],
    page: 'src/pages/KnowledgeCenterPage.jsx',
    note: 'Sidebar hidden; hard redirect until production-ready',
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin',
    routes: ['/dijital-ikiz'],
    page: 'src/pages/DigitalTwinCenterPage.jsx',
    note: 'Sidebar hidden; hard redirect until production-ready',
  },
  {
    id: 'customer-experience',
    label: 'Müşteri Deneyimi',
    routes: ['/musteri-deneyimi', '/cxc'],
    page: 'src/pages/CustomerExperienceCloudPage.jsx',
    note: 'Sidebar hidden; hard redirect until production-ready',
  },
  {
    id: 'bachy',
    label: 'Bachy AIOS companion',
    routes: ['/aios/bachy'],
    page: 'src/pages/BachySettingsPage.jsx',
    note: 'UI removed 2026-07-22 — code kept under src/bachy + src/components/Bachy',
  },
]

export const SHELVED_ROUTE_SET = new Set(
  SHELVED_HUBS.filter((h) => !h.skipRedirect).flatMap((h) => h.routes.filter((r) => r !== '/')),
)

export function isShelvedHubRoute(pathname) {
  if (!pathname || pathname === '/') return false
  if (SHELVED_ROUTE_SET.has(pathname)) return true
  return SHELVED_HUBS.filter((h) => !h.skipRedirect).some((h) =>
    h.routes.some((r) => r !== '/' && pathname.startsWith(`${r}/`)),
  )
}
