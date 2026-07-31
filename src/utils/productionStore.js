import { syncQuoteFromProduction } from './quoteWorkflowSync'
import { nextDocumentCode } from './documentCodes'
import {
  deriveJobSummary,
  ensureLineItems,
  getLineQuantityRows,
  resolveOrderForProductionJob,
  syncLineQuantitiesFromRows,
  createQuantityRowTimestamp,
} from './productionLineItems'
import {
  findWorkflowStage,
  getOrderStageOptions,
  getProductionStageOptions,
  isOrderReceivedStage,
  loadWorkflowStages,
  PRODUCTION_ENTRY_STAGE_ID,
} from './workflowStages'
import { softDeleteRecord, restoreDeletedRecord } from './deletedRecordsStore'
import { loadOrders, updateOrder } from './ordersStore'
import { addDepoItem, createDepoItemFromRow, getDepoItemByProductionRow } from './depoStore'

const STORAGE_KEY = 'erlenbox-production'
const DELETED_COLLECTION = 'production'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatListDate(value) {
  if (!value) return ''
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value
  const [datePart] = String(value).split(' ')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

export function normalizeProductionJob(job) {
  const stages = loadWorkflowStages()
  const summary = deriveJobSummary(job, stages)

  return {
    ...job,
    stages,
    lineItems: summary.lineItems,
    currentStageId: summary.currentStageId,
    stage: summary.stage,
    status: summary.status,
    quantity: summary.quantity,
    product: summary.product || job?.product || '',
  }
}

export { resolveProductionStageLabel } from './workflowStages'

export function loadProductionJobs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    const jobs = Array.isArray(parsed) ? parsed : []
    return jobs.map(normalizeProductionJob)
  } catch {
    return []
  }
}

export function saveProductionJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.map(normalizeProductionJob)))
  window.dispatchEvent(new CustomEvent('bach:production-updated'))
}

export function createProductionFromOrder(order) {
  const jobs = loadProductionJobs()
  const sharedCode = String(order?.id || '').trim()
  if (!sharedCode) return null

  const existing = jobs.find((job) => job.id === sharedCode || job.orderId === sharedCode)
  if (existing) return existing

  const stages = loadWorkflowStages()
  const productionStages = getProductionStageOptions(stages)
  const entryStage = findWorkflowStage(stages, PRODUCTION_ENTRY_STAGE_ID)
  const initialStage = productionStages[0] || entryStage
  const orderItems = (order.items || []).filter((item) => item?.product || item?.description)
  const lineItems =
    orderItems.length > 0
      ? orderItems.map((item) => ({
          id: item.id || createId('line'),
          product: item.product || '',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          currentStageId: initialStage?.id || '',
          fulfillmentStatus: 'Devam Ediyor',
          producedQuantity: 0,
          deliveredQuantity: 0,
        }))
      : [
          {
            id: createId('line'),
            product: order.title || 'Üretim kalemi',
            quantity: 1,
            currentStageId: initialStage?.id || '',
            fulfillmentStatus: 'Devam Ediyor',
            producedQuantity: 0,
            deliveredQuantity: 0,
          },
        ]

  const quantity = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const product = lineItems.length === 1 ? lineItems[0].product : `${lineItems.length} kalem`

  const job = normalizeProductionJob({
    id: sharedCode,
    orderId: sharedCode,
    customer: order.customer,
    title: order.title || `${order.customer} üretimi`,
    product,
    quantity,
    stage: initialStage?.label || '',
    currentStageId: initialStage?.id || '',
    stages,
    lineItems,
    status: 'Devam Ediyor',
    priority: order.priority || 'Normal',
    createdAt: order.createdAt || new Date().toISOString().slice(0, 10),
    deliveryDate: order.deliveryDate || '',
    endDate: formatListDate(order.deliveryDate) || '',
    items: (order.items || []).map((item) => ({ ...item })),
    activities: [
      {
        id: createId('act'),
        date: new Date().toLocaleString('tr-TR'),
        text: `Sipariş ${sharedCode} üretime aktarıldı.`,
      },
      ...(order.activities || []),
    ],
  })

  saveProductionJobs([job, ...jobs])
  syncQuoteFromProduction(job)
  return job
}

export function createStandaloneProductionJob() {
  const jobs = loadProductionJobs()
  const stages = loadWorkflowStages()
  const productionStages = getProductionStageOptions(stages)
  const entryStage = findWorkflowStage(stages, PRODUCTION_ENTRY_STAGE_ID)
  const initialStage = productionStages[0] || entryStage
  const id = nextDocumentCode(jobs.flatMap((job) => [job.id, job.orderId]))

  const job = normalizeProductionJob({
    id,
    orderId: '',
    customer: '',
    title: '',
    product: '',
    quantity: 0,
    stage: initialStage?.label || '',
    currentStageId: initialStage?.id || '',
    stages,
    lineItems: [],
    status: 'Devam Ediyor',
    priority: 'Normal',
    createdAt: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    endDate: '',
    items: [],
    activities: [
      {
        id: createId('act'),
        date: new Date().toLocaleString('tr-TR'),
        text: 'Yeni üretim kaydı oluşturuldu.',
      },
    ],
  })

  saveProductionJobs([job, ...jobs])
  return job
}

