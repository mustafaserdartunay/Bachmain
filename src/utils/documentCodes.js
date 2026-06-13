import { initialQuotes } from '../data/quotesData'
import { detailedOrders } from '../data/ordersData'
import { loadProductionJobs } from './productionStore'

const QUOTES_STORAGE_KEY = 'erlenbox-quotes'
const ORDERS_STORAGE_KEY = 'erlenbox-orders'
const CODE_LENGTH = 5
const CODE_START = 10001
export const QUOTE_CODE_START = 20000

export function parseDocumentCode(value) {
  const str = String(value || '').trim()
  if (/^\d{5}$/.test(str)) return Number(str)
  const trailing = str.match(/-(\d+)\s*$/)?.[1]
  if (trailing) {
    const num = Number(trailing)
    return Number.isFinite(num) ? num : 0
  }
  const digits = str.replace(/\D/g, '')
  if (!digits) return 0
  if (digits.length <= 5) return Number(digits)
  return Number(digits.slice(-5))
}

function readStoredDocumentIds(storageKey, fallbackItems = []) {
  if (typeof window === 'undefined') {
    return fallbackItems.map((item) => item.id).filter(Boolean)
  }
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return fallbackItems.map((item) => item.id).filter(Boolean)
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return fallbackItems.map((item) => item.id).filter(Boolean)
    return parsed.map((item) => item.id).filter(Boolean)
  } catch {
    return fallbackItems.map((item) => item.id).filter(Boolean)
  }
}

export function collectAllDocumentCodeValues(extraIds = []) {
  const ids = [
    ...readStoredDocumentIds(QUOTES_STORAGE_KEY, initialQuotes),
    ...readStoredDocumentIds(ORDERS_STORAGE_KEY, detailedOrders),
    ...loadProductionJobs().flatMap((item) => [item.id, item.orderId]),
    ...extraIds.filter(Boolean),
  ]
  return ids.map(parseDocumentCode).filter((value) => value > 0)
}

export function sanitizeQuoteCode(value) {
  return String(value || '').replace(/\D/g, '')
}

export function isValidQuoteCode(value) {
  const code = sanitizeQuoteCode(value)
  return code.length > 0 && /^\d+$/.test(code)
}

export function nextDocumentCode(extraIds = []) {
  const values = collectAllDocumentCodeValues(extraIds)
  const max = values.length > 0 ? Math.max(...values) : CODE_START - 1
  const next = Math.min(max + 1, 10 ** CODE_LENGTH - 1)
  return String(next).padStart(CODE_LENGTH, '0')
}

function parseQuoteCode(value) {
  const digits = String(value || '').replace(/\D/g, '')
  const num = Number(digits)
  return Number.isFinite(num) && num > 0 ? num : 0
}

function collectQuoteCodeValues(extraIds = []) {
  const ids = [
    ...readStoredDocumentIds(QUOTES_STORAGE_KEY, initialQuotes),
    ...extraIds.filter(Boolean),
  ]
  return ids.map(parseQuoteCode).filter((value) => value >= QUOTE_CODE_START)
}

export function nextQuoteCode(extraIds = []) {
  const values = collectQuoteCodeValues(extraIds)
  const max = values.length > 0 ? Math.max(...values) : QUOTE_CODE_START - 1
  return String(max + 1)
}

export function resolveQuoteCode(quoteId, extraIds = []) {
  const stored = sanitizeQuoteCode(quoteId)
  if (stored) return stored
  return nextQuoteCode(extraIds)
}

export function formatDocumentCode(value) {
  const parsed = parseDocumentCode(value)
  return parsed > 0 ? String(parsed).padStart(CODE_LENGTH, '0') : String(value || '')
}
