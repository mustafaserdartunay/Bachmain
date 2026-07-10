import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Factory,
  FileText,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react'
import { statusBadgeMap, formatCurrency } from '../../data/mockData'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  getDetailedCrm,
  getDetailedOrders,
  getDetailedProduction,
  getDetailedQuotes,
} from '../../utils/dashboardAlerts'
import CrmWorkspace from '../Crm/CrmWorkspace'

const orderProgress = {
  Yeni: 15,
  Üretimde: 45,
  Paketlemede: 65,
  Kargoda: 85,
  Tamamlandı: 100,
}

const productionStages = ['Kesim', 'Baskı', 'Montaj', 'Kalite Kontrol', 'Sevkiyat']

function progressColor(value) {
  if (value >= 80) return 'from-emerald-500 to-emerald-400'
  if (value >= 50) return 'from-blue-500 to-cyan-400'
  if (value >= 25) return 'from-amber-500 to-orange-400'
  return 'from-red-500 to-orange-500'
}

function TabButton({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
        active
          ? 'border-blue-500/35 bg-blue-500/10 text-blue-200'
          : 'border-dark-500/50 bg-dark-700/40 text-gray-400 hover:text-gray-200'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className={`rounded-md px-1.5 py-0.5 text-[12px] ${active ? 'bg-blue-500/20' : 'bg-dark-600'}`}>{count}</span>
    </button>
  )
}

function QuotesTab() {
  const quotes = getDetailedQuotes()
  return (
    <div className="space-y-2">
      {quotes.map((quote) => (
        <div key={quote.id} className="rounded-xl border border-dark-500/40 bg-dark-700/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black text-blue-400">{quote.id}</p>
                <span className={statusBadgeMap[quote.status]}>{quote.status}</span>
              </div>
              <p className="mt-1 truncate text-sm font-bold text-white">{getCustomerDisplay(quote.customer).brandShortName}</p>
              <p className="text-[12px] text-gray-500">Oluşturma {quote.date} · Son tarih {quote.expiry}</p>
            </div>
            <p className="shrink-0 text-sm font-black text-emerald-300">{formatCurrency(quote.amount)}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-600">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${quote.status === 'Kabul Edildi' ? 'from-emerald-500 to-emerald-400' : quote.status === 'Reddedildi' ? 'from-red-500 to-red-400' : 'from-amber-500 to-amber-400'}`}
                style={{ width: quote.status === 'Kabul Edildi' ? '100%' : quote.status === 'Bekliyor' ? '55%' : '20%' }}
              />
            </div>
            <span className="text-[12px] font-bold text-gray-500">
              {quote.status === 'Kabul Edildi' ? 'Onaylandı' : quote.status === 'Bekliyor' ? 'Müşteri yanıtı bekleniyor' : 'Kapandı'}
            </span>
          </div>
        </div>
      ))}
      <Link to="/teklifler" className="block pt-1 text-center text-[12px] font-bold text-blue-400 hover:text-blue-300">Teklif listesine git →</Link>
    </div>
  )
}

