import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  CircleCheckBig,
  Factory,
  Landmark,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  UsersRound,
  WalletCards,
  Warehouse,
} from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { buildMonthEndPaymentCapacity } from '../../utils/monthEndPaymentCapacity'
import { RECURRING_PAYMENTS_EVENT } from '../../utils/recurringPaymentsStore'

const STATUS_STYLES = {
  red: {
    label: 'Ödeme açığı var',
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
    label: 'Ödemeler karşılanıyor',
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
    <div>
      <div className="relative h-3 overflow-visible rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 shadow-inner">
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md ${style.marker}`}
          style={{ left: `${status.marker}%` }}
          aria-label={`Karşılama oranı yüzde ${Math.round(status.coverage)}`}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
        <span>Açık</span>
        <span>Sınırda</span>
        <span>Güçlü</span>
      </div>
    </div>
  )
}

function AmountCell({ label, value, icon: Icon, href, tone = 'text-[var(--ink)]' }) {
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} />
        <span className="truncate text-[10px] font-bold text-[var(--muted)]">{label}</span>
      </span>
      <span className={`mt-1 block text-sm font-black tabular-nums ${tone}`}>{money(value)}</span>
    </>
  )

  if (href) {
    return (
      <Link
        to={href}
        className="rounded-xl bg-white/45 px-2.5 py-2 transition-colors hover:bg-white/70"
      >
        {content}
      </Link>
    )
  }
  return <div className="rounded-xl bg-white/45 px-2.5 py-2">{content}</div>
}

function CurrentCapacity({ data }) {
  const style = STATUS_STYLES[data.tone] || STATUS_STYLES.red
  return (
    <article className="glass-inset flex min-w-0 flex-col rounded-2xl p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold text-[var(--ink)]">1. Alacak–Borç Ödeme Gücü</p>
          <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
            Mevcut varlık + müşteri alacağı / zorunlu ödemeler
          </p>
        </div>
        <StatusBadge tone={data.tone} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <AmountCell
          label="Canlı Varlık"
          value={data.liveAssets}
          icon={Landmark}
          href="/kasa"
          tone="text-blue-600"
        />
        <AmountCell
          label="Müşteri Alacağı"
          value={data.receivables}
          icon={ReceiptText}
          href="/musteriler"
          tone="text-cyan-600"
        />
        <AmountCell
          label="Tedarikçi Borcu"
          value={data.supplierPayables}
          icon={WalletCards}
          href="/giderler/tedarikciler"
          tone="text-rose-600"
        />
        <AmountCell
          label="Kalan Maaş"
          value={data.payroll}
          icon={UsersRound}
          href="/personel"
          tone="text-violet-600"
        />
        <AmountCell
          label="Sabit Genel Gider"
          value={data.fixedExpenses}
          icon={WalletCards}
          href="/kasa"
          tone="text-orange-600"
        />
        <AmountCell
          label={data.balance >= 0 ? 'Ödeme Sonrası Artı' : 'Kapanması Gereken Açık'}
          value={Math.abs(data.balance)}
          icon={data.balance >= 0 ? TrendingUp : CircleAlert}
          tone={style.text}
        />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-end justify-between gap-3">
          <span className="text-[10px] font-bold text-[var(--muted)]">Karşılama oranı</span>
          <span className={`text-base font-black tabular-nums ${style.text}`}>
            %{Math.max(0, Math.round(data.coverage))}
          </span>
        </div>
        <CapacityBar status={data} />
      </div>
    </article>
  )
}

function ProcessStep({ label, value, count, icon: Icon, href, tone }) {
  return (
    <Link
      to={href}
      className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/45 px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:bg-white/70"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70 ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-bold text-[var(--muted)]">
          {label} · {count}
        </span>
        <span className={`block truncate text-sm font-black tabular-nums ${tone}`}>
          {money(value)}
        </span>
      </span>
    </Link>
  )
}

function OperationalCapacity({ operational, projected, guidance }) {
  const style = STATUS_STYLES[projected.tone] || STATUS_STYLES.red
  return (
    <article className="glass-inset flex min-w-0 flex-col rounded-2xl p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold text-[var(--ink)]">2. Operasyonel Nakit Rotası</p>
          <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
            Sipariş → üretim → depo → satış/tahsilat
          </p>
        </div>
        <StatusBadge tone={projected.tone} />
      </div>

      <div className="mt-3 flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
        <ProcessStep
          label="Siparişte"
          value={operational.orders}
          count={operational.counts.orders}
          icon={ShoppingCart}
          href="/siparisler"
          tone="text-emerald-600"
        />
        <ArrowRight className="mx-auto h-3.5 w-3.5 rotate-90 text-[var(--muted)] sm:rotate-0" />
        <ProcessStep
          label="Üretimde"
          value={operational.production}
          count={operational.counts.production}
          icon={Factory}
          href="/uretim"
          tone="text-fuchsia-600"
        />
        <ArrowRight className="mx-auto h-3.5 w-3.5 rotate-90 text-[var(--muted)] sm:rotate-0" />
        <ProcessStep
          label="Depoda"
          value={operational.depot}
          count={operational.counts.depot}
          icon={Warehouse}
          href="/depo"
          tone="text-amber-600"
        />
      </div>

      <div className="mt-3 rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-[var(--muted)]">
              Nakde dönüşebilir brüt değer
            </p>
            <p className="text-lg font-black tabular-nums text-blue-600">
              {money(operational.total)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[var(--muted)]">Senaryo sonrası bakiye</p>
            <p className={`text-lg font-black tabular-nums ${style.text}`}>
              {projected.balance >= 0 ? '+' : '−'}
              {money(Math.abs(projected.balance))}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <CapacityBar status={projected} />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/45 px-3 py-2.5">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <p className="text-[11px] font-extrabold leading-snug text-[var(--ink)]">{guidance}</p>
          <p className="mt-1 text-[9px] font-semibold text-[var(--muted)]">
            Operasyonel değer tahmini brüt nakit senaryosudur; gerçekleşmiş tahsilat veya kâr
            değildir.
          </p>
        </div>
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
    <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-4`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--ink)]">
            Ay Sonu Ödeme ve Nakit Dönüşüm Çizelgesi
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
            {snapshot.monthLabel} · kayıtlı finans, personel ve operasyon verilerinden canlı
            hesaplanır
          </p>
        </div>
        <div className="rounded-xl bg-white/45 px-3 py-2 text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Önce mevcut durum
          </p>
          <p className="text-[11px] font-extrabold text-[var(--ink)]">
            Sonra satış ve üretim senaryosu
          </p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <CurrentCapacity data={snapshot.current} />
        <OperationalCapacity
          operational={snapshot.operational}
          projected={snapshot.projected}
          guidance={snapshot.guidance}
        />
      </div>
    </section>
  )
}
