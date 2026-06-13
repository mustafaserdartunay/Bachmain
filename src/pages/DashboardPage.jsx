import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Factory,
  FileText,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import ActionTimeline from '../components/Dashboard/ActionTimeline'
import KpiCard from '../components/Dashboard/KpiCard'
import SalesChart from '../components/Dashboard/SalesChart'
import OrderStatusChart from '../components/Dashboard/OrderStatusChart'
import QuotesPipelineChart from '../components/Dashboard/QuotesPipelineChart'
import StockLevelChart from '../components/Dashboard/StockLevelChart'
import DealerPerformanceChart from '../components/Dashboard/DealerPerformanceChart'
import OperationsBoard from '../components/Dashboard/OperationsBoard'
import StatusAnalysisBoard from '../components/Dashboard/StatusAnalysisBoard'
import { stats } from '../data/mockData'
import { getDashboardAnalytics, formatCurrency } from '../utils/dashboardAlerts'
import { formatTreasuryCurrency, getTreasuryAccounts, getTreasuryMovements, calculateAccountBalance } from '../utils/treasuryStore'

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  const analytics = getDashboardAnalytics()
  const treasuryTotal = getTreasuryAccounts().reduce(
    (sum, account) => sum + calculateAccountBalance(account, getTreasuryMovements()),
    0,
  )

  const extendedKpis = [
    { ...stats[0], title: 'Yeni Siparişler' },
    { ...stats[1], title: 'Üretimdeki İşler', value: analytics.productionActive },
    { ...stats[2], title: 'Bekleyen Teklifler', value: analytics.quotesPending },
    {
      title: 'Tahsilat Bekleyen',
      value: formatCurrency(analytics.tahsilatBekleyen),
      trend: analytics.overdueTotal > 0 ? `${analytics.overdueTotal} gecikmiş` : 'Güncel',
      color: 'green',
      sparkline: [120, 140, 135, 150, 160, 155],
    },
    {
      title: 'Kasa Bakiyesi',
      value: formatTreasuryCurrency(treasuryTotal),
      trend: 'Anlık',
      color: 'cyan',
      sparkline: [80, 82, 85, 88, 90, 92],
    },
    {
      title: 'Kritik Uyarı',
      value: analytics.overdueTotal,
      trend: analytics.overdueTotal > 0 ? 'Aksiyon gerekli' : 'Temiz',
      color: 'purple',
      sparkline: [2, 3, 4, 5, analytics.overdueTotal, analytics.overdueTotal],
    },
  ]

  return (
    <div className="space-y-5 overflow-x-hidden">
      <section className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">Operasyon kontrol merkezi</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-wide text-blue-300">Dashboard</h1>
            <p className="mt-1 text-xs text-gray-500">{today}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {analytics.overdueTotal > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
                <AlertTriangle className="h-3.5 w-3.5" /> {analytics.overdueTotal} geciken kayıt
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" /> {analytics.ordersActive} aktif sipariş
            </span>
            <Link to="/teklifler" className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-dark-700">
              <FileText className="mr-1 inline h-3.5 w-3.5" />Teklifler
            </Link>
            <Link to="/siparisler" className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-dark-700">
              <ShoppingCart className="mr-1 inline h-3.5 w-3.5" />Siparişler
            </Link>
            <Link to="/crm" className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 hover:bg-dark-700">
              Crm
            </Link>
            <Link to="/kasa" className="btn-primary inline-flex items-center gap-1 px-3 py-2 text-xs">
              <Wallet className="h-3.5 w-3.5" /> Kasa
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {extendedKpis.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </section>

      <StatusAnalysisBoard />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
              <SalesChart />
            </div>
            <div className="min-w-0 lg:col-span-2">
              <OrderStatusChart />
            </div>
          </div>

          <OperationsBoard />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <QuotesPipelineChart />
            <StockLevelChart />
          </div>

          <DealerPerformanceChart />
        </div>

        <div className="min-w-0">
          <ActionTimeline />
        </div>
      </div>
    </div>
  )
}
