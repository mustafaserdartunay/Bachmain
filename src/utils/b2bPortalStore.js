import { getAllCustomerProfiles } from '../data/customerProfiles'
import { CUSTOMER_META_KEY, getCustomerMetaSelection, readCustomerMeta } from './customerMeta'
import { getCatalogProducts, stripCostFields } from './productCatalog'
import { getTreasuryMovements } from './treasuryStore'
import { loadOrders } from './ordersStore'
import { loadQuotes } from './quotesStore'
import { loadProductionJobs } from './productionStore'
import { loadWorkflowStages } from './workflowStages'
import { readCompanySettings } from './companySettings'
import { readCustomerPortalSettings } from './customerPortalSettings'

const ACCESS_KEY = 'erlenbox-b2b-access'
const ORDERS_KEY = 'erlenbox-b2b-orders'
const QUOTES_KEY = 'erlenbox-b2b-quotes'
const TICKETS_KEY = 'erlenbox-b2b-tickets'
const PRODUCTION_KEY = 'erlenbox-b2b-production'

export const PRODUCTION_STEPS = [
  'Tasarım Onayı',
  'Üretim Planlama',
  'Kesim',
  'Baskı',
  'Montaj',
  'Kalite Kontrol',
  'Sevkiyat',
]

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('erlenbox:b2b-updated'))
}

