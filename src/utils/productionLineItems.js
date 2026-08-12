import { resolveProductionStageActiveIndex, resolveProductionStagesList } from './workflowStages'
import { getLineFulfillmentOptions, isKnownFulfillmentLabel } from './productionFulfillmentOptions'

import { getJobQuantityMetrics, getLineQuantityMetrics, withDerivedQuantityRowFulfillmentStatus } from './productionQuantityMetrics'
import { normalizeStagePhotos } from './productionStagePhotos'

export { DEFAULT_PART_DELIVERY_SITUATIONS as LINE_FULFILLMENT_OPTIONS } from './productionFulfillmentOptions'
export { getLineFulfillmentOptions, loadPartDeliverySituations, publishPartDeliverySituations } from './productionFulfillmentOptions'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createQuantityRowTimestamp() {
  return new Date().toLocaleString('tr-TR')
}

export function formatQuantityRowDateTime(value) {
  const parts = splitQuantityRowDateTime(value)
  if (!parts.date) return ''
  return parts.time ? `${parts.date} ${parts.time}` : parts.date
}

export function splitQuantityRowDateTime(value) {
  if (!value) return { date: '', time: '' }
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}(?::\d{2})?))?/)
  if (trMatch) {
    return {
      date: trMatch[1],
      time: trMatch[2] ? trMatch[2].slice(0, 5) : '',
    }
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const year = parsed.getFullYear()
    const hours = String(parsed.getHours()).padStart(2, '0')
    const minutes = String(parsed.getMinutes()).padStart(2, '0')
    return {
      date: `${day}.${month}.${year}`,
      time: `${hours}:${minutes}`,
    }
  }

  return { date: raw, time: '' }
}

const PRODUCTION_END_STATUSES = new Set(['Tamamlandı', 'Depoda Hazır'])

export function shouldStampProductionEndedAt(status) {
  return PRODUCTION_END_STATUSES.has(String(status || '').trim())
}

function inferTimestampFromRowId(id) {
  const match = String(id || '').match(/(?:^|-)(\d{13})(?:-|$)/)
  if (!match) return ''
  return new Date(Number(match[1])).toLocaleString('tr-TR')
}

function resolveQuantityRowTimestamps(defaults, producedQuantity, deliveredQuantity, fulfillmentStatus) {
  const createdAt = defaults?.createdAt || inferTimestampFromRowId(defaults?.id) || ''

  const hasMeaningfulStatus = fulfillmentStatus && !['Devam Ediyor', 'Bekliyor', 'Seçiniz'].includes(fulfillmentStatus)

  return {
    createdAt,
    statusUpdatedAt: defaults?.statusUpdatedAt || (hasMeaningfulStatus ? createdAt : ''),
    producedUpdatedAt: defaults?.producedUpdatedAt || (producedQuantity > 0 ? createdAt : ''),
    deliveredUpdatedAt: defaults?.deliveredUpdatedAt || (deliveredQuantity > 0 ? createdAt : ''),
  }
}

