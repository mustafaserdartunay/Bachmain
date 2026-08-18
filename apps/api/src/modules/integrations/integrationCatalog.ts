/** IH-0 Integration Hub connector catalog seed. */

export type ConnectorKind =
  | 'protocol'
  | 'saas'
  | 'erp'
  | 'commerce'
  | 'payment'
  | 'shipping'
  | 'bank'
  | 'iot'
  | 'messaging'
  | 'storage'

export type ConnectorItem = {
  id: string
  slug: string
  title: string
  kind: ConnectorKind
  protocol: string
  summary: string
  featured?: boolean
  status: 'available' | 'beta' | 'coming'
  deepLink?: string
  tags: string[]
}

export const CONNECTOR_CATALOG: ConnectorItem[] = [
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
  {
    id: 'erp.nilvera',
    slug: 'nilvera',
    title: 'Nilvera e-Belge',
    kind: 'erp',
    protocol: 'REST',
    summary: 'e-Fatura · e-Arşiv · GİB',
    featured: true,
    status: 'available',
    deepLink: '/e-belgeler',
    tags: ['einvoice', 'earchive', 'gib'],
  },
]

export function getIntegrationCatalog() {
  const counts: Record<string, number> = {}
  for (const c of CONNECTOR_CATALOG) {
    counts[c.kind] = (counts[c.kind] || 0) + 1
  }
  return {
    version: 'IH-0',
    items: CONNECTOR_CATALOG,
    counts,
    protocols: [
      'REST',
      'SOAP',
      'GraphQL',
      'WebSocket',
      'gRPC',
      'MQTT',
      'AMQP',
      'Kafka',
      'SFTP',
      'FTP',
      'SMTP',
    ],
  }
}

export function recommendConnectors(hints: string[] = []) {
  const h = hints.map((x) => x.toLowerCase())
  const scored = CONNECTOR_CATALOG.map((c) => {
    let score = c.featured ? 2 : 0
    if (c.status === 'available') score += 1
    for (const t of c.tags) {
      if (h.some((x) => x.includes(t) || t.includes(x))) score += 3
    }
    if (h.some((x) => c.title.toLowerCase().includes(x) || c.slug.includes(x))) score += 4
    return { ...c, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, 6)
}