function OrdersTab() {
  const orders = getDetailedOrders()
  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const progress = orderProgress[order.status] || 20
        return (
          <div key={order.id} className="rounded-xl border border-dark-500/40 bg-dark-700/30 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black text-blue-400">{order.id}</p>
                  <span className={statusBadgeMap[order.status]}>{order.status}</span>
                  {order.paymentStatus === 'Bekliyor' && (
                    <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-bold text-red-300">Ödeme bekliyor</span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm font-bold text-white">{getCustomerDisplay(order.customer).brandShortName}</p>
                <p className="text-[12px] text-gray-500">
                  {order.assignedTo} · Teslim {order.delivery} · {order.items?.length || 0} kalem
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-white">{formatCurrency(order.amount)}</p>
                <p className="text-[12px] text-gray-500">{order.paymentMethod}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[12px] font-bold text-gray-500">
                <span>Sipariş ilerlemesi</span>
                <span className="text-blue-300">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-dark-600">
                <div className={`h-full rounded-full bg-gradient-to-r ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
            {order.timeline?.[0] && (
              <p className="mt-2 truncate text-[12px] text-gray-500">Son: {order.timeline[order.timeline.length - 1]?.action}</p>
            )}
          </div>
        )
      })}
      <Link to="/siparisler" className="block pt-1 text-center text-[12px] font-bold text-blue-400 hover:text-blue-300">Sipariş listesine git →</Link>
    </div>
  )
}

function ProductionTab() {
  const jobs = getDetailedProduction()
  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const stageIndex = productionStages.indexOf(job.stage)
        const progress = stageIndex >= 0 ? Math.round(((stageIndex + 1) / productionStages.length) * 100) : 30
        const isLate = job.endDate && new Date(job.endDate.split('.').reverse().join('-')) < new Date()
        return (
          <div key={job.workOrder} className={`rounded-xl border p-3 ${isLate ? 'border-red-500/35 bg-red-500/8' : 'border-dark-500/40 bg-dark-700/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black text-purple-300">{job.workOrder}</p>
                  <span className={statusBadgeMap[job.status]}>{job.status}</span>
                  {isLate && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[11px] font-black text-red-300">Termin gecikti</span>}
                </div>
                <p className="mt-1 truncate text-sm font-bold text-white">{job.product}</p>
                <p className="text-[12px] text-gray-500">{job.orderId} · {job.quantity.toLocaleString('tr-TR')} adet · Bitiş {job.endDate}</p>
              </div>
              <p className="shrink-0 rounded-lg bg-purple-500/15 px-2 py-1 text-[12px] font-black text-purple-200">{job.stage}</p>
            </div>
            <div className="mt-3 flex gap-1">
              {productionStages.map((stage, index) => (
                <div
                  key={stage}
                  className={`h-1.5 flex-1 rounded-full ${index <= stageIndex ? 'bg-emerald-500' : index === stageIndex + 1 ? 'bg-blue-500 animate-pulse' : 'bg-dark-600'}`}
                  title={stage}
                />
              ))}
            </div>
            <p className="mt-2 text-[12px] font-bold text-gray-500">İlerleme {progress}% · Aktif aşama: {job.stage}</p>
          </div>
        )
      })}
      <Link to="/uretim" className="block pt-1 text-center text-[12px] font-bold text-blue-400 hover:text-blue-300">Üretim takibine git →</Link>
    </div>
  )
}

function CrmTab() {
  return <CrmWorkspace variant="compact" defaultTab="agenda" />
}

export default function OperationsBoard() {
  const [tab, setTab] = useState('orders')
  const quotes = getDetailedQuotes()
  const orders = getDetailedOrders()
  const production = getDetailedProduction()
  const crm = getDetailedCrm()

  return (
    <section className="rounded-2xl border border-dark-500/50 bg-dark-800/70 shadow-card">
      <div className="border-b border-dark-500/45 p-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Operasyon Merkezi</h2>
        <p className="mt-0.5 text-xs text-gray-500">Teklif · sipariş · üretim · CRM detay takibi</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <TabButton active={tab === 'quotes'} icon={FileText} label="Teklif" count={quotes.length} onClick={() => setTab('quotes')} />
          <TabButton active={tab === 'orders'} icon={ShoppingCart} label="Sipariş" count={orders.length} onClick={() => setTab('orders')} />
          <TabButton active={tab === 'production'} icon={Factory} label="Üretim" count={production.length} onClick={() => setTab('production')} />
          <TabButton active={tab === 'crm'} icon={CheckSquare} label="CRM" count={crm.tasks.filter((t) => t.status !== 'Tamamlandı').length} onClick={() => setTab('crm')} />
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto p-4">
        {tab === 'quotes' && <QuotesTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'production' && <ProductionTab />}
        {tab === 'crm' && <CrmTab />}
      </div>
    </section>
  )
}