export function createQuantityRow(defaults = {}) {
  const rawStatus = defaults?.fulfillmentStatus === 'Kısmi Teslimat'
    ? 'Kısmi Üretim'
    : defaults?.fulfillmentStatus
  const fulfillmentStatus = isKnownFulfillmentLabel(rawStatus)
    ? rawStatus
    : 'Devam Ediyor'
  const producedQuantity = Math.max(0, Number(defaults?.producedQuantity) || 0)
  const deliveredQuantity = Math.max(0, Number(defaults?.deliveredQuantity) || 0)
  const orderedQuantity = Math.max(0, Number(defaults?.orderedQuantity) || 0)
  const timestamps = resolveQuantityRowTimestamps(defaults, producedQuantity, deliveredQuantity, fulfillmentStatus)

  return {
    id: defaults?.id || createId('qrow'),
    fulfillmentStatus,
    fulfillmentStatusManual: Boolean(defaults?.fulfillmentStatusManual),
    orderedQuantity,
    producedQuantity,
    deliveredQuantity,
    deliveredQuantityManual: Boolean(defaults?.deliveredQuantityManual),
    currentStageId: defaults?.currentStageId || '',
    createdAt: timestamps.createdAt,
    statusUpdatedAt: timestamps.statusUpdatedAt,
    producedUpdatedAt: timestamps.producedUpdatedAt,
    deliveredUpdatedAt: timestamps.deliveredUpdatedAt,
    stageUpdatedAt: defaults?.stageUpdatedAt || '',
    productionCode: defaults?.productionCode || '',
    invoiceNo: defaults?.invoiceNo || '',
    invoiceAt: defaults?.invoiceAt || '',
    waybillNo: defaults?.waybillNo || '',
    waybillAt: defaults?.waybillAt || '',
    sevkiyatTripId: defaults?.sevkiyatTripId || '',
    trackingToken: defaults?.trackingToken || '',
    depoItemId: defaults?.depoItemId || '',
    depoSentAt: defaults?.depoSentAt || '',
    productionStartedAt: defaults?.productionStartedAt || '',
    productionEndedAt: defaults?.productionEndedAt || '',
    stageTimestamps:
      defaults?.stageTimestamps && typeof defaults.stageTimestamps === 'object'
        ? { ...defaults.stageTimestamps }
        : {},
    stageActors:
      defaults?.stageActors && typeof defaults.stageActors === 'object'
        ? { ...defaults.stageActors }
        : {},
    // Only + button sets this — empty extras without it stay hidden.
    explicitPartial: defaults?.explicitPartial === true,
  }
}

function normalizeQuantityRows(line, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  const fallbackStageId = productionStages.some((stage) => stage.id === line?.currentStageId)
    ? line.currentStageId
    : productionStages[0]?.id || ''

  function resolveRowStageId(rowStageId) {
    // No stage list provided — keep stored ids (callers like getLineQuantityRows omit stages).
    if (!productionStages.length) return rowStageId || line?.currentStageId || ''
    if (rowStageId && productionStages.some((stage) => stage.id === rowStageId)) return rowStageId
    return fallbackStageId
  }

  if (Array.isArray(line?.quantityRows) && line.quantityRows.length > 0) {
    return line.quantityRows.map((row, index) => {
      const lineQty = Math.max(0, Number(line?.quantity) || 0)
      let orderedQuantity = Number(row.orderedQuantity)
      if (!Number.isFinite(orderedQuantity) || orderedQuantity < 0 || (index === 0 && orderedQuantity === 0 && lineQty > 0)) {
        if (index === 0) {
          orderedQuantity = lineQty
        } else {
          const prevRow = line.quantityRows[index - 1]
          const prevOrderedRaw = Number(prevRow?.orderedQuantity)
          const prevOrdered = Number.isFinite(prevOrderedRaw) && prevOrderedRaw >= 0
            ? prevOrderedRaw
            : lineQty
          const prevProduced = Math.max(0, Number(prevRow?.producedQuantity) || 0)
          orderedQuantity = Math.max(0, prevOrdered - prevProduced)
        }
      }
      return createQuantityRow({
        ...row,
        orderedQuantity,
        currentStageId: resolveRowStageId(row.currentStageId || fallbackStageId),
      })
    })
  }

  return [createQuantityRow({
    fulfillmentStatus: line?.fulfillmentStatus,
    orderedQuantity: Math.max(0, Number(line?.quantity) || 0),
    producedQuantity: line?.producedQuantity,
    deliveredQuantity: line?.deliveredQuantity,
    currentStageId: fallbackStageId,
  })]
}

export function deriveLineCurrentStageId(rows = [], stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  if (!productionStages.length) return ''

  let minIndex = productionStages.length
  let stageId = productionStages[0]?.id || ''

  rows.forEach((row) => {
    const idx = productionStages.findIndex((stage) => stage.id === row?.currentStageId)
    if (idx >= 0 && idx < minIndex) {
      minIndex = idx
      stageId = row.currentStageId
    }
  })

  return stageId
}

