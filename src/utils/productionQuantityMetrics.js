import { getProductionStageOptions } from './workflowStages'
import {
  ensureLineItems,
  getLineStageProgress,
  getQuantityRowStageProgress,
} from './productionLineItems'

export function formatQty(value) {
  return Math.max(0, Number(value) || 0).toLocaleString('tr-TR')
}

export function getQuantityRowOrdered(row, lineItem, rowIndex = 0) {
  const lineQty = Math.max(0, Number(lineItem?.quantity) || 0)
  const explicit = Number(row?.orderedQuantity)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  if (rowIndex === 0) return lineQty
  if (Number.isFinite(explicit) && explicit >= 0) return explicit
  return 0
}

export function getQuantityRowRemaining(row, lineItem, rowIndex = 0) {
  const ordered = getQuantityRowOrdered(row, lineItem, rowIndex)
  const produced = Math.max(0, Number(row?.producedQuantity) || 0)
  return Math.max(0, ordered - produced)
}

export function getFirstRowSplitBaseRemaining(lineItem, orderLineQuantity = null) {
  const rows = Array.isArray(lineItem?.quantityRows) ? lineItem.quantityRows : []
  const firstRow = rows[0]
  if (!firstRow) return 0

  const firstRowOrdered = getQuantityRowOrdered(firstRow, lineItem, 0)
  const firstRowProduced = Math.max(0, Number(firstRow?.producedQuantity) || 0)
  const firstRowDelivered = Math.max(0, Number(firstRow?.deliveredQuantity) || 0)
  const resolvedOrderQty = Math.max(0, Number(orderLineQuantity) || 0)
  const firstRowSiparisQty = resolvedOrderQty > 0 ? resolvedOrderQty : firstRowOrdered
  const firstRowRemaining = Math.max(0, firstRowSiparisQty - firstRowProduced)
  const firstRowUndelivered = Math.max(0, firstRowProduced - firstRowDelivered)

  return firstRowRemaining > 0 ? firstRowRemaining : firstRowUndelivered
}

export function getSplitRowKalanVariance(splitBaseRemaining, deliveredQuantity) {
  const base = Math.max(0, Number(splitBaseRemaining) || 0)
  const delivered = Math.max(0, Number(deliveredQuantity) || 0)
  const variance = base - delivered

  if (variance < 0) {
    const excess = Math.abs(variance)
    return { label: 'Fazla', value: excess, isExcess: true, depoQuantity: excess }
  }

  return {
    label: 'Kalan',
    value: variance,
    isExcess: false,
    depoQuantity: delivered,
  }
}

export function resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity = null) {
  const delivered = Math.max(0, Number(row?.deliveredQuantity) || 0)
  if (rowIndex <= 0) return delivered

  const base = getFirstRowSplitBaseRemaining(lineItem, orderLineQuantity)
  return getSplitRowKalanVariance(base, delivered).depoQuantity
}

export function getLineQuantityMetrics(line) {
  const ordered = Math.max(0, Number(line?.quantity) || 0)
  const produced = Math.max(0, Number(line?.producedQuantity) || 0)
  const delivered = Math.max(0, Number(line?.deliveredQuantity) || 0)
  const remaining = Math.max(0, ordered - produced)
  const excess = Math.max(0, produced - ordered)
  const undelivered = Math.max(0, produced - delivered)
  const deliveryRemaining = Math.max(0, ordered - delivered)
  const productionClosed = line?.productionClosed === true
  const variance = produced - ordered

  return {
    ordered,
    produced,
    delivered,
    remaining,
    excess,
    undelivered,
    deliveryRemaining,
    productionClosed,
    variance,
    hasShortfall: productionClosed && remaining > 0,
    hasExcess: excess > 0,
    hasRemaining: remaining > 0 && !productionClosed,
    hasPartialDelivery: delivered > 0 && delivered < Math.max(produced, ordered),
    productionPct: ordered
      ? Math.min(100, Math.round((produced / ordered) * 100))
      : produced > 0
        ? 100
        : 0,
    deliveryPct: ordered ? Math.min(100, Math.round((delivered / ordered) * 100)) : 0,
  }
}

