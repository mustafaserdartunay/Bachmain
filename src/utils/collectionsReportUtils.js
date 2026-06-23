import { getTreasuryMovements } from './treasuryStore'
import { readSalesInvoices } from './salesInvoicesStore'

export const AGING_BUCKETS = [
  { id: 'unplanned', label: 'Planlanmamış', color: '#94a3b8' },
  { id: 'current', label: 'Güncel', color: '#3b82f6' },
  { id: 'd1_30', label: '1-30 Gün Gecikmiş', color: '#eab308' },
  { id: 'd31_60', label: '31-60 Gün Gecikmiş', color: '#f97316' },
  { id: 'd61_90', label: '61-90 Gün Gecikmiş', color: '#fb923c' },
  { id: 'd91_120', label: '91-120 Gün Gecikmiş', color: '#f87171' },
  { id: 'd120p', label: '120+ Gün Gecikmiş', color: '#ef4444' },
]

function parseIso(value) {
  if (!value) return null
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function todayIso() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function daysPastDue(dueDate, reference = todayIso()) {
  const due = parseIso(dueDate)
  const ref = parseIso(reference)
  if (!due || !ref) return 0
  return Math.max(0, Math.floor((ref.getTime() - due.getTime()) / 86400000))
}

function resolveAgingBucket(invoice) {
  if (invoice.remainingAmount <= 0) return null
  if (!invoice.dueDate) return 'unplanned'

  const overdue = daysPastDue(invoice.dueDate)
  if (overdue === 0) return 'current'
  if (overdue <= 30) return 'd1_30'
  if (overdue <= 60) return 'd31_60'
  if (overdue <= 90) return 'd61_90'
  if (overdue <= 120) return 'd91_120'
  return 'd120p'
}

export function getOpenReceivables(invoices = readSalesInvoices()) {
  return invoices.filter((item) => item.remainingAmount > 0)
}

export function aggregateAgingBuckets(invoices = readSalesInvoices()) {
  const openItems = getOpenReceivables(invoices)
  const bucketMap = Object.fromEntries(AGING_BUCKETS.map((bucket) => [bucket.id, { amount: 0, count: 0 }]))

  openItems.forEach((invoice) => {
    const bucketId = resolveAgingBucket(invoice)
    if (!bucketId) return
    bucketMap[bucketId].amount += invoice.remainingAmount
    bucketMap[bucketId].count += 1
  })

  return AGING_BUCKETS.map((bucket) => ({
    ...bucket,
    amount: bucketMap[bucket.id].amount,
    count: bucketMap[bucket.id].count,
  }))
}

export function getCollectionsSummary(invoices = readSalesInvoices()) {
  const openItems = getOpenReceivables(invoices)
  const aging = aggregateAgingBuckets(invoices)

  const unplannedAmount = aging.find((item) => item.id === 'unplanned')?.amount || 0
  const overdueAmount = openItems
    .filter((item) => daysPastDue(item.dueDate) > 0)
    .reduce((sum, item) => sum + item.remainingAmount, 0)

  const treasuryCollections = getTreasuryMovements().filter((item) => item.type === 'Müşteri Tahsilatı')
  const treasuryTotal = treasuryCollections.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const invoiceCollectedTotal = invoices.reduce((sum, item) => sum + item.collectedAmount, 0)
  const totalCollected = Math.max(treasuryTotal, invoiceCollectedTotal)

  const overdueItems = openItems.filter((item) => daysPastDue(item.dueDate) > 0)
  const avgOverdueDays = overdueItems.length
    ? Math.round(overdueItems.reduce((sum, item) => sum + daysPastDue(item.dueDate), 0) / overdueItems.length)
    : 0

  return {
    unplannedAmount,
    overdueAmount,
    totalCollected,
    avgOverdueDays,
  }
}

function normalizeTreasuryDate(value) {
  if (!value) return todayIso()
  const raw = String(value)
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (trMatch) return `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`
  return raw.slice(0, 10)
}

export function buildCollectionRows(invoices = readSalesInvoices()) {
  const treasuryRows = getTreasuryMovements()
    .filter((item) => item.type === 'Müşteri Tahsilatı')
    .map((item) => ({
      id: item.id,
      collectionDate: normalizeTreasuryDate(item.date),
      documentDate: normalizeTreasuryDate(item.docDate || item.date),
      partyName: item.customerName || item.description || 'Müşteri',
      documentType: item.method === 'Çek' ? 'Çek' : 'Satış Faturası',
      amount: Number(item.amount) || 0,
      source: 'treasury',
    }))

  if (treasuryRows.length > 0) {
    return treasuryRows.sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))
  }

  return invoices
    .filter((item) => item.collectedAmount > 0)
    .map((item) => ({
      id: `col-${item.id}`,
      collectionDate: item.issueDate,
      documentDate: item.issueDate,
      partyName: item.customerName || 'Müşteri',
      documentType: 'Satış Faturası',
      amount: item.collectedAmount,
      source: 'invoice',
      invoiceNo: item.invoiceNo,
    }))
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate))
}

export function formatCollectionDate(iso) {
  const date = parseIso(iso)
  if (!date) return '—'
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
