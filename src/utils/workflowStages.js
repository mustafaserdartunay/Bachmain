import { defaultQuoteStages } from '../data/quotesData'
import { productionStageId } from '../data/productionStages'

const STORAGE_KEY = 'erlenbox-workflow-stages'

export const ORDER_RECEIVED_STAGE_ID = 'stage-8'
export const PRODUCTION_ENTRY_STAGE_ID = 'stage-9'
export const DEFAULT_ORDER_STAGE_ID = ORDER_RECEIVED_STAGE_ID

export function isOrderReceivedStage(stage) {
  if (!stage) return false
  if (stage.id === ORDER_RECEIVED_STAGE_ID) return true
  const label = String(stage.label || '').trim()
  if (label === 'Sipariş Alındı') return true
  if (label.startsWith('Sipariş Alındı')) return true
  return false
}

export function isProductionEntryStage(stage) {
  if (!stage) return false
  if (stage.id === PRODUCTION_ENTRY_STAGE_ID) return true
  return String(stage.label || '').trim() === 'Üretime Alındı'
}

const DEFAULT_QUOTE_STAGE_LABELS = new Set(
  defaultQuoteStages
    .filter((stage) => !isOrderReceivedStage(stage) && !isProductionEntryStage(stage))
    .map((stage) => stage.label),
)

const AUTO_INJECTED_PRODUCTION_LABELS = [
  'Malzeme',
  'Malzeme Hazırlık',
  'Kesim',
  'Büküm',
  'Kaynak',
  'Baskı',
  'Montaj',
  'Kalite',
  'Kalite Kontrol',
  'Paketleme',
  'Sevkiyat',
]
const AUTO_INJECTED_PRODUCTION_IDS = new Set(
  AUTO_INJECTED_PRODUCTION_LABELS.map((label) => productionStageId(label)),
)

export function buildDefaultWorkflowStages() {
  return defaultQuoteStages.map((stage) => ({ ...stage }))
}

function sanitizeWorkflowStages(stages) {
  return (stages || []).filter((stage) => {
    const label = String(stage?.label || '').trim()
    return Boolean(label)
  })
}

function findStageIndex(stages, { id, label }) {
  if (id) {
    const byId = stages.findIndex((stage) => stage.id === id)
    if (byId >= 0) return byId
  }
  if (label) {
    const byLabel = stages.findIndex((stage) => stage.label === label)
    if (byLabel >= 0) return byLabel
  }
  return -1
}

function findCanonicalOrderStartIndex(stages) {
  return stages.findIndex((stage) => stage.id === ORDER_RECEIVED_STAGE_ID)
}

function findCanonicalProductionEntryIndex(stages) {
  return stages.findIndex((stage) => stage.id === PRODUCTION_ENTRY_STAGE_ID)
}

function findOrderStartIndex(stages) {
  const byId = findCanonicalOrderStartIndex(stages)
  if (byId >= 0) return byId
  return findCanonicalProductionEntryIndex(stages)
}

function findProductionEntryIndex(stages) {
  return findCanonicalProductionEntryIndex(stages)
}

function defaultOrderReceivedStage() {
  return (
    defaultQuoteStages.find((stage) => stage.id === ORDER_RECEIVED_STAGE_ID) || {
      id: ORDER_RECEIVED_STAGE_ID,
      label: 'Sipariş Alındı',
      color: 'bg-purple-500',
      note: 'Teklif siparişe dönüştürüldü.',
    }
  )
}

function defaultProductionEntryStage() {
  return (
    defaultQuoteStages.find((stage) => stage.id === PRODUCTION_ENTRY_STAGE_ID) || {
      id: PRODUCTION_ENTRY_STAGE_ID,
      label: 'Üretime Alındı',
      color: 'bg-fuchsia-500',
      note: 'Sipariş üretim sürecine aktarıldı.',
    }
  )
}

function defaultQuoteStagesOnly() {
  return defaultQuoteStages.filter(
    (stage) => !isOrderReceivedStage(stage) && !isProductionEntryStage(stage),
  )
}

