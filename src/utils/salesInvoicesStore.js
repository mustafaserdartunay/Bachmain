import { createCustomerSalesInvoice, getTreasuryMovements } from './treasuryStore'

const STORAGE_KEY = 'erlenbox-sales-invoices'

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    return JSON.parse(saved) ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('erlenbox:sales-invoices-updated'))
}

function todayIso() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function daysBetween(fromIso, toIsoDate = todayIso()) {
  const from = new Date(`${fromIso}T12:00:00`)
  const to = new Date(`${toIsoDate}T12:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  return Math.floor((to.getTime() - from.getTime()) / 86400000)
}

function createId() {
  return `SINV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function normalizeInvoice(raw = {}) {
  const totalAmount = Math.max(0, Number(raw.totalAmount ?? raw.amount) || 0)
  const collectedAmount = Math.min(totalAmount, Math.max(0, Number(raw.collectedAmount) || 0))
  const remainingAmount = Math.max(0, totalAmount - collectedAmount)
  const dueDate = raw.dueDate || raw.issueDate || todayIso()
  const overdueDays = remainingAmount > 0 ? Math.max(0, daysBetween(dueDate)) : 0

  return {
    id: raw.id || createId(),
    title: String(raw.title || 'Satış Faturaları').trim(),
    invoiceNo: String(raw.invoiceNo || raw.docNo || '').trim(),
    customerId: raw.customerId || '',
    customerName: String(raw.customerName || '').trim(),
    issueDate: raw.issueDate || raw.date || todayIso(),
    dueDate,
    totalAmount,
    collectedAmount,
    remainingAmount,
    overdueDays,
    invoiceKind: raw.invoiceKind === 'a-fatura' ? 'a-fatura' : 'e-fatura',
    status: raw.status || (remainingAmount <= 0 ? 'collected' : 'approved'),
    description: raw.description || '',
    source: raw.source || 'manual',
  }
}

function syncTreasuryInvoices(invoices) {
  const movements = getTreasuryMovements().filter((item) => item.type === 'Satış Faturası')
  const byDocNo = new Map(invoices.map((item) => [item.invoiceNo, item]))
  let changed = false

  movements.forEach((movement) => {
    const docNo = String(movement.docNo || '').trim()
    if (!docNo || byDocNo.has(docNo)) return
    invoices.unshift(
      normalizeInvoice({
        id: movement.id,
        title: 'Satış Faturaları',
        invoiceNo: docNo,
        customerId: movement.customerId || '',
        customerName: movement.customerName || '',
        issueDate: movement.date || todayIso(),
        dueDate: movement.dueDate || movement.date || todayIso(),
        totalAmount: movement.amount,
        collectedAmount: 0,
        invoiceKind: 'e-fatura',
        status: 'approved',
        description: movement.description || '',
        source: 'treasury',
      }),
    )
    changed = true
  })

  return changed ? invoices : null
}

export function readSalesInvoices() {
  let invoices = readJson(STORAGE_KEY, null)
  if (!Array.isArray(invoices)) {
    invoices = []
    writeJson(STORAGE_KEY, invoices)
    return []
  }

  const synced = syncTreasuryInvoices([...invoices.map(normalizeInvoice)])
  if (synced) {
    writeJson(STORAGE_KEY, synced)
    return synced
  }

  return invoices.map(normalizeInvoice)
}

export function saveSalesInvoices(items) {
  writeJson(STORAGE_KEY, items.map(normalizeInvoice))
}

export function upsertSalesInvoice(partial) {
  const invoices = readSalesInvoices()
  const normalized = normalizeInvoice(partial)
  const index = invoices.findIndex(
    (item) =>
      item.id === normalized.id ||
      (normalized.invoiceNo && item.invoiceNo === normalized.invoiceNo),
  )

  if (index >= 0) {
    invoices[index] = normalizeInvoice({ ...invoices[index], ...partial })
  } else {
    invoices.unshift(normalized)
  }

  saveSalesInvoices(invoices)
  return normalizeInvoice(invoices[index >= 0 ? index : 0])
}

export function recordInvoiceCollection(invoiceId, amount) {
  const invoices = readSalesInvoices()
  const index = invoices.findIndex((item) => item.id === invoiceId)
  if (index < 0) return null

  const current = invoices[index]
  const nextCollected = Math.min(
    current.totalAmount,
    current.collectedAmount + Math.max(0, Number(amount) || 0),
  )
  invoices[index] = normalizeInvoice({
    ...current,
    collectedAmount: nextCollected,
    status: nextCollected >= current.totalAmount ? 'collected' : current.status,
  })
  saveSalesInvoices(invoices)
  return invoices[index]
}

export function deleteSalesInvoice(invoiceId) {
  const invoices = readSalesInvoices().filter((item) => item.id !== invoiceId)
  saveSalesInvoices(invoices)
}

export function createSalesInvoice({
  title = 'Satış Faturaları',
  invoiceNo,
  customerId,
  customerName,
  issueDate,
  dueDate,
  totalAmount,
  invoiceKind = 'e-fatura',
  status = 'approved',
  description = '',
  syncTreasury = true,
}) {
  const normalizedNo = String(invoiceNo || '').trim() || `SF-${Date.now().toString().slice(-6)}`
  const amount = Math.max(0, Number(totalAmount) || 0)

  if (syncTreasury && amount > 0 && customerName) {
    createCustomerSalesInvoice({
      customerName,
      customerId,
      amount,
      docNo: normalizedNo,
      date: issueDate || todayIso(),
      dueDate: dueDate || issueDate || todayIso(),
      description: description || `${title} ${normalizedNo}`,
    })
  }

  return upsertSalesInvoice({
    title,
    invoiceNo: normalizedNo,
    customerId,
    customerName,
    issueDate: issueDate || todayIso(),
    dueDate: dueDate || issueDate || todayIso(),
    totalAmount: amount,
    collectedAmount: 0,
    invoiceKind,
    status,
    description,
  })
}

export function getSalesInvoiceStats(invoices = readSalesInvoices()) {
  const totalRecords = invoices.length
  const grandTotal = invoices.reduce((sum, item) => sum + item.totalAmount, 0)
  const remainingTotal = invoices.reduce((sum, item) => sum + item.remainingAmount, 0)
  const collectedTotal = invoices.reduce((sum, item) => sum + item.collectedAmount, 0)
  const overdueCount = invoices.filter(
    (item) => item.remainingAmount > 0 && item.overdueDays > 0,
  ).length

  return {
    totalRecords,
    grandTotal,
    remainingTotal,
    collectedTotal,
    overdueCount,
  }
}

export function formatInvoiceDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Taslak',
  approved: 'Onaylandı',
  sent: 'Gönderildi',
  collected: 'Tahsil edildi',
}

export const INVOICE_KIND_LABELS = {
  'e-fatura': 'E-FATURA',
  'a-fatura': 'A-FATURA',
}
