const STORAGE_KEY = 'bach-label-quote-segment-tabs'
const CUSTOM_LISTS_KEY = 'bach-quote-segment-custom-lists'
export const QUOTE_SEGMENT_TABS_EVENT = 'bach:quote-segment-tabs-updated'
export const QUOTE_CUSTOM_LISTS_EVENT = 'bach:quote-segment-custom-lists-updated'

export const DEFAULT_QUOTE_SEGMENTS = [
  { id: 'quote', label: 'Teklif Süreci', sourceId: 'quote', builtIn: true, kind: 'workflow' },
  { id: 'quoteStatus', label: 'Teklif Durumu', sourceId: 'quoteStatus', builtIn: true, kind: 'status' },
]

function normalizeLabel(label) {
  return String(label || '').trim()
}

function inferKind(segment) {
  if (segment?.kind === 'status' || segment?.kind === 'workflow') return segment.kind
  const source = segment?.sourceId || segment?.id || ''
  if (source === 'quoteStatus' || String(source).startsWith('quote-custom')) return 'status'
  return 'workflow'
}

function normalizeTabs(tabs) {
  return (Array.isArray(tabs) ? tabs : [])
    .filter((segment) => segment?.id && normalizeLabel(segment.label))
    .map((segment) => ({
      ...segment,
      label: normalizeLabel(segment.label),
      sourceId: segment.sourceId || segment.id,
      builtIn: Boolean(segment.builtIn),
      kind: inferKind(segment),
    }))
}

export function quoteSegmentSource(tab) {
  return tab?.sourceId || tab?.id || 'quote'
}

export function isQuoteWorkflowSegment(tab) {
  return quoteSegmentSource(tab) === 'quote'
}

export function isQuoteStatusSegment(tab) {
  return quoteSegmentSource(tab) === 'quoteStatus'
}

export function isQuoteCustomStatusSegment(tab) {
  if (!tab) return false
  const source = quoteSegmentSource(tab)
  if (source === 'quoteStatus' || source === 'quote') return false
  return tab.kind === 'status' || String(source).startsWith('quote-custom')
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

export function readQuoteCustomLists() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_LISTS_KEY) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(
      Object.entries(saved).filter(([, options]) => Array.isArray(options)),
    )
  } catch {
    return {}
  }
}

export function saveQuoteCustomList(sourceId, options) {
  const key = String(sourceId || '').trim()
  if (!key) return readQuoteCustomLists()
  const all = { ...readQuoteCustomLists(), [key]: Array.isArray(options) ? options : [] }
  try {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(all))
  } catch {
    // localStorage kapalıysa sadece event yayınlanır.
  }
  window.dispatchEvent(new CustomEvent(QUOTE_CUSTOM_LISTS_EVENT, { detail: all }))
  return all
}

export function deleteQuoteCustomList(sourceId) {
  const key = String(sourceId || '').trim()
  const all = { ...readQuoteCustomLists() }
  if (!key || !(key in all)) return all
  delete all[key]
  try {
    localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(all))
  } catch {
    // localStorage kapalıysa sadece event yayınlanır.
  }
  window.dispatchEvent(new CustomEvent(QUOTE_CUSTOM_LISTS_EVENT, { detail: all }))
  return all
}

export function quoteCustomListOptions(lists, tab) {
  if (!isQuoteCustomStatusSegment(tab)) return []
  const source = quoteSegmentSource(tab)
  const options = lists?.[source]
  return Array.isArray(options) ? options : []
}

export function quoteSegmentFieldValue(quote, tab) {
  const source = quoteSegmentSource(tab)
  return quote?.segmentFieldValues?.[source] || ''
}
