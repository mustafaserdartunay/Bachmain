const STORAGE_KEY = 'bach-label-quote-segment-tabs'
export const QUOTE_SEGMENT_TABS_EVENT = 'bach:quote-segment-tabs-updated'

export const DEFAULT_QUOTE_SEGMENTS = [
  { id: 'quote', label: 'Teklif Süreci', sourceId: 'quote', builtIn: true },
  { id: 'quoteStatus', label: 'Teklif Durumu', sourceId: 'quoteStatus', builtIn: true },
]

function normalizeLabel(label) {
  return String(label || '').trim()
}

function normalizeTabs(tabs) {
  return (Array.isArray(tabs) ? tabs : [])
    .filter((segment) => segment?.id && normalizeLabel(segment.label))
    .map((segment) => ({
      ...segment,
      label: normalizeLabel(segment.label),
      sourceId: segment.sourceId || segment.id,
      builtIn: Boolean(segment.builtIn),
    }))
}

export function quoteSegmentSource(tab) {
  return tab?.sourceId || tab?.id || 'quote'
}

export function isQuoteStatusSegment(tab) {
  return quoteSegmentSource(tab) === 'quoteStatus'
}

export function readQuoteSegmentTabs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    const normalized = normalizeTabs(saved)
    if (normalized.length) return normalized
  } catch {
    // localStorage kapalıysa varsayılan sekmeleri kullan.
  }
  return DEFAULT_QUOTE_SEGMENTS.map((segment) => ({ ...segment }))
}

export function saveQuoteSegmentTabs(tabs) {
  const next = normalizeTabs(tabs)
  const stored = next.length ? next : DEFAULT_QUOTE_SEGMENTS.map((segment) => ({ ...segment }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // localStorage kapalıysa sadece event yayınlanır.
  }
  window.dispatchEvent(new CustomEvent(QUOTE_SEGMENT_TABS_EVENT, { detail: stored }))
  return stored
}
