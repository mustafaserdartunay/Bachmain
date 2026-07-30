import { computeDepoLineTotals } from './depoHelpers'
import { isDepoItemDelivered } from './depoStageHelpers'
import { loadDepoItems } from './depoStore'
import { loadDepoWorkflowStages } from './depoWorkflowStages'
import { documentTotals } from './documentTotals'
import { loadOrders, orderTotals } from './ordersStore'
import { loadPersonnel } from './personnelStore'
import { fullName } from './personnelHelpers'
import { loadProductionJobs } from './productionStore'
import { loadRecurringPayments } from './recurringPaymentsStore'
import {
  getLiveAssetTotal,
  getTotalCustomerReceivable,
  getTotalSupplierPayable,
  getTreasuryAccounts,
  getTreasuryMovements,
} from './treasuryStore'

const CLOSED_ORDER_STATUSES = new Set(['Tamamlandı', 'İptal', 'Reddedildi', 'Kapalı'])
const CLOSED_PRODUCTION_STATUSES = new Set(['Tamamlandı', 'İptal', 'Reddedildi', 'Kapalı'])
const ACTIVE_PERSONNEL_STATUSES = new Set(['Aktif', 'Deneme Süreci', 'İzinli'])

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü]+/g, ' ')
    .trim()
}

function localMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseDate(value) {
  if (!value) return null
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = new Date(`${raw.slice(0, 10)}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (match) {
    const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function isMovementInMonth(movement, monthKey) {
  const date = parseDate(movement?.date || movement?.paidAt || movement?.createdAt)
  return date ? localMonthKey(date) === monthKey : false
}

function amountMatches(left, right) {
  const a = Math.abs(Number(left) || 0)
  const b = Math.abs(Number(right) || 0)
  return Math.abs(a - b) <= Math.max(1, b * 0.01)
}

function movementMatchesObligation(movement, obligation, monthKey) {
  if (movement?.direction !== 'out' || !isMovementInMonth(movement, monthKey)) return false
  if (!amountMatches(movement.amount, obligation.amount)) return false

  const haystack = normalizeText(
    [
      movement.description,
      movement.category,
      movement.type,
      movement.vendorName,
      movement.customerName,
    ].join(' '),
  )
  return obligation.matchers.some((matcher) => {
    const needle = normalizeText(matcher)
    return needle.length >= 3 && haystack.includes(needle)
  })
}

function isRecurringGeneralExpense(item) {
  if (item?.active === false || item?.interval !== 'monthly') return false
  const category = normalizeText(item.category)
  if (category.includes('tahsilat') || category.includes('alacak')) return false
  if (category.includes('tedarikçi') || category.includes('tedarikci') || item.vendorName)
    return false
  if (category.includes('maaş') || category.includes('maas')) return false
  return Number(item.amount) > 0
}

function collectOutstandingPayroll(personnel, movements, monthKey) {
  return personnel
    .filter((employee) => ACTIVE_PERSONNEL_STATUSES.has(employee.status))
    .reduce((total, employee) => {
      const payroll = (employee.payrollHistory || []).find((row) => row.month === monthKey)
      if (payroll?.paidAt) return total
      const amount = Number(payroll?.net) || Number(employee.salary?.base) || 0
      if (amount <= 0) return total

      const name = fullName(employee)
      const obligation = { amount, matchers: [name, `maaş ${name}`, `maas ${name}`] }
      const alreadyPosted = movements.some((movement) =>
        movementMatchesObligation(movement, obligation, monthKey),
      )
      return alreadyPosted ? total : total + amount
    }, 0)
}

function collectOutstandingFixedExpenses(recurringPayments, movements, monthKey) {
  return recurringPayments.filter(isRecurringGeneralExpense).reduce((total, item) => {
    const amount = Number(item.amount) || 0
    const obligation = {
      amount,
      matchers: [item.title, item.subtitle, item.category].filter(Boolean),
    }
    const alreadyPosted = movements.some((movement) =>
      movementMatchesObligation(movement, obligation, monthKey),
    )
    return alreadyPosted ? total : total + amount
  }, 0)
}

function resolveProductionAmount(job, ordersById) {
  const linkedOrder = ordersById.get(job.orderId || job.id)
  if (linkedOrder) return orderTotals(linkedOrder).grandTotal
  if (job.items?.length) return documentTotals(job).grandTotal
  const items = (job.lineItems || []).map((line) => ({
    product: line.product,
    quantity: Number(line.quantity) || 0,
    unitPrice: Number(line.unitPrice) || 0,
    vatRate: Number(line.vatRate) || 20,
  }))
  return items.length ? documentTotals({ items }).grandTotal : 0
}

function getDocumentReferenceIds(movement) {
  return [movement?.orderId, movement?.sourceOrderId, movement?.referenceId, movement?.documentId]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
}

function buildOperationalPotential({ orders, productionJobs, depoItems, movements }) {
  const orderById = new Map(orders.map((order) => [String(order.id), order]))
  const invoicedOrderIds = new Set(
    movements
      .filter((movement) => movement.type === 'Satış Faturası')
      .flatMap(getDocumentReferenceIds),
  )
  const depoStages = loadDepoWorkflowStages()
  const activeDepoItems = depoItems.filter((item) => !isDepoItemDelivered(item, depoStages))
  const depoOrderIds = new Set(
    activeDepoItems.map((item) => String(item.orderId || '').trim()).filter(Boolean),
  )
  const eligibleDepoItems = activeDepoItems.filter(
    (item) => !item.orderId || !invoicedOrderIds.has(String(item.orderId)),
  )

  const depo = eligibleDepoItems.reduce((total, item) => {
    const totals = computeDepoLineTotals(item)
    const remainingQuantity = Math.max(
      0,
      (Number(item.producedQuantity) || 0) - (Number(item.soldQuantity) || 0),
    )
    return total + remainingQuantity * totals.unitPriceIncl
  }, 0)

  const activeProduction = productionJobs.filter(
    (job) => !CLOSED_PRODUCTION_STATUSES.has(job.status),
  )
  const productionOrderIds = new Set(
    activeProduction.map((job) => String(job.orderId || job.id || '').trim()).filter(Boolean),
  )
  const seenProduction = new Set()
  let productionCount = 0
  const production = activeProduction.reduce((total, job) => {
    const referenceId = String(job.orderId || job.id || '').trim()
    if (!referenceId || seenProduction.has(referenceId)) return total
    seenProduction.add(referenceId)
    if (depoOrderIds.has(referenceId) || invoicedOrderIds.has(referenceId)) return total
    productionCount += 1
    return total + resolveProductionAmount(job, orderById)
  }, 0)

  const activeOrders = orders.filter((order) => !CLOSED_ORDER_STATUSES.has(order.status))
  let orderCount = 0
  const ordersTotal = activeOrders.reduce((total, order) => {
    const referenceId = String(order.id || '').trim()
    if (
      !referenceId ||
      invoicedOrderIds.has(referenceId) ||
      productionOrderIds.has(referenceId) ||
      depoOrderIds.has(referenceId)
    ) {
      return total
    }
    orderCount += 1
    return total + orderTotals(order).grandTotal
  }, 0)

  return {
    orders: ordersTotal,
    production,
    depot: depo,
    total: ordersTotal + production + depo,
    counts: {
      orders: orderCount,
      production: productionCount,
      depot: eligibleDepoItems.length,
    },
  }
}

export function calculateCapacityStatus(resources, obligations) {
  const safeResources = Number(resources) || 0
  const safeObligations = Math.max(0, Number(obligations) || 0)
  const coverage = safeObligations > 0 ? (safeResources / safeObligations) * 100 : 100
  const balance = safeResources - safeObligations
  const tone = coverage >= 100 ? 'green' : coverage >= 80 ? 'orange' : 'red'
  return {
    resources: safeResources,
    obligations: safeObligations,
    coverage,
    balance,
    tone,
    marker: Math.min(98, Math.max(2, (coverage / 150) * 100)),
  }
}

function buildGuidance(current, operational) {
  if (current.balance >= 0) {
    return 'Mevcut varlık ve alacaklar zorunlu ödemeleri karşılıyor. Operasyonel dönüşüm nakit tamponunu büyütür.'
  }

  const gap = Math.abs(current.balance)
  if (operational.depot >= gap) {
    return 'Öncelik depo: hazır ürünleri satış ve tahsilata çevirerek ödeme açığı kapatılabilir.'
  }
  if (operational.depot + operational.production >= gap) {
    return 'Depo satışını hızlandırın, üretimdeki işleri teslimata taşıyın; birlikte açık kapanabilir.'
  }
  if (operational.total >= gap) {
    return 'Siparişleri üretime, üretimi depoya ve depoyu satışa taşıyarak açık kapanabilir.'
  }
  return 'Operasyonel potansiyel tek başına yetmiyor; tahsilatı hızlandırıp gider planını yeniden düzenleyin.'
}

export function buildMonthEndPaymentCapacity(now = new Date()) {
  const accounts = getTreasuryAccounts()
  const movements = getTreasuryMovements()
  const monthKey = localMonthKey(now)
  const liveAssets = getLiveAssetTotal(movements, accounts)
  const receivables = getTotalCustomerReceivable(movements)
  const supplierPayables = getTotalSupplierPayable(movements)
  const payroll = collectOutstandingPayroll(loadPersonnel(), movements, monthKey)
  const fixedExpenses = collectOutstandingFixedExpenses(
    loadRecurringPayments(),
    movements,
    monthKey,
  )

  const resources = liveAssets.total + receivables
  const obligations = supplierPayables + payroll + fixedExpenses
  const current = calculateCapacityStatus(resources, obligations)
  const operational = buildOperationalPotential({
    orders: loadOrders(),
    productionJobs: loadProductionJobs(),
    depoItems: loadDepoItems(),
    movements,
  })
  const projected = calculateCapacityStatus(resources + operational.total, obligations)

  return {
    monthKey,
    monthLabel: now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    current: {
      ...current,
      liveAssets: liveAssets.total,
      receivables,
      supplierPayables,
      payroll,
      fixedExpenses,
    },
    operational,
    projected,
    guidance: buildGuidance(current, operational),
  }
}