export function getJobQuantityMetrics(lineItems = []) {
  return lineItems.reduce(
    (acc, line) => {
      const m = getLineQuantityMetrics(line)
      acc.ordered += m.ordered
      acc.produced += m.produced
      acc.delivered += m.delivered
      acc.remaining += m.remaining
      acc.excess += m.excess
      acc.undelivered += m.undelivered
      if (m.hasShortfall) acc.linesWithShortfall += 1
      if (m.hasExcess) acc.linesWithExcess += 1
      if (m.hasPartialDelivery) acc.linesWithPartialDelivery += 1
      if (m.hasRemaining) acc.linesWithRemaining += 1
      return acc
    },
    {
      ordered: 0,
      produced: 0,
      delivered: 0,
      remaining: 0,
      excess: 0,
      undelivered: 0,
      linesWithShortfall: 0,
      linesWithExcess: 0,
      linesWithPartialDelivery: 0,
      linesWithRemaining: 0,
    },
  )
}

export function getLineStageIndex(line, productionStages) {
  return productionStages.findIndex((stage) => stage.id === line?.currentStageId)
}

export function getLineStageTracks(line, productionStages = []) {
  const metrics = getLineQuantityMetrics(line)
  const activeIndex = getLineStageIndex(line, productionStages)
  const lastStage = productionStages[productionStages.length - 1]
  const firstStage = productionStages[0]

  if (metrics.productionClosed && metrics.remaining > 0) {
    return [
      {
        id: 'finished',
        label: 'Tamamlanan üretim',
        quantity: metrics.produced,
        stageId: lastStage?.id || line.currentStageId,
        stageIndex: productionStages.length - 1,
        tone: 'finished',
        stages: productionStages.map((stage, index) => ({
          ...stage,
          completed: true,
          active: index === productionStages.length - 1,
        })),
      },
      {
        id: 'pending',
        label: 'Bekleyen adet',
        quantity: metrics.remaining,
        stageId: line.pendingStageId || firstStage?.id || '',
        stageIndex: 0,
        tone: 'pending',
        stages: productionStages.map((stage, index) => ({
          ...stage,
          completed: false,
          active: index === 0,
        })),
      },
    ]
  }

  if (metrics.productionClosed && metrics.excess > 0) {
    return [
      {
        id: 'ordered',
        label: 'Sipariş karşılandı',
        quantity: metrics.ordered,
        stageId: lastStage?.id || line.currentStageId,
        stageIndex: productionStages.length - 1,
        tone: 'finished',
        stages: productionStages.map((stage, index) => ({
          ...stage,
          completed: index < productionStages.length - 1,
          active: index === productionStages.length - 1,
        })),
      },
      {
        id: 'excess',
        label: 'Fazla üretim',
        quantity: metrics.excess,
        stageId: lastStage?.id || line.currentStageId,
        stageIndex: productionStages.length - 1,
        tone: 'excess',
        stages: productionStages.map((stage, index) => ({
          ...stage,
          completed: index < productionStages.length - 1,
          active: index === productionStages.length - 1,
        })),
      },
    ]
  }

  return [
    {
      id: 'active',
      label: metrics.produced > 0 ? 'Üretimde' : 'Planlanan',
      quantity: metrics.produced > 0 ? metrics.produced : metrics.ordered,
      stageId: line.currentStageId,
      stageIndex: activeIndex >= 0 ? activeIndex : 0,
      tone: 'active',
      stages: productionStages.map((stage, index) => ({
        ...stage,
        completed: activeIndex >= 0 && index < activeIndex,
        active: activeIndex >= 0 && index === activeIndex,
      })),
    },
  ]
}

function getLineMaxStageIndex(line, productionStages) {
  const tracks = getLineStageTracks(line, productionStages)
  let maxIndex = -1
  tracks.forEach((track) => {
    const idx =
      track.stageIndex >= 0
        ? track.stageIndex
        : productionStages.findIndex((item) => item.id === track.stageId)
    if (idx > maxIndex) maxIndex = idx
  })
  return maxIndex
}

export function getGlobalMinimalStageSteps(stageStats = []) {
  return stageStats.map((stage) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    count: stage.unitsReached,
    total: stage.totalOrdered,
    isActive: stage.isActive,
    isComplete: stage.isComplete,
    products: stage.productsReached || [],
  }))
}