function normalizeOrderReceivedStage(stage) {
  if (!stage) return defaultOrderReceivedStage()
  if (stage.id !== ORDER_RECEIVED_STAGE_ID) return stage
  return {
    ...stage,
    id: ORDER_RECEIVED_STAGE_ID,
    label: stage.label === 'Sipariş Alındı' ? 'Sipariş Alındı' : stage.label,
  }
}

function normalizeProductionEntryStage(stage) {
  if (!stage) return defaultProductionEntryStage()
  if (stage.id !== PRODUCTION_ENTRY_STAGE_ID) return stage
  return {
    ...stage,
    id: PRODUCTION_ENTRY_STAGE_ID,
    label: 'Üretime Alındı',
  }
}

function isAutoInjectedProductionStage(stage) {
  if (!stage) return false
  if (AUTO_INJECTED_PRODUCTION_LABELS.includes(stage.label)) return true
  return AUTO_INJECTED_PRODUCTION_IDS.has(stage.id)
}

function isQuoteStageLabel(stage) {
  return DEFAULT_QUOTE_STAGE_LABELS.has(stage?.label)
}

function findOrderSectionStart(stages) {
  const orderReceivedIndex = findCanonicalOrderStartIndex(stages)
  if (orderReceivedIndex >= 0) return orderReceivedIndex
  const productionEntryIndex = findCanonicalProductionEntryIndex(stages)
  if (productionEntryIndex >= 0) return productionEntryIndex
  return stages.length
}

function findOrderSectionEnd(stages, start) {
  if (start < 0) return start
  for (let index = start; index < stages.length; index += 1) {
    if (stages[index].id === PRODUCTION_ENTRY_STAGE_ID) {
      return index + 1
    }
  }
  let end = start
  for (let index = start; index < stages.length; index += 1) {
    if (isAutoInjectedProductionStage(stages[index])) break
    end = index + 1
  }
  return end
}

function normalizeOrderSlice(stages) {
  const seen = new Set()
  const normalized = []
  for (const stage of stages) {
    let next = stage
    if (stage.id === ORDER_RECEIVED_STAGE_ID) next = normalizeOrderReceivedStage(stage)
    else if (stage.id === PRODUCTION_ENTRY_STAGE_ID) next = normalizeProductionEntryStage(stage)
    if (!next?.id || seen.has(next.id)) continue
    seen.add(next.id)
    normalized.push(next)
  }
  if (normalized.length === 0) {
    return uniqueOrderStagesByLabel([defaultOrderReceivedStage(), defaultProductionEntryStage()])
  }
  const hasOrderReceived = normalized.some((item) => item.id === ORDER_RECEIVED_STAGE_ID)
  const hasProductionEntry = normalized.some((item) => item.id === PRODUCTION_ENTRY_STAGE_ID)
  const withAnchors = [...normalized]
  if (!hasOrderReceived) withAnchors.unshift(defaultOrderReceivedStage())
  if (!hasProductionEntry) withAnchors.push(defaultProductionEntryStage())
  return uniqueOrderStagesByLabel(withAnchors)
}

function partitionWorkflowStages(stages) {
  const unique = uniqueStagesById(sanitizeWorkflowStages(stages))
  const orderSectionStart = findOrderSectionStart(unique)
  const orderSectionEnd = findOrderSectionEnd(unique, orderSectionStart)

  const quoteSlice = orderSectionStart >= 0 ? unique.slice(0, orderSectionStart) : unique
  const quoteStages = filterValidWorkflowStages(quoteSlice)

  const orderSlice =
    orderSectionStart >= 0 && orderSectionStart < unique.length
      ? unique.slice(orderSectionStart, orderSectionEnd)
      : []
  const orderStages =
    orderSlice.length > 0
      ? normalizeOrderSlice(orderSlice)
      : normalizeOrderSlice([defaultOrderReceivedStage(), defaultProductionEntryStage()])

  const productionStages = filterValidWorkflowStages(
    unique.slice(orderSectionEnd >= 0 ? orderSectionEnd : 0),
  )

  const finalQuoteStages = quoteStages.length > 0 ? quoteStages : defaultQuoteStagesOnly()

  return {
    quoteStages: finalQuoteStages,
    orderStages,
    productionStages,
  }
}

