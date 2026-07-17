import {
  depoSeedItems,
  depoSeedTransfers,
  depoSeedWarehouses,
  DEFAULT_DEPO_VAT_RATE,
} from '../data/depoSeed'
import { loadProductionJobs } from './productionStore'
import { loadOrders } from './ordersStore'
import { getLineQuantityMetrics } from './productionQuantityMetrics'
import {
  findDepoStageById,
  loadDepoWorkflowStages,
  resolveDepoStageIdFromLegacyStatus,
} from './depoWorkflowStages'
import { normalizeStagePhotos } from './productionStagePhotos'

const STORAGE_KEY = 'erlenbox-depo'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowStamp() {
  return new Date().toLocaleString('tr-TR')
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new CustomEvent('bach:depo-updated'))
}

function defaultState() {
  return {
    warehouses: depoSeedWarehouses,
    items: depoSeedItems,
    transfers: depoSeedTransfers,
  }
}

export function loadDepoState() {
  return readRaw() || defaultState()
}

export function saveDepoState(state) {
  writeRaw(state)
  return state
}

export function loadDepoWarehouses() {
  return loadDepoState().warehouses || []
}

export function loadDepoItems() {
  const stages = loadDepoWorkflowStages()
  return (loadDepoState().items || []).map((item) => normalizeDepoItem(item, stages))
}

function normalizeDepoItem(item, stages = loadDepoWorkflowStages()) {
  const firstStage = stages[0]
  let currentStageId = item.currentStageId
    || resolveDepoStageIdFromLegacyStatus(item.status, stages)
    || firstStage?.id
    || ''
  const stage = findDepoStageById(currentStageId, stages) || firstStage
  let stagePhotos = normalizeStagePhotos(item.stagePhotos)
  let productionCode = item.productionCode || ''

  if (!productionCode && item.productionJobId && item.lineItemId && item.quantityRowId) {
    const job = loadProductionJobs().find((entry) => entry.id === item.productionJobId)
    const line = job?.lineItems?.find((entry) => entry.id === item.lineItemId)
    const rowIndex = Array.isArray(line?.quantityRows)
      ? line.quantityRows.findIndex((row) => row.id === item.quantityRowId)
      : -1
    const row = rowIndex >= 0 ? line.quantityRows[rowIndex] : null
    productionCode = row?.productionCode || (rowIndex >= 0 && line.quantityRows.length > 1 ? `${item.productionJobId}-${rowIndex + 1}` : '')
  }

  const aracStage = stages.find((entry) => (
    entry.label === 'Araç Teslim' || entry.label === 'Araçta'
  ))
  const teslimStage = stages.find((entry) => entry.label === 'Teslim Edildi')

  if (item.loadingPhoto && aracStage && !stagePhotos.some((photo) => photo.stageId === aracStage.id)) {
    stagePhotos = [
      ...stagePhotos,
      {
        id: createId('photo'),
        dataUrl: item.loadingPhoto,
        stageId: aracStage.id,
        stageLabel: aracStage.label,
        createdAt: item.loadedAt || item.updatedAt || nowStamp(),
      },
    ]
  }

  if (item.deliveryPhoto && teslimStage && !stagePhotos.some((photo) => photo.stageId === teslimStage.id)) {
    stagePhotos = [
      ...stagePhotos,
      {
        id: createId('photo'),
        dataUrl: item.deliveryPhoto,
        stageId: teslimStage.id,
        stageLabel: teslimStage.label,
        createdAt: item.deliveredAt || item.updatedAt || nowStamp(),
      },
    ]
  }

  const customerText = typeof item.customer === 'object'
    ? (item.customer?.companyTitle || item.customer?.name || '')
    : (item.customer || '')

  return {
    ...item,
    stockScope: item.stockScope || (String(customerText).trim() ? 'customer' : 'general'),
    currentStageId: stage?.id || currentStageId,
    status: stage?.label || item.status || firstStage?.label || 'Beklemede',
    productionCode,
    stagePhotos,
  }
}

export function loadDepoTransfers() {
  return loadDepoState().transfers || []
}

function patchState(patch) {
  const state = loadDepoState()
  return saveDepoState({ ...state, ...patch })
}

export function addWarehouse(payload) {
  const warehouses = loadDepoWarehouses()
  const warehouse = {
    id: createId('wh'),
    status: 'Aktif',
    city: '',
    district: '',
    notes: '',
    ...payload,
  }
  patchState({ warehouses: [warehouse, ...warehouses] })
  return warehouse
}

export function updateDepoItem(itemId, patch) {
  const items = loadDepoItems().map((item) => (
    item.id === itemId ? { ...item, ...patch, updatedAt: nowStamp() } : item
  ))
  patchState({ items })
  return items.find((item) => item.id === itemId) || null
}

function defaultWarehouseForKind(kind) {
  const warehouses = loadDepoWarehouses()
  return warehouses.find((w) => w.kind === kind) || null
}