export function getLineMinimalStageSteps(line, productionStages = []) {
  const progress = getLineStageProgress(line, productionStages)
  const maxIndex = getLineMaxStageIndex(line, productionStages)
  const productEntry = {
    id: line.id,
    name: line.product || 'Ürün',
    quantity: Number(line.quantity) || 0,
  }

  return progress.map((stage, stageIndex) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    count: stage.completed || stage.active ? 1 : 0,
    total: 1,
    isActive: stage.active,
    isComplete: stage.completed,
    products: maxIndex >= stageIndex ? [productEntry] : [],
  }))
}

export function getQuantityRowMinimalSteps(row, productionStages = []) {
  const progress = getQuantityRowStageProgress(row, productionStages)
  return progress.map((stage) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    count: stage.completed || stage.active ? 1 : 0,
    total: 1,
    isActive: stage.active,
    isComplete: stage.completed,
  }))
}

export function getLineMinimalTrackSteps(track, productionStages = []) {
  if (!track?.stages?.length) return []
  return track.stages.map((stage) => ({
    id: stage.id,
    label: stage.label,
    color: stage.color,
    count: stage.completed || stage.active ? 1 : 0,
    total: 1,
    isActive: stage.active,
    isComplete: stage.completed,
  }))
}

export function getJobStageStatsByQuantity(lineItems, productionStages) {
  const totalOrdered = lineItems.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) || 1
  const totalLineItems = lineItems.length

  return productionStages.map((stage, stageIndex) => {
    let unitsReached = 0
    let activeLines = 0
    const productsReached = []

    lineItems.forEach((line) => {
      const maxIndex = getLineMaxStageIndex(line, productionStages)
      const tracks = getLineStageTracks(line, productionStages)

      if (maxIndex >= stageIndex) {
        productsReached.push({
          id: line.id,
          name: line.product || 'Ürün',
          quantity: Number(line.quantity) || 0,
        })
      }

      tracks.forEach((track) => {
        const trackStageIndex =
          track.stageIndex >= 0
            ? track.stageIndex
            : productionStages.findIndex((item) => item.id === track.stageId)
        if (trackStageIndex >= stageIndex) {
          unitsReached += track.quantity
        }
        if (trackStageIndex === stageIndex) activeLines += 1
      })
    })

    return {
      ...stage,
      unitsReached,
      totalOrdered,
      totalLineItems,
      productsReached,
      pct: Math.min(100, Math.round((unitsReached / totalOrdered) * 100)),
      isActive: activeLines > 0,
      isComplete: unitsReached >= totalOrdered,
    }
  })
}

export function jobMatchesQuantityFilter(job, filter, stages = []) {
  if (!filter || filter === 'Tümü') return true
  const lineItems = ensureLineItems(job, stages)
  const metrics = getJobQuantityMetrics(lineItems)

  if (filter === 'Kısmi Teslimat') {
    return (
      lineItems.some((line) => getLineQuantityMetrics(line).hasPartialDelivery) ||
      job.status === 'Kısmi Teslimat'
    )
  }
  if (filter === 'Kalan Adet Var') {
    return lineItems.some((line) => {
      const m = getLineQuantityMetrics(line)
      return m.remaining > 0 && (m.produced > 0 || m.productionClosed)
    })
  }
  if (filter === 'Fazla Üretim') {
    return metrics.excess > 0 || metrics.linesWithExcess > 0
  }
  return true
}

export function deriveQuantityRowFulfillmentStatus(row, lineItem, productionStages = []) {
  if (lineItem?.productionClosed) {
    return row?.fulfillmentStatus || 'Devam Ediyor'
  }

  const stages = (productionStages || []).filter((stage) => stage?.id)
  if (!stages.length) return row?.fulfillmentStatus || 'Devam Ediyor'

  const ordered = getQuantityRowOrdered(row, lineItem)
  const produced = Math.max(0, Number(row?.producedQuantity) || 0)
  const delivered = Math.max(0, Number(row?.deliveredQuantity) || 0)
  const stageIndex = stages.findIndex((stage) => stage.id === row?.currentStageId)
  const resolvedIndex = stageIndex >= 0 ? stageIndex : 0
  const lastIndex = stages.length - 1
  const isAtLastStage = resolvedIndex >= lastIndex

  if (ordered > 0 && delivered >= ordered) {
    return 'Tamamlandı'
  }

  if (delivered > 0 && (ordered === 0 || delivered < ordered)) {
    return 'Kısmi Teslimat'
  }

  if (isAtLastStage) {
    if (ordered > 0 && produced < ordered) {
      return 'Kısmi Üretim Bitti'
    }
    if (ordered > 0 && produced >= ordered) {
      return 'Devam Ediyor'
    }
    if (ordered > 0) {
      return 'Kısmi Üretim Bitti'
    }
  }

  if (resolvedIndex > 0 || produced > 0 || delivered > 0) {
    return 'Devam Ediyor'
  }

  if (resolvedIndex <= 0 && produced === 0 && delivered === 0) {
    return 'Bekliyor'
  }

  return row?.fulfillmentStatus || 'Devam Ediyor'
}

