import { readSalesInvoices } from './salesInvoicesStore'

const VAT_MULTIPLIER = 1.2

const INVOICE_KIND_COLORS = {
  'E-FATURA': '#3b82f6',
  'E-ARŞİV': '#8b5cf6',
  'A-FATURA': '#ef4444',
  KATEGORİSİZ: '#6b7280',
  'GİB-FATURA': '#a855f7',
}

const CUSTOMER_CATEGORY_COLORS = {
  KATEGORİSİZ: '#6b7280',
  Ambalaj: '#3b82f6',
  Gıda: '#10b981',
  Tekstil: '#a855f7',
  Kozmetik: '#ec4899',
  Elektronik: '#06b6d4',
  'GÖRÜŞME SAĞLANDI - OLUMLU': '#22c55e',
  'GÖRÜŞME SAĞLANDI - OLUMSUZ': '#ef4444',
  'GÖRÜŞME YAPILACAK': '#f97316',
  'GÖRÜŞME YAPILDI - BEKLEMEDE': '#38bdf8',
}

const PRODUCT_CATEGORY_COLORS = {
  KATEGORİSİZ: '#6b7280',
  'Kraft Kutular': '#f59e0b',
  'Oluklu Kutular': '#f97316',
  'Premium Kutular': '#a855f7',
  'E-Ticaret Kutuları': '#06b6d4',
  'Gıda Ambalaj': '#10b981',
  'Baskılı Kutular': '#3b82f6',
  'Çikolata Kutusu': '#eab308',
  'Çerçeveli Orta Kanvas': '#22c55e',
  'Dubai Kutusu': '#8b5cf6',
}

function parseIso(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function filterInvoicesByRange(invoices, dateFrom, dateTo) {
  return invoices.filter((item) => {
    const issue = item.issueDate || ''
    if (dateFrom && issue < dateFrom) return false
    if (dateTo && issue > dateTo) return false
    return true
  })
}

function amountWithVat(amount, includeVat) {
  const base = Math.max(0, Number(amount) || 0)
  return includeVat ? base * VAT_MULTIPLIER : base
}

function mapToPieSlices(groups, colorMap, limit = 5) {
  const entries = Object.entries(groups)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  const top = entries.slice(0, limit)
  const rest = entries.slice(limit)
  const slices = top.map(([name, value]) => ({
    name,
    value,
    color: colorMap[name] || '#64748b',
  }))

  if (rest.length > 0) {
    slices.push({
      name: `+${rest.length} Kategori`,
      value: rest.reduce((sum, [, value]) => sum + value, 0),
      color: '#475569',
    })
  }

  return slices
}

export function aggregateInvoiceCategories(invoices, includeVat = true) {
  const groups = {
    'E-FATURA': 0,
    'E-ARŞİV': 0,
    'A-FATURA': 0,
    KATEGORİSİZ: 0,
    'GİB-FATURA': 0,
  }

  invoices.forEach((invoice) => {
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    if (invoice.invoiceKind === 'e-fatura') groups['E-FATURA'] += amount
    else if (invoice.invoiceKind === 'e-arsiv') groups['E-ARŞİV'] += amount
    else if (invoice.invoiceKind === 'a-fatura') groups['A-FATURA'] += amount
    else groups.KATEGORİSİZ += amount
  })

  return mapToPieSlices(groups, INVOICE_KIND_COLORS)
}

export function aggregateCustomerCategories(invoices, customerMetaById, includeVat = true) {
  const groups = {}

  invoices.forEach((invoice) => {
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    const category = customerMetaById[invoice.customerId]?.category || 'KATEGORİSİZ'
    groups[category] = (groups[category] || 0) + amount
  })

  if (Object.keys(groups).length === 0) {
    groups.KATEGORİSİZ = 0
  }

  return mapToPieSlices(groups, CUSTOMER_CATEGORY_COLORS, 5)
}

function resolveProductCategory(title = '') {
  const lower = String(title).toLowerCase()
  if (lower.includes('çikolata')) return 'Çikolata Kutusu'
  if (lower.includes('kraft')) return 'Kraft Kutular'
  if (lower.includes('oluklu')) return 'Oluklu Kutular'
  if (lower.includes('dubai')) return 'Dubai Kutusu'
  if (lower.includes('canvas') || lower.includes('kanvas')) return 'Çerçeveli Orta Kanvas'
  if (lower.includes('premium')) return 'Premium Kutular'
  if (lower.includes('e-ticaret')) return 'E-Ticaret Kutuları'
  if (lower.includes('baskı')) return 'Baskılı Kutular'
  return 'KATEGORİSİZ'
}

export function aggregateProductCategories(invoices, includeVat = true) {
  const groups = { KATEGORİSİZ: 0 }

  invoices.forEach((invoice) => {
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    const category = resolveProductCategory(invoice.title)
    groups[category] = (groups[category] || 0) + amount
  })

  return mapToPieSlices(groups, PRODUCT_CATEGORY_COLORS, 5)
}

function bucketKey(date, granularity) {
  if (!date) return '—'
  const year = date.getFullYear()
  const month = date.getMonth()
  if (granularity === 'year') return String(year)
  if (granularity === 'month') {
    return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    const week = Math.ceil(date.getDate() / 7)
    return `H${week} ${date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })}`
  }
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export function aggregateSalesTimeline(invoices, granularity = 'month', includeVat = true) {
  const buckets = new Map()

  invoices.forEach((invoice) => {
    const date = parseIso(invoice.issueDate)
    if (!date) return
    const key = bucketKey(date, granularity)
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    buckets.set(key, (buckets.get(key) || 0) + amount)
  })

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
}

export function aggregateByCustomer(invoices, includeVat = true) {
  const map = new Map()
  invoices.forEach((invoice) => {
    const key = invoice.customerName || 'Bilinmeyen'
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    map.set(key, (map.get(key) || 0) + amount)
  })
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export function aggregateByProduct(invoices, includeVat = true) {
  const map = new Map()
  invoices.forEach((invoice) => {
    const key = resolveProductCategory(invoice.title)
    const amount = amountWithVat(invoice.totalAmount, includeVat)
    map.set(key, (map.get(key) || 0) + amount)
  })
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
}

export function getReportInvoices() {
  return readSalesInvoices()
}

export function formatReportRangeLabel(dateFrom, dateTo) {
  const format = (iso) => {
    const date = parseIso(iso)
    if (!date) return '—'
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (dateFrom && dateTo) return `${format(dateFrom)} - ${format(dateTo)}`
  if (dateFrom) return format(dateFrom)
  return 'Tüm dönem'
}
