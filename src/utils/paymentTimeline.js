import { getCustomerProfiles } from '../data/customerProfiles'
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

function formatDateLabel(dateIso) {
  if (!dateIso) return ''
  const date = new Date(`${dateIso}T12:00:00`)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
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

function buildPaymentAlert({ id, category, title, subtitle, date, amount = 0, recurring = false, link = '/kasa' }) {
  const dateIso = parsePaymentDate(date)
  if (!dateIso) return null
  const diff = daysUntil(dateIso)
  const overdue = diff < 0
  const dueToday = diff === 0
  return {
    id,
    category,
    title,
    subtitle,
    date: dateIso,
    dateLabel: formatDateLabel(dateIso),
    amount: Number(amount) || 0,
    recurring,
    overdue,
    dueToday,
    daysUntil: diff,
    urgency: overdue || dueToday ? (overdue ? 'overdue' : 'today') : diff <= 7 ? 'soon' : 'normal',
    link,
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
        category: 'Tekrarlayan Ödeme',
        title: item.title,
        subtitle: item.subtitle || item.vendorName || item.category || 'Tekrarlayan ödeme',
        date: dueDate,
        amount: item.amount,
        recurring: true,
        link: isSupplier ? '/suppliers' : '/kasa',
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
      })
    })
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
    }))
    .filter(Boolean)
}

export function getPaymentActionTimeline() {
  const alerts = [
    ...collectRecurringPaymentAlerts(),
    ...collectChequePaymentAlerts(),
    ...collectSalaryPaymentAlerts(),
    ...collectPlannedMovementAlerts(),
    ...collectSupplierPayableAlerts(),
  ]

  const unique = new Map()
  alerts.forEach((item) => {
    if (!item) return
    unique.set(item.id, item)
  })

  return [...unique.values()].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    if (a.dueToday !== b.dueToday) return a.dueToday ? -1 : 1
    if (a.urgency === 'soon' && b.urgency !== 'soon') return -1
    if (a.urgency !== 'soon' && b.urgency === 'soon') return 1
    return a.date.localeCompare(b.date)
  })
}

export { formatCurrency, formatDateLabel, daysUntil }
