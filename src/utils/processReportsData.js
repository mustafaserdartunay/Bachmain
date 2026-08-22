/**
 * Süreç Yönetimi rapor özeti — mevcut store'lardan (paralel ledger yok).
 */
import { loadQuotes } from './quotesStore'
import { loadOrders } from './ordersStore'
import { loadProductionJobs } from './productionStore'
import { loadDepoItems, loadDepoWarehouses } from './depoStore'
import { loadTrips, getSevkiyatSummary } from './sevkiyatStore'
import { documentTotals } from './documentTotals'
import { getExchangeRatesSnapshot } from '../hooks/useExchangeRates'
import {
  getQuoteStageOptions,
  getOrderStageOptions,
  getProductionStageOptions,
  findWorkflowStage,
  loadWorkflowStages,
} from './workflowStages'

function money(value) {
  return Number(value) || 0
}

function countByKey(items, getKey) {
  const map = new Map()
  items.forEach((item) => {
    const key = String(getKey(item) || 'Belirsiz').trim() || 'Belirsiz'
    map.set(key, (map.get(key) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function toneFromRatio(ratio) {
  if (ratio >= 0.7) return 'green'
  if (ratio >= 0.4) return 'orange'
  return 'red'
}

function quoteAmount(quote, rates) {
  try {
    return money(documentTotals(quote, rates)?.grandTotal)
  } catch {
    return 0
  }
}

function orderAmount(order, rates) {
  try {
    return money(documentTotals(order, rates)?.grandTotal)
  } catch {
    return 0
  }
}

function buildStageBars(items, stages, getStageId) {
  return stages.map((stage) => ({
    name: stage.label || stage.id,
    value: items.filter((item) => getStageId(item) === stage.id).length,
    color: stage.color || undefined,
  }))
}

export const PROCESS_REPORT_SECTIONS = [
  {
    id: 'teklif',
    label: 'Teklif Raporları',
    short: 'Teklif',
    href: '/teklifler',
    tone: 'text-cyan-600',
    iconTone: 'bg-cyan-500/10 text-cyan-600',
  },
  {
    id: 'siparis',
    label: 'Sipariş Raporları',
    short: 'Sipariş',
    href: '/siparisler',
    tone: 'text-emerald-600',
    iconTone: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'uretim',
    label: 'Üretim Raporları',
    short: 'Üretim',
    href: '/uretim',
    tone: 'text-fuchsia-600',
    iconTone: 'bg-fuchsia-500/10 text-fuchsia-600',
  },
  {
    id: 'depo',
    label: 'Depo Raporları',
    short: 'Depo',
    href: '/depo',
    tone: 'text-amber-600',
    iconTone: 'bg-amber-500/10 text-amber-600',
  },
  {
    id: 'sevkiyat',
    label: 'Sevkiyat Raporları',
    short: 'Sevkiyat',
    href: '/sevkiyat',
    tone: 'text-blue-600',
    iconTone: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'teslim',
    label: 'Teslim Raporları',
    short: 'Teslim',
    href: '/teslim-edilenler',
    tone: 'text-rose-600',
    iconTone: 'bg-rose-500/10 text-rose-600',
  },
]

export function buildProcessReportsSnapshot() {
  const rates = getExchangeRatesSnapshot()
  const stages = loadWorkflowStages()
  const quotes = loadQuotes()
  const orders = loadOrders()
  const jobs = loadProductionJobs()
  const depoItems = loadDepoItems()
  const warehouses = loadDepoWarehouses()
  const trips = loadTrips()
  const sevkiyat = getSevkiyatSummary(trips)

  const quoteTotalAmount = quotes.reduce((sum, q) => sum + quoteAmount(q, rates), 0)
  const orderTotalAmount = orders.reduce((sum, o) => sum + orderAmount(o, rates), 0)
  const approvedQuotes = quotes.filter((q) => q.status === 'Onaylandı').length
  const cancelledQuotes = quotes.filter(
    (q) => q.status === 'İptal' || q.status === 'Reddedildi',
  ).length
  const sentQuotes = quotes.filter((q) => q.status === 'Müşteriye Gönderildi').length
  const quoteConversion = quotes.length ? approvedQuotes / quotes.length : 0

  const quoteStages = getQuoteStageOptions(stages)
  const orderStages = getOrderStageOptions(stages)
  const productionStages = getProductionStageOptions(stages)

  const deliveredTrips = trips.filter((t) => t.status === 'delivered')
  const inTransit = trips.filter((t) => t.status === 'in_transit')

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      cards: [
        {
          id: 'teklif',
          title: 'Teklif',
          primaryLabel: 'Toplam',
          primaryValue: quotes.length,
          secondaryLabel: 'Tutar',
          secondaryValue: quoteTotalAmount,
          coverage: quoteConversion * 100,
          tone: toneFromRatio(quoteConversion),
          metrics: [
            { label: 'Gönderilen', value: sentQuotes },
            { label: 'Onay', value: approvedQuotes },
            { label: 'İptal', value: cancelledQuotes },
          ],
        },
        {
          id: 'siparis',
          title: 'Sipariş',
          primaryLabel: 'Toplam',
          primaryValue: orders.length,
          secondaryLabel: 'Tutar',
          secondaryValue: orderTotalAmount,
          coverage: quotes.length ? (orders.length / quotes.length) * 100 : 0,
          tone: toneFromRatio(quotes.length ? orders.length / quotes.length : 0),
          metrics: [
            { label: 'Açık', value: orders.filter((o) => o.status !== 'Tamamlandı').length },
            { label: 'Tamam', value: orders.filter((o) => o.status === 'Tamamlandı').length },
            { label: 'İptal', value: orders.filter((o) => o.status === 'İptal').length },
          ],
        },
        {
          id: 'uretim',
          title: 'Üretim',
          primaryLabel: 'İş',
          primaryValue: jobs.length,
          secondaryLabel: 'Aktif',
          secondaryValue: jobs.filter((j) => j.status !== 'Tamamlandı').length,
          coverage: jobs.length
            ? (jobs.filter((j) => j.status === 'Tamamlandı').length / jobs.length) * 100
            : 0,
          tone: toneFromRatio(
            jobs.length ? jobs.filter((j) => j.status === 'Tamamlandı').length / jobs.length : 0,
          ),
          metrics: [
            { label: 'Aşama', value: productionStages.length },
            {
              label: 'Tamam',
              value: jobs.filter((j) => j.status === 'Tamamlandı').length,
            },
            { label: 'Satır', value: jobs.reduce((n, j) => n + (j.lineItems?.length || 0), 0) },
          ],
        },
        {
          id: 'depo',
          title: 'Depo',
          primaryLabel: 'Kalem',
          primaryValue: depoItems.length,
          secondaryLabel: 'Depo',
          secondaryValue: warehouses.length,
          coverage: depoItems.length ? Math.min(100, (depoItems.length / 20) * 100) : 0,
          tone: depoItems.length > 0 ? 'green' : 'orange',
          metrics: [
            { label: 'Depo', value: warehouses.length },
            { label: 'Kalem', value: depoItems.length },
            {
              label: 'Miktar',
              value: depoItems.reduce((n, i) => n + money(i.quantity ?? i.qty ?? 1), 0),
            },
          ],
        },
        {
          id: 'sevkiyat',
          title: 'Sevkiyat',
          primaryLabel: 'Sefer',
          primaryValue: sevkiyat.total,
          secondaryLabel: 'Yolda',
          secondaryValue: sevkiyat.inTransit,
          coverage: sevkiyat.total ? (sevkiyat.delivered / sevkiyat.total) * 100 : 0,
          tone: toneFromRatio(sevkiyat.total ? sevkiyat.delivered / sevkiyat.total : 0),
          metrics: [
            { label: 'Plan', value: sevkiyat.planned },
            { label: 'Yolda', value: sevkiyat.inTransit },
            { label: 'Teslim', value: sevkiyat.delivered },
          ],
        },
        {
          id: 'teslim',
          title: 'Teslim',
          primaryLabel: 'Teslim',
          primaryValue: deliveredTrips.length,
          secondaryLabel: 'Yolda',
          secondaryValue: inTransit.length,
          coverage: trips.length ? (deliveredTrips.length / trips.length) * 100 : 0,
          tone: toneFromRatio(trips.length ? deliveredTrips.length / trips.length : 0),
          metrics: [
            { label: 'Teslim', value: deliveredTrips.length },
            { label: 'Yolda', value: inTransit.length },
            { label: 'Sefer', value: trips.length },
          ],
        },
      ],
      funnel: [
        { name: 'Teklif', value: quotes.length },
        { name: 'Sipariş', value: orders.length },
        { name: 'Üretim', value: jobs.length },
        { name: 'Depo', value: depoItems.length },
        { name: 'Sevkiyat', value: trips.length },
        { name: 'Teslim', value: deliveredTrips.length },
      ],
    },
    teklif: {
      total: quotes.length,
      totalAmount: quoteTotalAmount,
      byStatus: countByKey(quotes, (q) => q.status),
      byStage: buildStageBars(quotes, quoteStages, (q) => q.currentStageId),
      approved: approvedQuotes,
      cancelled: cancelledQuotes,
      sent: sentQuotes,
      conversion: quoteConversion * 100,
      topCustomers: countByKey(quotes, (q) => q.customer || q.customerName).slice(0, 8),
    },
    siparis: {
      total: orders.length,
      totalAmount: orderTotalAmount,
      byStatus: countByKey(orders, (o) => o.status),
      byStage: buildStageBars(orders, orderStages, (o) => o.currentStageId),
      linkedQuotes: orders.filter((o) => o.quoteId).length,
      topCustomers: countByKey(orders, (o) => o.customer || o.customerName).slice(0, 8),
    },
    uretim: {
      total: jobs.length,
      byStatus: countByKey(
        jobs,
        (j) => j.status || findWorkflowStage(stages, j.currentStageId)?.label,
      ),
      byStage: buildStageBars(jobs, productionStages, (j) => j.currentStageId),
      lineCount: jobs.reduce((n, j) => n + (j.lineItems?.length || 0), 0),
      completed: jobs.filter((j) => j.status === 'Tamamlandı').length,
    },
    depo: {
      total: depoItems.length,
      warehouses: warehouses.length,
      byWarehouse: countByKey(depoItems, (i) => i.warehouseName || i.warehouseId || 'Ana Depo'),
      byStatus: countByKey(depoItems, (i) => i.status || i.stage || 'Stokta'),
      quantity: depoItems.reduce((n, i) => n + money(i.quantity ?? i.qty ?? 1), 0),
    },
    sevkiyat: {
      ...sevkiyat,
      byStatus: countByKey(trips, (t) => {
        if (t.status === 'delivered') return 'Teslim'
        if (t.status === 'in_transit') return 'Yolda'
        if (t.status === 'planned' || t.status === 'draft') return 'Plan'
        return t.status || 'Diğer'
      }),
      trips: trips.length,
    },
    teslim: {
      total: deliveredTrips.length,
      inTransit: inTransit.length,
      rate: trips.length ? (deliveredTrips.length / trips.length) * 100 : 0,
      byDay: countByKey(deliveredTrips, (t) => {
        const raw = t.deliveredAt || t.updatedAt || t.createdAt || ''
        return String(raw).slice(0, 10) || 'Tarihsiz'
      }).slice(0, 14),
    },
  }
}
