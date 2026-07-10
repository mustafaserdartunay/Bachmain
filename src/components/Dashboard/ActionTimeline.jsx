import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CreditCard,
  Repeat,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { getPaymentActionTimeline, formatCurrency } from '../../utils/paymentTimeline'
import { RECURRING_PAYMENTS_EVENT } from '../../utils/recurringPaymentsStore'

const categoryIcon = {
  'Tekrarlayan Ödeme': Repeat,
  'Tedarikçi Ödemesi': Building2,
  'Maaş Ödemesi': UsersRound,
  'Genel Gider': Wallet,
  'Çek Ödemesi': CreditCard,
  Ödeme: CreditCard,
}

function urgencyStyles(item) {
  if (item.overdue || item.dueToday) {
    return {
      dot: 'bg-red-400 ring-red-400/20',
      card: 'border-red-400/25 bg-red-500/10 shadow-[inset_3px_0_0_rgba(248,113,113,0.65)]',
      badge: 'border-red-400/25 bg-red-500/15 text-red-300',
      label: item.overdue ? 'GECİKTİ' : 'BUGÜN',
      title: 'text-gray-100',
      meta: 'text-gray-400',
      date: 'text-red-300',
      amount: 'text-red-300',
    }
  }
  if (item.urgency === 'soon') {
    return {
      dot: 'bg-orange-400 ring-orange-400/20',
      card: 'border-orange-400/25 bg-orange-500/10 shadow-[inset_3px_0_0_rgba(251,146,60,0.6)]',
      badge: 'border-orange-400/25 bg-orange-500/15 text-orange-200',
      label: 'YAKIN',
      title: 'text-gray-100',
      meta: 'text-gray-400',
      date: 'text-orange-200',
      amount: 'text-orange-200',
    }
  }
  return {
    dot: 'bg-emerald-400 ring-emerald-400/20',
    card: 'border-dark-500/50 bg-dark-700/25 shadow-[inset_3px_0_0_rgba(52,211,153,0.42)]',
    badge: 'border-dark-500/50 bg-dark-600/70 text-gray-300',
    label: 'PLANLI',
    title: 'text-gray-200',
    meta: 'text-gray-400',
    date: 'text-gray-400',
    amount: 'text-emerald-300',
  }
}

export default function ActionTimeline() {
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    function refresh() {
      setRevision((current) => current + 1)
    }
    window.addEventListener('erlenbox:treasury-updated', refresh)
    window.addEventListener('bach:personnel-updated', refresh)
    window.addEventListener(RECURRING_PAYMENTS_EVENT, refresh)
    return () => {
      window.removeEventListener('erlenbox:treasury-updated', refresh)
      window.removeEventListener('bach:personnel-updated', refresh)
      window.removeEventListener(RECURRING_PAYMENTS_EVENT, refresh)
    }
  }, [])

  void revision

  const items = getPaymentActionTimeline()
  const overdueCount = items.filter((item) => item.overdue || item.dueToday).length

  return (
    <aside className="flex h-full min-h-[42rem] flex-col rounded-3xl border border-dark-500/55 bg-dark-800/75 shadow-card">
      <div className="border-b border-dark-500/45 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Tekrarlayan Ödemeler Zaman Çizelgesi</h2>
            <p className="mt-0.5 text-[13px] font-semibold text-gray-400">Tekrarlayan · tedarikçi · maaş · gider</p>
          </div>
          {overdueCount > 0 && (
            <span className="shrink-0 rounded-full border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[12px] font-black text-red-300">
              {overdueCount} ödeme
            </span>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dark-500/45 bg-dark-700/25 px-4 py-8 text-center text-xs font-semibold text-gray-500">
            Planlı ödeme bulunamadı.
          </div>
        ) : (
          <>
            <div className="absolute bottom-4 left-[23px] top-4 w-px bg-dark-500/45" />
            <div className="space-y-2.5">
              {items.map((item) => {
                const styles = urgencyStyles(item)
                const Icon = categoryIcon[item.category] || CreditCard
                return (
                  <Link
                    key={item.id}
                    to={item.link || '/kasa'}
                    className={`relative ml-0 block rounded-2xl border px-3 py-3 pl-9 transition-colors hover:border-blue-400/35 hover:bg-dark-700/45 ${styles.card}`}
                  >
                    <span className={`absolute left-3 top-4 z-10 h-2.5 w-2.5 rounded-full ring-[5px] ${styles.dot}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black uppercase ${styles.badge}`}>{styles.label}</span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wide text-gray-400">
                            <Icon className="h-3 w-3" /> {item.category}
                          </span>
                          {item.recurring && (
                            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-300">Tekrarlayan</span>
                          )}
                        </div>
                        <p className={`truncate text-sm font-black ${styles.title}`}>{item.title}</p>
                        <p className={`mt-1 truncate text-xs font-semibold ${styles.meta}`}>{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className={`text-[13px] font-black ${styles.date}`}>
                        {item.dateLabel}
                        {item.overdue && ` · ${Math.abs(item.daysUntil)} gün gecikti`}
                        {item.dueToday && !item.overdue && ' · Bugün'}
                        {!item.overdue && !item.dueToday && item.daysUntil > 0 && ` · ${item.daysUntil} gün`}
                      </span>
                      {item.amount > 0 && (
                        <span className={`shrink-0 text-sm font-black ${styles.amount}`}>
                          {formatCurrency(item.amount)}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-dark-500/45 p-3 text-center">
        <Link to="/kasa" className="inline-flex items-center gap-1 text-[13px] font-black text-blue-400 hover:text-blue-300">
          Kasa ve ödemeler <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  )
}