export function getQuantityRowStageProgress(row, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  if (!productionStages.length) return []

  const activeStageId =
    String(row?.currentStageId || '').trim() || productionStages[0]?.id || ''
  const stageTimestamps =
    row?.stageTimestamps && typeof row.stageTimestamps === 'object'
      ? row.stageTimestamps
      : {}

  return productionStages.map((stage) => {
    const hasVisit = Boolean(String(stageTimestamps[stage.id] || '').trim())
    const isActive = stage.id === activeStageId
    return {
      ...stage,
      completed: hasVisit && !isActive,
      active: isActive,
      pending: !hasVisit && !isActive,
    }
  })
}

export function syncLineQuantitiesFromRows(quantityRows = []) {
  const normalizedRows = quantityRows.map((row) => createQuantityRow(row))
  const producedQuantity = normalizedRows.reduce((sum, row) => sum + Math.max(0, Number(row.producedQuantity) || 0), 0)
  const deliveredQuantity = normalizedRows.reduce((sum, row) => sum + Math.max(0, Number(row.deliveredQuantity) || 0), 0)
  const fulfillmentStatus = normalizedRows[normalizedRows.length - 1]?.fulfillmentStatus || 'Devam Ediyor'

  return {
    quantityRows: normalizedRows,
    producedQuantity,
    deliveredQuantity,
    fulfillmentStatus,
  }
}

export function getLineQuantityRows(line) {
  return normalizeQuantityRows(line)
}

/** True when production was explicitly started or legacy rows already have progress. */
export function isLineProductionStarted(line, stages = []) {
  if (String(line?.productionStartedAt || '').trim()) return true
  if (line?.productionClosed) return true

  const rows = Array.isArray(line?.quantityRows) ? line.quantityRows : []
  if (
    rows.some(
      (row) =>
        (Number(row.producedQuantity) || 0) > 0 ||
        (Number(row.deliveredQuantity) || 0) > 0 ||
        row.depoItemId ||
        row.waybillNo ||
        row.invoiceNo ||
        row.sevkiyatTripId,
    )
  ) {
    return true
  }
  if (rows.length > 1 && rows.some((row) => row.explicitPartial)) return true

  const productionStages = resolveProductionStagesList(stages)
  if (productionStages.length > 1) {
    const firstId = productionStages[0]?.id
    if (
      rows.some(
        (row) =>
          row.currentStageId &&
          row.currentStageId !== firstId &&
          String(row.stageUpdatedAt || '').trim(),
      )
    ) {
      return true
    }
  }

  return false
}

export function applyJobFulfillmentStatusToLineItems(lineItems = [], statusLabel, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  const lastStage = productionStages[productionStages.length - 1]
  const now = createQuantityRowTimestamp()

  return lineItems.map((line) => {
    const rows = getLineQuantityRows(line).map((row) => {
      const nextRow = {
        ...row,
        fulfillmentStatus: statusLabel,
        statusUpdatedAt: now,
      }
      if (statusLabel === 'Tamamlandı') {
        nextRow.deliveredQuantity = Math.max(nextRow.deliveredQuantity, nextRow.producedQuantity)
        nextRow.deliveredUpdatedAt = now
        if (lastStage?.id) {
          nextRow.currentStageId = lastStage.id
          nextRow.stageUpdatedAt = now
        }
      }
      return nextRow
    })
    const synced = syncLineQuantitiesFromRows(rows)
    const currentStageId = deriveLineCurrentStageId(synced.quantityRows, stages) || line.currentStageId
    return {
      ...line,
      ...synced,
      currentStageId,
      fulfillmentStatus: statusLabel,
    }
  })
}

export function applyJobProductionStageToLineItems(lineItems = [], stageId, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  const stage = productionStages.find((item) => item.id === stageId)
  if (!stage) return lineItems

  const now = createQuantityRowTimestamp()

  return lineItems.map((line) => {
    const rows = getLineQuantityRows(line).map((row) => {
      const nextRow = {
        ...row,
        currentStageId: stageId,
        stageUpdatedAt: now,
      }
      return withDerivedQuantityRowFulfillmentStatus(nextRow, line, productionStages, { timestamp: now })
    })
    const synced = syncLineQuantitiesFromRows(rows)
    const currentStageId = deriveLineCurrentStageId(synced.quantityRows, stages) || stageId
    return {
      ...line,
      ...synced,
      currentStageId,
    }
  })
}

