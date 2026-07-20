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
    i18n: [],
    analyses: [],
    returns: [],
    subscriptions: [],
    shipments: [],
    payments: [],
    coupons: [],
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
    phase: 'GC-1',
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

const LOCALES = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru']

export function generateProductAiLocal(productId, productName = 'Demo Ürün') {
  const s = read()
  if (!s.i18n) s.i18n = []
  const row = {
    id: `i18n_${Date.now().toString(36)}`,
    productId,
    locale: 'tr',
    title: productName,
    description: `${productName} — Product AI açıklama (GC-1 stub).`,
    seoTitle: `${productName} | BachMain`,
    seoDescription: 'SEO meta stub',
    keywords: [productName.toLowerCase(), 'bachmain'],
    socialCopy: `Yeni: ${productName} 🚀`,
    merchantFeed: `${productName} | Hızlı kargo`,
  }
  s.i18n = s.i18n.filter((x) => !(x.productId === productId && x.locale === 'tr'))
  s.i18n.unshift(row)
  write(s)
  return row
}

export function expandI18nLocal(productId) {
  const s = read()
  if (!s.i18n) s.i18n = []
  const base = s.i18n.find((x) => x.productId === productId && x.locale === 'tr')
  const title = base?.title || `Product ${productId}`
  for (const locale of LOCALES) {
    if (locale === 'tr') continue
    if (s.i18n.some((x) => x.productId === productId && x.locale === locale)) continue
    s.i18n.push({
      id: `i18n_${locale}_${Date.now().toString(36)}`,
      productId,
      locale,
      title: `[${locale.toUpperCase()}] ${title}`,
      description: `(${locale}) ${base?.description || title}`,
    })
  }
  write(s)
  return s.i18n.filter((x) => x.productId === productId)
}

export function listI18nLocal() {
  return read().i18n || []
}

export function analyzeOrderLocal(id) {
  const s = read()
  const order = s.inbox.find((o) => o.id === id)
  if (!order) return null
  const amount = Number(order.totalAmount || 0)
  let fraudScore = order.riskScore || 0
  if (amount > 50000) fraudScore += 20
  const riskScore = Math.min(100, fraudScore + 15)
  const recommendation = riskScore >= 70 ? 'hold' : riskScore >= 45 ? 'review' : 'promote'
  const analysis = {
    id: `an_${Date.now().toString(36)}`,
    inboxId: id,
    orderRef: order.externalOrderId,
    riskScore,
    fraudScore,
    stockRisk: 12,
    deliveryRisk: 18,
    recommendation,
    summary: `${order.channelKey} · ${order.totalAmount} ${order.currency}`,
  }
  if (!s.analyses) s.analyses = []
  s.analyses.unshift(analysis)
  const idx = s.inbox.findIndex((o) => o.id === id)
  if (idx >= 0) s.inbox[idx] = { ...s.inbox[idx], riskScore, analysisId: analysis.id }
  write(s)
  return analysis
}

export function listAnalysesLocal() {
  return read().analyses || []
}

export function addReturnLocal(orderRef, kind = 'return') {
  const s = read()
  if (!s.returns) s.returns = []
  const row = { id: `ret_${Date.now().toString(36)}`, orderRef, kind, status: 'open' }
  s.returns.unshift(row)
  write(s)
  return row
}

export function listReturnsLocal() {
  return read().returns || []
}

export function addSubscriptionLocal(customerRef, productId) {
  const s = read()
  if (!s.subscriptions) s.subscriptions = []
  const row = {
    id: `sub_${Date.now().toString(36)}`,
    customerRef,
    productId,
    status: 'active',
    interval: 'month',
    amount: '999',
    currency: 'TRY',
  }
  s.subscriptions.unshift(row)
  write(s)
  return row
}

export function listSubscriptionsLocal() {
  return read().subscriptions || []
}

export function addShipmentLocal(orderRef, carrier) {
  const s = read()
  if (!s.shipments) s.shipments = []
  const row = {
    id: `sh_${Date.now().toString(36)}`,
    orderRef,
    carrier,
    trackingNo: `TRK${Date.now().toString().slice(-8)}`,
    status: 'labeled',
  }
  s.shipments.unshift(row)
  write(s)
  return row
}

export function listShipmentsLocal() {
  return read().shipments || []
}

export function addPaymentLocal(provider, amount) {
  const s = read()
  if (!s.payments) s.payments = []
  const row = {
    id: `pay_${Date.now().toString(36)}`,
    provider,
    amount,
    currency: 'TRY',
    status: 'pending',
  }
  s.payments.unshift(row)
  write(s)
  return row
}

export function listPaymentsLocal() {
  return read().payments || []
}

export function addCouponLocal(code, discountValue = '10') {
  const s = read()
  if (!s.coupons) s.coupons = []
  const row = {
    id: `cp_${Date.now().toString(36)}`,
    code: code.toUpperCase(),
    discountType: 'percent',
    discountValue,
    active: true,
  }
  s.coupons.unshift(row)
  write(s)
  return row
}

export function listCouponsLocal() {
  return read().coupons || []
}

export function analyticsLocal() {
  return {
    sales: 186400,
    byChannel: [
      { channel: 'trendyol', revenue: 62000 },
      { channel: 'b2b', revenue: 54000 },
      { channel: 'amazon', revenue: 38400 },
    ],
    roi: 1.8,
    roas: 2.4,
    profit: 41200,
  }
}

export function aiSalesForecastLocal() {
  return {
    country: 'DE',
    suggestedPrice: 129.9,
    currency: 'EUR',
    suggestedChannel: 'amazon',
    suggestedAd: 'Google Shopping + Meta',
    upliftPct: 18,
  }
}

export { EVT as COMMERCE_UPDATED_EVENT }
