import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Factory,
  FileText,
  Handshake,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  ReceiptText,
  ShoppingCart,
  StickyNote,
  Store,
  Users,
  Warehouse,
} from 'lucide-react'
import { formatCurrency } from '../../utils/dashboardAlerts'
import { getPaymentActionTimeline } from '../../utils/paymentTimeline'
import {
  buildCrmActivitySummary,
  buildQuickActionCards,
  buildSalesPerformanceSeries,
  enrichFinanceCards,
  formatQuickActionAmount,
} from '../../utils/dashboardModernData'

const ICON_BG = {
  cash: 'bg-emerald-50 text-emerald-600',
  bank: 'bg-blue-50 text-blue-600',
  cheques: 'bg-violet-50 text-violet-600',
  'live-assets': 'bg-indigo-50 text-indigo-600',
  receivables: 'bg-cyan-50 text-cyan-600',
  future: 'bg-green-50 text-green-600',
  orders: 'bg-lime-50 text-lime-700',
  production: 'bg-fuchsia-50 text-fuchsia-600',
  'depo-stock-sales': 'bg-teal-50 text-teal-600',
  possible: 'bg-sky-50 text-sky-600',
  payables: 'bg-orange-50 text-orange-600',
}

function buildSmoothLinePath(coords) {
  if (!coords.length) return ''
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`

  let path = `M ${coords[0].x} ${coords[0].y}`
  for (let index = 0; index < coords.length - 1; index += 1) {
    const current = coords[index]
    const next = coords[index + 1]
    const previous = coords[index - 1] || current
    const following = coords[index + 2] || next
    const control1x = current.x + (next.x - previous.x) / 6
    const control1y = current.y + (next.y - previous.y) / 6
    const control2x = next.x - (following.x - current.x) / 6
    const control2y = next.y - (following.y - current.y) / 6
    path += ` C ${control1x} ${control1y}, ${control2x} ${control2y}, ${next.x} ${next.y}`
  }
  return path
}

function FinanceSparkline({ points = [], tone = 'emerald' }) {
  if (!points.length) return null

  const width = 88
  const height = 24
  const paddingY = 3
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(1, max - min)
  const coords = points.map((point, index) => ({
    x: (index / Math.max(points.length - 1, 1)) * width,
    y: height - paddingY - ((point - min) / range) * (height - paddingY * 2),
  }))
  const linePath = buildSmoothLinePath(coords)
  const stroke = tone === 'rose' ? '#f43f5e' : '#10b981'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="block h-6 w-[88px] shrink-0"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function LightPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-bold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function FinanceMetricsPanel({ cards = [] }) {
  if (!cards.length) return null

  return (
    <LightPanel title="Finans Özeti">
      <div className="overflow-hidden rounded-xl border border-slate-100">
        {cards.map((card, index) => {
          const iconBg = ICON_BG[card.id] || 'bg-slate-100 text-slate-500'
          const Icon = card.icon
          const row = (
            <div
              className={`flex items-center gap-2 px-2.5 py-2 sm:px-3 ${index > 0 ? 'border-t border-slate-100' : ''}`}
            >
              {Icon ? (
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ) : null}

              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{card.label}</p>

              <div className="ml-auto shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums tracking-tight text-slate-900">{card.value}</p>
                <div className="mt-1 flex justify-end">
                  <FinanceSparkline points={card.sparkline} tone={card.trendUp ? 'emerald' : 'rose'} />
                </div>
                <p className={`mt-0.5 text-[10px] font-semibold tabular-nums ${card.trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {card.changePercent > 0 ? '+' : ''}{card.changePercent}%
                </p>
              </div>
            </div>
          )

          if (card.href) {
            return (
              <Link
                key={card.id}
                to={card.href}
                title={card.sub || card.label}
                className="block transition-colors hover:bg-slate-50/70"
              >
                {row}
              </Link>
            )
          }

          return (
            <div key={card.id} title={card.sub || card.label}>
              {row}
            </div>
          )
        })}
      </div>
    </LightPanel>
  )
}

