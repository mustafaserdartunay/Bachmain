/** PC-0 Platform Core local registry — domains stay SoT behind deep-links. */

const KEY = 'bach_platform_pc0_v1'
const EVT = 'bach:platform-updated'

export const PLATFORM_UPDATED_EVENT = EVT

export const MODULE_REGISTRY = [
  { code: 'identity', label: 'Identity', route: '/profil', domain: 'platform', status: 'active' },
  {
    code: 'mdm',
    label: 'Master Data',
    route: '/ayarlar/master-data',
    domain: 'mdm',
    status: 'active',
  },
  {
    code: 'workflow',
    label: 'Workflow',
    route: '/otomasyon',
    domain: 'platform',
    status: 'active',
  },
  { code: 'aios', label: 'AI Gateway', route: '/aios', domain: 'ai', status: 'active' },
  {
    code: 'knowledge',
    label: 'Knowledge',
    route: '/bilgi-merkezi',
    domain: 'knowledge',
    status: 'active',
  },
  { code: 'commerce', label: 'Commerce', route: '/ticaret', domain: 'commerce', status: 'active' },
  { code: 'growth', label: 'AI Growth', route: '/ai-buyume', domain: 'growth', status: 'active' },
  { code: 'mes', label: 'MES', route: '/mes', domain: 'mes', status: 'active' },
  { code: 'finance', label: 'Finance', route: '/finans', domain: 'finance', status: 'active' },
  { code: 'cxc', label: 'CXC', route: '/musteri-deneyimi', domain: 'crm', status: 'active' },
  {
    code: 'documents',
    label: 'Documents',
    route: '/belge-merkezi',
    domain: 'documents',
    status: 'active',
  },
  {
    code: 'analytics',
    label: 'Analytics',
    route: '/analitik',
    domain: 'analytics',
    status: 'active',
  },
  { code: 'crm', label: 'CRM / ERP', route: '/musteriler', domain: 'crm', status: 'active' },
  {
    code: 'billing',
    label: 'License',
    route: '/hesap/lisans',
    domain: 'platform',
    status: 'active',
  },
]

function blank() {
  return {
    modules: MODULE_REGISTRY.map((m) => ({ ...m })),
    flags: [
      { key: 'platform.developer_mode', enabled: false, description: 'Developer Mode' },
      { key: 'platform.plugin_center', enabled: true, description: 'Plugin Center stubs' },
      { key: 'analytics.cockpit', enabled: true, description: 'Executive Cockpit' },
    ],
    jobs: [
      {
        id: 'j1',
        name: 'nightly-backup-probe',
        queue: 'maintenance',
        status: 'queued',
        priority: 20,
      },
      {
        id: 'j2',
        name: 'analytics-board-report',
        queue: 'reports',
        status: 'queued',
        priority: 40,
      },
    ],
    health: [
      { service: 'API', status: 'ok' },
      { service: 'Database', status: 'ok' },
      { service: 'Redis', status: 'degraded' },
      { service: 'AI Gateway', status: 'ok' },
      { service: 'Email', status: 'ok' },
      { service: 'WhatsApp', status: 'unknown' },
      { service: 'Google Maps', status: 'ok' },
      { service: 'Billing', status: 'ok' },
    ],
    integrations: [
      { code: 'openai', label: 'OpenAI', status: 'configured' },
      { code: 'stripe', label: 'Stripe', status: 'configured' },
      { code: 'whatsapp', label: 'WhatsApp', status: 'configured' },
      { code: 'resend', label: 'Resend', status: 'configured' },
      { code: 'google_maps', label: 'Google Maps', status: 'configured' },
    ],
    plugins: [
      { slug: 'sample-kpi-widget', title: 'Sample KPI Widget', kind: 'widget' },
      { slug: 'sample-workflow-pack', title: 'Sample Workflow Pack', kind: 'workflow' },
    ],
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function ensurePlatformSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listModulesLocal() {
  return read().modules
}

export function setModuleStatusLocal(code, status) {
  const s = read()
  s.modules = s.modules.map((m) => (m.code === code ? { ...m, status } : m))
  write(s)
  return s.modules.find((m) => m.code === code)
}

export function listFlagsLocal() {
  return read().flags
}

export function toggleFlagLocal(key) {
  const s = read()
  s.flags = s.flags.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
  write(s)
  return s.flags.find((f) => f.key === key)
}

export function listJobsLocal() {
  return read().jobs
}

export function enqueueJobLocal(name) {
  const s = read()
  const row = {
    id: `j_${Date.now().toString(36)}`,
    name: name || 'manual-job',
    queue: 'default',
    status: 'queued',
    priority: 50,
  }
  s.jobs = [row, ...s.jobs]
  write(s)
  return row
}

export function healthLocal() {
  return read().health
}

export function listIntegrationsLocal() {
  return read().integrations
}

export function listPluginsLocal() {
  return read().plugins
}

export function platformOverviewLocal() {
  const s = read()
  return {
    phase: 'PC-0',
    architecture: 'modular-monolith',
    activeModules: s.modules.filter((m) => m.status === 'active').length,
    queuedJobs: s.jobs.filter((j) => j.status === 'queued').length,
    flagsOn: s.flags.filter((f) => f.enabled).length,
    eventBus: 'workflow.eventBus',
  }
}

export const EVENT_SAMPLES = [
  'trigger.customer.created',
  'trigger.order.created',
  'trigger.production.started',
  'trigger.warehouse.inbound',
  'trigger.delivery.completed',
  'trigger.invoice.issued',
  'trigger.payment.received',
  'trigger.analytics.dashboard.layout_saved',
  'trigger.document.rendered',
  'trigger.platform.job.queued',
]
