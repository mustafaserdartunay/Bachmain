import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckSquare,
  CreditCard,
  RefreshCw,
  Repeat,
  Wallet,
} from 'lucide-react'
import { getActionTimeline, formatCurrency } from '../../utils/dashboardAlerts'

const categoryIcon = {
  Tahsilat: Wallet,
  Ödeme: CreditCard,
  'Tekrarlayan Tahsilat': Repeat,
  'Tekrarlayan Ödeme': Repeat,
  Görev: CheckSquare,
  Randevu: Calendar,
  'Teklif Süresi': AlertTriangle,
  'Üretim Termin': RefreshCw,
  'Sipariş Ödemesi': CreditCard,
  'Cari Risk': AlertTriangle,
}

function urgencyStyles(urgency, overdue) {
  if (overdue) {
    return {
      dot: 'bg-red-500 ring-red-500/30',
      card: 'border-red-500/40 bg-red-500/10',
      badge: 'bg-red-500/20 text-red-300',
      label: 'GECİKTİ',
      title: 'text-red-100',
      meta: 'text-red-300/80',
    }
  }
  if (urgency === 'today') {
    return {
      dot: 'bg-amber-400 ring-amber-400/30',
      card: 'border-amber-500/35 bg-amber-500/8',
      badge: 'bg-amber-500/20 text-amber-200',
      label: 'BUGÜN',
      title: 'text-amber-50',
      meta: 'text-amber-200/80',
    }
  }
  if (urgency === 'soon') {
    return {
      dot: 'bg-blue-400 ring-blue-400/30',
      card: 'border-blue-500/25 bg-blue-500/5',
      badge: 'bg-blue-500/15 text-blue-200',
      label: 'YAKIN',
      title: 'text-gray-100',
      meta: 'text-gray-400',
    }
  }
  return {
    dot: 'bg-emerald-400 ring-emerald-400/20',
    card: 'border-dark-500/40 bg-dark-700/25',
    badge: 'bg-dark-600 text-gray-400',
    label: 'PLANLI',
    title: 'text-gray-200',
    meta: 'text-gray-500',
  }
}

export default function ActionTimeline() {
  const items = getActionTimeline()
  const overdueCount = items.filter((i) => i.overdue).length

  return (
    <aside className="rounded-2xl border border-dark-500/50 bg-dark-800/70 shadow-card lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
      <div className="border-b border-dark-500/45 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-white">Aksiyon Zaman Çizelgesi</h2>
            <p className="mt-0.5 text-[10px] text-gray-500">Ödeme · tekrarlayan · görev · randevu</p>
          </div>
          {overdueCount > 0 && (
            <span className="rounded-lg bg-red-500/20 px-2 py-1 text-[10px] font-black text-red-300">
              {overdueCount} gecikmiş
            </span>
          )}
        </div>
      </div>

      <div className="relative p-4">
        <div className="absolute bottom-4 left-[27px] top-4 w-px bg-dark-500/60" />
        <div className="space-y-3">
          {items.map((item) => {
            const styles = urgencyStyles(item.urgency, item.overdue)
            const Icon = categoryIcon[item.category] || AlertTriangle
            return (
              <Link
                key={item.id}
                to={item.link || '/crm'}
                className={`relative ml-0 block rounded-xl border p-3 pl-10 transition-colors hover:brightness-110 ${styles.card}`}
              >
                <span className={`absolute left-3 top-4 z-10 h-3 w-3 rounded-full ring-4 ${styles.dot}`} />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${styles.badge}`}>{styles.label}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-gray-500">
                        <Icon className="h-3 w-3" /> {item.category}
                      </span>
                      {item.recurring && (
                        <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">Tekrarlayan</span>
                      )}
                    </div>
                    <p className={`truncate text-xs font-bold ${styles.title}`}>{item.title}</p>
                    <p className={`mt-0.5 truncate text-[10px] ${styles.meta}`}>{item.subtitle}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold ${item.overdue ? 'text-red-400' : 'text-gray-500'}`}>
                    {item.dateLabel}
                    {item.overdue && ` · ${Math.abs(item.daysUntil)} gün gecikti`}
                    {item.dueToday && ' · Bugün'}
                    {!item.overdue && !item.dueToday && item.daysUntil > 0 && ` · ${item.daysUntil} gün`}
                  </span>
                  {item.amount > 0 && (
                    <span className={`shrink-0 text-xs font-black ${item.overdue ? 'text-red-300' : 'text-emerald-300'}`}>
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="border-t border-dark-500/45 p-3 text-center">
        <Link to="/crm" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300">
          Tüm takip merkezi <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  )
}
