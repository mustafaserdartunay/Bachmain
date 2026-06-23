import { getCustomerProfiles } from '../data/customerProfiles'
import { readCustomerMeta, getCustomerMetaSelection } from './customerMeta'
import { getFieldSalesReps, loadFieldSalesTasks } from './fieldSalesStore'
import { loadOrders, orderTotals } from './ordersStore'
import { loadQuotes } from './quotesStore'
import { readSalesInvoices } from './salesInvoicesStore'
import { loadSalesRepSettings } from './salesRepSettingsStore'
import { getMonthlyWinner } from './salesRepStore'

function normalizeRep(value) {
  return String(value || '').trim().toLocaleLowerCase('tr-TR')
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function inCurrentMonth(isoDate, key = monthKey()) {
  if (!isoDate) return false
  return String(isoDate).slice(0, 7) === key
}

function quoteTotal(quote) {
  return (quote.items || []).reduce((sum, item) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    const vat = Number(item.vatRate) || 0
    return sum + qty * price * (1 + vat / 100)
  }, 0)
}

function matchesRep(recordOwner, repLabel) {
  return normalizeRep(recordOwner) === normalizeRep(repLabel)
}

function customersForRep(repLabel) {
  const customers = getCustomerProfiles()
  const meta = readCustomerMeta()
  return customers.filter((customer) => {
    const selection = getCustomerMetaSelection(customer, meta[customer.id])
    return matchesRep(selection.representative, repLabel)
  })
}

export function getRepQuotes(repLabel, { monthOnly = false } = {}) {
  const key = monthKey()
  return loadQuotes().filter((quote) => {
    if (!matchesRep(quote.owner, repLabel)) return false
    if (monthOnly && !inCurrentMonth(quote.createdAt, key)) return false
    return true
  })
}

export function getRepOrders(repLabel, { monthOnly = false } = {}) {
  const key = monthKey()
  return loadOrders().filter((order) => {
    if (!matchesRep(order.owner, repLabel)) return false
    if (monthOnly && !inCurrentMonth(order.createdAt, key)) return false
    return true
  })
}

export function getRepSalesInvoices(repLabel, { monthOnly = false } = {}) {
  const key = monthKey()
  const customerIds = new Set(customersForRep(repLabel).map((item) => item.id))
  return readSalesInvoices().filter((invoice) => {
    const byCustomer = invoice.customerId && customerIds.has(invoice.customerId)
    const byName = customersForRep(repLabel).some((c) => c.company === invoice.customerName || c.name === invoice.customerName)
    if (!byCustomer && !byName) return false
    if (monthOnly && !inCurrentMonth(invoice.issueDate, key)) return false
    return true
  })
}

export function getRepTasks(repLabel) {
  return loadFieldSalesTasks(repLabel)
}

export function calculateRepSalesTotal(repLabel, { monthOnly = false } = {}) {
  const orders = getRepOrders(repLabel, { monthOnly })
  const orderSum = orders.reduce((sum, order) => sum + orderTotals(order).grandTotal, 0)
  const invoices = getRepSalesInvoices(repLabel, { monthOnly })
  const invoiceSum = invoices.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  return Math.max(orderSum, invoiceSum)
}

export function calculateRepPoints(repLabel, settings = loadSalesRepSettings(), { monthOnly = true } = {}) {
  const quotes = getRepQuotes(repLabel, { monthOnly })
  const orders = getRepOrders(repLabel, { monthOnly })
  const tasks = getRepTasks(repLabel).filter((task) => task.status === 'done')
  const salesTotal = calculateRepSalesTotal(repLabel, { monthOnly })

  const quotePoints = quotes.length * (Number(settings.pointsPerQuote) || 0)
  const salePoints = orders.length * (Number(settings.pointsPerSale) || 0)
  const taskPoints = tasks.length * (Number(settings.pointsPerTask) || 0)
  const revenuePoints = Math.round(salesTotal / 1000)

  return {
    total: quotePoints + salePoints + taskPoints + revenuePoints,
    quotePoints,
    salePoints,
    taskPoints,
    revenuePoints,
    salesTotal,
  }
}

export function calculateRepCommission(repLabel, settings = loadSalesRepSettings(), { monthOnly = true, isWinner = false } = {}) {
  const salesTotal = calculateRepSalesTotal(repLabel, { monthOnly })
  const rate = isWinner
    ? Number(settings.winnerCommissionRate) || 15
    : Number(settings.baseCommissionRate) || 10
  return {
    salesTotal,
    rate,
    commission: salesTotal * rate / 100,
    isWinner,
  }
}

export function buildMonthlyLeaderboard(monthKeyValue = monthKey()) {
  const settings = loadSalesRepSettings()
  const reps = getFieldSalesReps()
  const rows = reps.map((rep) => {
    const points = calculateRepPoints(rep.label, settings, { monthOnly: true })
    return {
      repId: rep.id,
      repLabel: rep.label,
      color: rep.color,
      ...points,
      quotes: getRepQuotes(rep.label, { monthOnly: true }).length,
      orders: getRepOrders(rep.label, { monthOnly: true }).length,
      tasksOpen: getRepTasks(rep.label).filter((task) => task.status !== 'done').length,
      tasksDone: getRepTasks(rep.label).filter((task) => task.status === 'done').length,
    }
  }).sort((a, b) => b.total - a.total || b.salesTotal - a.salesTotal)

  const ranked = rows.map((row, index) => ({ ...row, rank: index + 1 }))
  const winner = ranked[0] || null
  const storedWinner = getMonthlyWinner(monthKeyValue)
  const winnerLabel = storedWinner?.repLabel || winner?.repLabel || ''

  return ranked.map((row) => ({
    ...row,
    isWinner: normalizeRep(row.repLabel) === normalizeRep(winnerLabel) || (row.rank === 1 && !winnerLabel),
    commission: calculateRepCommission(row.repLabel, settings, {
      monthOnly: true,
      isWinner: normalizeRep(row.repLabel) === normalizeRep(winnerLabel) || (row.rank === 1 && !storedWinner),
    }),
  }))
}

export function getRepDetail(repLabel) {
  const settings = loadSalesRepSettings()
  const leaderboard = buildMonthlyLeaderboard()
  const self = leaderboard.find((row) => normalizeRep(row.repLabel) === normalizeRep(repLabel))
  const quotes = getRepQuotes(repLabel)
  const orders = getRepOrders(repLabel)
  const invoices = getRepSalesInvoices(repLabel)
  const tasks = getRepTasks(repLabel)
  const customers = customersForRep(repLabel)

  return {
    repLabel,
    rank: self?.rank || 0,
    points: self?.total || 0,
    commission: self?.commission || calculateRepCommission(repLabel, settings, { isWinner: self?.rank === 1 }),
    quotes,
    orders,
    invoices,
    tasks,
    customers,
    settings,
  }
}

export function formatMonthLabel(key = monthKey()) {
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export { monthKey }