export function removeDepoItemByProductionLine(productionJobId, lineItemId) {
  const items = loadDepoItems().filter(
    (item) => !(item.productionJobId === productionJobId && item.lineItemId === lineItemId),
  )
  if (items.length !== loadDepoItems().length) {
    patchState({ items })
  }
}

function estimateUnitCost(line) {
  return Number(line.unitCost) || Number(line.cost) || 12.5
}

function estimateUnitPrice(line) {
  return Number(line.unitPrice) || Number(line.price) || 18.75
}

export function resolveLinePricingFromOrder(job, line) {
  const order = loadOrders().find((entry) => entry.id === job.orderId)
  const orderLine = order?.items?.find((entry) => (
    entry.id === line.id || entry.product === line.product
  ))
  return {
    unitPrice: Number(orderLine?.unitPrice) || estimateUnitPrice(line),
    vatRate: Number(orderLine?.vatRate) || DEFAULT_DEPO_VAT_RATE,
    unitCost: Number(orderLine?.unitCost) || estimateUnitCost(line),
    productCode: orderLine?.sku || line.sku || line.productCode || '',
  }
}

export function resolveLineProductCode(job, line) {
  return resolveLinePricingFromOrder(job, line).productCode
}

export function addDepoItem(item) {
  const items = loadDepoItems()
  patchState({ items: [item, ...items] })
  return item
}

export function getDepoItemByProductionRow(productionJobId, lineItemId, quantityRowId) {
  return loadDepoItems().find((item) => (
    item.productionJobId === productionJobId
    && item.lineItemId === lineItemId
    && item.quantityRowId === quantityRowId
  )) || null
}

export function removeDepoItemByProductionRow(productionJobId, lineItemId, quantityRowId) {
  const items = loadDepoItems().filter(
    (item) => !(
      item.productionJobId === productionJobId
      && item.lineItemId === lineItemId
      && item.quantityRowId === quantityRowId
    ),
  )
  if (items.length !== loadDepoItems().length) {
    patchState({ items })
  }
}

export function removeDepoItemById(depoItemId) {
  if (!depoItemId) return
  const items = loadDepoItems().filter((item) => item.id !== depoItemId)
  if (items.length !== loadDepoItems().length) {
    patchState({ items })
  }
}

export function createDepoItemFromLine(job, line, warehouseId) {
  const metrics = getLineQuantityMetrics(line)
  const warehouse = warehouseId
    ? loadDepoWarehouses().find((w) => w.id === warehouseId)
    : defaultWarehouseForKind('order')

  const pricing = resolveLinePricingFromOrder(job, line)
  const stages = loadDepoWorkflowStages()
  const firstStage = stages[0]
  const customerName = job.customer || ''
  const stockScope = String(customerName).trim() ? 'customer' : 'general'

  return {
    id: createId('dep'),
    productionJobId: job.id,
    orderId: job.orderId || '',
    lineItemId: line.id,
    quantityRowId: '',
    stockScope,
    projectId: job.projectId || '',
    customer: customerName,
    product: line.product || job.product || 'Ürün',
    productCode: pricing.productCode,
    quantity: metrics.ordered,
    producedQuantity: metrics.produced,
    soldQuantity: metrics.produced,
    deliveredQuantity: metrics.delivered,
    unitCost: pricing.unitCost,
    unitPrice: pricing.unitPrice,
    vatRate: pricing.vatRate,
    warehouseId: warehouse?.id || '',
    currentStageId: firstStage?.id || '',
    stagePhotos: [],
    status: firstStage?.label || 'Beklemede',
    transportType: '',
    vehicleId: '',
    driverId: '',
    packedAt: '',
    readyAt: '',
    loadedAt: '',
    loadingPhoto: '',
    deliveredAt: '',
    deliveryPhoto: '',
    invoiceNo: '',
    invoiceAt: '',
    waybillNo: '',
    waybillAt: '',
    notes: '',
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  }
}

export function createDepoItemFromRow(job, line, row, { quantity } = {}) {
  const deliveredQty = Math.max(0, Number(quantity ?? row?.deliveredQuantity) || 0)
  const producedQty = Math.max(0, Number(row?.producedQuantity) || 0)
  const warehouse = defaultWarehouseForKind('order')
  const pricing = resolveLinePricingFromOrder(job, line)
  const stamp = nowStamp()
  const stages = loadDepoWorkflowStages()
  const firstStage = stages[0]
  const customerName = job.customer || ''
  const stockScope = String(customerName).trim() ? 'customer' : 'general'

  return {
    id: createId('dep'),
    productionJobId: job.id,
    orderId: job.orderId || '',
    lineItemId: line.id,
    quantityRowId: row.id,
    source: 'production',
    sourceLabel: 'Üretim takibi',
    productionCode: row.productionCode || '',
    stockScope,
    projectId: job.projectId || '',
    customer: customerName,
    product: line.product || job.product || 'Ürün',
    productCode: pricing.productCode,
    quantity: deliveredQty,
    producedQuantity: producedQty,
    soldQuantity: deliveredQty,
    deliveredQuantity: deliveredQty,
    unitCost: pricing.unitCost,
    unitPrice: pricing.unitPrice,
    vatRate: pricing.vatRate,
    warehouseId: warehouse?.id || '',
    currentStageId: firstStage?.id || '',
    stagePhotos: [],
    status: firstStage?.label || 'Beklemede',
    transportType: '',
    vehicleId: '',
    driverId: '',
    packedAt: '',
    readyAt: '',
    loadedAt: '',
    loadingPhoto: '',
    deliveredAt: '',
    deliveryPhoto: '',
    invoiceNo: '',
    invoiceAt: '',
    waybillNo: '',
    waybillAt: '',
    notes: '',
    createdAt: stamp,
    updatedAt: stamp,
    depoSentAt: stamp,
  }
}