export function loadWorkflowStages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return []
        const clean = compactWorkflowStagePipeline(sanitizeWorkflowStages(parsed))
        if (clean.length !== parsed.length || JSON.stringify(clean) !== JSON.stringify(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
          window.dispatchEvent(new CustomEvent('bach:workflow-stages-updated'))
        }
        return clean
      }
    }
  } catch {
    // fall through to migration/defaults
  }

  const migrated = migrateWorkflowStagesFromQuotes()
  if (migrated) {
    saveWorkflowStages(migrated)
    return migrated
  }

  return buildDefaultWorkflowStages()
}

function migrateWorkflowStagesFromQuotes() {
  try {
    const saved = localStorage.getItem('erlenbox-quotes')
    if (!saved) return null
    const quotes = JSON.parse(saved)
    if (!Array.isArray(quotes) || quotes.length === 0) return null

    const richest = quotes.reduce((best, quote) => {
      const count = (quote.stages || []).length
      return count > (best?.stages?.length || 0) ? quote : best
    }, null)

    if ((richest?.stages || []).length > 0) {
      return sanitizeWorkflowStages(richest.stages)
    }
  } catch {
    return null
  }
  return null
}

function compactWorkflowStagePipeline(stages) {
  const { quoteStages, orderStages, productionStages } = partitionWorkflowStages(stages)
  return [...quoteStages, ...orderStages, ...productionStages]
}

export function appendQuoteStage(quoteStages, nextStage) {
  return [...quoteStages, nextStage]
}

export function saveWorkflowStages(stages) {
  const clean = compactWorkflowStagePipeline(sanitizeWorkflowStages(stages))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  window.dispatchEvent(new CustomEvent('bach:workflow-stages-updated'))
  return clean
}

export function findWorkflowStage(stages, stageId) {
  return stages.find((stage) => stage.id === stageId) || null
}

export function resolveWorkflowStageLabel(stages, stageId, fallback = '') {
  return findWorkflowStage(stages, stageId)?.label || fallback
}

export function toStageDropdownOptions(stages) {
  return stages.map((stage) => ({ label: stage.label, color: stage.color }))
}

function uniqueStagesById(stages) {
  const seen = new Set()
  return (stages || []).filter((stage) => {
    if (!stage?.id || seen.has(stage.id)) return false
    seen.add(stage.id)
    return true
  })
}

function uniqueOrderStagesByLabel(stages) {
  const seen = new Set()
  return uniqueStagesById(stages).filter((stage) => {
    const label = String(stage?.label || '').trim()
    if (!label) return false
    if (seen.has(label)) return false
    seen.add(label)
    return true
  })
}

function filterValidWorkflowStages(stages) {
  return uniqueStagesById(stages).filter((stage) => {
    const label = String(stage?.label || '').trim()
    return Boolean(label)
  })
}

export function getOrderStageOptions(stages = loadWorkflowStages()) {
  if (!stages?.length) return []
  return partitionWorkflowStages(stages).orderStages
}

export function getQuoteStageOptions(stages = loadWorkflowStages()) {
  if (!stages?.length) return []
  return partitionWorkflowStages(stages).quoteStages
}

export function mergeQuoteStagesIntoWorkflow(fullStages, quoteStages) {
  const orderStart = findOrderStartIndex(fullStages)
  if (orderStart >= 0) {
    return [...quoteStages, ...fullStages.slice(orderStart)]
  }
  return [
    ...quoteStages,
    ...getOrderStageOptions(fullStages),
    ...getProductionStageOptions(fullStages),
  ]
}