function createToken() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `b2b-${value}`
  }
  return `b2b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function defaultProductionSteps() {
  return PRODUCTION_STEPS.map((name, index) => ({
    id: `step-${index}`,
    name,
    progress: index === 0 ? 35 : 0,
    status: index === 0 ? 'active' : 'pending',
  }))
}

function seedProductionForOrder(order) {
  return order.lines.map((line) => ({
    id: createId('PRD'),
    orderId: order.id,
    customerId: order.customerId,
    productId: line.productId,
    productName: line.productName,
    quantity: line.quantity,
    steps: defaultProductionSteps(),
    updatedAt: new Date().toISOString(),
  }))
}

export function readB2bAccessMap() {
  return readJson(ACCESS_KEY, {})
}

export function getB2bAccess(customerId) {
  return readB2bAccessMap()[customerId] || null
}

export function findCustomerByToken(token) {
  const map = readB2bAccessMap()
  const entry = Object.entries(map).find(
    ([, value]) => value.enabled && value.accessToken === token,
  )
  if (!entry) return null
  const [customerId, access] = entry
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  if (!customer) return null
  const meta = readCustomerMeta()[customerId] || {}
  const selection = getCustomerMetaSelection(customer, meta)
  return {
    customer,
    access,
    isDealer: selection.type === 'Bayi',
  }
}

export function enableB2bAccess(customerId, customPrices = {}) {
  const map = readB2bAccessMap()
  const existing = map[customerId]
  const reusableToken =
    typeof existing?.accessToken === 'string' && existing.accessToken.length >= 40
  const access = {
    enabled: true,
    accessToken: reusableToken ? existing.accessToken : createToken(),
    enabledAt: existing?.enabledAt || new Date().toISOString(),
    customPrices: { ...(existing?.customPrices || {}), ...customPrices },
  }
  map[customerId] = access
  writeJson(ACCESS_KEY, map)
  return access
}

export function disableB2bAccess(customerId) {
  const map = readB2bAccessMap()
  if (map[customerId]) {
    map[customerId] = { ...map[customerId], enabled: false }
    writeJson(ACCESS_KEY, map)
  }
}

export function getPortalUrl(token) {
  if (typeof window === 'undefined') return `/portal/${token}`
  return `${window.location.origin}/portal/${token}`
}

function normalized(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

function recordBelongsToCustomer(record, customer) {
  if (!record || !customer) return false
  if (record.customerId && record.customerId === customer.id) return true
  const customerNames = new Set(
    [
      customer.company,
      customer.companyTitle,
      customer.shortBrandName,
      customer.brandShortName,
      customer.name,
    ]
      .map(normalized)
      .filter(Boolean),
  )
  return [record.customer, record.customerName, record.customerTitle, record.company]
    .map(normalized)
    .some((value) => value && customerNames.has(value))
}

function stripEmbeddedMedia(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === 'string' && item.startsWith('data:') ? null : item,
    ),
  )
}

export function buildB2bPortalSnapshot(customerId) {
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  const access = getB2bAccess(customerId)
  if (!customer || !access?.enabled) return null

  const meta = readCustomerMeta()[customerId] || {}
  const portalSettings = readCustomerPortalSettings(customerId, customer)
  const company = readCompanySettings()
  const sharedIbanIds = new Set(portalSettings.sharedIbanIds || [])
  const products = getCatalogProducts()
    .filter((product) => {
      const customerIds = Array.isArray(product.customerIds) ? product.customerIds : []
      return customerIds.length === 0 || customerIds.includes(customerId)
    })
    .map(stripCostFields)

  return stripEmbeddedMedia({
    version: 1,
    publishedAt: new Date().toISOString(),
    customer,
    access,
    meta,
    portalSettings,
    company: {
      ...company,
      bankAccounts: (company.bankAccounts || []).filter((account) => sharedIbanIds.has(account.id)),
    },
    products,
    movements: getTreasuryMovements().filter((record) => recordBelongsToCustomer(record, customer)),
    b2bOrders: readB2bOrders(customerId),
    b2bQuotes: readB2bQuotes(customerId),
    b2bTickets: readB2bTickets(customerId),
    b2bProduction: readB2bProduction(customerId),
    orders: loadOrders().filter((record) => recordBelongsToCustomer(record, customer)),
    quotes: loadQuotes().filter((record) => recordBelongsToCustomer(record, customer)),
    production: loadProductionJobs().filter((record) => recordBelongsToCustomer(record, customer)),
    workflowStages: loadWorkflowStages(),
  })
}

export function hydrateB2bPortalSnapshot(snapshot) {
  if (!snapshot?.customer?.id || !snapshot?.access?.accessToken) return false
  const customerId = snapshot.customer.id
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value))

  write('erlenbox-created-customers', [snapshot.customer])
  write(CUSTOMER_META_KEY, { [customerId]: snapshot.meta || {} })
  write(ACCESS_KEY, { [customerId]: snapshot.access })
  write(ORDERS_KEY, snapshot.b2bOrders || [])
  write(QUOTES_KEY, snapshot.b2bQuotes || [])
  write(TICKETS_KEY, snapshot.b2bTickets || [])
  write(PRODUCTION_KEY, snapshot.b2bProduction || [])
  write('erlenbox-orders', snapshot.orders || [])
  write('erlenbox-quotes', snapshot.quotes || [])
  write('erlenbox-production', snapshot.production || [])
  write('erlenbox-products', snapshot.products || [])
  write('erlenbox-treasury-movements', snapshot.movements || [])
  write('erlenbox-workflow-stages', snapshot.workflowStages || [])
  write('erlenbox-company-settings', snapshot.company || {})
  write('erlenbox-customer-portal-settings', {
    [customerId]: snapshot.portalSettings || {},
  })
  sessionStorage.setItem(
    'bach-b2b-remote-snapshot',
    snapshot.publishedAt || new Date().toISOString(),
  )
  window.dispatchEvent(new CustomEvent('erlenbox:b2b-updated'))
  return true
}

export function readB2bOrders(customerId) {
  return readJson(ORDERS_KEY, []).filter((order) => order.customerId === customerId)
}

export function readAllB2bOrders() {
  return readJson(ORDERS_KEY, []).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  )
}

export function readB2bQuotes(customerId) {
  return readJson(QUOTES_KEY, []).filter((quote) => quote.customerId === customerId)
}

export function createB2bOrder({
  customerId,
  customerName,
  lines,
  note = '',
  paymentMethod = 'havale',
  total = 0,
}) {
  const order = {
    id: createId('ORD'),
    customerId,
    customerName,
    status: 'Yeni',
    createdAt: new Date().toISOString(),
    lines,
    note,
    paymentMethod,
    total,
  }
  const orders = [order, ...readJson(ORDERS_KEY, [])]
  writeJson(ORDERS_KEY, orders)
  const production = [...readJson(PRODUCTION_KEY, []), ...seedProductionForOrder(order)]
  writeJson(PRODUCTION_KEY, production)
  return order
}

export function readB2bProduction(customerId) {
  return readJson(PRODUCTION_KEY, []).filter((item) => item.customerId === customerId)
}

export function getProductionOverallProgress(item) {
  if (!item.steps?.length) return 0
  const total = item.steps.reduce((sum, step) => sum + Number(step.progress || 0), 0)
  return Math.round(total / item.steps.length)
}

export function readB2bTickets(customerId) {
  const tickets = readJson(TICKETS_KEY, [])
  return customerId ? tickets.filter((ticket) => ticket.customerId === customerId) : tickets
}

export function createB2bTicket({ customerId, customerName, message }) {
  const ticket = {
    id: createId('TKT'),
    customerId,
    customerName,
    message,
    createdAt: new Date().toISOString(),
    status: 'Açık',
    replies: [],
  }
  const tickets = [ticket, ...readJson(TICKETS_KEY, [])]
  writeJson(TICKETS_KEY, tickets)
  return ticket
}

export function replyB2bTicket(ticketId, message, author = 'Yönetici') {
  const tickets = readJson(TICKETS_KEY, [])
  const index = tickets.findIndex((ticket) => ticket.id === ticketId)
  if (index < 0) return null
  const reply = {
    id: createId('RPL'),
    message,
    author,
    at: new Date().toISOString(),
  }
  tickets[index] = {
    ...tickets[index],
    replies: [...(tickets[index].replies || []), reply],
    status: 'Yanıtlandı',
  }
  writeJson(TICKETS_KEY, tickets)
  return tickets[index]
}

/** Header zil bildirimleri — açık ticketlar ve son cevaplar */
export function getB2bTicketNotifications({ replyWindowMs = 7 * 24 * 60 * 60 * 1000 } = {}) {
  const tickets = readB2bTickets()
  const notifications = []
  const now = Date.now()

  tickets.forEach((ticket) => {
    if (ticket.status === 'Açık') {
      notifications.push({
        id: `b2b-ticket-${ticket.id}`,
        kind: 'ticket',
        entityId: ticket.id,
        title: ticket.customerName || 'B2B Canlı Not',
        subtitle: ticket.message,
        detail: 'Yanıt bekleniyor',
        date: String(ticket.createdAt || '').slice(0, 10),
        sortAt: ticket.createdAt || '',
        urgency: 'now',
        link: '/yonetici-kontrol',
      })
    }

    ;(ticket.replies || []).forEach((reply) => {
      const at = reply.at || ''
      const age = at ? now - new Date(at).getTime() : Number.POSITIVE_INFINITY
      if (!Number.isFinite(age) || age > replyWindowMs) return
      notifications.push({
        id: `b2b-reply-${reply.id}`,
        kind: 'ticket-reply',
        entityId: ticket.id,
        title: `${reply.author || 'Yönetici'} yanıtladı`,
        subtitle: reply.message,
        detail: ticket.customerName || 'B2B Canlı Not',
        date: String(at).slice(0, 10),
        sortAt: at,
        urgency: 'today',
        link: '/yonetici-kontrol',
      })
    })
  })

  return notifications
}

export function setCustomPrice(customerId, productId, price) {
  const map = readB2bAccessMap()
  const access = map[customerId] || enableB2bAccess(customerId)
  access.customPrices = { ...(access.customPrices || {}), [productId]: Number(price) || 0 }
  map[customerId] = access
  writeJson(ACCESS_KEY, map)
  return access
}
