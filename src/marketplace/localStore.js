/** MP-0 Marketplace local catalog + installs (Plugin SDK stub). */

const KEY = 'bach_marketplace_mp0_v1'
const EVT = 'bach:marketplace-updated'

export const MARKETPLACE_UPDATED_EVENT = EVT

export const CATALOG = [
  {
    id: 'ind.furniture',
    slug: 'industry-furniture',
    title: 'Mobilya Pack',
    kind: 'industry',
    summary: 'Sipariş · üretim · sevk · teklif',
    featured: true,
    trending: true,
    rating: 4.8,
    installs: 1240,
    version: '1.2.0',
    license: 'pro',
    tags: ['mobilya'],
  },
  {
    id: 'ind.chocolate',
    slug: 'industry-chocolate',
    title: 'Çikolata Pack',
    kind: 'industry',
    summary: 'Lot · kalite · soğuk zincir',
    featured: true,
    rating: 4.6,
    installs: 420,
    version: '1.0.1',
    license: 'pro',
    tags: ['gıda'],
  },
  {
    id: 'ind.logistics',
    slug: 'industry-logistics',
    title: 'Lojistik Pack',
    kind: 'industry',
    summary: 'Rota · tır · CMR',
    trending: true,
    rating: 4.7,
    installs: 980,
    version: '1.3.0',
    license: 'pro',
    deepLink: '/lojistik',
    tags: ['lojistik'],
  },
  {
    id: 'ind.ecommerce',
    slug: 'industry-ecommerce',
    title: 'E-Ticaret Pack',
    kind: 'industry',
    summary: 'Shopify/Woo · sipariş',
    rating: 4.5,
    installs: 2100,
    version: '2.0.0',
    license: 'pro',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  {
    id: 'ind.packaging',
    slug: 'industry-packaging',
    title: 'Ambalaj Pack',
    kind: 'industry',
    summary: 'Palet · koli · etiket',
    rating: 4.4,
    installs: 310,
    version: '1.0.0',
    license: 'pro',
    tags: ['ambalaj'],
  },
  {
    id: 'agent.sales',
    slug: 'ai-sales-agent',
    title: 'Sales AI',
    kind: 'agent',
    summary: 'Pipeline · teklif',
    featured: true,
    rating: 4.9,
    installs: 3200,
    version: '1.1.0',
    license: 'pro',
    deepLink: '/ai-organizasyon',
    tags: ['aios', 'sales'],
  },
  {
    id: 'agent.ceo',
    slug: 'ai-ceo-agent',
    title: 'CEO AI',
    kind: 'agent',
    summary: 'Brifing · risk · fırsat',
    featured: true,
    rating: 4.8,
    installs: 2800,
    version: '1.1.0',
    license: 'enterprise',
    deepLink: '/ai-organizasyon',
    tags: ['aios'],
  },
  {
    id: 'agent.warehouse',
    slug: 'ai-warehouse-agent',
    title: 'Warehouse AI',
    kind: 'agent',
    summary: 'FIFO · ABC · kritik stok',
    rating: 4.6,
    installs: 1500,
    version: '1.0.0',
    license: 'pro',
    deepLink: '/ai-organizasyon',
    tags: ['depo'],
  },
  {
    id: 'agent.finance',
    slug: 'ai-finance-agent',
    title: 'Finance AI',
    kind: 'agent',
    summary: 'Nakit · tahsilat',
    rating: 4.7,
    installs: 1900,
    version: '1.0.2',
    license: 'pro',
    deepLink: '/ai-organizasyon',
    tags: ['finans'],
  },
  {
    id: 'agent.hr',
    slug: 'ai-hr-agent',
    title: 'HR AI',
    kind: 'agent',
    summary: 'PDKS · izin · kapasite',
    rating: 4.5,
    installs: 900,
    version: '1.0.0',
    license: 'pro',
    deepLink: '/ai-organizasyon',
    tags: ['hr'],
  },
  {
    id: 'app.service',
    slug: 'app-service-mgmt',
    title: 'Servis Yönetimi',
    kind: 'application',
    summary: 'Ticket · SLA',
    featured: true,
    rating: 4.5,
    installs: 860,
    version: '0.9.0',
    license: 'trial',
    deepLink: '/ai-uygulama',
    tags: ['servis'],
  },
  {
    id: 'app.maintenance',
    slug: 'app-maintenance',
    title: 'Bakım Yönetimi',
    kind: 'application',
    summary: 'Makine · iş emri',
    rating: 4.4,
    installs: 640,
    version: '0.9.0',
    license: 'trial',
    deepLink: '/ai-uygulama',
    tags: ['bakım'],
  },
  {
    id: 'doc.quote',
    slug: 'doc-quote-pack',
    title: 'Teklif Şablon Pack',
    kind: 'document',
    summary: 'Teklif PDF',
    featured: true,
    rating: 4.8,
    installs: 4100,
    version: '1.4.0',
    license: 'free',
    deepLink: '/belge-merkezi/marketplace',
    tags: ['teklif'],
  },
  {
    id: 'doc.packing',
    slug: 'doc-packing-list',
    title: 'Packing List Pack',
    kind: 'document',
    summary: 'Packing · CMR · etiket',
    rating: 4.6,
    installs: 2200,
    version: '1.2.0',
    license: 'free',
    deepLink: '/belge-merkezi/marketplace',
    tags: ['sevkiyat'],
  },
  {
    id: 'dash.ceo',
    slug: 'dash-ceo',
    title: 'CEO Dashboard',
    kind: 'dashboard',
    summary: 'Executive KPI',
    featured: true,
    rating: 4.7,
    installs: 1800,
    version: '1.1.0',
    license: 'pro',
    deepLink: '/analitik?tab=builder',
    tags: ['analytics'],
  },
  {
    id: 'wf.approval',
    slug: 'wf-approval',
    title: 'Onay Süreci Pack',
    kind: 'workflow',
    summary: 'Eşik · onay · mail/WA',
    featured: true,
    trending: true,
    rating: 4.9,
    installs: 5000,
    version: '1.5.0',
    license: 'free',
    deepLink: '/otomasyon',
    tags: ['onay'],
  },
  {
    id: 'wf.collection',
    slug: 'wf-collection',
    title: 'Tahsilat Workflow',
    kind: 'workflow',
    summary: 'Gecikme hatırlatma',
    rating: 4.6,
    installs: 1600,
    version: '1.1.0',
    license: 'pro',
    deepLink: '/otomasyon',
    tags: ['finans'],
  },
  {
    id: 'int.whatsapp',
    slug: 'int-whatsapp',
    title: 'WhatsApp',
    kind: 'integration',
    summary: 'Omnichannel',
    featured: true,
    rating: 4.8,
    installs: 6000,
    version: '2.1.0',
    license: 'pro',
    deepLink: '/mesajlar',
    tags: ['omni'],
  },
  {
    id: 'int.openai',
    slug: 'int-openai',
    title: 'OpenAI',
    kind: 'integration',
    summary: 'AI Gateway',
    featured: true,
    rating: 4.9,
    installs: 8000,
    version: '1.0.0',
    license: 'enterprise',
    deepLink: '/ayarlar/ai/openai',
    tags: ['aios'],
  },
  {
    id: 'int.shopify',
    slug: 'int-shopify',
    title: 'Shopify',
    kind: 'integration',
    summary: 'Sipariş · stok',
    trending: true,
    rating: 4.5,
    installs: 2700,
    version: '1.0.0',
    license: 'pro',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  {
    id: 'theme.glass',
    slug: 'theme-glass',
    title: 'Glass Theme',
    kind: 'theme',
    summary: 'iOS cam yüzey',
    featured: true,
    rating: 4.8,
    installs: 4500,
    version: '1.0.0',
    license: 'free',
    tags: ['ui'],
  },
  {
    id: 'prompt.seo',
    slug: 'prompt-seo',
    title: 'SEO Prompt Pack',
    kind: 'prompt',
    summary: 'Blog · meta',
    rating: 4.6,
    installs: 2300,
    version: '1.0.0',
    license: 'free',
    deepLink: '/aios?tab=prompts',
    tags: ['growth'],
  },
  {
    id: 'prompt.crm',
    slug: 'prompt-crm',
    title: 'CRM Prompt Pack',
    kind: 'prompt',
    summary: '360 · next action',
    rating: 4.7,
    installs: 1700,
    version: '1.0.0',
    license: 'free',
    deepLink: '/aios?tab=prompts',
    tags: ['crm'],
  },
]

function blank() {
  return { installed: [], reviews: [] }
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

export function ensureMarketplaceSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listCatalogLocal(kind) {
  if (!kind || kind === 'discover' || kind === 'featured') {
    if (kind === 'featured') return CATALOG.filter((i) => i.featured)
    return CATALOG
  }
  const map = {
    industry: 'industry',
    agents: 'agent',
    applications: 'application',
    extensions: 'extension',
    integrations: 'integration',
    workflows: 'workflow',
    documents: 'document',
    dashboards: 'dashboard',
    themes: 'theme',
    prompts: 'prompt',
  }
  const k = map[kind] || kind
  return CATALOG.filter((i) => i.kind === k)
}

export function listInstalledLocal() {
  return read().installed
}

export function isInstalledLocal(id) {
  return read().installed.some((x) => x.itemId === id)
}

export function installLocal(item) {
  const s = read()
  if (s.installed.some((x) => x.itemId === item.id)) return null
  const row = {
    id: `mpi_${Date.now()}`,
    itemId: item.id,
    slug: item.slug,
    title: item.title,
    version: item.version,
    license: item.license,
    status: 'installed',
    securityScan: 'passed',
    pluginCode: `plugin.${item.slug}`,
    installedAt: new Date().toISOString(),
  }
  s.installed = [row, ...s.installed]
  write(s)
  return row
}

export function uninstallLocal(itemId) {
  const s = read()
  s.installed = s.installed.filter((x) => x.itemId !== itemId)
  write(s)
}

export function recommendLocal() {
  return [...CATALOG]
    .sort((a, b) => (b.featured ? 2 : 0) + b.rating - ((a.featured ? 2 : 0) + a.rating))
    .slice(0, 6)
}

export function overviewLocal() {
  const installed = read().installed
  return {
    total: CATALOG.length,
    featured: CATALOG.filter((i) => i.featured).length,
    installed: installed.length,
    trending: CATALOG.filter((i) => i.trending).length,
  }
}
