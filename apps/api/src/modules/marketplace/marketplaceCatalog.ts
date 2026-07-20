/** BachMain Marketplace catalog — MP-0 ecosystem packs. */

export type MarketplaceKind =
  | 'industry'
  | 'agent'
  | 'application'
  | 'extension'
  | 'integration'
  | 'workflow'
  | 'document'
  | 'dashboard'
  | 'theme'
  | 'printer'
  | 'language'
  | 'prompt'
  | 'asset'

export type MarketplaceItem = {
  id: string
  slug: string
  title: string
  kind: MarketplaceKind
  category: string
  summary: string
  featured?: boolean
  trending?: boolean
  rating: number
  installs: number
  version: string
  license: 'free' | 'trial' | 'pro' | 'enterprise'
  deepLink?: string
  tags: string[]
}

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // Industry
  {
    id: 'ind.furniture',
    slug: 'industry-furniture',
    title: 'Mobilya Pack',
    kind: 'industry',
    category: 'industry',
    summary: 'Sipariş · üretim · sevk · teklif şablonları',
    featured: true,
    trending: true,
    rating: 4.8,
    installs: 1240,
    version: '1.2.0',
    license: 'pro',
    tags: ['mobilya', 'üretim'],
  },
  {
    id: 'ind.chocolate',
    slug: 'industry-chocolate',
    title: 'Çikolata Pack',
    kind: 'industry',
    category: 'industry',
    summary: 'Lot · kalite · soğuk zincir',
    featured: true,
    rating: 4.6,
    installs: 420,
    version: '1.0.1',
    license: 'pro',
    tags: ['gıda', 'kalite'],
  },
  {
    id: 'ind.logistics',
    slug: 'industry-logistics',
    title: 'Lojistik Pack',
    kind: 'industry',
    category: 'industry',
    summary: 'Rota · tır · CMR · doluluk',
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
    category: 'industry',
    summary: 'Shopify/Woo köprü · sipariş · iade',
    rating: 4.5,
    installs: 2100,
    version: '2.0.0',
    license: 'pro',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  // Agents
  {
    id: 'agent.sales',
    slug: 'ai-sales-agent',
    title: 'Sales AI',
    kind: 'agent',
    category: 'agents',
    summary: 'Pipeline · teklif · iskonto riski',
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
    category: 'agents',
    summary: 'Günlük brifing · risk · fırsat',
    featured: true,
    rating: 4.8,
    installs: 2800,
    version: '1.1.0',
    license: 'enterprise',
    deepLink: '/ai-organizasyon',
    tags: ['aios', 'executive'],
  },
  {
    id: 'agent.warehouse',
    slug: 'ai-warehouse-agent',
    title: 'Warehouse AI',
    kind: 'agent',
    category: 'agents',
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
    category: 'agents',
    summary: 'Nakit · tahsilat · marj',
    rating: 4.7,
    installs: 1900,
    version: '1.0.2',
    license: 'pro',
    deepLink: '/ai-organizasyon',
    tags: ['finans'],
  },
  // Applications
  {
    id: 'app.service',
    slug: 'app-service-mgmt',
    title: 'Servis Yönetimi',
    kind: 'application',
    category: 'applications',
    summary: 'Ticket · teknisyen · SLA',
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
    category: 'applications',
    summary: 'Makine · planlı bakım · iş emri',
    rating: 4.4,
    installs: 640,
    version: '0.9.0',
    license: 'trial',
    deepLink: '/ai-uygulama',
    tags: ['bakım', 'mes'],
  },
  {
    id: 'app.quality',
    slug: 'app-quality',
    title: 'Kalite Yönetimi',
    kind: 'application',
    category: 'applications',
    summary: 'IQC · fire · iade',
    rating: 4.3,
    installs: 510,
    version: '0.8.0',
    license: 'pro',
    tags: ['kalite'],
  },
  // Documents
  {
    id: 'doc.quote',
    slug: 'doc-quote-pack',
    title: 'Teklif Şablon Pack',
    kind: 'document',
    category: 'documents',
    summary: 'Teklif PDF · değişkenler',
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
    category: 'documents',
    summary: 'Packing · CMR · etiket',
    rating: 4.6,
    installs: 2200,
    version: '1.2.0',
    license: 'free',
    deepLink: '/belge-merkezi/marketplace',
    tags: ['sevkiyat'],
  },
  // Dashboards
  {
    id: 'dash.ceo',
    slug: 'dash-ceo',
    title: 'CEO Dashboard',
    kind: 'dashboard',
    category: 'dashboards',
    summary: 'Executive KPI wall',
    featured: true,
    rating: 4.7,
    installs: 1800,
    version: '1.1.0',
    license: 'pro',
    deepLink: '/analitik?tab=builder',
    tags: ['analytics'],
  },
  {
    id: 'dash.production',
    slug: 'dash-production',
    title: 'Üretim Dashboard',
    kind: 'dashboard',
    category: 'dashboards',
    summary: 'OEE · fire · iş emri',
    rating: 4.5,
    installs: 1200,
    version: '1.0.0',
    license: 'pro',
    deepLink: '/analitik?tab=builder',
    tags: ['mes'],
  },
  // Workflows
  {
    id: 'wf.approval',
    slug: 'wf-approval',
    title: 'Onay Süreci Pack',
    kind: 'workflow',
    category: 'workflows',
    summary: 'Eşik · müdür onayı · mail/WA',
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
    category: 'workflows',
    summary: 'Gecikme · hatırlatma · escalate',
    rating: 4.6,
    installs: 1600,
    version: '1.1.0',
    license: 'pro',
    deepLink: '/otomasyon',
    tags: ['finans'],
  },
  // Integrations
  {
    id: 'int.whatsapp',
    slug: 'int-whatsapp',
    title: 'WhatsApp',
    kind: 'integration',
    category: 'integrations',
    summary: 'Omnichannel mesaj',
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
    category: 'integrations',
    summary: 'AI Gateway provider',
    featured: true,
    rating: 4.9,
    installs: 8000,
    version: '1.0.0',
    license: 'enterprise',
    deepLink: '/ayarlar/ai/openai',
    tags: ['aios'],
  },
  {
    id: 'int.maps',
    slug: 'int-google-maps',
    title: 'Google Maps',
    kind: 'integration',
    category: 'integrations',
    summary: 'Rota · konum',
    rating: 4.7,
    installs: 3500,
    version: '1.2.0',
    license: 'pro',
    tags: ['maps'],
  },
  {
    id: 'int.shopify',
    slug: 'int-shopify',
    title: 'Shopify',
    kind: 'integration',
    category: 'integrations',
    summary: 'Sipariş · stok sync',
    trending: true,
    rating: 4.5,
    installs: 2700,
    version: '1.0.0',
    license: 'pro',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  // Themes
  {
    id: 'theme.glass',
    slug: 'theme-glass',
    title: 'Glass Theme',
    kind: 'theme',
    category: 'themes',
    summary: 'iOS cam yüzey dili',
    featured: true,
    rating: 4.8,
    installs: 4500,
    version: '1.0.0',
    license: 'free',
    tags: ['ui'],
  },
  {
    id: 'theme.executive',
    slug: 'theme-executive',
    title: 'Executive Theme',
    kind: 'theme',
    category: 'themes',
    summary: 'Yönetici paneli görünümü',
    rating: 4.4,
    installs: 900,
    version: '1.0.0',
    license: 'pro',
    tags: ['ui'],
  },
  // Prompts
  {
    id: 'prompt.seo',
    slug: 'prompt-seo',
    title: 'SEO Prompt Pack',
    kind: 'prompt',
    category: 'prompts',
    summary: 'Blog · meta · anahtar kelime',
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
    category: 'prompts',
    summary: '360 özet · next action',
    rating: 4.7,
    installs: 1700,
    version: '1.0.0',
    license: 'free',
    deepLink: '/aios?tab=prompts',
    tags: ['crm'],
  },
]

export function getMarketplaceCatalog() {
  return {
    version: 'MP-0',
    rule: 'Installs are Plugin SDK extensions — never mutate Platform Core.',
    items: MARKETPLACE_ITEMS,
    counts: {
      total: MARKETPLACE_ITEMS.length,
      industry: MARKETPLACE_ITEMS.filter((i) => i.kind === 'industry').length,
      agents: MARKETPLACE_ITEMS.filter((i) => i.kind === 'agent').length,
      applications: MARKETPLACE_ITEMS.filter((i) => i.kind === 'application').length,
      integrations: MARKETPLACE_ITEMS.filter((i) => i.kind === 'integration').length,
    },
  }
}

export function recommendMarketplaceItems(hints: string[] = []) {
  const h = hints.map((x) => x.toLowerCase())
  const scored = MARKETPLACE_ITEMS.map((item) => {
    let score = item.featured ? 2 : 0
    score += item.trending ? 1 : 0
    score += item.rating
    if (h.some((x) => item.tags.some((t) => t.includes(x) || x.includes(t)))) score += 3
    return { ...item, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, 8)
}
