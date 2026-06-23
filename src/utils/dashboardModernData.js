import { getCustomerProfiles, getArchivedCustomers } from '../data/customerProfiles'
import { loadOrders, orderTotals } from './ordersStore'
import { getTreasuryMovements, getCustomerLiveBalance } from './treasuryStore'
import { loadQuotes } from './quotesStore'
import { loadProductionJobs } from './productionStore'
import { loadTasks, loadAppointments, loadAgendaNotes } from './crmStore'
import { isTaskCompleted, isCrmProcessCompleted } from './crmProcessHelpers'
import { loadDepoItems } from './depoStore'
import { computeDepoLineTotals } from './depoHelpers'
import { isDepoItemDelivered } from './depoStageHelpers'
import { loadDepoWorkflowStages } from './depoWorkflowStages'
import { getQuoteStageOptions, getProductionStageOptions, loadWorkflowStages } from './workflowStages'
import { readLeads } from '../omnichannel/store'
import { getCustomerMetaSelection, readCustomerMeta, SUPPLIER_TYPE_LABEL } from './customerMeta'
import { documentTotals } from './documentTotals'

function dayKey(date) {
  return date.toISOString().slice(0, 10)
}

function monthKey(date) {
  return date.toISOString().slice(0, 7)
}

function parseMovementDate(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const parts = String(value).split('.')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

export function buildCashFlowSeries(dayCount = 30) {
  const movements = getTreasuryMovements()
  const end = new Date()
  const series = []

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date(end)
    date.setDate(date.getDate() - index)
    const key = dayKey(date)
    const dayMovements = movements.filter((movement) => parseMovementDate(movement.date) === key)
    const income = dayMovements
      .filter((movement) => movement.direction === 'in')
      .reduce((sum, movement) => sum + (Number(movement.amount) || 0), 0)
    const expense = dayMovements
      .filter((movement) => movement.direction === 'out')
      .reduce((sum, movement) => sum + (Number(movement.amount) || 0), 0)

    series.push({
      key,
      label: date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      income,
      expense,
      net: income - expense,
    })
  }

  return series
}

export function buildSalesPerformanceSeries(monthCount = 7) {
  const orders = loadOrders()
  const quotes = loadQuotes()
  const end = new Date()
  const series = []

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(end.getFullYear(), end.getMonth() - index, 1)
    const key = monthKey(date)
    const orderTotal = orders
      .filter((order) => parseMovementDate(order.createdAt || order.date)?.slice(0, 7) === key)
      .reduce((sum, order) => sum + (Number(order.amount) || documentTotals(order).grandTotal || 0), 0)
    const quoteTotal = quotes
      .filter((quote) => parseMovementDate(quote.createdAt || quote.date)?.slice(0, 7) === key)
      .reduce((sum, quote) => sum + (Number(quote.amount) || documentTotals(quote).grandTotal || 0), 0)

    series.push({
      key,
      label: date.toLocaleDateString('tr-TR', { month: 'short' }),
      sales: orderTotal,
      quotes: quoteTotal,
    })
  }

  return series
}

function buildSparkline(seed, direction = 1) {
  const points = []
  let value = 38 + (seed * 5.5)
  const waveA = 0.65 + (seed % 3) * 0.15
  const waveB = 1.1 + (seed % 4) * 0.2
  for (let index = 0; index < 16; index += 1) {
    const progress = index / 15
    const drift = progress * 14 * direction
    const wave = Math.sin((seed + index) * waveA) * 7 * direction
    const ripple = Math.cos((seed * 1.7 + index) * waveB) * 3.5
    value += wave + ripple + (index % 4 === 0 ? direction * 2.5 : -direction * 0.6) + drift * 0.35
    points.push(Math.max(10, Math.min(90, value)))
  }
  return points
}

