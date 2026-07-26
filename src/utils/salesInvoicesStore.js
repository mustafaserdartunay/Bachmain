import { getCustomerProfiles } from '../data/customerProfiles'
import { createCustomerSalesInvoice, getTreasuryMovements } from './treasuryStore'
import { readEInvoiceSettings } from './eInvoiceSettingsStore'

const STORAGE_KEY = 'erlenbox-sales-invoices'
export const SALES_INVOICES_EVENT = 'erlenbox:sales-invoices-updated'

/** @type {Map<string, number[]>} */
const pipelineTimers = new Map()

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
  window.dispatchEvent(new CustomEvent(SALES_INVOICES_EVENT))
}

function todayIso() {
  const date = new Date()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function nowIso() {
  return new Date().toISOString()
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

function normalizeInvoiceKind(raw) {
  const value = String(raw || '').toLowerCase()
  if (value === 'a-fatura' || value === 'afatura') return 'a-fatura'
  if (value === 'e-arsiv' || value === 'earsiv' || value === 'e_arsiv') return 'e-arsiv'
  return 'e-fatura'
}

function normalizeLines(rawLines) {
  if (!Array.isArray(rawLines)) return []
  return rawLines.map((line, index) => ({
    id: line.id || `line-${index}`,
    description: String(line.description || '').trim(),
    quantity: Math.max(0, Number(line.quantity) || 0),
    unitPrice: Math.max(0, Number(line.unitPrice) || 0),
    vat: Math.max(0, Number(line.vat) || 0),
  }))
}

function normalizeInvoice(raw = {}) {
  const totalAmount = Math.max(0, Number(raw.totalAmount ?? raw.amount) || 0)
  const collectedAmount = Math.min(totalAmount, Math.max(0, Number(raw.collectedAmount) || 0))
  const remainingAmount = Math.max(0, totalAmount - collectedAmount)
  const dueDate = raw.dueDate || raw.issueDate || todayIso()
  const overdueDays = remainingAmount > 0 ? Math.max(0, daysBetween(dueDate)) : 0
  const gibStatus = raw.gibStatus || 'idle'
  const emailStatus = raw.emailStatus || 'idle'

  return {
    id: raw.id || createId(),
    title: String(raw.title || 'Satış Faturaları').trim(),
    invoiceNo: String(raw.invoiceNo || raw.docNo || '').trim(),
    customerId: raw.customerId || '',
    customerName: String(raw.customerName || '').trim(),
    customerEmail: String(raw.customerEmail || '').trim(),
    issueDate: raw.issueDate || raw.date || todayIso(),
    dueDate,
    totalAmount,
    collectedAmount,
    remainingAmount,
    overdueDays,
    invoiceKind: normalizeInvoiceKind(raw.invoiceKind),
    status: raw.status || (remainingAmount <= 0 ? 'collected' : 'approved'),
    description: raw.description || '',
    source: raw.source || 'manual',
    lines: normalizeLines(raw.lines),
    gibStatus,
    gibStatusAt: raw.gibStatusAt || '',
    gibUuid: raw.gibUuid || '',
    gibMessage: raw.gibMessage || '',
    emailStatus,
    emailStatusAt: raw.emailStatusAt || '',
    emailMessage: raw.emailMessage || '',
    issuedAt: raw.issuedAt || '',
  }
}

function buildSeedInvoices() {
  const customers = getCustomerProfiles().slice(0, 8)
  const names = [
    'Mazlum Çikolata San. ve Tic. Ltd. Şti.',
    'Teslim Edilen - 5800',
    'Satış Faturaları',
    'Özel Baskılı Kraft Kutu',
    'Oluklu Mukavva Siparişi',
    'Proforma Teklif Faturası',
    'İhracat Satış Faturası',
    'Perakende Satış',
  ]

  const baseDate = new Date()
  return names.map((title, index) => {
    const customer = customers[index % customers.length]
    const issue = new Date(baseDate)
    issue.setDate(issue.getDate() - index * 4)
    const due = new Date(issue)
    due.setDate(due.getDate() + 15)
    const totalAmount = [20353.2, 5800, 12450, 8900, 45600, 3200, 156780, 980][index] || 5000
    const collected = index === 2 || index === 6 ? totalAmount : index === 5 ? totalAmount * 0.4 : 0
    const invoiceNo = index % 3 === 0 ? `AB020260000000${33 - index}` : ''
    const kind = index === 1 ? 'a-fatura' : index === 3 ? 'e-arsiv' : 'e-fatura'

    return normalizeInvoice({
      id: `SINV-SEED-${index + 1}`,
      title,
      invoiceNo,
      customerId: customer?.id || '',
      customerName: customer?.company || customer?.companyTitle || title,
      customerEmail: customer?.email || '',
      issueDate: issue.toISOString().slice(0, 10),
      dueDate: due.toISOString().slice(0, 10),
      totalAmount,
      collectedAmount: collected,
      invoiceKind: kind,
      status: collected >= totalAmount ? 'collected' : index === 4 ? 'draft' : 'approved',
      description: `${title} · ${customer?.company || 'Müşteri'}`,
      source: 'seed',
      gibStatus: index === 0 ? 'sent' : 'idle',
      emailStatus: index === 0 ? 'opened' : 'idle',
    })
  })
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
  if (!Array.isArray(invoices) || invoices.length === 0) {
    invoices = buildSeedInvoices()
    writeJson(STORAGE_KEY, invoices)
    return invoices.map(normalizeInvoice)
  }

  const synced = syncTreasuryInvoices([...invoices.map(normalizeInvoice)])
  if (synced) {
    writeJson(STORAGE_KEY, synced)
    return synced
  }

  return invoices.map(normalizeInvoice)
}

export function getSalesInvoiceById(invoiceId) {
  return readSalesInvoices().find((item) => item.id === invoiceId) || null
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
  clearInvoicePipeline(invoiceId)
  const invoices = readSalesInvoices().filter((item) => item.id !== invoiceId)
  saveSalesInvoices(invoices)
}

export function createSalesInvoice({
  title = 'Satış Faturaları',
  invoiceNo,
  customerId,
  customerName,
  customerEmail = '',
  issueDate,
  dueDate,
  totalAmount,
  invoiceKind = 'e-fatura',
  status = 'approved',
  description = '',
  lines = [],
  syncTreasury = true,
  gibStatus = 'idle',
  emailStatus = 'idle',
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
    customerEmail,
    issueDate: issueDate || todayIso(),
    dueDate: dueDate || issueDate || todayIso(),
    totalAmount: amount,
    collectedAmount: 0,
    invoiceKind,
    status,
    description,
    lines,
    gibStatus,
    emailStatus,
  })
}

function clearInvoicePipeline(invoiceId) {
  const timers = pipelineTimers.get(invoiceId)
  if (!timers) return
  timers.forEach((id) => window.clearTimeout(id))
  pipelineTimers.delete(invoiceId)
}

function patchInvoiceLive(invoiceId, partial) {
  const invoices = readSalesInvoices()
  const index = invoices.findIndex((item) => item.id === invoiceId)
  if (index < 0) return null
  invoices[index] = normalizeInvoice({ ...invoices[index], ...partial })
  saveSalesInvoices(invoices)
  return invoices[index]
}

/**
 * Faturayı GİB'e keser ve canlı durum pipeline'ını başlatır.
 */
export function issueSalesInvoiceToGib(invoiceId, options = {}) {
  const settings = readEInvoiceSettings()
  const invoice = getSalesInvoiceById(invoiceId)
  if (!invoice) return null

  clearInvoicePipeline(invoiceId)

  const gibUuid = invoice.gibUuid || `GIB-${Date.now().toString(36).toUpperCase()}`
  const kindLabel = invoice.invoiceKind === 'e-arsiv' ? 'e-Arşiv' : 'e-Fatura'

  const started = patchInvoiceLive(invoiceId, {
    status: 'sending',
    gibStatus: 'sending',
    gibStatusAt: nowIso(),
    gibUuid,
    gibMessage: `${kindLabel} GİB API'ye iletiliyor…`,
    emailStatus: settings.emailTrackingEnabled ? 'idle' : invoice.emailStatus,
    emailMessage: settings.emailTrackingEnabled ? '' : invoice.emailMessage,
    issuedAt: nowIso(),
    customerEmail: options.customerEmail || invoice.customerEmail,
  })

  if (!settings.simulateLivePipeline && settings.gibApiMode !== 'demo') {
    return started
  }

  const timers = []
  const schedule = (delay, partial) => {
    timers.push(
      window.setTimeout(() => {
        patchInvoiceLive(invoiceId, partial)
      }, delay),
    )
  }

  schedule(settings.gibSendingMs, {
    gibStatus: 'sending',
    gibStatusAt: nowIso(),
    gibMessage: 'GİB bağlantısı kuruluyor…',
    status: 'sending',
  })

  schedule(settings.gibPendingMs, {
    gibStatus: 'pending',
    gibStatusAt: nowIso(),
    gibMessage: 'GİB yanıtı bekleniyor…',
    status: 'pending',
  })

  schedule(settings.gibSentMs, {
    gibStatus: 'sent',
    gibStatusAt: nowIso(),
    gibMessage: `${kindLabel} GİB'e başarıyla gönderildi.`,
    status: 'sent',
  })

  if (settings.emailTrackingEnabled) {
    const email = options.customerEmail || invoice.customerEmail || 'musteri@ornek.com'
    schedule(settings.emailQueuedMs, {
      emailStatus: 'queued',
      emailStatusAt: nowIso(),
      emailMessage: `Fatura e-postası kuyruğa alındı → ${email}`,
      customerEmail: email,
    })
    schedule(settings.emailInTransitMs, {
      emailStatus: 'in_transit',
      emailStatusAt: nowIso(),
      emailMessage: 'E-posta yolda…',
    })
    schedule(settings.emailDeliveredMs, {
      emailStatus: 'delivered',
      emailStatusAt: nowIso(),
      emailMessage: 'E-posta müşteri kutusuna ulaştı.',
    })
    schedule(settings.emailOpenedMs, {
      emailStatus: 'opened',
      emailStatusAt: nowIso(),
      emailMessage: 'Müşteri e-postayı açtı.',
    })
  }

  pipelineTimers.set(invoiceId, timers)
  return started
}

/**
 * Taslak/kayıt oluşturup GİB kesme akışını başlatır.
 */
export function createAndIssueSalesInvoice(payload) {
  const settings = readEInvoiceSettings()
  const kind = normalizeInvoiceKind(payload.invoiceKind || settings.defaultInvoiceKind)
  const series = kind === 'e-arsiv' ? settings.eArsivSeries : settings.eFaturaSeries
  const invoiceNo =
    String(payload.invoiceNo || '').trim() || `${series}${Date.now().toString().slice(-8)}`

  const invoice = createSalesInvoice({
    ...payload,
    invoiceNo,
    invoiceKind: kind,
    status: 'draft',
    gibStatus: 'idle',
    emailStatus: 'idle',
    syncTreasury: payload.syncTreasury !== false,
  })

  return issueSalesInvoiceToGib(invoice.id, {
    customerEmail: payload.customerEmail || invoice.customerEmail,
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

export function formatStatusTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Taslak',
  approved: 'Onaylandı',
  sending: 'Gönderiliyor',
  pending: 'Beklemede',
  sent: 'Gönderildi',
  collected: 'Tahsil edildi',
}

export const INVOICE_KIND_LABELS = {
  'e-fatura': 'E-FATURA',
  'e-arsiv': 'E-ARŞİV',
  'a-fatura': 'A-FATURA',
}

export const GIB_STATUS_LABELS = {
  idle: 'Hazır',
  sending: 'Gönderiliyor',
  pending: 'Beklemede',
  sent: 'Gönderildi',
  failed: 'Hata',
}

export const EMAIL_STATUS_LABELS = {
  idle: 'Bekliyor',
  queued: 'Kuyrukta',
  in_transit: 'Yolda',
  delivered: 'Ulaştı',
  opened: 'Açıldı',
  failed: 'Hata',
}
