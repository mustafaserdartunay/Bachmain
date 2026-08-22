import { defaultQuoteStages, initialQuotes } from '../data/quotesData'
import { nextQuoteCode } from './documentCodes'
import { getQuoteStageOptions, loadWorkflowStages } from './workflowStages'
import {
  softDeleteRecord,
  restoreDeletedRecord,
  permanentlyDeleteRecord,
} from './deletedRecordsStore'
import { withQuotePreparedBy, getActiveUserLabel } from './quotePreparedBy'
import { readUserProfile } from './userProfile'

const STORAGE_KEY = 'erlenbox-quotes'
const DELETED_COLLECTION = 'quotes'

function normalizeQuoteStages(quote) {
  const stages = loadWorkflowStages()
  const quoteStages = getQuoteStageOptions(stages)
  let currentStageId = quote.currentStageId
  if (!currentStageId || !quoteStages.some((stage) => stage.id === currentStageId)) {
    currentStageId = quoteStages[0]?.id || ''
  }

  return {
    ...quote,
    stages,
    currentStageId,
  }
}

export function loadQuotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialQuotes.map(normalizeQuoteStages)
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed)
      ? parsed.map(normalizeQuoteStages)
      : initialQuotes.map(normalizeQuoteStages)
  } catch {
    return initialQuotes.map(normalizeQuoteStages)
  }
}

export function saveQuotes(quotes, { silent = false } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
    if (!silent) {
      window.dispatchEvent(new CustomEvent('bach:quotes-updated'))
    }
    return true
  } catch {
    return false
  }
}

export function softDeleteQuote(quote) {
  if (!quote?.id) return null
  const quotes = loadQuotes()
  const existing = quotes.find((item) => item.id === quote.id) || quote
  const next = quotes.filter((item) => item.id !== quote.id)
  if (!saveQuotes(next)) return null
  const profile = readUserProfile()
  const deletedBy = getActiveUserLabel() || profile?.displayName || profile?.email || ''
  softDeleteRecord(DELETED_COLLECTION, existing, {
    entityLabel: existing.customer || existing.title || existing.id || 'Teklif',
    deletedBy,
    lastRestoredAt: existing.lastRestoredFromDeletedAt || '',
  })
  return existing
}

export function restoreDeletedQuote(quoteId) {
  const record = restoreDeletedRecord(DELETED_COLLECTION, quoteId)
  if (!record) return null
  const restoredAt = new Date().toISOString()
  const restoredRecord = normalizeQuoteStages(
    withQuotePreparedBy({
      ...record,
      lastRestoredFromDeletedAt: restoredAt,
      activities: [
        ...(record.activities || []),
        {
          id: `act-${Date.now()}`,
          date: new Date().toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          text: 'Silinenlerden geri yüklendi.',
        },
      ],
    }),
  )
  const quotes = loadQuotes()
  if (quotes.some((item) => item.id === restoredRecord.id)) {
    const next = quotes.map((item) => (item.id === restoredRecord.id ? restoredRecord : item))
    saveQuotes(next)
    return restoredRecord
  }
  saveQuotes([restoredRecord, ...quotes])
  return restoredRecord
}

export function permanentlyDeleteQuote(quoteId) {
  return permanentlyDeleteRecord(DELETED_COLLECTION, quoteId)
}

function createEmptyQuoteItem(product = '', quantity = 1, unitPrice = 0, vatRate = 20) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    product,
    description: '',
    extraDescription: '',
    quantity: Number(quantity) || 1,
    unitPrice: Number(unitPrice) || 0,
    vatRate: Number(vatRate ?? 20),
    lineImage: '',
    showDescription: true,
  }
}

export function createVoiceQuote(payload = {}) {
  const quotes = loadQuotes()
  const nextId = nextQuoteCode(quotes.map((quote) => quote.id))
  const today = new Date()
  const createdAt = today.toISOString().slice(0, 10)
  const validUntil = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10)

  const items =
    (payload.items || []).length > 0
      ? payload.items.map((item) =>
          createEmptyQuoteItem(
            item.product || item.name || '',
            item.quantity,
            item.unitPrice ?? item.price,
            item.vatRate,
          ),
        )
      : [createEmptyQuoteItem()]

  const quote = withQuotePreparedBy({
    ...(initialQuotes[0] || {}),
    id: nextId,
    title: payload.title || '',
    customer: payload.customer || '',
    contact: payload.contact || '',
    email: payload.email || '',
    phone: payload.phone || '',
    owner: payload.owner || '',
    status: 'Taslak',
    priority: 'Normal',
    source: 'Sesli Asistan',
    tags: ['sesli-asistan'],
    notes: payload.notes || '',
    termsDescription: '',
    terms: [],
    createdAt,
    validUntil,
    currentStageId: getQuoteStageOptions(loadWorkflowStages())[0]?.id || '',
    stages: loadWorkflowStages(),
    items,
    activities: [
      {
        id: `act-${Date.now()}`,
        date: new Date().toLocaleString('tr-TR'),
        text: 'Sesli asistan ile teklif oluşturuldu.',
      },
    ],
  })

  saveQuotes([quote, ...quotes.filter((item) => item.id !== quote.id)])
  return quote
}

export function readVoiceQuoteOpenId() {
  return sessionStorage.getItem('erlenbox-voice-open-quote')
}

export function clearVoiceQuoteOpenId() {
  sessionStorage.removeItem('erlenbox-voice-open-quote')
}
