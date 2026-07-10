import { getCustomerProfiles } from '../data/customerProfiles'
import { detailedOrders } from '../data/ordersData'
import { loadPersonnel } from './personnelStore'
import { fullName } from './personnelHelpers'
import { getCustomerMetaSelection, readCustomerMeta, SUPPLIER_TYPE_LABEL } from './customerMeta'
import { getTreasuryAccounts, getTreasuryMovements } from './treasuryStore'
import { loadRecurringPayments } from './recurringPaymentsStore'
import { formatCurrency } from '../data/mockData'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function parsePaymentDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parts = String(value).split('.')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function daysUntil(dateIso) {
  if (!dateIso) return 0
  const today = new Date(`${todayIso()}T12:00:00`)
  const target = new Date(`${dateIso}T12:00:00`)
  return Math.round((target - today) / 86400000)
}

function formatDueDateLabel(dateIso) {
  if (!dateIso) return ''
  const [year, month, day] = dateIso.split('-')
  if (!year || !month || !day) return ''
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`
}

function formatDateLabel(dateIso) {
  return formatDueDateLabel(dateIso)
}

function nextMonthlyDate(dayOfMonth, from = new Date()) {
  const safeDay = Math.min(Math.max(Number(dayOfMonth) || 1, 1), 28)
  const year = from.getFullYear()
  const month = from.getMonth()
  let candidate = new Date(year, month, safeDay, 12)
  const todayStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12)
  if (candidate < todayStart) {
    candidate = new Date(year, month + 1, safeDay, 12)
  }
  return candidate.toISOString().slice(0, 10)
}

function buildPaymentAlert({
  id,
  category,
  title,
  subtitle,
  date,
  amount = 0,
  recurring = false,
  link = '/kasa',
  flow = 'out',
}) {
  const dateIso = parsePaymentDate(date)
  if (!dateIso) return null
  const diff = daysUntil(dateIso)
  const overdue = diff < 0
  const dueToday = diff === 0
  let urgency = 'future'
  if (overdue) urgency = 'overdue'
  else if (dueToday) urgency = 'today'
  else if (diff <= 7) urgency = 'soon'
  else if (diff <= 15) urgency = 'week2'
  return {
    id,
    category,
    title,
    subtitle,
    date: dateIso,
    dateLabel: formatDueDateLabel(dateIso),
    amount: Number(amount) || 0,
    recurring,
    overdue,
    dueToday,
    daysUntil: diff,
    urgency,
    link,
    flow,
  }
}

function collectRecurringPaymentAlerts() {
  return loadRecurringPayments()
    .filter((item) => item.active !== false)
    .map((item) => {
      const dueDate = item.interval === 'monthly'
        ? nextMonthlyDate(item.dayOfMonth)
        : parsePaymentDate(item.dueDate) || nextMonthlyDate(item.dayOfMonth)
      const isSupplier = item.category === 'Tedarikçi Ödemesi' || Boolean(item.vendorName)
      return buildPaymentAlert({
        id: `recurring-${item.id}`,
        category: item.category || 'Tekrarlayan Ödeme',
        title: item.title,
        subtitle: item.subtitle || item.vendorName || item.category || 'Tekrarlayan ödeme',
        date: dueDate,
        amount: item.amount,
        recurring: true,
        link: isSupplier ? '/suppliers' : '/kasa',
        flow: 'out',
      })
    })
    .filter(Boolean)
}

function collectRecurringReceivableAlerts() {
  return loadRecurringPayments()
    .filter((item) => item.active !== false)
    .filter((item) => String(item.category || '').toLowerCase().includes('tahsilat'))
    .map((item) => {
      const dueDate = item.interval === 'monthly'
        ? nextMonthlyDate(item.dayOfMonth)
        : parsePaymentDate(item.dueDate) || nextMonthlyDate(item.dayOfMonth)
      return buildPaymentAlert({
        id: `recurring-recv-${item.id}`,
        category: 'Tekrarlayan Tahsilat',
        title: item.title,
        subtitle: item.subtitle || item.vendorName || 'Tekrarlayan tahsilat',
        date: dueDate,
        amount: item.amount,
        recurring: true,
        link: '/musteriler',
        flow: 'in',
      })
    })
    .filter(Boolean)
}

function collectChequePaymentAlerts() {
  const alerts = []
  getTreasuryAccounts().forEach((account) => {
    const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
    entries.forEach((entry) => {
      if (entry.direction !== 'out') return
      const dueDate = parsePaymentDate(entry.chequeDueDate)
      if (!dueDate) return
      const isSupplier = entry.partyType === SUPPLIER_TYPE_LABEL
      alerts.push(buildPaymentAlert({
        id: `cheque-${entry.id || `${account.id}-${entry.chequeNo}`}`,
        category: isSupplier ? 'Tedarikçi Ödemesi' : 'Çek Ödemesi',
        title: entry.partyName || entry.chequeOwner || 'Çek ödemesi',
        subtitle: [entry.chequeBank, entry.chequeNo].filter(Boolean).join(' · ') || account.name,
        date: dueDate,
        amount: Math.abs(Number(entry.amount) || 0),
        link: isSupplier ? '/suppliers' : '/kasa',
        flow: 'out',
      }))
    })
  })
  return alerts.filter(Boolean)
}

function collectChequeReceivableAlerts() {
  const alerts = []
  getTreasuryAccounts().forEach((account) => {
    const entries = Array.isArray(account.chequeEntries) ? account.chequeEntries : []
    entries.forEach((entry) => {
      if (entry.direction !== 'in' || entry.collected) return
      const dueDate = parsePaymentDate(entry.chequeDueDate)
      if (!dueDate) return
      alerts.push(buildPaymentAlert({
        id: `cheque-in-${entry.id || `${account.id}-${entry.chequeNo}`}`,
        category: 'Alacak',
        title: entry.partyName || entry.chequeOwner || 'Çek tahsilatı',
        subtitle: [entry.chequeBank, entry.chequeNo].filter(Boolean).join(' · ') || account.name,
        date: dueDate,
        amount: Math.abs(Number(entry.amount) || 0),
        link: '/kasa',
        flow: 'in',
      }))
    })
  })
  return alerts.filter(Boolean)
}

function collectSalaryPaymentAlerts() {
  return loadPersonnel()
    .filter((employee) => ['Aktif', 'Deneme Süreci', 'İzinli'].includes(employee.status))
    .map((employee) => {
      const paymentDay = Number(employee.salary?.paymentDay) || 1
      return buildPaymentAlert({
        id: `salary-${employee.id}`,
        category: 'Maaş Ödemesi',
        title: `Maaş · ${fullName(employee)}`,
        subtitle: [employee.department, employee.position].filter(Boolean).join(' · ') || 'Personel maaşı',
        date: nextMonthlyDate(paymentDay),
        amount: Number(employee.salary?.base) || 0,
        recurring: true,
        link: '/personel',
        flow: 'out',
      })
    })
    .filter(Boolean)
}

function collectPlannedMovementAlerts() {
  const customerMeta = readCustomerMeta()
  return getTreasuryMovements()
    .filter((movement) => movement.direction === 'out')
    .filter((movement) => {
      const status = String(movement.status || 'İşlendi')
      return status === 'Bekliyor' || status === 'Planlandı' || Boolean(movement.dueDate)
    })
    .map((movement) => {
      const dueDate = parsePaymentDate(movement.dueDate) || parsePaymentDate(movement.date)
      const profile = getCustomerProfiles().find((customer) => (
        customer.company === movement.vendorName
        || customer.company === movement.customerName
      ))
      const partyType = profile
        ? getCustomerMetaSelection(profile, customerMeta[profile.id] || {}).type
        : ''
      const isSupplier = partyType === SUPPLIER_TYPE_LABEL || Boolean(movement.vendorName)
      const isGeneralExpense = movement.type === 'Gider Ödemesi'
        && (movement.category === 'Genel Gider' || !movement.vendorName)
      const category = isGeneralExpense
        ? 'Genel Gider'
        : isSupplier
          ? 'Tedarikçi Ödemesi'
          : 'Ödeme'
      return buildPaymentAlert({
        id: `movement-${movement.id}`,
        category,
        title: movement.description || movement.type || 'Planlı ödeme',
        subtitle: movement.vendorName || movement.customerName || movement.accountName || movement.method || '',
        date: dueDate,
        amount: Number(movement.amount) || 0,
        link: isSupplier ? '/suppliers' : '/kasa',
        flow: 'out',
      })
    })
    .filter(Boolean)
}

function collectIncomingMovementAlerts() {
  return getTreasuryMovements()
    .filter((movement) => movement.direction === 'in')
    .filter((movement) => {
      const status = String(movement.status || 'İşlendi')
      return status === 'Bekliyor' || status === 'Planlandı' || Boolean(movement.dueDate)
    })
    .map((movement) => {
      const dueDate = parsePaymentDate(movement.dueDate) || parsePaymentDate(movement.date)
      return buildPaymentAlert({
        id: `in-movement-${movement.id}`,
        category: 'Tahsilat',
        title: movement.description || movement.type || 'Planlı tahsilat',
        subtitle: movement.customerName || movement.accountName || movement.method || '',
        date: dueDate,
        amount: Number(movement.amount) || 0,
        link: movement.customerId ? `/musteriler/${movement.customerId}` : '/kasa',
        flow: 'in',
      })
    })
    .filter(Boolean)
}

function collectSalesInvoiceReceivableAlerts() {
  return getTreasuryMovements()
    .filter((movement) => movement.type === 'Satış Faturası')
    .filter((movement) => parsePaymentDate(movement.dueDate))
    .map((movement) => buildPaymentAlert({
      id: `invoice-recv-${movement.id}`,
      category: 'Alacak',
      title: movement.description || `Satış faturası ${movement.docNo || ''}`.trim(),
      subtitle: movement.customerName || 'Müşteri alacağı',
      date: movement.dueDate,
      amount: Number(movement.amount) || 0,
      link: movement.customerId ? `/musteriler/${movement.customerId}` : '/musteriler',
      flow: 'in',
    }))
    .filter(Boolean)
}

function collectOrderReceivableAlerts() {
  return detailedOrders
    .filter((order) => order.paymentStatus === 'Bekliyor')
    .map((order) => buildPaymentAlert({
      id: `order-recv-${order.id}`,
      category: 'Alacak',
      title: `${order.id} ödeme bekliyor`,
      subtitle: order.customer || 'Sipariş tahsilatı',
      date: parsePaymentDate(order.delivery) || nextMonthlyDate(1),
      amount: Number(order.amount) || 0,
      link: '/siparisler',
      flow: 'in',
    }))
    .filter(Boolean)
}

function collectSupplierPayableAlerts() {
  const customerMeta = readCustomerMeta()
  return getCustomerProfiles()
    .filter((customer) => getCustomerMetaSelection(customer, customerMeta[customer.id] || {}).type === SUPPLIER_TYPE_LABEL)
    .filter((customer) => Number(customer.payableDueAmount) > 0 && customer.payableDueDate)
    .map((customer) => buildPaymentAlert({
      id: `supplier-payable-${customer.id}`,
      category: 'Tedarikçi Ödemesi',
      title: `${customer.company} ödemesi`,
      subtitle: 'Tedarikçi borç vadesi',
      date: customer.payableDueDate,
      amount: Number(customer.payableDueAmount) || 0,
      link: `/musteriler/${customer.id}`,
      flow: 'out',
    }))
    .filter(Boolean)
}

function classifyRecurringTier(item) {
  if (item.overdue) return 'overdue'
  if (item.daysUntil <= 7) return 'approaching'
  return 'upcoming'
}

export function formatPaymentDelayCountdown(dateIso, now = Date.now()) {
  const dueEnd = new Date(`${dateIso}T23:59:59`).getTime()
  const diff = now - dueEnd
  if (diff <= 0) return ''
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  return `${days}g ${hours}s ${minutes}dk gecikti`
}

export function formatPaymentUntilCountdown(dateIso, now = Date.now()) {
  const dueEnd = new Date(`${dateIso}T23:59:59`).getTime()
  const diff = dueEnd - now
  if (diff <= 0) return ''
  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  return `${days}g ${hours}s ${minutes}dk kaldı`
}

export function getRecurringPaymentTimeline() {
  const alerts = [
    ...collectRecurringPaymentAlerts(),
    ...collectSalaryPaymentAlerts(),
  ]

  const unique = new Map()
  alerts.forEach((item) => {
    if (!item) return
    unique.set(item.id, {
      ...item,
      tier: classifyRecurringTier(item),
    })
  })

  const tierOrder = { overdue: 0, approaching: 1, upcoming: 2 }
  return [...unique.values()].sort((a, b) => {
    const leftTier = tierOrder[a.tier] ?? 9
    const rightTier = tierOrder[b.tier] ?? 9
    if (leftTier !== rightTier) return leftTier - rightTier
    if (a.tier === 'overdue') return a.date.localeCompare(b.date)
    return a.date.localeCompare(b.date)
  })
}

const ACTIVATION_URGENCY_ORDER = {
  overdue: 0,
  today: 1,
  soon: 2,
  week2: 3,
  future: 4,
}

export function getActivationTimeline() {
  const alerts = [
    ...collectRecurringPaymentAlerts(),
    ...collectRecurringReceivableAlerts(),
    ...collectChequePaymentAlerts(),
    ...collectChequeReceivableAlerts(),
    ...collectSalaryPaymentAlerts(),
    ...collectPlannedMovementAlerts(),
    ...collectIncomingMovementAlerts(),
    ...collectSalesInvoiceReceivableAlerts(),
    ...collectOrderReceivableAlerts(),
    ...collectSupplierPayableAlerts(),
  ]

  const unique = new Map()
  alerts.forEach((item) => {
    if (!item) return
    unique.set(item.id, item)
  })

  return [...unique.values()].sort((a, b) => {
    const left = ACTIVATION_URGENCY_ORDER[a.urgency] ?? 9
    const right = ACTIVATION_URGENCY_ORDER[b.urgency] ?? 9
    if (left !== right) return left - right
    // Gecikmişlerde en eski üstte; diğerlerinde en yakın tarih üstte
    if (a.urgency === 'overdue') return a.date.localeCompare(b.date)
    return a.date.localeCompare(b.date)
  })
}

export function getPaymentActionTimeline() {
  return getActivationTimeline()
}

export { formatCurrency, formatDateLabel, formatDueDateLabel, daysUntil }