export function updateProductionJob(jobId, patch) {
  const jobs = loadProductionJobs().map((job) => {
    if (job.id !== jobId) return job
    return normalizeProductionJob({ ...job, ...patch })
  })
  saveProductionJobs(jobs)
  const updated = jobs.find((job) => job.id === jobId)
  if (
    updated &&
    (Object.prototype.hasOwnProperty.call(patch, 'stage') ||
      Object.prototype.hasOwnProperty.call(patch, 'currentStageId') ||
      Object.prototype.hasOwnProperty.call(patch, 'lineItems'))
  ) {
    syncQuoteFromProduction(updated)
  }
  return updated
}

export function updateProductionLineItem(jobId, lineItemId, patch) {
  const jobs = loadProductionJobs()
  const job = jobs.find((item) => item.id === jobId)
  if (!job) return null

  const stages = loadWorkflowStages()
  const nextLineItems = ensureLineItems(job, stages).map((line) =>
    line.id === lineItemId ? { ...line, ...patch } : line,
  )

  return updateProductionJob(jobId, { lineItems: nextLineItems })
}

export function getProductionJobById(jobId) {
  return loadProductionJobs().find((job) => job.id === jobId) || null
}

export function deleteProductionJob(jobId) {
  const job = loadProductionJobs().find((item) => item.id === jobId)
  if (job) {
    softDeleteRecord(DELETED_COLLECTION, job, { entityLabel: job.id || 'Üretim' })
  }
  saveProductionJobs(loadProductionJobs().filter((item) => item.id !== jobId))
}

export function restoreDeletedProductionJob(jobId) {
  const record = restoreDeletedRecord(DELETED_COLLECTION, jobId)
  if (!record) return null
  const jobs = loadProductionJobs()
  if (jobs.some((item) => item.id === record.id)) return record
  saveProductionJobs([normalizeProductionJob(record), ...jobs])
  return record
}

export function cancelProductionBackToOrder(jobId) {
  const job = getProductionJobById(jobId)
  if (!job) return false

  const orderId = job.orderId || job.id
  deleteProductionJob(jobId)

  const order = loadOrders().find((item) => item.id === orderId)
  if (!order) return true

  const stages = loadWorkflowStages()
  const orderStages = getOrderStageOptions(stages)
  const fallBack =
    orderStages.find((stage) => isOrderReceivedStage(stage)) ||
    orderStages.find((stage) => stage.label !== 'Üretime Alındı') ||
    orderStages[0]

  updateOrder(orderId, {
    status: order.status === 'Üretimde' ? 'Yeni' : order.status,
    currentStageId: fallBack?.id || order.currentStageId,
    activities: [
      ...(order.activities || []),
      {
        id: createId('act'),
        date: new Date().toLocaleString('tr-TR'),
        text: 'Üretime alma işlemi vazgeçildi. Sipariş listede kaldı.',
      },
    ],
  })
  return true
}

export function sendProductionJobToDepo(jobId) {
  const job = getProductionJobById(jobId)
  if (!job) return { sent: 0 }

  const stages = loadWorkflowStages()
  const productionStages = getProductionStageOptions(stages)
  const orders = loadOrders()
  const order = resolveOrderForProductionJob(job, orders)
  const lineItems = ensureLineItems(job, productionStages, order)
  let sent = 0
  const now = createQuantityRowTimestamp()
  const nextLineItems = lineItems.map((lineItem) => {
    const rows = getLineQuantityRows(lineItem).map((row, index) => ({
      ...row,
      productionCode: row.productionCode || `${job.id}-${index + 1}`,
    }))

    const patchedRows = rows.map((row) => {
      if (row.depoItemId) {
        const existing = getDepoItemByProductionRow(job.id, lineItem.id, row.id)
        return existing ? { ...row, depoItemId: existing.id } : row
      }

      const quantity = Math.max(
        Number(row.deliveredQuantity) || 0,
        Number(row.producedQuantity) || 0,
        Number(lineItem.quantity) || 0,
        1,
      )
      const readyRow = {
        ...row,
        deliveredQuantity: quantity,
        producedQuantity: Math.max(Number(row.producedQuantity) || 0, quantity),
      }
      const depoItem = createDepoItemFromRow(job, lineItem, readyRow, { quantity })
      addDepoItem(depoItem)
      sent += 1
      return {
        ...readyRow,
        depoItemId: depoItem.id,
        depoSentAt: now,
      }
    })

    const synced = syncLineQuantitiesFromRows(patchedRows)
    return { ...lineItem, ...synced, quantityRows: synced.quantityRows }
  })

  const summary = deriveJobSummary({ ...job, lineItems: nextLineItems }, stages)
  updateProductionJob(job.id, {
    lineItems: nextLineItems,
    status: summary.status,
    currentStageId: summary.currentStageId,
    stage: summary.stage,
    activities: [
      ...(job.activities || []),
      {
        id: createId('act'),
        date: new Date().toLocaleString('tr-TR'),
        text:
          sent > 0 ? `${sent} kalem depoya gönderildi.` : 'Depoya gönderilecek kalem bulunamadı.',
      },
    ],
  })

  return { sent }
}
