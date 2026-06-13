import { Link } from 'react-router-dom'
import { getDashboardAnalytics, formatCurrency } from '../../utils/dashboardAlerts'

function MetricCell({ label, value, sub, tone = 'text-white', alert = false, href }) {
  const content = (
    <div className={`rounded-xl border p-3 ${alert ? 'border-red-500/35 bg-red-500/8' : 'border-dark-500/40 bg-dark-700/30'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${tone}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-[10px] ${alert ? 'text-red-300/80' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  )
  if (href) return <Link to={href} className="block">{content}</Link>
  return content
}

export default function StatusAnalysisBoard() {
  const a = getDashboardAnalytics()

  return (
    <section className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-white">Durum Analizi</h2>
          <p className="text-xs text-gray-500">Anlık operasyon ve risk göstergeleri</p>
        </div>
        <div className="flex gap-2">
          {a.overdueTotal > 0 && (
            <span className="rounded-lg bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300">{a.overdueTotal} kritik</span>
          )}
          <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Canlı</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCell label="Aktif Sipariş" value={a.ordersActive} sub={`${a.ordersLate} termin gecikmesi`} alert={a.ordersLate > 0} href="/siparisler" tone="text-blue-300" />
        <MetricCell label="Üretimde İE" value={a.productionActive} sub={`${a.productionLate} geciken iş emri`} alert={a.productionLate > 0} href="/uretim" tone="text-purple-300" />
        <MetricCell label="Bekleyen Teklif" value={a.quotesPending} sub={`%${a.quoteConversion} dönüşüm`} href="/teklifler" tone="text-amber-300" />
        <MetricCell label="Açık Görev" value={a.tasksOpen} sub={`${a.tasksOverdue} geciken · %${a.taskCompletion} tamamlanma`} alert={a.tasksOverdue > 0} href="/crm" tone="text-orange-300" />
        <MetricCell label="Bugün Randevu" value={a.appointmentsToday} sub={`${a.dueTodayTotal} bugün vadesi dolan`} href="/crm" tone="text-cyan-300" />
        <MetricCell label="Tahsilat Bekleyen" value={formatCurrency(a.tahsilatBekleyen)} sub={`Ödeme: ${formatCurrency(a.odemeBekleyen)}`} alert={a.overdueTotal > 0} href="/kasa" tone="text-emerald-300" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/25 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">Sipariş Sağlığı</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-600">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.max(20, 100 - a.ordersLate * 12)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">{a.ordersLate === 0 ? 'Terminler kontrol altında' : `${a.ordersLate} sipariş riskli`}</p>
        </div>
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/25 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">Üretim Kapasitesi</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-600">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400" style={{ width: `${Math.min(95, a.productionActive * 18)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">{a.productionActive} aktif hat · {a.productionLate} gecikme</p>
        </div>
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/25 p-3">
          <p className="text-[10px] font-bold uppercase text-gray-500">CRM Verimlilik</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-600">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${a.taskCompletion}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">Görev tamamlama %{a.taskCompletion} · {a.recurringTotal} tekrarlayan kayıt</p>
        </div>
      </div>
    </section>
  )
}