function mapLegacyJobStatus(status) {
  if (status === 'Tamamlandı') return 'Tamamlandı'
  if (status === 'Bekliyor') return 'Bekliyor'
  return 'Devam Ediyor'
}

export function normalizeLineItem(line, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  let currentStageId = line?.currentStageId ?? ''
  if (!currentStageId || !productionStages.some((stage) => stage.id === currentStageId)) {
    currentStageId = productionStages[0]?.id || ''
  }

  const quantity = Number(line?.quantity) || 1
  const quantityRows = normalizeQuantityRows(line, stages)
  const synced = syncLineQuantitiesFromRows(quantityRows)
  const derivedStageId = deriveLineCurrentStageId(synced.quantityRows, stages)

  return {
    id: line?.id || createId('line'),
    product: line?.product || '',
    description: line?.description || '',
    quantity,
    currentStageId: derivedStageId || currentStageId,
    fulfillmentStatus: synced.fulfillmentStatus,
    producedQuantity: synced.producedQuantity,
    deliveredQuantity: synced.deliveredQuantity,
    quantityRows: synced.quantityRows,
    productionClosed: line?.productionClosed === true,
    productionClosedAt: line?.productionClosedAt || '',
    pendingStageId: line?.pendingStageId || '',
    depoWarehouseKind: line?.depoWarehouseKind === 'order' ? 'order' : '',
    stagePhotos: normalizeStagePhotos(line?.stagePhotos),
    productionStartedAt: line?.productionStartedAt || '',
    productionMode:
      line?.productionMode === 'partial'
        ? 'partial'
        : line?.productionMode === 'full'
          ? 'full'
          : '',
  }
}

export function createLineItemFromOrderItem(item, defaults = {}) {
  return normalizeLineItem({
    id: item?.id || createId('line'),
    product: item?.product || '',
    description: item?.description || '',
    quantity: item?.quantity,
    currentStageId: defaults.currentStageId || '',
    fulfillmentStatus: defaults.fulfillmentStatus || 'Devam Ediyor',
    producedQuantity: defaults.producedQuantity || 0,
    deliveredQuantity: defaults.deliveredQuantity || 0,
  })
}

export function resolveOrderForProductionJob(job, orders = []) {
  const code = String(job?.orderId || job?.id || '').trim()
  if (!code || !Array.isArray(orders)) return null
  return orders.find((order) => order.id === code || order.quoteId === code) || null
}

export function resolveLineItemOrderQuantity(lineItem, order) {
  const lineQty = Math.max(0, Number(lineItem?.quantity) || 0)
  if (!order) return lineQty

  const items = (order.items || []).filter((item) => item?.product || item?.description)
  if (!items.length) return lineQty

  const lineId = String(lineItem?.id || '').trim()
  if (lineId) {
    const byId = items.find((item) => String(item?.id || '').trim() === lineId)
    if (byId) return Math.max(0, Number(byId.quantity) || 0)
  }

  const productKey = String(lineItem?.product || '').trim().toLowerCase()
  if (productKey) {
    const byProduct = items.find((item) => String(item?.product || '').trim().toLowerCase() === productKey)
    if (byProduct) return Math.max(0, Number(byProduct.quantity) || 0)
  }

  if (items.length === 1) return Math.max(0, Number(items[0].quantity) || 0)

  return lineQty
}

function enrichLineItemFromOrder(lineItem, order, stages = []) {
  const orderQty = resolveLineItemOrderQuantity(lineItem, order)
  if (orderQty <= 0) return lineItem

  const quantity = Math.max(lineQtyFromItem(lineItem), orderQty)
  const baseRows = Array.isArray(lineItem.quantityRows) ? lineItem.quantityRows : null
  const quantityRows = baseRows?.map((row, index) => (
    index === 0 && (!Number(row.orderedQuantity) || Number(row.orderedQuantity) <= 0)
      ? { ...row, orderedQuantity: quantity }
      : row
  ))

  return normalizeLineItem({
    ...lineItem,
    quantity,
    ...(quantityRows ? { quantityRows } : {}),
  }, stages)
}