export function mergeOrderStagesIntoWorkflow(fullStages, orderStages) {
  const quotePart = getQuoteStageOptions(fullStages)
  let cleanOrderStages = uniqueOrderStagesByLabel(orderStages)
  const hasProductionEntry = cleanOrderStages.some(
    (stage) => stage.id === PRODUCTION_ENTRY_STAGE_ID || stage.label === 'Üretime Alındı',
  )
  if (!hasProductionEntry) {
    const entryStage =
      findWorkflowStage(fullStages, PRODUCTION_ENTRY_STAGE_ID) ||
      fullStages.find((stage) => stage.label === 'Üretime Alındı')
    if (entryStage) {
      cleanOrderStages = [...cleanOrderStages, entryStage]
    }
  }
  const productionIndex = findStageIndex(fullStages, {
    id: PRODUCTION_ENTRY_STAGE_ID,
    label: 'Üretime Alındı',
  })
  const productionTail =
    productionIndex >= 0
      ? fullStages.slice(productionIndex + 1)
      : getProductionStageOptions(fullStages)
  return [...quotePart, ...cleanOrderStages, ...productionTail]
}

export function appendProductionStage(productionStages, nextStage) {
  return [...productionStages, nextStage]
}

export function appendOrderStage(orderStages, nextStage) {
  const entryIndex = orderStages.findIndex(
    (stage) => stage.id === PRODUCTION_ENTRY_STAGE_ID || stage.label === 'Üretime Alındı',
  )
  if (entryIndex >= 0) {
    return [...orderStages.slice(0, entryIndex), nextStage, ...orderStages.slice(entryIndex)]
  }
  return [...orderStages, nextStage]
}

export function resolveQuoteProcessRecord(quote, stages = loadWorkflowStages()) {
  const quoteStages = getQuoteStageOptions(stages)
  const currentStageId = resolveQuotePanelCurrentStageId(quote, stages)
  const activeStage =
    quoteStages.find((item) => item.id === currentStageId) || quoteStages[0] || null

  return {
    stages: quoteStages,
    currentStageId,
    activeStage,
  }
}

export function resolveQuoteActiveStage(quote, stages = loadWorkflowStages()) {
  const quoteStages = getQuoteStageOptions(stages)
  const merged = [...quoteStages, ...getOrderStageOptions(stages)]
  if (quote?.currentStageId && merged.some((stage) => stage.id === quote.currentStageId)) {
    return merged.find((stage) => stage.id === quote.currentStageId) || null
  }
  return quoteStages[0] || null
}

export function resolveQuotePanelCurrentStageId(record, stages = loadWorkflowStages()) {
  const quoteStages = getQuoteStageOptions(stages)
  if (record?.currentStageId && quoteStages.some((stage) => stage.id === record.currentStageId)) {
    return record.currentStageId
  }
  return quoteStages[0]?.id || ''
}

export function resolveOrderPanelCurrentStageId(record, stages = loadWorkflowStages()) {
  const orderStages = getOrderStageOptions(stages)
  if (record?.currentStageId && orderStages.some((stage) => stage.id === record.currentStageId)) {
    return record.currentStageId
  }
  return orderStages[0]?.id || DEFAULT_ORDER_STAGE_ID
}

export function mergeProductionStagesIntoWorkflow(fullStages, productionStages) {
  const productionIndex = findStageIndex(fullStages, {
    id: PRODUCTION_ENTRY_STAGE_ID,
    label: 'Üretime Alındı',
  })
  const cleanProductionStages = uniqueStagesById(productionStages || [])
  if (productionIndex >= 0) {
    return [...fullStages.slice(0, productionIndex + 1), ...cleanProductionStages]
  }
  const quotePart = getQuoteStageOptions(fullStages)
  const orderPart = getOrderStageOptions(fullStages)
  const productionEntry =
    findWorkflowStage(fullStages, PRODUCTION_ENTRY_STAGE_ID) || defaultProductionEntryStage()
  return [
    ...quotePart,
    ...orderPart.filter((stage) => stage.id !== PRODUCTION_ENTRY_STAGE_ID),
    productionEntry,
    ...cleanProductionStages,
  ]
}

