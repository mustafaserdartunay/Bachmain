/** IH-0 Integration Hub local catalog + connections. */

const KEY = 'bach_integration_hub_ih0_v1'
const EVT = 'bach:integration-hub-updated'

export const INTEGRATION_HUB_UPDATED_EVENT = EVT

export const CONNECTORS = [
  {
    id: 'proto.rest',
    slug: 'rest-api',
    title: 'REST API',
    kind: 'protocol',
    protocol: 'REST',
    summary: 'HTTP JSON · OpenAPI',
    featured: true,
    status: 'available',
    tags: ['api'],
  },
  {
    id: 'proto.graphql',
    slug: 'graphql',
    title: 'GraphQL',
    kind: 'protocol',
    protocol: 'GraphQL',
    summary: 'Query · mutation',
    status: 'available',
    tags: ['api'],
  },
  {
    id: 'proto.soap',
    slug: 'soap',
    title: 'SOAP',
    kind: 'protocol',
    protocol: 'SOAP',
    summary: 'WSDL · XML',
    status: 'available',
    tags: ['legacy'],
  },
  {
    id: 'proto.mqtt',
    slug: 'mqtt',
    title: 'MQTT',
    kind: 'iot',
    protocol: 'MQTT',
    summary: 'IoT · sensors',
    status: 'beta',
    tags: ['iot'],
  },
  {
    id: 'proto.sftp',
    slug: 'sftp',
    title: 'SFTP',
    kind: 'storage',
    protocol: 'SFTP',
    summary: 'Güvenli dosya aktarımı',
    featured: true,
    status: 'available',
    tags: ['file'],
  },
  {
    id: 'saas.openai',
    slug: 'openai',
    title: 'OpenAI',
    kind: 'saas',
    protocol: 'REST',
    summary: 'AI Gateway',
    featured: true,
    status: 'available',
    deepLink: '/ayarlar/ai/openai',
    tags: ['ai'],
  },
  {
    id: 'msg.whatsapp',
    slug: 'whatsapp',
    title: 'WhatsApp',
    kind: 'messaging',
    protocol: 'REST',
    summary: 'Omnichannel',
    featured: true,
    status: 'available',
    deepLink: '/mesajlar',
    tags: ['omni'],
  },
  {
    id: 'com.shopify',
    slug: 'shopify',
    title: 'Shopify',
    kind: 'commerce',
    protocol: 'REST',
    summary: 'Sipariş · stok',
    featured: true,
    status: 'available',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  {
    id: 'com.woo',
    slug: 'woocommerce',
    title: 'WooCommerce',
    kind: 'commerce',
    protocol: 'REST',
    summary: 'WordPress mağaza',
    status: 'available',
    deepLink: '/ticaret',
    tags: ['commerce'],
  },
  {
    id: 'com.trendyol',
    slug: 'trendyol',
    title: 'Trendyol',
    kind: 'commerce',
    protocol: 'REST',
    summary: 'Pazaryeri',
    status: 'beta',
    deepLink: '/ticaret',
    tags: ['marketplace'],
  },
  {
    id: 'pay.stripe',
    slug: 'stripe',
    title: 'Stripe',
    kind: 'payment',
    protocol: 'REST',
    summary: 'Ödeme · webhook',
    featured: true,
    status: 'available',
    tags: ['billing'],
  },
  {
    id: 'pay.iyzico',
    slug: 'iyzico',
    title: 'iyzico',
    kind: 'payment',
    protocol: 'REST',
    summary: 'TR ödeme',
    status: 'available',
    tags: ['billing'],
  },
  {
    id: 'erp.logo',
    slug: 'logo-erp',
    title: 'Logo ERP',
    kind: 'erp',
    protocol: 'REST',
    summary: 'Stok · fatura',
    featured: true,
    status: 'coming',
    tags: ['erp', 'tr'],
  },
  {
    id: 'erp.parasut',
    slug: 'parasut',
    title: 'Paraşüt',
    kind: 'erp',
    protocol: 'REST',
    summary: 'Muhasebe',
    status: 'coming',
    tags: ['accounting', 'tr'],
  },
  {
    id: 'erp.sap',
    slug: 'sap',
    title: 'SAP',
    kind: 'erp',
    protocol: 'REST',
    summary: 'Enterprise ERP',
    status: 'coming',
    tags: ['erp'],
  },
  {
    id: 'ship.yurtici',
    slug: 'yurtici',
    title: 'Yurtiçi Kargo',
    kind: 'shipping',
    protocol: 'REST',
    summary: 'Sevk · takip',
    status: 'beta',
    deepLink: '/lojistik',
    tags: ['shipping'],
  },
  {
    id: 'ship.aras',
    slug: 'aras',
    title: 'Aras Kargo',
    kind: 'shipping',
    protocol: 'REST',
    summary: 'Sevk · takip',
    status: 'beta',
    deepLink: '/lojistik',
    tags: ['shipping'],
  },
  {
    id: 'bank.open',
    slug: 'open-banking',
    title: 'Open Banking',
    kind: 'bank',
    protocol: 'REST',
    summary: 'Hesap hareketi · ISO20022',
    status: 'coming',
    deepLink: '/finans',
    tags: ['bank'],
  },
  {
    id: 'iot.opcua',
    slug: 'opc-ua',
    title: 'OPC-UA',
    kind: 'iot',
    protocol: 'OPC-UA',
    summary: 'PLC · makine',
    status: 'coming',
    deepLink: '/mes',
    tags: ['mes'],
  },
  {
    id: 'store.s3',
    slug: 'amazon-s3',
    title: 'Amazon S3',
    kind: 'storage',
    protocol: 'S3',
    summary: 'Object storage',
    status: 'available',
    tags: ['file'],
  },
]

export const WEBHOOKS = [
  {
    id: 'wh_in_1',
    direction: 'incoming',
    url: '/v1/webhooks/inbound/{tenant}',
    status: 'active',
    signature: true,
  },
  {
    id: 'wh_out_1',
    direction: 'outgoing',
    url: 'https://partner.example/hooks/bach',
    status: 'paused',
    signature: true,
  },
]

export const RETRIES = [
  {
    id: 'rt_1',
    connectorSlug: 'shopify',
    error: '429 rate limit',
    attempts: 2,
    nextRetryAt: null,
  },
]

function blank() {
  return { connections: [] }
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

export function ensureIntegrationSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listConnectorsLocal(filter) {
  if (!filter || filter === 'dashboard' || filter === 'connections') return CONNECTORS
  if (filter === 'marketplace') return CONNECTORS.filter((c) => c.kind !== 'protocol')
  if (filter === 'erp') return CONNECTORS.filter((c) => c.kind === 'erp')
  if (filter === 'commerce') return CONNECTORS.filter((c) => c.kind === 'commerce')
  if (filter === 'payment') return CONNECTORS.filter((c) => c.kind === 'payment')
  if (filter === 'shipping') return CONNECTORS.filter((c) => c.kind === 'shipping')
  if (filter === 'bank') return CONNECTORS.filter((c) => c.kind === 'bank')
  if (filter === 'iot') return CONNECTORS.filter((c) => c.kind === 'iot')
  if (filter === 'storage' || filter === 'files') {
    return CONNECTORS.filter((c) => c.kind === 'storage' || c.protocol === 'SFTP')
  }
  if (filter === 'protocols') return CONNECTORS.filter((c) => c.kind === 'protocol')
  return CONNECTORS
}

export function listConnectionsLocal() {
  return read().connections
}

export function isConnectedLocal(id) {
  return read().connections.some((x) => x.connectorId === id)
}

export function connectLocal(item) {
  if (item.status === 'coming') return { error: 'coming' }
  const s = read()
  if (s.connections.some((x) => x.connectorId === item.id)) return null
  const row = {
    id: `ic_${Date.now()}`,
    connectorId: item.id,
    slug: item.slug,
    title: item.title,
    protocol: item.protocol,
    status: 'connected',
    health: 'ok',
    lastSyncAt: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
  }
  s.connections = [row, ...s.connections]
  write(s)
  return row
}

export function disconnectLocal(connectorId) {
  const s = read()
  s.connections = s.connections.filter(
    (x) => x.connectorId !== connectorId && x.slug !== connectorId,
  )
  write(s)
}

export function overviewLocal() {
  const connections = read().connections
  return {
    connectors: CONNECTORS.length,
    connected: connections.length,
    webhooks: WEBHOOKS.length,
    retries: RETRIES.length,
    featured: CONNECTORS.filter((c) => c.featured).length,
    healthOk: connections.filter((c) => c.health === 'ok').length,
  }
}

export function runWizardLocal(brief) {
  const hints = String(brief || '')
    .toLowerCase()
    .split(/[\s,.;:]+/)
    .filter((w) => w.length > 2)
  const scored = CONNECTORS.map((c) => {
    let score = c.featured ? 2 : 0
    if (c.status === 'available') score += 1
    for (const t of c.tags || []) {
      if (hints.some((x) => x.includes(t) || t.includes(x))) score += 3
    }
    if (hints.some((x) => c.title.toLowerCase().includes(x) || c.slug.includes(x))) score += 4
    return { ...c, score }
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  const primary = scored[0]
  return {
    suggested: scored,
    draftFlow: {
      name: primary ? `${primary.title} sync` : 'Custom integration',
      steps: [
        'Trigger',
        primary ? `API: ${primary.title}` : 'API Call',
        'Transform',
        'Validate',
        'End',
      ],
      deepLink: '/otomasyon/designer',
    },
  }
}