function lineQtyFromItem(lineItem) {
  return Math.max(0, Number(lineItem?.quantity) || 0)
}

export function ensureLineItems(job, stages = [], order = null) {
  const productionStages = resolveProductionStagesList(stages)
  let legacyStageId = job?.currentStageId || ''
  if (!legacyStageId && job?.stage) {
    legacyStageId = productionStages.find((stage) => stage.label === job.stage)?.id || ''
  }

  const enrich = (line) => (order ? enrichLineItemFromOrder(line, order, stages) : normalizeLineItem(line, stages))

  if (Array.isArray(job?.lineItems) && job.lineItems.length > 0) {
    return job.lineItems.map((line) => enrich(line))
  }

  const defaults = {
    currentStageId: legacyStageId,
    fulfillmentStatus: mapLegacyJobStatus(job?.status),
  }

  if (Array.isArray(job?.items) && job.items.length > 0) {
    return job.items
      .filter((item) => item?.product || item?.description)
      .map((item) => enrich(createLineItemFromOrderItem(item, defaults)))
  }

  if (job?.product) {
    return [enrich(createLineItemFromOrderItem({
      id: createId('line'),
      product: job.product,
      quantity: job.quantity,
    }, defaults))]
  }

  return []
}

export function deriveJobSummary(job, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  const lineItems = ensureLineItems(job, stages)

  if (lineItems.length === 0) {
    return {
      currentStageId: job?.currentStageId || '',
      stage: job?.stage || '',
      status: job?.status || 'Bekliyor',
      quantity: Number(job?.quantity) || 0,
      product: job?.product || '',
      lineItems,
    }
  }

  let minIndex = productionStages.length
  let summaryStageId = ''
  lineItems.forEach((line) => {
    const lineStageId = deriveLineCurrentStageId(getLineQuantityRows(line), stages) || line.currentStageId
    if (!lineStageId) return
    const index = productionStages.findIndex((stage) => stage.id === lineStageId)
    if (index >= 0 && index < minIndex) {
      minIndex = index
      summaryStageId = lineStageId
    }
  })

  const summaryStage = productionStages.find((stage) => stage.id === summaryStageId)
  const statuses = lineItems.map((line) => line.fulfillmentStatus || 'Devam Ediyor')
  const qtyMetrics = getJobQuantityMetrics(lineItems)

  let status = 'Devam Ediyor'
  if (statuses.every((item) => item === 'Tamamlandı')) status = 'Tamamlandı'
  else if (statuses.some((item) => item === 'Kısmi Üretim') || qtyMetrics.linesWithPartialDelivery > 0) status = 'Kısmi Üretim'
  else if (statuses.some((item) => item === 'Kısmi Üretim Bitti') || qtyMetrics.linesWithShortfall > 0 || qtyMetrics.linesWithExcess > 0) status = 'Kısmi Üretim Bitti'
  else if (statuses.every((item) => item === 'Bekliyor')) status = 'Bekliyor'

  const quantity = lineItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
  const product = lineItems.length === 1
    ? lineItems[0].product
    : `${lineItems.length} kalem`

  return {
    currentStageId: summaryStageId,
    stage: summaryStage?.label || '',
    status,
    quantity,
    product,
    lineItems,
  }
}

export function resolveLineActiveStage(line, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  if (line?.currentStageId) {
    const byId = productionStages.find((stage) => stage.id === line.currentStageId)
    if (byId) return byId
  }
  return productionStages[0] || null
}

export function getLineStageProgress(line, stages = []) {
  const { productionStages, activeIndex } = resolveProductionStageActiveIndex(line, stages)

  return productionStages.map((stage, index) => ({
    ...stage,
    completed: activeIndex >= 0 && index < activeIndex,
    active: activeIndex >= 0 && index === activeIndex,
    pending: activeIndex < 0 || index > activeIndex,
  }))
}
