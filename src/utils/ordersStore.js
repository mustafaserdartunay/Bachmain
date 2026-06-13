import { detailedOrders } from '../data/ordersData'
import { documentTotals, sanitizeDocumentDiscountFields } from './documentTotals'
import { syncQuoteFromOrder } from './quoteWorkflowSync'
import { loadQuotes, saveQuotes } from './quotesStore'
import {
  DEFAULT_ORDER_STAGE_ID,
  findWorkflowStage,
  getOrderStageOptions,
  getQuoteStageOptions,
  isOrderReceivedStage,
  loadWorkflowStages,
} from './workflowStages'

export { DEFAULT_ORDER_STAGE_ID }

const STORAGE_KEY = 'erlenbox-orders'

function normalizeOrder(order) {
  const stages = loadWorkflowStages()
  const orderStageIds = new Set(getOrderStageOptions(stages).map((stage) => stage.id))
  let currentStageId = order?.currentStageId

  if (!currentStageId || !orderStageIds.has(currentStageId)) {
    currentStageId = DEFAULT_ORDER_STAGE_ID
  }

  const termsDescription = order?.termsDescription ?? order?.notes ?? ''

  return {
    ...order,
    stages,
    currentStageId,
    termsDescription,
    notes: order?.notes ?? termsDescription,
    terms: Array.isArray(order?.terms) ? order.terms : [],
    activities: Array.isArray(order?.activities) ? order.activities : [],
  }
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatActivityDate() {
  return new Date().toLocaleString('tr-TR')
}

function mapLegacyOrder(order) {
  const stages = loadWorkflowStages()
  return {
    id: order.id,
    quoteId: order.quoteId || null,
    title: order.notes || `${order.customer} siparişi`,
    customer: order.customer,
    contact: order.contact,
    phone: order.phone,
    email: order.email,
    status: order.status || 'Yeni',
    priority: order.priority || 'Normal',
    source: order.source || 'Manuel',
    owner: order.assignedTo || '',
    createdAt: order.date?.split('.').reverse().join('-') || new Date().toISOString().slice(0, 10),
    deliveryDate: order.delivery?.split('.').reverse().join('-') || '',
    notes: order.notes || '',
    currentStageId: order.status === 'Üretimde' ? 'stage-9' : DEFAULT_ORDER_STAGE_ID,
    stages,
    items: (order.items || []).map((item, index) => ({
      id: item.id || `item-${index}`,
      product: item.product,
      description: '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: 20,
    })),
    activities: (order.timeline || []).map((entry, index) => ({
      id: `act-${order.id}-${index}`,
      date: entry.date,
      text: entry.action,
    })),
  }
}

export function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return detailedOrders.map(mapLegacyOrder).map(normalizeOrder)
    const parsed = JSON.parse(saved)
    const orders = Array.isArray(parsed) ? parsed : detailedOrders.map(mapLegacyOrder)
    return orders.map(normalizeOrder)
  } catch {
    return detailedOrders.map(mapLegacyOrder).map(normalizeOrder)
  }
}

export function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.map(normalizeOrder)))
  window.dispatchEvent(new CustomEvent('bach:orders-updated'))
}

export function orderTotals(order) {
  return documentTotals(order)
}

export function createOrderFromQuote(quote, stageId = DEFAULT_ORDER_STAGE_ID) {
  const orders = loadOrders()
  const sharedCode = String(quote?.id || '').trim()
  if (!sharedCode) return null

  const existing = orders.find((order) => order.id === sharedCode || order.quoteId === sharedCode)
  if (existing) return existing

  const stages = loadWorkflowStages()
  const orderStageIds = new Set(getOrderStageOptions(stages).map((stage) => stage.id))
  const resolvedStageId = orderStageIds.has(stageId) ? stageId : DEFAULT_ORDER_STAGE_ID
  const order = {
    id: sharedCode,
    quoteId: sharedCode,
    title: quote.title || `${quote.customer} siparişi`,
    customer: quote.customer,
    contact: quote.contact,
    phone: quote.phone,
    email: quote.email,
    status: 'Yeni',
    priority: quote.priority || 'Normal',
    source: quote.source || 'Teklif',
    owner: quote.owner || '',
    createdAt: new Date().toISOString().slice(0, 10),
    deliveryDate: quote.validUntil || '',
    notes: quote.notes || '',
    termsDescription: quote.termsDescription || quote.notes || '',
    terms: Array.isArray(quote.terms) ? [...quote.terms] : [],
    currentStageId: resolvedStageId,
    stages,
    items: (quote.items || []).map((item) => ({ ...item })),
    ...sanitizeDocumentDiscountFields(quote),
    activities: [
      {
        id: createId('act'),
        date: formatActivityDate(),
        text: `Teklif ${sharedCode} siparişe dönüştürüldü.`,
      },
      ...(quote.activities || []),
    ],
  }

  saveOrders([order, ...orders])
  syncQuoteFromOrder(order)
  return order
}

export function updateOrder(orderId, patch) {
  const orders = loadOrders().map((order) => (order.id === orderId ? { ...order, ...patch } : order))
  saveOrders(orders)
  const updated = orders.find((order) => order.id === orderId)
  if (updated && patch.currentStageId) {
    syncQuoteFromOrder(updated)
  }
  return updated
}

export function deleteOrder(orderId) {
  saveOrders(loadOrders().filter((order) => order.id !== orderId))
}

function findQuoteForOrder(order) {
  const sharedCode = String(order?.quoteId || order?.id || '').trim()
  if (!sharedCode) return null
  const quotes = loadQuotes()
  const index = quotes.findIndex((quote) => quote.id === sharedCode || quote.orderId === sharedCode)
  if (index === -1) return null
  return { quotes, index, quote: quotes[index] }
}

export function orderHasLinkedQuote(order) {
  return Boolean(findQuoteForOrder(order))
}

export function cancelOrderFromQuote(order) {
  if (!order?.id) return false

  const linked = findQuoteForOrder(order)
  deleteOrder(order.id)

  if (!linked) return true

  const { quotes, index, quote } = linked
  const stages = loadWorkflowStages()
  const quoteStages = getQuoteStageOptions(stages)
  const currentStage = findWorkflowStage(stages, quote.currentStageId)
  const fallbackStage = quoteStages.find((stage) => !isOrderReceivedStage(stage)) || quoteStages[0]

  const nextQuote = {
    ...quote,
    stages,
    orderId: undefined,
    activities: [
      ...(quote.activities || []),
      {
        id: createId('act'),
        date: formatActivityDate(),
        text: 'Sipariş oluşturma vazgeçildi. Teklif listede kaldı.',
      },
    ],
  }

  if (!currentStage || isOrderReceivedStage(currentStage)) {
    nextQuote.currentStageId = fallbackStage?.id || quote.currentStageId
  }

  if (quote.status === 'Onaylandı') {
    nextQuote.status = 'Yeni Teklif'
  }

  quotes[index] = nextQuote
  saveQuotes(quotes)
  return true
}

const OPEN_ORDER_KEY = 'erlenbox-open-order'

export function setOpenOrderId(orderId) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(OPEN_ORDER_KEY, String(orderId || ''))
}

export function readOpenOrderId() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(OPEN_ORDER_KEY)
}

export function clearOpenOrderId() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(OPEN_ORDER_KEY)
}
