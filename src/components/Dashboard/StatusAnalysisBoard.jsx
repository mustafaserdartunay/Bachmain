import { Link } from 'react-router-dom'
import {
  Banknote,
  Boxes,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  ScrollText,
  WalletCards,
} from 'lucide-react'
import { loadOrders } from '../../utils/ordersStore'
import { loadProductionJobs } from '../../utils/productionStore'
import { documentMoneyParts, sumMoneyParts } from '../../utils/documentTotals'
import { getStockProductsReport } from '../../utils/stockStore'
import {
  calculateAccountBalance,
  formatTreasuryCurrency,
  getCashTreasuryAccounts,
  getCashTreasuryTotal,
  getBankTreasuryAccounts,
  getBankTreasuryTotal,
  getChequeTreasuryAccounts,
  getLiveAssetTotal,
  getTotalCustomerReceivableParts,
  getTotalSupplierPayableParts,
  getTreasuryAccounts,
  getTreasuryMovements,
} from '../../utils/treasuryStore'
import {
  getCustomerChequePortfolioRows,
  getCustomerChequePortfolioTotal,
  getCustomerPromissoryNotePortfolioRows,
  getCustomerPromissoryNotePortfolioTotal,
} from '../../utils/treasuryReportUtils'
import {
  getOrderStageOptions,
  getProductionStageOptions,
  loadWorkflowStages,
} from '../../utils/workflowStages'
import {
  DEFAULT_DASHBOARD_FINANCE_CARDS,
  loadDashboardFinanceCards,
} from '../../utils/dashboardFinanceCards'

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
  valueExVat,
  valueIncVat,
  sub,
  tone = 'text-white',
  valueTone = 'text-emerald-700',
  iconTone = 'text-gray-200',
  icon: Icon,
  href,
  featured = false,
}) {
  const hasDual =
    valueExVat != null &&
    valueIncVat != null &&
    String(valueExVat) !== '' &&
    String(valueIncVat) !== ''
  const content = (
    <article className="glass-finance-card flex h-full min-h-[84px] flex-col justify-between p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[var(--muted)]">{label}</p>
        </div>
        {Icon && (
          <span className={`neon-icon-wrap !h-8 !w-8 !rounded-xl ${iconTone}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      {hasDual ? (
        <div className={`my-auto space-y-1 ${valueTone}`}>
          <p className="break-words text-[13px] font-extrabold leading-tight tracking-tight">
            <span className="mr-1 text-[10px] font-bold text-[var(--muted)]">KDV Hariç</span>
            {valueExVat}
          </p>
          <p className="break-words text-[13px] font-extrabold leading-tight tracking-tight">
            <span className="mr-1 text-[10px] font-bold text-[var(--muted)]">KDV Dahil</span>
            {valueIncVat}
          </p>
        </div>
      ) : (
        <p
          className={`my-auto break-words text-lg font-extrabold leading-tight tracking-tight ${valueTone}`}
        >
          {value}
        </p>
      )}
      {sub && (
        <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--muted)]">
          {sub}
        </p>
      )}
    </article>
  )
  if (href)
    return (
      <Link to={href} className="block h-full">
        {content}
      </Link>
    )
  return content
}

function moneyCardValue(parts) {
  return {
    value: formatTreasuryCurrency(parts.inclVat),
    valueExVat: formatTreasuryCurrency(parts.exclVat),
    valueIncVat: formatTreasuryCurrency(parts.inclVat),
    exclVat: parts.exclVat,
    inclVat: parts.inclVat,
  }
}

export function buildFinanceMetricCards({ includeHidden = false } = {}) {
  const accounts = getTreasuryAccounts()
  const movements = getTreasuryMovements()
  const enrichedAccounts = accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, movements),
  }))
  const cashAccounts = getCashTreasuryAccounts(enrichedAccounts)
  const bankAccounts = getBankTreasuryAccounts(enrichedAccounts)
  const cashTotal = getCashTreasuryTotal(movements, enrichedAccounts)
  const bankTotal = getBankTreasuryTotal(movements, enrichedAccounts)
  const customerChequePortfolio = getCustomerChequePortfolioTotal(accounts)
  const customerChequeRows = getCustomerChequePortfolioRows(accounts)
  const customerPromissoryNotePortfolio = getCustomerPromissoryNotePortfolioTotal(accounts)
  const customerPromissoryNoteRows = getCustomerPromissoryNotePortfolioRows(accounts)
  const chequeAccounts = getChequeTreasuryAccounts(enrichedAccounts)
  const liveAssets = getLiveAssetTotal(movements, enrichedAccounts)

  const workflowStages = loadWorkflowStages()
  const orderStages = getOrderStageOptions(workflowStages)
  const productionStages = getProductionStageOptions(workflowStages)
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

  const activeOrders = loadOrders().filter(
    (order) =>
      !['Tamamlandı', 'İptal'].includes(order.status) &&
      !terminalOrderStageIds.has(order.currentStageId),
  )
  // Gelecek tutar: yalnızca aktif sipariş + üretim (teklif ve depo dahil edilmez)
  const activeProductionJobs = loadProductionJobs().filter(
    (job) =>
      !['Tamamlandı', 'İptal'].includes(job.status) &&
      !completedProductionStageIds.has(job.currentStageId),
  )

  const futureParts = sumMoneyParts([
    ...activeOrders.map((order) => documentMoneyParts(order)),
    ...activeProductionJobs.map((job) => documentMoneyParts(job)),
  ])
  const liveAssetTotal = liveAssets.total
  const liveParts = { exclVat: liveAssetTotal, vat: 0, inclVat: liveAssetTotal }
  const possibleParts = {
    exclVat: liveAssetTotal + futureParts.exclVat,
    vat: futureParts.vat,
    inclVat: liveAssetTotal + futureParts.inclVat,
  }
  const receivableParts = getTotalCustomerReceivableParts(movements)
  const payableParts = getTotalSupplierPayableParts(movements)
  const stockReport = getStockProductsReport()
  const stockParts = {
    exclVat: Number(stockReport.totalValueExVat) || Number(stockReport.totalValue) || 0,
    vat: Math.max(
      0,
      (Number(stockReport.totalValueIncVat) || 0) - (Number(stockReport.totalValueExVat) || 0),
    ),
    inclVat: Number(stockReport.totalValueIncVat) || Number(stockReport.totalValue) || 0,
  }
  const cashParts = moneyCardValue({ exclVat: cashTotal, vat: 0, inclVat: cashTotal })
  const bankParts = moneyCardValue({ exclVat: bankTotal, vat: 0, inclVat: bankTotal })
  const chequeParts = moneyCardValue({
    exclVat: customerChequePortfolio,
    vat: 0,
    inclVat: customerChequePortfolio,
  })
  const noteParts = moneyCardValue({
    exclVat: customerPromissoryNotePortfolio,
    vat: 0,
    inclVat: customerPromissoryNotePortfolio,
  })
  const receivableValues = moneyCardValue(receivableParts)
  const payableValues = moneyCardValue(payableParts)
  const stockValues = moneyCardValue(stockParts)
  const liveValues = moneyCardValue(liveParts)
  const futureValues = moneyCardValue(futureParts)
  const possibleValues = moneyCardValue(possibleParts)

  const baseCards = [
    {
      id: 'cash',
      label: 'Nakit Kasa',
      ...cashParts,
      sub: `${cashAccounts.length} nakit kasa toplamı`,
      href: '/kasa',
      tone: 'text-emerald-300',
      iconTone: 'text-emerald-300',
      icon: Banknote,
    },
    {
      id: 'bank',
      label: 'Bankalar',
      ...bankParts,
      sub: `${bankAccounts.length} banka hesabı toplamı`,
      href: '/kasa',
      tone: 'text-blue-300',
      iconTone: 'text-blue-300',
      icon: Landmark,
    },
    {
      id: 'receivables',
      label: 'Tahsilat Bekleyen',
      ...receivableValues,
      sub: 'Müşteri cari alacak · KDV hariç / dahil',
      href: '/musteriler',
      tone: 'text-cyan-300',
      valueTone: 'text-orange-500',
      iconTone: 'text-cyan-300',
      icon: ReceiptText,
    },
    {
      id: 'payables',
      label: 'Ödenecekler Toplamı',
      ...payableValues,
      sub: 'Tedarikçi cari borç · KDV hariç / dahil',
      href: '/giderler/tedarikciler',
      tone: 'text-orange-300',
      valueTone: 'text-red-600',
      iconTone: 'text-orange-300',
      icon: WalletCards,
    },
    {
      id: 'stock-value',
      label: 'Stok Toplam Değeri',
      ...stockValues,
      sub: `${stockReport.totalUnits.toLocaleString('tr-TR')} adet · maliyet · KDV hariç / dahil`,
      href: '/stok/urunler',
      tone: 'text-teal-300',
      valueTone: 'text-teal-600',
      iconTone: 'text-teal-300',
      icon: Boxes,
    },
    {
      id: 'cheques',
      label: 'Portföydeki Çekler',
      ...chequeParts,
      sub: `${customerChequeRows.length} müşteri çeki`,
      href: '/nakit/cekler',
      tone: 'text-purple-300',
      iconTone: 'text-purple-300',
      icon: CircleDollarSign,
    },
    {
      id: 'promissory-notes',
      label: 'Portföydeki Senetler',
      ...noteParts,
      sub: `${customerPromissoryNoteRows.length} müşteri senedi`,
      href: '/nakit/cekler',
      tone: 'text-fuchsia-300',
      iconTone: 'text-fuchsia-300',
      icon: ScrollText,
    },
    {
      id: 'future',
      label: 'Gelecek Tutar',
      ...futureValues,
      sub: 'Sipariş + üretim · teklif/depo hariç',
      tone: 'text-emerald-300',
      iconTone: 'text-emerald-300',
      icon: Banknote,
      featured: true,
    },
    {
      id: 'possible',
      label: 'Genel Olası Tutar',
      ...possibleValues,
      sub: 'Canlı varlık + gelecek tutar · KDV hariç / dahil',
      href: '/kasa',
      tone: 'text-gray-100',
      valueTone: 'text-blue-600',
      iconTone: 'text-emerald-300',
      icon: WalletCards,
      featured: true,
    },
    {
      id: 'live-assets',
      label: 'Toplam Canlı Varlık',
      ...liveValues,
      sub: `${cashAccounts.length} nakit + ${bankAccounts.length} banka + ${chequeAccounts.length} çek kasası`,
      tone: 'text-gray-100',
      valueTone: 'text-emerald-700',
      iconTone: 'text-blue-300',
      icon: Landmark,
      featured: true,
    },
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
    <section className="glass p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-[var(--ink)]">Finans Analizi</h2>
          <p className="text-xs font-semibold text-[var(--muted)]">
            Kasa, banka, çek portföyü ve üretim sonrası beklenen toplamlar
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-green">Canlı kasa</span>
          <span className="badge badge-blue">Olası toplam</span>
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