export function withDerivedQuantityRowFulfillmentStatus(
  row,
  lineItem,
  productionStages,
  { skipDerive = false, timestamp = '' } = {},
) {
  // Manual DURUM selection must stick until the user changes it again.
  if (skipDerive || lineItem?.productionClosed || row?.fulfillmentStatusManual) return row

  const fulfillmentStatus = deriveQuantityRowFulfillmentStatus(row, lineItem, productionStages)
  if (fulfillmentStatus === row.fulfillmentStatus) return row

  return {
    ...row,
    fulfillmentStatus,
    statusUpdatedAt: timestamp || new Date().toLocaleString('tr-TR'),
  }
}

export function resolveProductionClosedStatus(line, productionStages) {
  const metrics = getLineQuantityMetrics(line)
  const lastStage = productionStages[productionStages.length - 1]

  if (
    metrics.delivered >= metrics.produced &&
    metrics.produced >= metrics.ordered &&
    metrics.excess === 0
  ) {
    return {
      fulfillmentStatus: metrics.delivered >= metrics.ordered ? 'Tamamlandı' : 'Kısmi Teslimat',
      currentStageId: lastStage?.id || line.currentStageId,
    }
  }
  if (metrics.hasExcess) {
    return {
      fulfillmentStatus: metrics.delivered > 0 ? 'Kısmi Teslimat' : 'Kısmi Üretim Bitti',
      currentStageId: lastStage?.id || line.currentStageId,
    }
  }
  if (metrics.hasShortfall || metrics.remaining > 0) {
    return {
      fulfillmentStatus: 'Kısmi Üretim Bitti',
      currentStageId: lastStage?.id || line.currentStageId,
    }
  }
  return {
    fulfillmentStatus: 'Kısmi Üretim Bitti',
    currentStageId: lastStage?.id || line.currentStageId,
  }
}

export function getLineVarianceLabel(metrics) {
  if (metrics.hasShortfall) {
    return `${formatQty(metrics.remaining)} adet kalan`
  }
  if (metrics.hasExcess) {
    return `+${formatQty(metrics.excess)} adet fazla`
  }
  if (metrics.hasRemaining) {
    return `${formatQty(metrics.remaining)} adet bekliyor`
  }
  if (metrics.produced === metrics.ordered && metrics.productionClosed) {
    return 'Tam karşılandı'
  }
  return null
}

export function resolveLineProductionFlowState(lineItem) {
  if (lineItem?.fulfillmentStatus === 'Tamamlandı') {
    return { label: 'Üretim Tamamlandı', tone: 'completed', shortLabel: 'Tamam' }
  }
  if (lineItem?.productionClosed) {
    return { label: 'Kapalı Üretim', tone: 'closed', shortLabel: 'Kapalı' }
  }
  return { label: 'Üretim Devam Ediyor', tone: 'continuing', shortLabel: 'Devam' }
}

const flowToneMeta = {
  continuing: {
    label: 'Üretim Devam Ediyor',
    shortLabel: 'Devam',
    colorClass: 'bg-blue-500',
    shellClass: 'border-blue-500/35 bg-blue-500/10 text-blue-300',
  },
  closed: {
    label: 'Kapalı Üretim',
    shortLabel: 'Kapalı',
    colorClass: 'bg-red-500',
    shellClass: 'border-red-500/45 bg-red-500/15 text-red-300',
  },
  completed: {
    label: 'Üretim Tamamlandı',
    shortLabel: 'Tamam',
    colorClass: 'bg-emerald-500',
    shellClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  },
}

const flowToneOrder = ['continuing', 'closed', 'completed']

