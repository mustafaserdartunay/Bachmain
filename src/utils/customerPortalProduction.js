import { findCustomerProfileByReference } from '../data/customerProfiles'
import { getCustomerDisplay } from './customerDisplay'
import { loadOrders } from './ordersStore'
import { loadQuotes } from './quotesStore'
import { loadProductionJobs } from './productionStore'
import { loadWorkflowStages } from './workflowStages'
import { readB2bProduction } from './b2bPortalStore'
import { getLineMinimalStageSteps, getLineQuantityMetrics, formatQty } from './productionQuantityMetrics'
import { normalizeStagePhotos } from './productionStagePhotos'

function formatPortalDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))?/)
  if (trMatch) return trMatch[2] ? `${trMatch[1]} ${trMatch[2]}` : trMatch[1]
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return raw
}

function customerMatchesReference(customerRef, customer) {
  if (!customer) return false
  const profile = findCustomerProfileByReference(customerRef)
  if (profile?.id === customer.id) return true
  const display = getCustomerDisplay(customer)
  const normalized = String(customerRef || '').trim().toLowerCase()
  if (!normalized) return false
  return [
    display.brandShortName,
    display.companyTitle,
    customer.company,
    customer.companyTitle,
    customer.shortBrandName,
  ].some((value) => String(value || '').trim().toLowerCase() === normalized)
}

function mapB2bStepsToMinimal(steps = []) {
  let activeIndex = steps.findIndex((step) => step.status === 'active')
  if (activeIndex < 0) {
    activeIndex = steps.findIndex((step) => Number(step.progress) > 0 && Number(step.progress) < 100)
  }
  return steps.map((step, index) => {
    const progress = Number(step.progress) || 0
    const isComplete = progress >= 100 || (activeIndex >= 0 && index < activeIndex)
    const isActive = activeIndex >= 0 ? index === activeIndex : index === 0 && progress > 0
    return {
      id: step.id,
      label: step.name,
      color: isComplete ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : 'bg-gray-500',
      isActive,
      isComplete,
    }
  })
}

function resolveQuoteAndOrder(job, orders, quotes) {
  const order = orders.find((entry) => entry.id === job.orderId || entry.id === job.id) || null
  const quoteId = order?.quoteId || null
  const quote = quoteId ? quotes.find((entry) => entry.id === quoteId) : null

  return {
    order,
    quote,
    orderId: order?.id || job.orderId || job.id,
    orderTitle: order?.title || job.title || 'Sipariş',
    orderDate: order?.createdAt || job.createdAt || '',
    quoteId: quote?.id || quoteId || null,
    quoteTitle: quote?.title || (quoteId ? `Teklif ${quoteId}` : null),
    quoteDate: quote?.createdAt || '',
  }
}

function buildLineItemView(line, index, stages) {
  const metrics = getLineQuantityMetrics(line)
  const steps = getLineMinimalStageSteps(line, stages)

  return {
    id: line.id,
    index,
    productName: line.product || 'Ürün',
    quantity: metrics.ordered,
    producedQuantity: metrics.produced,
    deliveredQuantity: metrics.delivered,
    fulfillmentStatus: line.fulfillmentStatus || 'Devam Ediyor',
    productionClosed: line.productionClosed === true,
    depoLabel: line.depoWarehouseKind === 'order' ? 'Depo' : '',
    steps,
    stagePhotos: normalizeStagePhotos(line?.stagePhotos),
    metricsLabel: `${formatQty(metrics.produced)} / ${formatQty(metrics.ordered)} üretim · ${formatQty(metrics.delivered)} teslim`,
  }
}

function buildJobView(job, orders, quotes, stages) {
  const linkage = resolveQuoteAndOrder(job, orders, quotes)
  const lineItems = (job.lineItems || []).map((line, index) => buildLineItemView(line, index, stages))

  return {
    id: job.id,
    source: 'erp',
    ...linkage,
    orderDateLabel: formatPortalDate(linkage.orderDate),
    quoteDateLabel: formatPortalDate(linkage.quoteDate),
    jobStatus: job.status || 'Devam Ediyor',
    jobStage: job.stage || '',
    deliveryDate: job.deliveryDate || job.endDate || '',
    deliveryDateLabel: formatPortalDate(job.deliveryDate || job.endDate),
    lineItems,
  }
}

function buildB2bJobView(item, orders, quotes) {
  const order = orders.find((entry) => entry.id === item.orderId) || null
  const quote = quotes.find((entry) => entry.customerId === item.customerId) || null

  return {
    id: item.id,
    source: 'b2b',
    orderId: item.orderId,
    orderTitle: order?.note || 'B2B Sipariş',
    orderDate: order?.createdAt || item.updatedAt || '',
    orderDateLabel: formatPortalDate(order?.createdAt || item.updatedAt),
    quoteId: quote?.id || null,
    quoteTitle: quote ? `Teklif ${quote.id}` : null,
    quoteDate: quote?.createdAt || '',
    quoteDateLabel: formatPortalDate(quote?.createdAt),
    jobStatus: 'Üretimde',
    jobStage: '',
    deliveryDate: '',
    deliveryDateLabel: '—',
    lineItems: [{
      id: item.id,
      index: 0,
      productName: item.productName,
      quantity: item.quantity,
      producedQuantity: 0,
      deliveredQuantity: 0,
      fulfillmentStatus: 'Devam Ediyor',
      productionClosed: false,
      depoLabel: '',
      steps: mapB2bStepsToMinimal(item.steps),
      stagePhotos: [],
      metricsLabel: `${formatQty(item.quantity)} adet sipariş`,
    }],
  }
}

export function readCustomerProductionTracking(customer) {
  if (!customer?.id) return []

  const stages = loadWorkflowStages()
  const orders = loadOrders()
  const quotes = loadQuotes()

  const erpJobs = loadProductionJobs()
    .filter((job) => customerMatchesReference(job.customer, customer))
    .map((job) => buildJobView(job, orders, quotes, stages))

  if (erpJobs.length > 0) {
    return erpJobs.sort((a, b) => String(b.orderDate).localeCompare(String(a.orderDate)))
  }

  return readB2bProduction(customer.id)
    .map((item) => buildB2bJobView(item, orders, quotes))
    .sort((a, b) => String(b.orderDate).localeCompare(String(a.orderDate)))
}

export function countActiveProductionJobs(jobs = []) {
  return jobs.filter((job) => (
    job.lineItems.some((line) => line.fulfillmentStatus !== 'Tamamlandı' && !line.productionClosed)
      || job.jobStatus !== 'Tamamlandı'
  )).length
}