export function resolveProductionPanelCurrentStageId(record, stages = loadWorkflowStages()) {
  const productionStages = getProductionStageOptions(stages)
  if (
    record?.currentStageId &&
    productionStages.some((stage) => stage.id === record.currentStageId)
  ) {
    return record.currentStageId
  }
  return productionStages[0]?.id || ''
}

export function isPlaceholderProductionStage(stage) {
  const label = String(stage?.label || '').trim()
  return !label || label === 'Seçiniz'
}

export function withoutPlaceholderProductionStages(stages = []) {
  return (stages || []).filter((stage) => !isPlaceholderProductionStage(stage))
}

/**
 * Production stages from Settings → Üretim Süreçleri.
 * Never injects the recommended template — empty means none configured.
 */
export function getProductionStageOptions(stages = loadWorkflowStages()) {
  if (!stages?.length) return []
  return withoutPlaceholderProductionStages(
    partitionWorkflowStages(stages).productionStages,
  )
}

/**
 * Resolve a production stage list for job/line helpers.
 * Accepts either a full workflow pipeline or an already-partitioned production list.
 * Must not fall back to recommended stages (that breaks click IDs vs Settings).
 */
export function resolveProductionStagesList(stages = []) {
  if (!stages?.length) return []

  const partitioned = withoutPlaceholderProductionStages(
    partitionWorkflowStages(stages).productionStages,
  )
  if (partitioned.length) return partitioned

  const hasWorkflowAnchors = stages.some(
    (stage) =>
      isOrderReceivedStage(stage) ||
      isProductionEntryStage(stage) ||
      stage?.id === ORDER_RECEIVED_STAGE_ID ||
      stage?.id === PRODUCTION_ENTRY_STAGE_ID,
  )
  // Full workflow with no production tail → truly empty.
  if (hasWorkflowAnchors) return []

  // Caller already passed production-only stages (no quote/order anchors).
  return withoutPlaceholderProductionStages(
    stages.filter((stage) => stage?.id && stage?.label),
  )
}

function resolveRawProductionStagesList(stages = []) {
  if (!stages?.length) return []
  const partitioned = partitionWorkflowStages(stages).productionStages
  if (partitioned.length) return partitioned
  return stages.filter((stage) => stage?.id && stage?.label)
}

export function resolveProductionStageActiveIndex(line, stages = []) {
  const productionStages = resolveProductionStagesList(stages)
  let activeIndex = productionStages.findIndex((stage) => stage.id === line?.currentStageId)

  if (activeIndex < 0 && line?.currentStageId) {
    const currentRaw = resolveRawProductionStagesList(stages).find(
      (stage) => stage.id === line.currentStageId,
    )
    if (currentRaw && isPlaceholderProductionStage(currentRaw)) {
      activeIndex = 0
    }
  }

  return { productionStages, activeIndex }
}

export function resolveOrderActiveStage(order, stages = loadWorkflowStages()) {
  const orderStages = getOrderStageOptions(stages)
  if (order?.currentStageId) {
    const byId = orderStages.find((stage) => stage.id === order.currentStageId)
    if (byId) return byId
  }
  return orderStages[0] || null
}

export function resolveProductionActiveStage(job, stages = loadWorkflowStages()) {
  const productionStages = getProductionStageOptions(stages)
  if (job?.currentStageId) {
    const byId = productionStages.find((stage) => stage.id === job.currentStageId)
    if (byId) return byId
  }
  if (job?.stage) {
    const byLabel = productionStages.find((stage) => stage.label === job.stage)
    if (byLabel) return byLabel
  }
  return productionStages[0] || null
}

export function resolveProductionStageLabel(job, stages = loadWorkflowStages()) {
  const activeStage = resolveProductionActiveStage(job, stages)
  return activeStage?.label || job?.stage || ''
}