export function getJobProductionFlowSegments(lineItems = []) {
  if (!lineItems.length) {
    return [
      {
        tone: 'continuing',
        label: flowToneMeta.continuing.label,
        shortLabel: flowToneMeta.continuing.shortLabel,
        colorClass: flowToneMeta.continuing.colorClass,
        shellClass: flowToneMeta.continuing.shellClass,
        count: 1,
        percent: 100,
      },
    ]
  }

  const counts = new Map()
  lineItems.forEach((lineItem) => {
    const { tone } = resolveLineProductionFlowState(lineItem)
    counts.set(tone, (counts.get(tone) || 0) + 1)
  })

  const total = lineItems.length
  return [...counts.entries()]
    .map(([tone, count]) => ({
      tone,
      label: flowToneMeta[tone].label,
      shortLabel: flowToneMeta[tone].shortLabel,
      colorClass: flowToneMeta[tone].colorClass,
      shellClass: flowToneMeta[tone].shellClass,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((left, right) => flowToneOrder.indexOf(left.tone) - flowToneOrder.indexOf(right.tone))
}

export function resolveJobProductionFlowBadge(lineItems = [], jobStatus = '') {
  if (!lineItems.length) {
    return { label: 'Üretim Devam Ediyor', tone: 'continuing' }
  }

  const allCompleted =
    jobStatus === 'Tamamlandı' || lineItems.every((line) => line.fulfillmentStatus === 'Tamamlandı')
  const anyClosed = lineItems.some((line) => line.productionClosed)

  if (allCompleted) {
    return { label: 'Üretim Tamamlandı', tone: 'completed' }
  }
  if (anyClosed) {
    return { label: 'Kapalı Üretim', tone: 'closed' }
  }
  return { label: 'Üretim Devam Ediyor', tone: 'continuing' }
}

/**
 * List-row progress: % across order line items' process advance.
 * Partial delivery never auto-completes; only explicit Tamamlandı → 100%.
 */
export function resolveJobProductionProgress(job, lineItems = [], productionStages = []) {
  const statusRaw = String(job?.status || '')
  if (/iptal/i.test(statusRaw)) {
    return { percent: 0, label: 'İptal', tone: 'cancel', stageCount: productionStages.length }
  }
  if (statusRaw === 'Tamamlandı' || /tamamland/i.test(statusRaw)) {
    return {
      percent: 100,
      label: 'Tamamlandı',
      tone: 'done',
      stageCount: productionStages.length,
    }
  }

  const lines = Array.isArray(lineItems) ? lineItems : []
  const stages = Array.isArray(productionStages) ? productionStages : []
  if (!lines.length) {
    return { percent: 0, label: 'Beklemede', tone: 'pending', stageCount: stages.length }
  }

  const lastIndex = Math.max(0, stages.length - 1)
  let anyStarted = false
  let allLinesFinished = true
  let progressSum = 0
  let maxStageIndex = 0

  lines.forEach((line) => {
    const rows = Array.isArray(line?.quantityRows) ? line.quantityRows : []
    const lineOrdered = Math.max(0, Number(line?.quantity) || 0)
    const lineDelivered = Math.max(
      0,
      Number(line?.deliveredQuantity) ||
        rows.reduce((sum, row) => sum + (Math.max(0, Number(row?.deliveredQuantity) || 0)), 0),
    )
    const lineProduced = Math.max(
      0,
      Number(line?.producedQuantity) ||
        rows.reduce((sum, row) => sum + (Math.max(0, Number(row?.producedQuantity) || 0)), 0),
    )
    const isPartial =
      lineOrdered > 0 && lineDelivered > 0 && lineDelivered < lineOrdered
    const rowStatuses = rows.map((row) => String(row?.fulfillmentStatus || ''))
    const closed =
      line?.productionClosed === true ||
      line?.fulfillmentStatus === 'Tamamlandı' ||
      /tamamland/i.test(String(line?.fulfillmentStatus || '')) ||
      (rows.length > 0 && rowStatuses.every((status) => /tamamland/i.test(status)))

    let stageIndex = stages.findIndex((stage) => stage.id === line?.currentStageId)
    rows.forEach((row) => {
      const idx = stages.findIndex((stage) => stage.id === row?.currentStageId)
      if (idx > stageIndex) stageIndex = idx
    })
    if (stageIndex < 0) stageIndex = 0
    if (stageIndex > maxStageIndex) maxStageIndex = stageIndex

    const started = closed || stageIndex > 0 || lineProduced > 0 || lineDelivered > 0
    if (started) anyStarted = true

    if (closed) {
      progressSum += 100
      return
    }

    if (!stages.length) {
      progressSum += started ? 50 : 0
      allLinesFinished = false
      return
    }

    if (stages.length === 1) {
      const singlePct = started ? (isPartial ? 90 : 100) : 0
      progressSum += singlePct
      if (!started || isPartial) allLinesFinished = false
      return
    }

    let linePct = Math.round((stageIndex / lastIndex) * 100)
    // Partial delivery: even last stage ("Depoda Hazır") must not fully complete the job.
    if (isPartial || (stageIndex >= lastIndex && lineDelivered < lineOrdered)) {
      const cap = Math.max(0, Math.round(((lastIndex - 0.15) / lastIndex) * 100))
      linePct = Math.min(linePct, cap)
      allLinesFinished = false
    } else if (stageIndex < lastIndex) {
      allLinesFinished = false
    }

    progressSum += linePct
  })

  const percent = Math.min(100, Math.round(progressSum / lines.length))

  if (!anyStarted) {
    return { percent: 0, label: 'Beklemede', tone: 'pending', stageCount: stages.length }
  }

  if (allLinesFinished && percent >= 100) {
    return {
      percent: 100,
      label: 'Devam ediyor',
      tone: 'active',
      stageCount: stages.length,
      stageIndex: maxStageIndex,
    }
  }

  return {
    percent,
    label: 'Devam ediyor',
    tone: 'active',
    stageCount: stages.length,
    stageIndex: maxStageIndex,
  }
}

export const PRODUCTION_STATE_FILTER_OPTIONS = [
  { label: 'Tümü', color: 'bg-gray-500' },
  { label: 'Devam Eden', color: 'bg-blue-500' },
  { label: 'Tamamlanan', color: 'bg-emerald-500' },
  { label: 'Beklemede', color: 'bg-gray-500' },
  { label: 'İptal', color: 'bg-red-500' },
  { label: 'Üretime Devam Edenler', color: 'bg-blue-500' },
  { label: 'Üretim Tamamlandı', color: 'bg-emerald-500' },
  { label: 'Depoya Gönderilenler', color: 'bg-orange-500' },
]

function jobIsWaiting(job, lineItems = []) {
  if (job?.status === 'Bekliyor') return true
  if (!lineItems.length) return false
  return lineItems.every(
    (line) =>
      line.fulfillmentStatus === 'Bekliyor' &&
      Math.max(0, Number(line.producedQuantity) || 0) === 0,
  )
}

function jobIsProductionComplete(job, lineItems = []) {
  if (job?.status === 'Tamamlandı') return true
  if (!lineItems.length) return false
  return lineItems.every((line) => line.fulfillmentStatus === 'Tamamlandı')
}

function jobIsCancelled(job) {
  return /iptal/i.test(String(job?.status || ''))
}

function jobHasDepoSentRows(job, stages = []) {
  const lineItems = ensureLineItems(job, stages)
  return lineItems.some((line) => (line.quantityRows || []).some((row) => Boolean(row.depoItemId)))
}

export function jobMatchesProductionStateFilter(job, filter, stages = []) {
  if (!filter || filter === 'Tümü') return true

  const lineItems = ensureLineItems(job, stages)
  const flow = resolveJobProductionFlowBadge(lineItems, job.status || '')

  if (filter === 'İptal') {
    return jobIsCancelled(job)
  }

  if (filter === 'Beklemede') {
    return jobIsWaiting(job, lineItems)
  }

  if (filter === 'Depoya Gönderilenler') {
    return jobHasDepoSentRows(job, stages)
  }

  if (filter === 'Tamamlanan' || filter === 'Üretim Tamamlandı') {
    return jobIsProductionComplete(job, lineItems) || flow.tone === 'completed'
  }

  if (filter === 'Devam Eden' || filter === 'Üretime Devam Edenler') {
    if (jobIsCancelled(job)) return false
    if (jobIsWaiting(job, lineItems)) return false
    if (jobIsProductionComplete(job, lineItems)) return false
    return (
      flow.tone === 'continuing' ||
      flow.tone === 'closed' ||
      ['Devam Ediyor', 'Kısmi Teslimat', 'Kısmi Üretim Bitti'].includes(job.status || '') ||
      lineItems.some((line) =>
        ['Devam Ediyor', 'Kısmi Teslimat', 'Kısmi Üretim Bitti'].includes(line.fulfillmentStatus),
      )
    )
  }

  return true
}
