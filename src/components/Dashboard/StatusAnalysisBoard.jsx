import { Link } from 'react-router-dom'
import { Banknote, CircleDollarSign, Landmark, ReceiptText, WalletCards } from 'lucide-react'
import { getDashboardAnalytics } from '../../utils/dashboardAlerts'
import { loadOrders } from '../../utils/ordersStore'
import { loadProductionJobs } from '../../utils/productionStore'
import { loadQuotes } from '../../utils/quotesStore'
import { documentTotals } from '../../utils/documentTotals'
import {
  calculateAccountBalance,
  formatTreasuryCurrency,
  getTreasuryAccounts,
  getTreasuryMovements,
} from '../../utils/treasuryStore'
import {
  getOrderStageOptions,
  getProductionStageOptions,
  getQuoteStageOptions,
  loadWorkflowStages,
} from '../../utils/workflowStages'
import { DEFAULT_DASHBOARD_FINANCE_CARDS, loadDashboardFinanceCards } from '../../utils/dashboardFinanceCards'

export const FINANCE_CARD_IDS = DEFAULT_DASHBOARD_FINANCE_CARDS.map((card) => card.id)

const colorToneMap = {
  'bg-blue-500': 'text-blue-300',
  'bg-sky-500': 'text-sky-300',
  'bg-cyan-500': 'text-cyan-300',
  'bg-teal-500': 'text-teal-300',
  'bg-emerald-500': 'text-emerald-300',
  'bg-lime-500': 'text-lime-300',
  'bg-green-500': 'text-green-300',
  'bg-amber-500': 'text-amber-300',
  'bg-yellow-500': 'text-yellow-300',
  'bg-orange-500': 'text-orange-300',
  'bg-red-500': 'text-red-300',
  'bg-rose-500': 'text-rose-300',
  'bg-pink-500': 'text-pink-300',
  'bg-fuchsia-500': 'text-fuchsia-300',
  'bg-purple-500': 'text-purple-300',
  'bg-violet-500': 'text-violet-300',
  'bg-indigo-500': 'text-indigo-300',
  'bg-slate-500': 'text-slate-300',
  'bg-stone-500': 'text-stone-300',
  'bg-zinc-500': 'text-zinc-300',
}

function getToneFromColor(color, fallback = 'text-gray-100') {
  return colorToneMap[color] || fallback
}

