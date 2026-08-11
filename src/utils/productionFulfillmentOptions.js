import { normalizeOptionList } from './customerMeta'
import { loadProductionJobs, saveProductionJobs } from './productionStore'

const STORAGE_KEY = 'erlenbox-production-fulfillment-options'

export const DEFAULT_PART_DELIVERY_SITUATIONS = [
  { label: 'Devam Ediyor', color: 'bg-blue-500' },
  { label: 'Kısmi Üretim', color: 'bg-orange-500' },
  { label: 'Depoda Hazır', color: 'bg-violet-500' },
  { label: 'Tamamlandı', color: 'bg-emerald-500' },
]

export function loadPartDeliverySituations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return normalizeOptionList(DEFAULT_PART_DELIVERY_SITUATIONS)
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return normalizeOptionList(DEFAULT_PART_DELIVERY_SITUATIONS)
    }
    const migrated = parsed.map((option) => {
      if (!option || typeof option !== 'object') return option
      if (option.label === 'Kısmi Teslimat') return { ...option, label: 'Kısmi Üretim' }
      return option
    })
    return normalizeOptionList(migrated)
  } catch {
    return normalizeOptionList(DEFAULT_PART_DELIVERY_SITUATIONS)
  }
}

function savePartDeliverySituations(options) {
  const normalized = normalizeOptionList(options)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

function migrateProductionFulfillmentLabels(previousOptions, nextOptions) {
  const nextLabels = new Set(nextOptions.map((option) => option.label))
  const renames = new Map()
  previousOptions.forEach((prev) => {
    const next = nextOptions.find((option) => option.id === prev.id)
    if (next && next.label !== prev.label) renames.set(prev.label, next.label)
  })

  const fallbackLabel = nextOptions.find((option) => option.label === 'Devam Ediyor')?.label
    || nextOptions[0]?.label
    || 'Devam Ediyor'

  function resolveLabel(label) {
    if (!label) return fallbackLabel
    if (nextLabels.has(label)) return label
    if (renames.has(label)) return renames.get(label)
    return fallbackLabel
  }

  const jobs = loadProductionJobs().map((job) => {
    const lineItems = (job.lineItems || []).map((line) => {
      const quantityRows = (line.quantityRows || []).map((row) => ({
        ...row,
        fulfillmentStatus: resolveLabel(row.fulfillmentStatus),
      }))
      const lastRowStatus = quantityRows[quantityRows.length - 1]?.fulfillmentStatus
      return {
        ...line,
        quantityRows,
        fulfillmentStatus: resolveLabel(lastRowStatus || line.fulfillmentStatus),
      }
    })

    const statuses = lineItems.map((line) => line.fulfillmentStatus || fallbackLabel)
    let status = job.status || fallbackLabel
    if (statuses.every((item) => item === 'Tamamlandı')) status = 'Tamamlandı'
    else if (statuses.some((item) => item === 'Kısmi Üretim' || item === 'Kısmi Teslimat')) status = 'Kısmi Üretim'
    else if (statuses.some((item) => item === 'Kısmi Üretim Bitti')) status = 'Kısmi Üretim Bitti'
    else if (statuses.some((item) => item === 'Bekliyor')) status = 'Bekliyor'
    else status = resolveLabel(status)

    return { ...job, lineItems, status }
  })

  saveProductionJobs(jobs)
}

export function publishPartDeliverySituations(nextOptions) {
  const previous = loadPartDeliverySituations()
  const saved = savePartDeliverySituations(nextOptions)
  migrateProductionFulfillmentLabels(previous, saved)
  window.dispatchEvent(new CustomEvent('bach:production-fulfillment-updated'))
  return saved
}

export function getLineFulfillmentOptions() {
  return loadPartDeliverySituations()
}

export function resolveFulfillmentLabel(label, options = loadPartDeliverySituations()) {
  if (!label) return ''
  if (label === 'Kısmi Teslimat') {
    const partial = options.find((option) => option.label === 'Kısmi Üretim')
    if (partial) return partial.label
  }
  if (options.some((option) => option.label === label)) return label
  return label
}

export function isKnownFulfillmentLabel(label, options = loadPartDeliverySituations()) {
  const resolved = resolveFulfillmentLabel(label, options)
  return options.some((option) => option.label === resolved)
}
