const KEY = 'bach_commerce_gc0_v1'
const EVT = 'bach:commerce-updated'

const MARKETPLACES = [
  { key: 'amazon', name: 'Amazon', kind: 'marketplace' },
  { key: 'shopify', name: 'Shopify', kind: 'store' },
  { key: 'woocommerce', name: 'WooCommerce', kind: 'store' },
  { key: 'trendyol', name: 'Trendyol', kind: 'marketplace' },
  { key: 'hepsiburada', name: 'Hepsiburada', kind: 'marketplace' },
  { key: 'n11', name: 'N11', kind: 'marketplace' },
  { key: 'pazarama', name: 'Pazarama', kind: 'marketplace' },
  { key: 'etsy', name: 'Etsy', kind: 'marketplace' },
  { key: 'alibaba', name: 'Alibaba', kind: 'marketplace' },
  { key: 'ebay', name: 'eBay', kind: 'marketplace' },
  { key: 'allegro', name: 'Allegro', kind: 'marketplace' },
  { key: 'b2b', name: 'B2B Portal', kind: 'portal' },
  { key: 'b2c', name: 'B2C Store', kind: 'store' },
  { key: 'dealer', name: 'Dealer Portal', kind: 'portal' },
  { key: 'pos', name: 'POS', kind: 'pos' },
]

function blank() {
  return {
    channels: [
      { key: 'trendyol', name: 'Trendyol', status: 'disconnected' },
      { key: 'amazon', name: 'Amazon', status: 'disconnected' },
      { key: 'shopify', name: 'Shopify', status: 'disconnected' },
      { key: 'b2b', name: 'B2B Portal', status: 'connected' },
      { key: 'b2c', name: 'B2C Store', status: 'connected' },
      { key: 'dealer', name: 'Dealer Portal', status: 'connected' },
    ],
    listings: [],
    priceRules: [
      {
        id: 'pr_dealer',
        name: 'Bayi %12',
        scope: 'dealer',
        adjustmentType: 'percent',
        adjustmentValue: -12,
        active: true,
      },
      {
        id: 'pr_eu',
        name: 'EU EUR +8%',
        scope: 'currency',
        currency: 'EUR',
        adjustmentType: 'percent',
        adjustmentValue: 8,
        active: true,
      },
    ],
    inbox: [
      {
        id: 'in_demo1',
        channelKey: 'trendyol',
        externalOrderId: 'TY-100245',
        status: 'received',
        currency: 'TRY',
        totalAmount: '18490',
        customerName: 'Demo Müşteri',
        riskScore: 12,
        lines: [{ sku: 'SKU-001', qty: 2, title: 'Demo Ürün' }],
      },
    ],
    stockJobs: [],
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVT))
  }
  return state
}

export function ensureCommerceSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function commerceOverviewLocal() {
  const s = read()
  return {
    channelsTotal: s.channels.length,
    channelsConnected: s.channels.filter((c) => c.status === 'connected').length,
    inboxTotal: s.inbox.length,
    inboxPending: s.inbox.filter((o) => o.status === 'received' || o.status === 'risk_review')
      .length,
    listingsTotal: s.listings.length,
    activePriceRules: s.priceRules.filter((r) => r.active).length,
    productMaster: 'erp_mdm',
    phase: 'GC-0',
  }
}

export function listChannelsLocal() {
  return read().channels
}

export function marketplaceCatalogLocal() {
  return MARKETPLACES
}

export function connectChannelLocal(key) {
  const s = read()
  const idx = s.channels.findIndex((c) => c.key === key)
  if (idx >= 0) s.channels[idx] = { ...s.channels[idx], status: 'connected' }
  else {
    const def = MARKETPLACES.find((m) => m.key === key)
    s.channels.push({ key, name: def?.name || key, status: 'connected' })
  }
  write(s)
  return s.channels
}

export function listInboxLocal() {
  return read().inbox
}

export function ingestOrderLocal(payload) {
  const s = read()
  const id = `in_${Date.now().toString(36)}`
  const order = {
    id,
    channelKey: payload.channelKey || 'trendyol',
    externalOrderId: payload.externalOrderId || `EXT-${Date.now()}`,
    status: 'received',
    currency: payload.currency || 'TRY',
    totalAmount: payload.totalAmount || '0',
    customerName: payload.customerName || 'Kanal Müşteri',
    riskScore: Number(payload.riskScore || 8),
    lines: payload.lines || [],
  }
  s.inbox.unshift(order)
  write(s)
  return order
}

export function promoteOrderLocal(id) {
  const s = read()
  const idx = s.inbox.findIndex((o) => o.id === id)
  if (idx < 0) return null
  s.inbox[idx] = {
    ...s.inbox[idx],
    status: 'promoted',
    erpOrderId: `erp_stub_${s.inbox[idx].externalOrderId}`,
    promotedAt: new Date().toISOString(),
  }
  write(s)
  return s.inbox[idx]
}

export function listPriceRulesLocal() {
  return read().priceRules
}

export function addPriceRuleLocal(rule) {
  const s = read()
  const row = {
    id: `pr_${Date.now().toString(36)}`,
    active: true,
    ...rule,
  }
  s.priceRules.push(row)
  write(s)
  return row
}

export function listListingsLocal() {
  return read().listings
}

export function publishListingLocal(input) {
  const s = read()
  const row = {
    id: `ls_${Date.now().toString(36)}`,
    status: 'published',
    ...input,
  }
  s.listings.unshift(row)
  write(s)
  return row
}

export function runStockSyncLocal(channelKey) {
  const s = read()
  const job = {
    id: `ss_${Date.now().toString(36)}`,
    channelKey: channelKey || 'all',
    status: 'done',
    productsTouched: 12,
    finishedAt: new Date().toISOString(),
  }
  s.stockJobs.unshift(job)
  write(s)
  return job
}

export function listStockJobsLocal() {
  return read().stockJobs
}

export { EVT as COMMERCE_UPDATED_EVENT }