export function FinanceMetricCard({
  label,
  value,
  sub,
  tone = 'text-white',
  valueTone = 'text-emerald-700',
  iconTone = 'text-gray-200',
  icon: Icon,
  href,
  featured = false,
}) {
  const content = (
    <article className={`${featured ? 'bg-dark-700/45' : 'bg-dark-800/75'} flex h-full min-h-[84px] flex-col justify-between rounded-xl border border-dark-500/55 p-2 shadow-card transition-colors hover:border-dark-400/70`}>
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className="max-w-[5.5rem] text-[7px] font-black uppercase leading-snug tracking-[0.16em] text-gray-400">{label}</p>
        </div>
        {Icon && (
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-dark-500/65 bg-dark-700/70 ${iconTone}`}>
            <Icon className="h-3 w-3" />
          </span>
        )}
      </div>
      <p className={`my-auto break-words text-[0.82rem] font-black leading-tight tracking-tight ${valueTone}`}>{value}</p>
      {sub && <p className="mt-1 line-clamp-2 text-[7.5px] font-semibold leading-snug text-gray-400">{sub}</p>}
    </article>
  )
  if (href) return <Link to={href} className="block h-full">{content}</Link>
  return content
}

function amountOf(record) {
  if (Number.isFinite(Number(record?.amount))) return Number(record.amount)
  return documentTotals(record || {}).grandTotal
}

function isChequeMovement(movement) {
  return ['method', 'type', 'description', 'chequeNo']
    .some((field) => String(movement?.[field] || '').toLocaleLowerCase('tr-TR').includes('çek'))
}

function uniqueById(records) {
  const seen = new Set()
  return records.filter((record) => {
    const id = String(record?.id || record?.orderId || record?.quoteId || '').trim()
    if (!id) return true
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function buildFinanceMetricCards({ includeHidden = false } = {}) {
  const a = getDashboardAnalytics()
  const accounts = getTreasuryAccounts()
  const movements = getTreasuryMovements()
  const enrichedAccounts = accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, movements),
  }))
  const cashTotal = enrichedAccounts
    .filter((account) => account.type === 'Nakit Kasa')
    .reduce((sum, account) => sum + account.balance, 0)
  const bankTotal = enrichedAccounts
    .filter((account) => account.type === 'Banka Hesabı')
    .reduce((sum, account) => sum + account.balance, 0)
  const chequePortfolio = movements
    .filter(isChequeMovement)
    .reduce((sum, movement) => sum + (movement.direction === 'out' ? -1 : 1) * (Number(movement.amount) || 0), 0)

  const workflowStages = loadWorkflowStages()
  const quoteStages = getQuoteStageOptions(workflowStages)
  const orderStages = getOrderStageOptions(workflowStages)
  const productionStages = getProductionStageOptions(workflowStages)
  const approvedQuoteStageIds = new Set(
    quoteStages
      .filter((stage) => ['Olumlu', 'Onaylandı', 'Sipariş Alındı', 'Üretime Alındı'].includes(stage.label))
      .map((stage) => stage.id),
  )
  const terminalOrderStageIds = new Set(
    orderStages
      .filter((stage) => ['Tamamlandı', 'İptal'].includes(stage.label))
      .map((stage) => stage.id),
  )
  const completedProductionStageIds = new Set(
    productionStages
      .filter((stage) => ['Tamamlandı', 'Sevkiyat', 'Teslim Edildi'].includes(stage.label))
      .map((stage) => stage.id),
  )

  const approvedQuotes = loadQuotes().filter((quote) => (
    quote.status === 'Onaylandı' || approvedQuoteStageIds.has(quote.currentStageId)
  ))
  const activeOrders = loadOrders().filter((order) => (
    !['Tamamlandı', 'İptal'].includes(order.status) && !terminalOrderStageIds.has(order.currentStageId)
  ))
  const activeProductionJobs = loadProductionJobs().filter((job) => (
    !['Tamamlandı', 'İptal'].includes(job.status) && !completedProductionStageIds.has(job.currentStageId)
  ))

  const approvedQuoteTotal = approvedQuotes.reduce((sum, quote) => sum + amountOf(quote), 0)
  const activeOrderTotal = activeOrders.reduce((sum, order) => sum + amountOf(order), 0)
  const productionLinkedRecords = uniqueById(activeProductionJobs.map((job) => {
    const linkedOrder = activeOrders.find((order) => order.id === job.orderId || order.id === job.id)
    if (linkedOrder) return linkedOrder
    const linkedQuote = approvedQuotes.find((quote) => quote.id === job.orderId || quote.id === job.id)
    return linkedQuote || job
  }))
  const productionFutureTotal = productionLinkedRecords.reduce((sum, record) => sum + amountOf(record), 0)
  const futureIncomingTotal = approvedQuoteTotal + activeOrderTotal + productionFutureTotal
  const liveAssetTotal = cashTotal + bankTotal + chequePortfolio
  const possibleGrandTotal = liveAssetTotal + futureIncomingTotal
  const baseCards = [
    { id: 'cash', label: 'Nakit Kasa', value: formatTreasuryCurrency(cashTotal), sub: `${enrichedAccounts.filter((account) => account.type === 'Nakit Kasa').length} kasa hesabı`, href: '/kasa', tone: 'text-emerald-300', iconTone: 'text-emerald-300', icon: Banknote },
    { id: 'bank', label: 'Banka', value: formatTreasuryCurrency(bankTotal), sub: `${enrichedAccounts.filter((account) => account.type === 'Banka Hesabı').length} banka hesabı`, href: '/kasa', tone: 'text-blue-300', iconTone: 'text-blue-300', icon: Landmark },
    { id: 'receivables', label: 'Tahsilat Bekleyen', value: formatTreasuryCurrency(a.tahsilatBekleyen), sub: 'Vadesi gelen/alacak kayıtları', href: '/kasa', tone: 'text-cyan-300', valueTone: 'text-orange-500', iconTone: 'text-cyan-300', icon: ReceiptText },
    { id: 'payables', label: 'Ödenecekler Toplamı', value: formatTreasuryCurrency(a.odemeBekleyen), sub: 'Bekleyen ödeme yükümlülüğü', href: '/kasa', tone: 'text-orange-300', valueTone: 'text-red-600', iconTone: 'text-orange-300', icon: WalletCards },
    { id: 'cheques', label: 'Portföydeki Çekler', value: formatTreasuryCurrency(chequePortfolio), sub: `${movements.filter(isChequeMovement).length} çek hareketi`, href: '/kasa', tone: 'text-purple-300', iconTone: 'text-purple-300', icon: CircleDollarSign },
    { id: 'future', label: 'Gelecek Tutar', value: formatTreasuryCurrency(futureIncomingTotal), sub: 'Teklif + sipariş + üretim', tone: 'text-emerald-300', iconTone: 'text-emerald-300', icon: Banknote, featured: true },
    { id: 'possible', label: 'Genel Olası Tutar', value: formatTreasuryCurrency(possibleGrandTotal), sub: 'Kasa + banka + çek + gelecek', href: '/kasa', tone: 'text-gray-100', valueTone: 'text-blue-600', iconTone: 'text-emerald-300', icon: WalletCards, featured: true },
    { id: 'live-assets', label: 'Toplam Canlı Varlık', value: formatTreasuryCurrency(liveAssetTotal), sub: 'Kasa + banka + çek', tone: 'text-gray-100', valueTone: 'text-emerald-700', iconTone: 'text-blue-300', icon: Landmark, featured: true },
  ]
  const baseById = new Map(baseCards.map((card) => [card.id, card]))
  const removedFinanceCardIds = new Set(['orders', 'production', 'depo-stock-sales'])
  return loadDashboardFinanceCards()
    .filter((config) => !removedFinanceCardIds.has(config.id))
    .filter((config) => includeHidden || config.visible !== false)
    .map((config) => {
    const base = baseById.get(config.id)
    const configTone = getToneFromColor(config.color)
    if (base) {
      return {
        ...base,
        label: config.label,
        iconTone: configTone,
      }
    }
    return {
      id: config.id,
      label: config.label,
      value: formatTreasuryCurrency(0),
      sub: 'Ayarlar üzerinden eklenen özel finans kartı',
      tone: configTone,
      valueTone: configTone,
      iconTone: configTone,
      icon: WalletCards,
    }
  })
}

export default function StatusAnalysisBoard() {
  const financeCards = buildFinanceMetricCards()
  return (
    <section className="rounded-3xl border border-dark-500/55 bg-dark-800/75 p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-100">Finans Analizi</h2>
          <p className="text-xs font-semibold text-gray-400">Kasa, banka, çek portföyü ve üretim sonrası beklenen toplamlar</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-lg border border-dark-500/60 bg-dark-700/55 px-2 py-1 text-[10px] font-bold text-emerald-300">Canlı kasa</span>
          <span className="rounded-lg border border-dark-500/60 bg-dark-700/55 px-2 py-1 text-[10px] font-bold text-blue-300">Olası toplam</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {financeCards.map((card) => (
          <FinanceMetricCard key={card.id} {...card} />
        ))}
      </div>
    </section>
  )
}