export function syncDepoFromProduction() {
  const jobs = loadProductionJobs()
  const items = loadDepoItems()
  const existing = new Set(items.map((item) => `${item.productionJobId}:${item.lineItemId}`))
  const added = []

  jobs.forEach((job) => {
    ;(job.lineItems || []).forEach((line) => {
      if (!line.productionClosed) return
      if (line.depoWarehouseKind !== 'order') return
      const metrics = getLineQuantityMetrics(line)
      if (metrics.produced <= 0) return
      const key = `${job.id}:${line.id}`
      if (existing.has(key)) return
      added.push(createDepoItemFromLine(job, line))
    })
  })

  if (added.length) {
    patchState({ items: [...items, ...added] })
  }
  return added
}

export function advanceDepoItemToStage(itemId, stageId, patch = {}) {
  const stages = loadDepoWorkflowStages()
  const stage = findDepoStageById(stageId, stages)
  if (!stage) return null

  const timestamps = {}
  const label = stage.label
  if (label === 'Paketlendi') timestamps.packedAt = nowStamp()
  if (label === 'Teslime Hazır') timestamps.readyAt = nowStamp()
  if (label === 'Araç Teslim' || label === 'Araçta') timestamps.loadedAt = nowStamp()
  if (label === 'Teslim Edildi') timestamps.deliveredAt = patch.deliveredAt || nowStamp()

  return updateDepoItem(itemId, {
    currentStageId: stageId,
    status: label,
    stageUpdatedAt: nowStamp(),
    ...timestamps,
    ...patch,
  })
}

export function advanceDepoItemStatus(itemId, nextStatus, patch = {}) {
  const stages = loadDepoWorkflowStages()
  const stage = stages.find((entry) => entry.label === nextStatus)
  if (stage) return advanceDepoItemToStage(itemId, stage.id, patch)

  const timestamps = {}
  if (nextStatus === 'Paketlendi') timestamps.packedAt = nowStamp()
  if (nextStatus === 'Teslime Hazır') timestamps.readyAt = nowStamp()
  if (nextStatus === 'Araçta') timestamps.loadedAt = nowStamp()
  if (nextStatus === 'Teslim Edildi') timestamps.deliveredAt = patch.deliveredAt || nowStamp()

  return updateDepoItem(itemId, { status: nextStatus, ...timestamps, ...patch })
}

export function createTransfer({ fromWarehouseId, toWarehouseId, depoItemId, quantity, notes = '' }) {
  const item = loadDepoItems().find((entry) => entry.id === depoItemId)
  const transfers = loadDepoTransfers()
  const transfer = {
    id: createId('trf'),
    fromWarehouseId,
    toWarehouseId,
    depoItemId,
    product: item?.product || '',
    quantity: Number(quantity) || 0,
    status: 'Tamamlandı',
    notes,
    createdAt: nowStamp(),
    completedAt: nowStamp(),
  }

  if (item && fromWarehouseId !== toWarehouseId) {
    updateDepoItem(depoItemId, { warehouseId: toWarehouseId })
  }

  patchState({ transfers: [transfer, ...transfers] })
  return transfer
}

export function issueDepoInvoice(depoItemId) {
  const item = loadDepoItems().find((entry) => entry.id === depoItemId)
  if (!item) return null
  if (item.invoiceNo) return item

  const invoiceNo = `SF-${Date.now().toString().slice(-8)}`
  const invoicedQuantity = Math.max(0, Number(item.deliveredQuantity) || Number(item.quantity) || Number(item.producedQuantity) || 0)
  return updateDepoItem(depoItemId, {
    invoiceNo,
    invoiceAt: nowStamp(),
    invoicedQuantity,
  })
}

export function createDepoWaybill(depoItemId) {
  const item = loadDepoItems().find((entry) => entry.id === depoItemId)
  if (!item) return null
  if (item.waybillNo) return item

  const waybillNo = `IRS-${Date.now().toString().slice(-8)}`
  return updateDepoItem(depoItemId, {
    waybillNo,
    waybillAt: nowStamp(),
  })
}

export function resetDepoSeed() {
  saveDepoState(defaultState())
}
