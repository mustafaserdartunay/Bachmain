import { getAllCustomerProfiles } from '../data/customerProfiles'
import { getCustomerMetaSelection, readCustomerMeta } from './customerMeta'

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
  return `b2b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
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

function ensureSeedData() {
  const access = readJson(ACCESS_KEY, {})
  const orders = readJson(ORDERS_KEY, [])
  if (orders.length > 0) return

  const customer = getAllCustomerProfiles()[0]
  if (!customer) return

  const token = createToken()
  access[customer.id] = {
    enabled: true,
    accessToken: token,
    enabledAt: new Date().toISOString(),
    customPrices: { 'PRD-001': 10.5 },
  }
  writeJson(ACCESS_KEY, access)

  const order = {
    id: createId('ORD'),
    customerId: customer.id,
    customerName: customer.company,
    status: 'Üretimde',
    createdAt: new Date().toISOString(),
    lines: [
      { productId: 'PRD-001', productName: 'Kraft Kutu 30x20', quantity: 500, unitPrice: 10.5 },
      { productId: 'PRD-002', productName: 'Premium Hediye Kutusu', quantity: 120, unitPrice: 28 },
    ],
    note: 'Numune onayı sonrası seri üretim',
  }
  writeJson(ORDERS_KEY, [order])

  const quote = {
    id: createId('QTE'),
    customerId: customer.id,
    customerName: customer.company,
    status: 'Bekliyor',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    lines: [{ productId: 'PRD-001', productName: 'Kraft Kutu 30x20', quantity: 1000, unitPrice: 10.8 }],
    total: 10800,
  }
  writeJson(QUOTES_KEY, [quote])
  writeJson(PRODUCTION_KEY, seedProductionForOrder(order))
}

ensureSeedData()

export function readB2bAccessMap() {
  return readJson(ACCESS_KEY, {})
}

export function getB2bAccess(customerId) {
  return readB2bAccessMap()[customerId] || null
}

export function findCustomerByToken(token) {
  const map = readB2bAccessMap()
  const entry = Object.entries(map).find(([, value]) => value.enabled && value.accessToken === token)
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
  const access = {
    enabled: true,
    accessToken: existing?.accessToken || createToken(),
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

export function readB2bOrders(customerId) {
  return readJson(ORDERS_KEY, []).filter((order) => order.customerId === customerId)
}

export function readB2bQuotes(customerId) {
  return readJson(QUOTES_KEY, []).filter((quote) => quote.customerId === customerId)
}

export function createB2bOrder({ customerId, customerName, lines, note = '', paymentMethod = 'havale', total = 0 }) {
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

export function setCustomPrice(customerId, productId, price) {
  const map = readB2bAccessMap()
  const access = map[customerId] || enableB2bAccess(customerId)
  access.customPrices = { ...(access.customPrices || {}), [productId]: Number(price) || 0 }
  map[customerId] = access
  writeJson(ACCESS_KEY, map)
  return access
}
