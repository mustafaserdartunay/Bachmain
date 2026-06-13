import { DEFAULT_DEPO_VAT_RATE } from '../data/depoSeed'
import { isDepoItemDelivered } from './depoStageHelpers'
import { loadDepoWorkflowStages } from './depoWorkflowStages'
import { formatQty } from './productionQuantityMetrics'
import { calcInclPrice } from './productPricing'

export function formatMoney(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDepoDateTime(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))?/)
  if (trMatch) return trMatch[2] ? `${trMatch[1]} ${trMatch[2]}` : trMatch[1]
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return raw
}

export function statusTone(status) {
  switch (status) {
    case 'Beklemede':
      return 'text-amber-300 bg-amber-500/10 border-amber-500/30'
    case 'Paketlendi':
      return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30'
    case 'Teslime Hazır':
      return 'text-blue-300 bg-blue-500/10 border-blue-500/30'
    case 'Araçta':
      return 'text-purple-300 bg-purple-500/10 border-purple-500/30'
    case 'Teslim Edildi':
      return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    default:
      return 'text-gray-400 bg-dark-700/60 border-dark-500/40'
  }
}

export function computeDepoLineTotals(item) {
  const quantity = Number(item?.producedQuantity) || 0
  const unitPriceExcl = Number(item?.unitPrice) || 0
  const vatRate = Number(item?.vatRate) || DEFAULT_DEPO_VAT_RATE
  const net = quantity * unitPriceExcl
  const vat = net * (vatRate / 100)
  const gross = net + vat
  const unitPriceIncl = calcInclPrice(unitPriceExcl, vatRate)

  return {
    quantity,
    unitPriceExcl,
    unitPriceIncl,
    vatRate,
    net,
    vat,
    gross,
    cost: quantity * (Number(item?.unitCost) || 0),
  }
}

export function computeDepoSummary(items = [], warehouses = []) {
  const stages = loadDepoWorkflowStages()
  const inWarehouse = items.filter((item) => !isDepoItemDelivered(item, stages))
  const delivered = items.filter((item) => isDepoItemDelivered(item, stages))

  const readySoldQty = inWarehouse.reduce((sum, item) => sum + (Number(item.soldQuantity) || 0), 0)
  const totalCost = items.reduce((sum, item) => sum + computeDepoLineTotals(item).cost, 0)
  const totalNet = items.reduce((sum, item) => sum + computeDepoLineTotals(item).net, 0)
  const totalSales = items.reduce((sum, item) => sum + computeDepoLineTotals(item).gross, 0)
  const invoiced = items.filter((item) => item.invoiceNo).length
  const waybilled = items.filter((item) => item.waybillNo).length

  const byStatus = stages.reduce((acc, stage) => {
    acc[stage.label] = items.filter((item) => {
      const label = item.status || stage.label
      return label === stage.label
    }).length
    return acc
  }, {})

  return {
    totalItems: items.length,
    inWarehouse: inWarehouse.length,
    delivered: delivered.length,
    readySoldQty,
    totalCost,
    totalNet,
    totalSales,
    invoiced,
    waybilled,
    stockWarehouses: warehouses.filter((w) => w.kind === 'stock').length,
    orderWarehouses: warehouses.filter((w) => w.kind === 'order').length,
    byStatus,
  }
}

export function customerLabel(customer) {
  if (!customer) return 'Müşteri yok'
  if (typeof customer === 'string') return customer
  return customer.brandShortName || customer.companyTitle || 'Müşteri'
}

export { formatQty }