function ModernTimeline() {
  const items = getPaymentActionTimeline()

  return (
    <LightPanel
      title="Aksiyon Zaman Çizelgesi"
      subtitle="Tekrarlayan · tedarikçi · maaş · gider"
      className="flex h-[32rem] flex-col"
    >
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">Planlı ödeme bulunamadı.</p>
        ) : items.map((item) => {
          const dotTone = item.overdue || item.dueToday
            ? 'bg-rose-500 ring-rose-100'
            : item.urgency === 'soon'
              ? 'bg-amber-400 ring-amber-100'
              : 'bg-emerald-500 ring-emerald-100'
          return (
            <Link
              key={item.id}
              to={item.link || '/kasa'}
              className="relative block rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 pl-8 transition-colors hover:border-slate-200 hover:bg-white"
            >
              <span className={`absolute left-3 top-4 h-2.5 w-2.5 rounded-full ring-4 ${dotTone}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle}</p>
                </div>
                {item.amount > 0 && (
                  <span className="shrink-0 text-sm font-black text-slate-700">{formatCurrency(item.amount)}</span>
                )}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.dateLabel}</p>
            </Link>
          )
        })}
      </div>
      <Link to="/kasa" className="mt-3 shrink-0 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
        Kasa ve ödemeler <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </LightPanel>
  )
}

function TaxStatusPanel({ issued, supplier, estimatedVatDue, onOpenIssued, onOpenSupplier }) {
  const rows = [
    {
      id: 'issued',
      label: 'Kesilen KDV',
      value: issued.vat,
      total: issued.total,
      icon: ReceiptText,
      tone: 'text-emerald-600 bg-emerald-50',
      onOpen: onOpenIssued,
    },
    {
      id: 'supplier',
      label: 'Alınan KDV',
      value: supplier.vat,
      total: supplier.total,
      icon: Store,
      tone: 'text-orange-600 bg-orange-50',
      onOpen: onOpenSupplier,
    },
    {
      id: 'due',
      label: 'Tahmini Ödenecek',
      value: estimatedVatDue,
      total: estimatedVatDue,
      icon: BarChart3,
      tone: 'text-rose-600 bg-rose-50',
      onOpen: onOpenIssued,
    },
  ]

  return (
    <LightPanel title="KDV Durumu" subtitle="Bu ay fatura ve alış özeti">
      <div className="space-y-2">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <button
              key={row.id}
              type="button"
              onClick={row.onOpen}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-left transition-colors hover:border-slate-200 hover:bg-white"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.tone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500">{row.label}</p>
                <p className="text-sm font-black text-slate-900">{formatCurrency(row.value)}</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{formatCurrency(row.total)}</span>
            </button>
          )
        })}
      </div>
    </LightPanel>
  )
}

function QuickActionsPanel() {
  const [tick, setTick] = useState(0)
  const actions = useMemo(() => buildQuickActionCards(), [tick])

  useEffect(() => {
    const events = [
      'bach:crm-updated',
      'bach:quotes-updated',
      'bach:orders-updated',
      'bach:depo-updated',
      'bach:production-updated',
      'bach:customers-updated',
      'bach:customer-meta-updated',
      'bach:omni-updated',
      'erlenbox:treasury-updated',
      'erlenbox:company-settings-updated',
    ]
    const refresh = () => setTick((value) => value + 1)
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [])

  return (
    <LightPanel className="!p-3 sm:!p-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => (
          <QuickActionCard key={action.id} action={action} />
        ))}
      </div>
    </LightPanel>
  )
}

const ACTION_ICONS = {
  'file-text': FileText,
  factory: Factory,
  cart: ShoppingCart,
  users: Users,
  handshake: Handshake,
  warehouse: Warehouse,
}

function QuickActionCard({ action }) {
  const ActionIcon = ACTION_ICONS[action.icon] || FileText
  const createHref = action.createHref || action.href
  const statItems = [
    { key: 'pending', label: 'Bekleyen', value: action.stats.pending, icon: Clock3 },
    { key: 'ongoing', label: 'Devam', value: action.stats.ongoing, icon: LoaderCircle },
    { key: 'completed', label: 'Biten', value: action.stats.completed, icon: CheckCircle2 },
  ]

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-2.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)] sm:p-3 ${action.border} ${action.surface}`}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/50 blur-xl" />
      <Link to={action.href} className="relative block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-xs font-black tracking-tight ${action.text}`}>{action.label}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Canlı süreç özeti</p>
          </div>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${action.chip}`}>
            <ActionIcon className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {statItems.map((item) => {
            const StatIcon = item.icon
            return (
              <div
                key={item.key}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border border-white/70 bg-white/80 px-1.5 py-1.5 text-center shadow-sm backdrop-blur-sm transition-colors group-hover:bg-white"
              >
                <StatIcon className={`h-3 w-3 shrink-0 ${action.text}`} />
                <p className={`mt-0.5 text-sm font-black leading-none ${action.text}`}>{item.value}</p>
                <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
              </div>
            )
          })}
        </div>
      </Link>

      <div className="relative mt-2">
        <Link
          to={createHref}
          className={`group/create inline-flex origin-left items-center gap-1 text-[9px] font-bold uppercase tracking-wide ${action.text} opacity-75 transition-all duration-200 ease-out hover:scale-[1.04] hover:opacity-100`}
        >
          <Plus className="h-2.5 w-2.5 transition-transform duration-200 group-hover/create:scale-110" />
          Yeni oluştur
          <ArrowRight className="h-2.5 w-2.5 transition-transform duration-200 group-hover/create:translate-x-0.5" />
        </Link>
        <p className={`mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-xs font-black tabular-nums tracking-tight shadow-sm ${action.chip}`}>
          <span>Toplam:</span>
          <span>{formatQuickActionAmount(action.stats.pendingAmount)}</span>
        </p>
      </div>
    </div>
  )
}

function CrmActivityPanel() {
  const [tick, setTick] = useState(0)
  const summary = useMemo(() => buildCrmActivitySummary(), [tick])

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  const categoryIcons = {
    clipboard: ClipboardList,
    calendar: CalendarDays,
    note: StickyNote,
  }

  const stateStyles = {
    new: { label: 'Yeni', className: 'bg-sky-100 text-sky-700' },
    ongoing: { label: 'Devam', className: 'bg-violet-100 text-violet-700' },
    completed: { label: 'Bitti', className: 'bg-emerald-100 text-emerald-700' },
  }

  return (
    <LightPanel
      title="CRM Aktivite Özeti"
      subtitle="Yeni görevler, randevular, notlar ve süreç durumu"
      action={(
        <Link to="/crm" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
          CRM&apos;ye git <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Yeni Kayıtlar', value: summary.totals.new, icon: Plus, tone: 'text-sky-600 bg-sky-50' },
          { label: 'Devam Eden', value: summary.totals.ongoing, icon: LoaderCircle, tone: 'text-violet-600 bg-violet-50' },
          { label: 'Biten', value: summary.totals.completed, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">{item.value}</p>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {summary.categories.map((category) => {
          const Icon = categoryIcons[category.icon] || ClipboardList
          return (
            <Link
              key={category.id}
              to={category.href}
              className={`group rounded-2xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${category.border} ${category.surface}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-black ${category.text}`}>{category.label}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Son 7 gün özeti</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${category.chip}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: 'Yeni', value: category.newCount },
                  { label: 'Devam', value: category.ongoingCount },
                  { label: 'Biten', value: category.completedCount },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/70 bg-white/85 px-2 py-2 text-center shadow-sm">
                    <p className={`text-lg font-black leading-none ${category.text}`}>{stat.value}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Son aktiviteler</p>
        <div className="grid gap-2 lg:grid-cols-2">
          {summary.recentItems.length === 0 ? (
            <p className="rounded-xl bg-white px-4 py-6 text-center text-xs text-slate-500">Henüz CRM kaydı yok.</p>
          ) : summary.recentItems.map((item) => {
            const badge = stateStyles[item.state] || stateStyles.new
            return (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.href}
                className="flex items-center gap-3 rounded-xl border border-white bg-white px-3 py-2.5 transition-colors hover:border-slate-200"
              >
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${badge.className}`}>
                  {badge.label}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">{item.date || '—'}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </LightPanel>
  )
}

export default function ModernDashboard({
  financeCards,
  issuedInvoiceAnalytics,
  supplierPurchaseAnalytics,
  estimatedVatDue,
  onOpenIssuedTax,
  onOpenSupplierTax,
}) {
  const metricCards = useMemo(() => enrichFinanceCards(financeCards), [financeCards])
  const salesSeries = useMemo(() => buildSalesPerformanceSeries(), [])

  return (
    <div className="modern-dashboard -mx-3 min-h-full rounded-[28px] bg-[#eef2f7] p-3 sm:-mx-4 sm:p-4 lg:-mx-5 lg:p-5">
      <div className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <QuickActionsPanel />
        <ModernTimeline />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <CrmActivityPanel />

          <LightPanel title="Satış Performansı" subtitle="Aylık sipariş ve teklif hacmi">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesSeries} barGap={6}>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="sales" name="Sipariş" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="quotes" name="Teklif" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </LightPanel>
        </div>

        <div className="space-y-5">
          <FinanceMetricsPanel cards={metricCards} />

          <TaxStatusPanel
            issued={issuedInvoiceAnalytics}
            supplier={supplierPurchaseAnalytics}
            estimatedVatDue={estimatedVatDue}
            onOpenIssued={onOpenIssuedTax}
            onOpenSupplier={onOpenSupplierTax}
          />
        </div>
      </div>
    </div>
  )
}