function parseCurrencyValue(value) {
  if (typeof value === 'number') return value
  const normalized = String(value || '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  return Number(normalized) || 0
}

export function enrichFinanceCards(cards = []) {
  const movements = getTreasuryMovements()
  const thisMonth = monthKey(new Date())
  const prevMonthDate = new Date()
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1)
  const prevMonth = monthKey(prevMonthDate)

  return cards.slice(0, 8).map((card, index) => {
    const relatedMovements = movements.filter((movement) => {
      const label = `${card.label} ${card.sub || ''}`.toLocaleLowerCase('tr-TR')
      const type = String(movement.type || '').toLocaleLowerCase('tr-TR')
      if (card.id === 'cash') return type.includes('kasa') || type.includes('nakit')
      if (card.id === 'bank') return type.includes('banka')
      if (card.id === 'cheques') return type.includes('çek')
      if (card.id === 'orders') return type.includes('sipariş') || type.includes('satış')
      return label.includes(type) || type.includes(String(card.label || '').toLocaleLowerCase('tr-TR'))
    })

    const currentMonthTotal = relatedMovements
      .filter((movement) => parseMovementDate(movement.date)?.slice(0, 7) === thisMonth)
      .reduce((sum, movement) => sum + (Number(movement.amount) || 0), 0)
    const previousMonthTotal = relatedMovements
      .filter((movement) => parseMovementDate(movement.date)?.slice(0, 7) === prevMonth)
      .reduce((sum, movement) => sum + (Number(movement.amount) || 0), 0)

    let changePercent = 0
    if (previousMonthTotal > 0) {
      changePercent = Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
    } else if (currentMonthTotal > 0) {
      changePercent = 100
    } else {
      changePercent = [8, 12, -4, 6, 3, -2, 9, 5][index % 8]
    }

    const direction = changePercent >= 0 ? 1 : -1
    const numericValue = parseCurrencyValue(card.value)

    return {
      ...card,
      numericValue,
      changePercent,
      trendUp: changePercent >= 0,
      sparkline: buildSparkline(index, direction),
    }
  })
}

export const QUICK_ACTIONS = [
  {
    id: 'quote',
    label: 'Yeni Teklif',
    href: '/teklifler',
    tone: 'blue',
    surface: 'from-blue-500/10 via-blue-50 to-white',
    border: 'border-blue-100 hover:border-blue-200',
    text: 'text-blue-700',
    chip: 'bg-blue-500/10 text-blue-700',
    icon: 'file-text',
    createHref: '/teklifler?yeni=1',
  },
  {
    id: 'order',
    label: 'Yeni Sipariş',
    href: '/siparisler',
    tone: 'emerald',
    surface: 'from-emerald-500/10 via-emerald-50 to-white',
    border: 'border-emerald-100 hover:border-emerald-200',
    text: 'text-emerald-700',
    chip: 'bg-emerald-500/10 text-emerald-700',
    icon: 'cart',
    createHref: '/siparisler?yeni=1',
  },
  {
    id: 'production',
    label: 'Üretim Takibi',
    href: '/uretim',
    tone: 'fuchsia',
    surface: 'from-fuchsia-500/10 via-fuchsia-50 to-white',
    border: 'border-fuchsia-100 hover:border-fuchsia-200',
    text: 'text-fuchsia-700',
    chip: 'bg-fuchsia-500/10 text-fuchsia-700',
    icon: 'factory',
    createHref: '/uretim/yeni',
  },
  {
    id: 'customer',
    label: 'Müşteriler',
    href: '/musteriler',
    tone: 'cyan',
    surface: 'from-cyan-500/10 via-cyan-50 to-white',
    border: 'border-cyan-100 hover:border-cyan-200',
    text: 'text-cyan-700',
    chip: 'bg-cyan-500/10 text-cyan-700',
    icon: 'users',
    createHref: '/musteriler/yeni',
  },
  {
    id: 'supplier',
    label: 'Tedarikçiler',
    href: '/giderler/tedarikciler',
    tone: 'amber',
    surface: 'from-amber-500/10 via-amber-50 to-white',
    border: 'border-amber-100 hover:border-amber-200',
    text: 'text-amber-700',
    chip: 'bg-amber-500/10 text-amber-700',
    icon: 'handshake',
    createHref: '/musteriler/yeni?kind=supplier',
  },
  {
    id: 'stock',
    label: 'Stoklar',
    href: '/stok/urunler',
    tone: 'orange',
    surface: 'from-orange-500/10 via-orange-50 to-white',
    border: 'border-orange-100 hover:border-orange-200',
    text: 'text-orange-700',
    chip: 'bg-orange-500/10 text-orange-700',
    icon: 'warehouse',
    createHref: '/stok/urunler?yeni=1',
  },
]

const TERMINAL_STAGE_LABELS = new Set([
  'Olumsuz', 'Reddedildi', 'İptal', 'Onaylandı', 'Sipariş Alındı', 'Üretime Alındı', 'Tamamlandı',
])
const PENDING_STAGE_LABELS = new Set(['Taslak', 'Yeni Teklif', 'Bekliyor', 'Yeni', 'Beklemede'])

function resolveDocumentAmount(document) {
  return Number(document?.amount) || documentTotals(document).grandTotal || 0
}

