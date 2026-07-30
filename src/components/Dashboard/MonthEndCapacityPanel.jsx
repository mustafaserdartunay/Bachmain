import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CircleAlert,
  CircleCheckBig,
  Factory,
  Landmark,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  WalletCards,
  Warehouse,
} from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { buildMonthEndPaymentCapacity } from '../../utils/monthEndPaymentCapacity'
import { RECURRING_PAYMENTS_EVENT } from '../../utils/recurringPaymentsStore'

const STATUS_STYLES = {
  red: {
    label: 'Açık',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-600',
    text: 'text-rose-600',
    marker: 'border-rose-600 bg-rose-500',
  },
  orange: {
    label: 'Sınırda',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-600',
    text: 'text-amber-600',
    marker: 'border-amber-600 bg-amber-500',
  },
  green: {
    label: 'Güçlü',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600',
    text: 'text-emerald-600',
    marker: 'border-emerald-600 bg-emerald-500',
  },
}

const REFRESH_EVENTS = [
  'erlenbox:treasury-updated',
  'bach:personnel-updated',
  RECURRING_PAYMENTS_EVENT,
  'bach:customers-updated',
  'bach:customer-meta-updated',
  'bach:orders-updated',
  'bach:production-updated',
  'bach:depo-updated',
  'bachmain:org-scope-changed',
  'bach:org-context-changed',
]

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function StatusBadge({ tone }) {
  const style = STATUS_STYLES[tone] || STATUS_STYLES.red
  const Icon = tone === 'green' ? CircleCheckBig : CircleAlert
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${style.badge}`}
    >
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  )
}

function CapacityBar({ status }) {
  const style = STATUS_STYLES[status.tone] || STATUS_STYLES.red
  return (
    <div className="pt-1">
      <div className="relative h-3 overflow-visible rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 shadow-inner">
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md ${style.marker}`}
          style={{ left: `${status.marker}%` }}
          aria-label={`Karşılama oranı yüzde ${Math.round(status.coverage)}`}
        />
      </div>
    </div>
  )
}

function MetricCell({ label, value, icon: Icon, href, tone = 'text-[var(--ink)]', title }) {
  const content = (
    <>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/60 ${tone}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
          {label}
        </span>
        <span className={`block truncate text-xs font-black tabular-nums ${tone}`}>
          {money(value)}
        </span>
      </span>
    </>
  )

  if (href) {
    return (
      <Link
        to={href}
        title={title || label}
        className="flex min-w-0 items-center gap-2 rounded-xl bg-white/45 px-2 py-2 transition-colors hover:bg-white/70"
      >
        {content}
      </Link>
    )
  }
  return (
    <div
      title={title || label}
      className="flex min-w-0 items-center gap-2 rounded-xl bg-white/45 px-2 py-2"
    >
      {content}
    </div>
  )
}

function CurrentCapacity({ data }) {
  const style = STATUS_STYLES[data.tone] || STATUS_STYLES.red
  return (
    <article className="glass-inset flex min-w-0 flex-col rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Landmark className="h-4 w-4" />
          </span>
          <p className="truncate text-xs font-extrabold text-[var(--ink)]">Mevcut Denge</p>
        </div>
        <StatusBadge tone={data.tone} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/35 p-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Net Denge
          </p>
          <p className={`truncate text-lg font-black tabular-nums ${style.text}`}>
            {data.balance >= 0 ? '+' : '−'}
            {money(Math.abs(data.balance))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Karşılama
          </p>
          <p className={`text-lg font-black tabular-nums ${style.text}`}>
            %{Math.max(0, Math.round(data.coverage))}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <CapacityBar status={data} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <MetricCell
          label="Varlık"
          value={data.liveAssets}
          icon={Landmark}
          href="/kasa"
          tone="text-blue-600"
        />
        <MetricCell
          label="Alacak"
          value={data.receivables}
          icon={ReceiptText}
          href="/musteriler"
          tone="text-cyan-600"
        />
        <MetricCell
          label="Ödemeler"
          value={data.obligations}
          icon={WalletCards}
          href="/giderler/tedarikciler"
          tone="text-rose-600"
          title={`Tedarikçi ${money(data.supplierPayables)} · Maaş ${money(data.payroll)} · Gider ${money(data.fixedExpenses)}`}
        />
      </div>
    </article>
  )
}

function OperationalCapacity({ operational, projected }) {
  const style = STATUS_STYLES[projected.tone] || STATUS_STYLES.red
  return (
    <article className="glass-inset flex min-w-0 flex-col rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-600">
            <Factory className="h-4 w-4" />
          </span>
          <p className="truncate text-xs font-extrabold text-[var(--ink)]">Operasyonel Senaryo</p>
        </div>
        <StatusBadge tone={projected.tone} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/35 p-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Senaryo Neti
          </p>
          <p className={`truncate text-lg font-black tabular-nums ${style.text}`}>
            {projected.balance >= 0 ? '+' : '−'}
            {money(Math.abs(projected.balance))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Karşılama
          </p>
          <p className={`text-lg font-black tabular-nums ${style.text}`}>
            %{Math.max(0, Math.round(projected.coverage))}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <CapacityBar status={projected} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <MetricCell
          label={`Sipariş · ${operational.counts.orders}`}
          value={operational.orders}
          icon={ShoppingCart}
          href="/siparisler"
          tone="text-emerald-600"
        />
        <MetricCell
          label={`Üretim · ${operational.counts.production}`}
          value={operational.production}
          icon={Factory}
          href="/uretim"
          tone="text-fuchsia-600"
        />
        <MetricCell
          label={`Depo · ${operational.counts.depot}`}
          value={operational.depot}
          icon={Warehouse}
          href="/depo"
          tone="text-amber-600"
        />
      </div>
    </article>
  )
}

export default function MonthEndCapacityPanel() {
  const [snapshot, setSnapshot] = useState(() => buildMonthEndPaymentCapacity())

  useEffect(() => {
    const refresh = () => setSnapshot(buildMonthEndPaymentCapacity())
    REFRESH_EVENTS.forEach((event) => window.addEventListener(event, refresh))
    window.addEventListener('storage', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      REFRESH_EVENTS.forEach((event) => window.removeEventListener(event, refresh))
      window.removeEventListener('storage', refresh)
      window.clearInterval(timer)
    }
  }, [])

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <p className="truncate text-sm font-black text-[var(--ink)]">Ay Sonu Nakit Dengesi</p>
        </div>
        <span className="shrink-0 rounded-lg bg-white/45 px-2.5 py-1 text-[10px] font-extrabold capitalize text-[var(--muted)]">
          {snapshot.monthLabel}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <CurrentCapacity data={snapshot.current} />
        <OperationalCapacity operational={snapshot.operational} projected={snapshot.projected} />
      </div>

      <div
        title="Operasyonel değer brüt nakit senaryosudur; gerçekleşmiş tahsilat veya kâr değildir."
        className="mt-3 flex items-center gap-2 rounded-xl bg-white/35 px-3 py-2"
      >
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <p className="min-w-0 flex-1 truncate text-[10px] font-bold text-[var(--ink)]">
          {snapshot.guidance}
        </p>
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
          Brüt senaryo
        </span>
      </div>
    </section>
  )
}