export function formatQuickActionAmount(value) {
  const amount = Number(value) || 0
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')}M₺`
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString('tr-TR')}K₺`
  return `${Math.round(amount).toLocaleString('tr-TR')}₺`
}

function resolveProductionJobAmount(job, ordersById = {}) {
  if (job.orderId && ordersById[job.orderId]) {
    return resolveDocumentAmount(ordersById[job.orderId])
  }
  if (job.items?.length) return resolveDocumentAmount(job)
  const lineItems = (job.lineItems || []).map((line) => ({
    product: line.product,
    quantity: line.quantity,
    unitPrice: line.unitPrice || 0,
    vatRate: line.vatRate || 20,
  }))
  if (!lineItems.length) return 0
  return resolveDocumentAmount({ items: lineItems })
}

function emptyQuickActionStats() {
  return { pending: 0, ongoing: 0, completed: 0, pendingAmount: 0 }
}

function classifyQuoteStats() {
  const quotes = loadQuotes()
  const stages = getQuoteStageOptions(loadWorkflowStages())
  const firstStageId = stages[0]?.id
  return quotes.reduce((stats, quote) => {
    const stage = stages.find((item) => item.id === quote.currentStageId)
    const label = stage?.label || quote.status || ''
    const amount = resolveDocumentAmount(quote)
    if (TERMINAL_STAGE_LABELS.has(label) || ['Reddedildi', 'Tamamlandı', 'İptal'].includes(quote.status)) {
      stats.completed += 1
    } else if (quote.currentStageId === firstStageId || PENDING_STAGE_LABELS.has(label) || PENDING_STAGE_LABELS.has(quote.status)) {
      stats.pending += 1
      stats.pendingAmount += amount
    } else {
      stats.ongoing += 1
    }
    return stats
  }, emptyQuickActionStats())
}

function classifyProductionStats() {
  const jobs = loadProductionJobs()
  const ordersById = Object.fromEntries(loadOrders().map((order) => [order.id, order]))
  const stages = getProductionStageOptions(loadWorkflowStages())
  const firstStageId = stages[0]?.id

  return jobs.reduce((stats, job) => {
    const amount = resolveProductionJobAmount(job, ordersById)
    if (['Tamamlandı', 'İptal'].includes(job.status)) {
      stats.completed += 1
    } else if (
      ['Devam Ediyor', 'Üretimde'].includes(job.status)
      || (job.currentStageId && job.currentStageId !== firstStageId)
    ) {
      stats.ongoing += 1
    } else {
      stats.pending += 1
      stats.pendingAmount += amount
    }
    return stats
  }, emptyQuickActionStats())
}

function classifyOrderStats() {
  const orders = loadOrders()
  return orders.reduce((stats, order) => {
    const amount = orderTotals(order).grandTotal
    if (['Tamamlandı', 'İptal'].includes(order.status)) stats.completed += 1
    else if (order.status === 'Yeni') {
      stats.pending += 1
      stats.pendingAmount += amount
    }
    else stats.ongoing += 1
    return stats
  }, emptyQuickActionStats())
}

function classifyCustomerStats() {
  const customerMeta = readCustomerMeta()
  const movements = getTreasuryMovements()
  const isCustomer = (customer) => (
    getCustomerMetaSelection(customer, customerMeta[customer.id] || {}).type !== SUPPLIER_TYPE_LABEL
  )
  const pendingAmount = getCustomerProfiles()
    .filter(isCustomer)
    .reduce((sum, customer) => {
      const balance = getCustomerLiveBalance(customer, movements)
      return balance > 0 ? sum + balance : sum
    }, 0)

  return {
    pending: readLeads().length,
    ongoing: getCustomerProfiles().filter(isCustomer).length,
    completed: getArchivedCustomers().length,
    pendingAmount,
  }
}

function classifySupplierStats() {
  const customerMeta = readCustomerMeta()
  const isSupplier = (customer) => (
    getCustomerMetaSelection(customer, customerMeta[customer.id] || {}).type === SUPPLIER_TYPE_LABEL
  )
  const active = getCustomerProfiles().filter(isSupplier)
  const archived = getArchivedCustomers()
    .map((entry) => entry.customer)
    .filter(isSupplier)
  const pendingSuppliers = active.filter((supplier) => Number(supplier.payableDueAmount) > 0)

  return {
    pending: pendingSuppliers.length,
    ongoing: active.length - pendingSuppliers.length,
    completed: archived.length,
    pendingAmount: pendingSuppliers.reduce((sum, supplier) => sum + (Number(supplier.payableDueAmount) || 0), 0),
  }
}

function classifyDepoStats() {
  const items = loadDepoItems()
  const stages = loadDepoWorkflowStages()
  const firstStageId = stages[0]?.id
  return items.reduce((stats, item) => {
    const amount = computeDepoLineTotals(item).gross
    if (isDepoItemDelivered(item, stages)) stats.completed += 1
    else if (item.currentStageId === firstStageId) {
      stats.pending += 1
      stats.pendingAmount += amount
    }
    else stats.ongoing += 1
    return stats
  }, emptyQuickActionStats())
}

const QUICK_ACTION_STATS = {
  quote: classifyQuoteStats,
  production: classifyProductionStats,
  order: classifyOrderStats,
  customer: classifyCustomerStats,
  supplier: classifySupplierStats,
  stock: classifyDepoStats,
}

export function buildQuickActionCards() {
  return QUICK_ACTIONS.map((action) => {
    let stats = emptyQuickActionStats()
    try {
      stats = (QUICK_ACTION_STATS[action.id] || (() => stats))()
    } catch {
      // Bozuk localStorage verisi uygulamayı düşürmesin.
    }
    return { ...action, stats }
  })
}

function isRecentRecord(value, days = 7) {
  const iso = parseMovementDate(value)
  if (!iso) return false
  const today = new Date()
  const created = new Date(`${iso}T12:00:00`)
  const diff = (today - created) / 86400000
  return diff >= 0 && diff <= days
}

function isAppointmentCompleted(appointment) {
  if (appointment.status === 'Tamamlandı' || appointment.status === 'İptal') return true
  return isCrmProcessCompleted(appointment, 'appointment')
}

function isAppointmentOngoing(appointment) {
  if (isAppointmentCompleted(appointment)) return false
  const today = new Date().toISOString().slice(0, 10)
  if (['Devam Ediyor', 'Onaylandı', 'Takipte'].includes(appointment.status)) return true
  return appointment.date >= today
}

function isTaskOngoing(task) {
  if (isTaskCompleted(task)) return false
  return ['Devam Ediyor', 'Takipte', 'Hazırlanıyor'].includes(task.status)
}

export function buildCrmActivitySummary() {
  const tasks = loadTasks()
  const appointments = loadAppointments().filter((item) => item.status !== 'İptal')
  const notes = loadAgendaNotes()

  const categories = [
    {
      id: 'task',
      label: 'Görevler',
      href: '/crm/gorevler',
      tone: 'violet',
      surface: 'from-violet-500/10 via-violet-50 to-white',
      border: 'border-violet-100',
      text: 'text-violet-700',
      chip: 'bg-violet-500/10 text-violet-700',
      icon: 'clipboard',
      newCount: tasks.filter((item) => isRecentRecord(item.createdAt)).length,
      ongoingCount: tasks.filter(isTaskOngoing).length,
      completedCount: tasks.filter(isTaskCompleted).length,
    },
    {
      id: 'appointment',
      label: 'Randevular',
      href: '/crm/randevular',
      tone: 'blue',
      surface: 'from-blue-500/10 via-blue-50 to-white',
      border: 'border-blue-100',
      text: 'text-blue-700',
      chip: 'bg-blue-500/10 text-blue-700',
      icon: 'calendar',
      newCount: appointments.filter((item) => isRecentRecord(item.createdAt || item.date)).length,
      ongoingCount: appointments.filter(isAppointmentOngoing).length,
      completedCount: appointments.filter(isAppointmentCompleted).length,
    },
    {
      id: 'note',
      label: 'Notlar',
      href: '/crm',
      tone: 'amber',
      surface: 'from-amber-500/10 via-amber-50 to-white',
      border: 'border-amber-100',
      text: 'text-amber-700',
      chip: 'bg-amber-500/10 text-amber-700',
      icon: 'note',
      newCount: notes.filter((item) => isRecentRecord(item.createdAt || item.date)).length,
      ongoingCount: notes.filter((item) => !item.completed).length,
      completedCount: notes.filter((item) => item.completed).length,
    },
  ]

  const totals = categories.reduce((summary, category) => ({
    new: summary.new + category.newCount,
    ongoing: summary.ongoing + category.ongoingCount,
    completed: summary.completed + category.completedCount,
  }), { new: 0, ongoing: 0, completed: 0 })

  const recentItems = [
    ...tasks.map((item) => ({
      id: item.id,
      kind: 'task',
      title: item.title,
      subtitle: item.customer || 'Görev',
      href: '/crm/gorevler',
      tone: 'violet',
      date: item.dueDate || item.createdAt,
      state: isTaskCompleted(item) ? 'completed' : isTaskOngoing(item) ? 'ongoing' : 'new',
    })),
    ...appointments.map((item) => ({
      id: item.id,
      kind: 'appointment',
      title: item.title,
      subtitle: item.customer || item.type || 'Randevu',
      href: '/crm/randevular',
      tone: 'blue',
      date: item.date || item.createdAt,
      state: isAppointmentCompleted(item) ? 'completed' : isAppointmentOngoing(item) ? 'ongoing' : 'new',
    })),
    ...notes.map((item) => ({
      id: item.id,
      kind: 'note',
      title: item.title || item.content?.slice(0, 60) || 'Not',
      subtitle: 'Ajanda notu',
      href: '/crm',
      tone: 'amber',
      date: item.date || item.createdAt,
      state: item.completed ? 'completed' : 'ongoing',
    })),
  ]
    .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')))
    .slice(0, 6)

  return { categories, totals, recentItems }
}
