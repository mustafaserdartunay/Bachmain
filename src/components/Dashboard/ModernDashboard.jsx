import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Factory,
  FileText,
  Handshake,
  MoreHorizontal,
  PackageCheck,
  Percent,
  Plus,
  ReceiptText,
  ShoppingCart,
  StickyNote,
  Store,
  Users,
  Warehouse,
  XCircle,
} from 'lucide-react'
import { toTitleCaseTr } from '../../utils/autoCapitalize'
import { formatCurrency, getPaymentActionTimeline } from '../../utils/paymentTimeline'
import { RECURRING_PAYMENTS_EVENT } from '../../utils/recurringPaymentsStore'
import {
  buildConfiguredQuickActionCards,
  buildCrmActivitySummary,
  enrichFinanceCards,
  formatQuickActionAmount,
} from '../../utils/dashboardModernData'
import {
  DASHBOARD_FINANCE_CARDS_EVENT,
  loadDashboardFinanceCards,
} from '../../utils/dashboardFinanceCards'
import {
  DASHBOARD_LAYOUT_EVENT,
  isDashboardSectionVisible,
  loadDashboardLayout,
} from '../../utils/dashboardLayoutStore'
import {
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_PANEL_CLASS,
  APP_DASHBOARD_PANEL_SIZE_CLASS,
  APP_DASHBOARD_PANEL_BODY_CLASS,
  APP_DASHBOARD_TIMELINE_RAIL_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_ACTIVATION_ROW_CLASS,
  getActivationAccentTone,
  getActivationAmountTone,
  APP_SUBLABEL_CLASS,
  APP_VALUE_CLASS,
} from '../../utils/dashboardDesign'

const FINANCE_METRIC_COLORS = {
  cash: { text: 'text-emerald-600', stroke: '#10b981' },
  bank: { text: 'text-blue-600', stroke: '#3b82f6' },
  cheques: { text: 'text-violet-600', stroke: '#8b5cf6' },
  'promissory-notes': { text: 'text-fuchsia-600', stroke: '#c026d3' },
  'live-assets': { text: 'text-indigo-600', stroke: '#6366f1' },
  receivables: { text: 'text-cyan-600', stroke: '#06b6d4' },
  future: { text: 'text-lime-600', stroke: '#65a30d' },
  orders: { text: 'text-amber-600', stroke: '#d97706' },
  production: { text: 'text-fuchsia-600', stroke: '#c026d3' },
  'depo-stock-sales': { text: 'text-teal-600', stroke: '#0d9488' },
  possible: { text: 'text-sky-600', stroke: '#0284c7' },
  payables: { text: 'text-orange-600', stroke: '#ea580c' },
  'stock-value': { text: 'text-teal-600', stroke: '#0d9488' },
}

const CRM_CATEGORY_COLORS = {
  clipboard: { text: 'text-violet-600' },
  calendar: { text: 'text-blue-600' },
  note: { text: 'text-orange-600' },
}

const ACTION_ICONS = {
  'file-text': FileText,
  factory: Factory,
  cart: ShoppingCart,
  users: Users,
  handshake: Handshake,
  warehouse: Warehouse,
  'package-check': PackageCheck,
}

const QUICK_ACTION_PROCESS_IDS = new Set(['quote', 'order', 'production', 'depo', 'delivered'])

const CRM_CATEGORY_ICONS = {
  clipboard: ClipboardList,
  calendar: CalendarDays,
  note: StickyNote,
}

const DASHBOARD_METRIC_ROW_CLASS = APP_METRIC_ROW_CLASS

function FinanceMetricCell({ card }) {
  const palette = FINANCE_METRIC_COLORS[card.id] || FINANCE_METRIC_COLORS.cash
  const Icon = card.icon
  const hasDual =
    card.valueExVat != null &&
    card.valueIncVat != null &&
    String(card.valueExVat) !== '' &&
    String(card.valueIncVat) !== ''
  const rowClass = hasDual ? APP_ACTIVATION_ROW_CLASS : DASHBOARD_METRIC_ROW_CLASS
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${palette.text}`} /> : null}
        <span className={APP_LABEL_CLASS} title={card.label}>
          {toTitleCaseTr(card.label)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
        {hasDual ? (
          <>
            <span
              className={`text-[11px] font-extrabold tabular-nums leading-tight ${palette.text}`}
              title={card.valueExVat}
            >
              {card.valueExVat}
            </span>
            <span
              className={`text-[11px] font-extrabold tabular-nums leading-tight ${palette.text}`}
              title={card.valueIncVat}
            >
              {card.valueIncVat}
            </span>
          </>
        ) : (
          <span
            className={`text-xs font-extrabold tabular-nums leading-tight ${palette.text}`}
            title={card.value}
          >
            {card.value}
          </span>
        )}
      </span>
    </>
  )

  if (card.href) {
    return (
      <Link
        to={card.href}
        title={
          hasDual
            ? `${card.sub || card.label} · ${card.valueExVat} / ${card.valueIncVat}`
            : card.sub || card.label
        }
        className={rowClass}
      >
        {content}
      </Link>
    )
  }

  return <div className={`${rowClass} cursor-default`}>{content}</div>
}

const CRM_STAT_TONES = {
  new: 'text-violet-600',
  ongoing: 'text-blue-600',
  completed: 'text-orange-600',
}

const CRM_METRIC_STAT_LABELS = ['Yeni', 'Devam', 'Biten']

function collectDashboardMetricStatLabels(quickActions = []) {
  const labels = new Set(CRM_METRIC_STAT_LABELS)
  buildConfiguredQuickActionCards(quickActions).forEach((action) => {
    labels.add(action.statLabels?.pending || 'Bekleyen')
    labels.add(action.statLabels?.ongoing || 'İşleme Alındı')
    labels.add(action.statLabels?.completed || 'Bitti')
  })
  return [...labels]
}

function useDashboardMetricStatColumnWidth(labels) {
  const measureRef = useRef(null)
  const [columnWidth, setColumnWidth] = useState(null)

  useLayoutEffect(() => {
    const measureEl = measureRef.current
    if (!measureEl || !labels.length) return undefined

    function measure() {
      let maxWidth = 0
      labels.forEach((label) => {
        measureEl.textContent = label
        maxWidth = Math.max(maxWidth, measureEl.offsetWidth)
      })
      setColumnWidth(Math.ceil(maxWidth + 16))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [labels])

  const longestLabelChars = Math.max(...labels.map((label) => label.length), 6)
  const measurer = (
    <span
      ref={measureRef}
      className="pointer-events-none fixed left-[-9999px] top-0 whitespace-nowrap text-[10px] font-bold leading-none opacity-0"
      aria-hidden="true"
    />
  )

  return {
    measurer,
    style: {
      '--dashboard-metric-stat-col': columnWidth
        ? `${columnWidth}px`
        : `max(4.25rem, ${longestLabelChars}ch)`,
    },
  }
}

function MetricStatGroup({ stats }) {
  return (
    <span className="dashboard-metric-stat-group shrink-0">
      {stats.map((stat) => (
        <span key={stat.label} className="dashboard-metric-stat-cell">
          <span className="whitespace-nowrap text-[10px] font-bold leading-none text-[var(--muted)]">
            {toTitleCaseTr(stat.label)}
          </span>
          <span
            className={`text-xs font-extrabold tabular-nums leading-none ${
              Number(stat.value) > 0
                ? stat.tone || 'text-[var(--ink)]'
                : 'text-[var(--muted)] opacity-70'
            }`}
          >
            {stat.value}
          </span>
        </span>
      ))}
    </span>
  )
}

function CrmCategoryMetricRow({ category }) {
  const palette = CRM_CATEGORY_COLORS[category.icon] || CRM_CATEGORY_COLORS.clipboard
  const Icon = CRM_CATEGORY_ICONS[category.icon] || ClipboardList
  const total = category.newCount + category.ongoingCount + category.completedCount
  const stats = [
    { label: 'Yeni', value: category.newCount, tone: CRM_STAT_TONES.new },
    { label: 'Devam', value: category.ongoingCount, tone: CRM_STAT_TONES.ongoing },
    { label: 'Biten', value: category.completedCount, tone: CRM_STAT_TONES.completed },
  ]
  const detail = `${total} kayıt · son 7 gün`

  return (
    <Link
      to={category.href}
      title={`${category.label} — ${detail}`}
      className={DASHBOARD_METRIC_ROW_CLASS}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${palette.text}`} />
        <span className={APP_LABEL_CLASS} title={category.label}>
          {toTitleCaseTr(category.label)}
        </span>
      </span>
      <MetricStatGroup stats={stats} />
    </Link>
  )
}

const FINANCE_STRIP_ORDER = [
  'receivables',
  'payables',
  'stock-value',
  'cash',
  'bank',
  'cheques',
  'promissory-notes',
  'live-assets',
  'future',
  'possible',
]

function sortFinanceStripCards(cards) {
  const orderMap = new Map(FINANCE_STRIP_ORDER.map((id, index) => [id, index]))
  return [...cards].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
}

function FinanceMetricsPanel({ cards = [], className = '' }) {
  if (!cards.length) return null

  const orderedCards = sortFinanceStripCards(cards)
  const panelTitleClass = APP_PANEL_TITLE_CLASS

  return (
    <section className={`${APP_PANEL_CLASS} ${APP_DASHBOARD_PANEL_SIZE_CLASS} ${className}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className={panelTitleClass}>Finans Özeti</h2>
      </div>

      <div className={APP_DASHBOARD_PANEL_BODY_CLASS}>
        {orderedCards.map((card) => (
          <FinanceMetricCell key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}

function LightPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`glass p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-extrabold text-[var(--ink)]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function ActivationRowAccent({ item }) {
  const tone = getActivationAccentTone(item)

  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${tone.ping}`}
      />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`} />
    </span>
  )
}

function ModernTimeline({ className = '' }) {
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

  return (
    <section className={`glass flex h-full min-h-0 flex-col px-4 py-3 ${className}`}>
      <div className="mb-2.5 flex min-w-0 items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
        </span>
        <h2 className="truncate text-xs font-extrabold leading-none text-[var(--ink)]">
          Aktivasyon Zaman Tablosu
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5">
        {items.length === 0 ? (
          <p className="glass-inset px-3 py-5 text-center text-[12px] font-semibold text-[var(--muted)]">
            Planlı ödeme veya alacak bulunamadı.
          </p>
        ) : (
          items.map((item) => {
            const amountTone = getActivationAmountTone(item)
            return (
              <Link
                key={item.id}
                to={item.link || '/kasa'}
                title={item.title}
                className={APP_ACTIVATION_ROW_CLASS}
              >
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <ActivationRowAccent item={item} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[12px] font-semibold leading-tight text-[var(--muted)]">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="truncate text-[11px] font-bold leading-none text-[var(--muted)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {item.amount > 0 ? (
                    <span
                      className={`text-xs font-extrabold tabular-nums leading-tight ${amountTone}`}
                    >
                      {formatCurrency(item.amount)}
                    </span>
                  ) : (
                    <span
                      className="text-xs font-extrabold leading-tight text-transparent"
                      aria-hidden="true"
                    >
                      —
                    </span>
                  )}
                  <span className="text-[11px] font-bold leading-none text-[var(--muted)]">
                    {item.dateLabel}
                  </span>
                </span>
              </Link>
            )
          })
        )}
      </div>
    </section>
  )
}

function TaxStatusPanel({
  issued,
  supplier,
  estimatedVatDue,
  estimatedIncomeTaxDue,
  onOpenIssued,
  onOpenSupplier,
  className = '',
}) {
  const rows = [
    {
      id: 'issued',
      label: 'Kesilen Faturalar Toplamı',
      value: issued.total,
      icon: ReceiptText,
      tone: 'text-emerald-600',
      onOpen: onOpenIssued,
    },
    {
      id: 'supplier',
      label: 'Alınan Faturalar Toplamı',
      value: supplier.total,
      icon: Store,
      tone: 'text-orange-600',
      onOpen: onOpenSupplier,
    },
    {
      id: 'paid-vat',
      label: 'Ödenen KDV Toplamı',
      value: estimatedVatDue,
      icon: BarChart3,
      tone: 'text-rose-600',
      onOpen: onOpenIssued,
    },
    {
      id: 'received-vat',
      label: 'Alınan KDV Toplamı',
      value: supplier.vat,
      icon: Store,
      tone: 'text-orange-600',
      onOpen: onOpenSupplier,
    },
    {
      id: 'income-tax',
      label: 'Ortalama Ödenecek Gelir Vergisi',
      value: estimatedIncomeTaxDue,
      icon: Percent,
      tone: 'text-violet-600',
      onOpen: onOpenIssued,
    },
  ]

  return (
    <section className={`${APP_PANEL_CLASS} ${APP_DASHBOARD_PANEL_SIZE_CLASS} ${className}`}>
      <div className="mb-2.5 flex shrink-0 items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
        </span>
        <h2 className="truncate text-xs font-extrabold leading-none text-[var(--ink)]">
          KDV Durumu
        </h2>
      </div>
      <div className={APP_DASHBOARD_PANEL_BODY_CLASS}>
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <button
              key={row.id}
              type="button"
              onClick={row.onOpen}
              title={row.label}
              className={DASHBOARD_METRIC_ROW_CLASS}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${row.tone}`} />
                <span className={APP_LABEL_CLASS}>{toTitleCaseTr(row.label)}</span>
              </span>
              <span className="flex shrink-0 items-center justify-center">
                <span className={`text-xs font-extrabold tabular-nums leading-tight ${row.tone}`}>
                  {formatCurrency(row.value)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CustomDashboardBlocks({ blocks = [] }) {
  const visibleBlocks = blocks.filter((block) => block.visible !== false)
  if (!visibleBlocks.length) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visibleBlocks.map((block) => {
        if (block.type === 'note') {
          return (
            <article key={block.id} className="glass px-4 py-3">
              <p className="text-sm font-extrabold text-[var(--ink)]">{block.title}</p>
              {block.subtitle ? (
                <p className="mt-0.5 text-xs text-[var(--muted)]">{block.subtitle}</p>
              ) : null}
              {block.content ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink)] opacity-80">
                  {block.content}
                </p>
              ) : null}
            </article>
          )
        }

        const content = (
          <article className="glass px-4 py-3 transition-transform hover:-translate-y-0.5">
            <p className="text-sm font-extrabold text-[var(--ink)]">{block.title}</p>
            {block.subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--muted)]">{block.subtitle}</p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-[var(--blue2)]">{block.href}</p>
          </article>
        )

        if (block.href) {
          return (
            <Link key={block.id} to={block.href}>
              {content}
            </Link>
          )
        }

        return <div key={block.id}>{content}</div>
      })}
    </div>
  )
}

function QuickActionsPanel({ quickActions = [], className = '' }) {
  const [tick, setTick] = useState(0)
  const actions = useMemo(
    () =>
      buildConfiguredQuickActionCards(quickActions)
        .filter((action) => QUICK_ACTION_PROCESS_IDS.has(action.id) || action.isCustom)
        .slice(0, 5),
    [quickActions, tick],
  )

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
      DASHBOARD_LAYOUT_EVENT,
    ]
    const refresh = () => setTick((value) => value + 1)
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [])

  const accent = {
    quote: {
      bar: 'from-[#5B8CFF] to-[#7C5CFF]',
      soft: 'bg-[rgba(91,140,255,0.12)]',
      text: 'text-[#3B6FE8]',
      ring: 'ring-[rgba(91,140,255,0.22)]',
    },
    order: {
      bar: 'from-[#34D399] to-[#10B981]',
      soft: 'bg-[rgba(16,185,129,0.12)]',
      text: 'text-[#059669]',
      ring: 'ring-[rgba(16,185,129,0.22)]',
    },
    production: {
      bar: 'from-[#C084FC] to-[#8B5CF6]',
      soft: 'bg-[rgba(139,92,246,0.12)]',
      text: 'text-[#7C3AED]',
      ring: 'ring-[rgba(139,92,246,0.22)]',
    },
    depo: {
      bar: 'from-[#FBBF24] to-[#F59E0B]',
      soft: 'bg-[rgba(245,158,11,0.14)]',
      text: 'text-[#D97706]',
      ring: 'ring-[rgba(245,158,11,0.22)]',
    },
    delivered: {
      bar: 'from-[#2DD4BF] to-[#14B8A6]',
      soft: 'bg-[rgba(20,184,166,0.14)]',
      text: 'text-[#0F766E]',
      ring: 'ring-[rgba(20,184,166,0.22)]',
    },
  }

  return (
    <section className={`${APP_PANEL_CLASS} ${APP_DASHBOARD_PANEL_SIZE_CLASS} ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          <h2 className={APP_PANEL_TITLE_CLASS}>Hızlı İşlemler</h2>
        </div>
        <span className="text-[11px] font-bold text-[var(--muted)]">{actions.length} süreç</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {actions.map((action) => {
          const ActionIcon = ACTION_ICONS[action.icon] || FileText
          const theme = accent[action.id] || accent.quote
          const createHref = action.createHref || action.href
          const stats = [
            {
              key: 'pending',
              label: action.statLabels?.pending || 'Bekleyen',
              value: action.stats.pending,
              Icon: Clock3,
            },
            {
              key: 'ongoing',
              label: action.statLabels?.ongoing || 'İşleme Alındı',
              value: action.stats.ongoing,
              Icon: CheckCircle2,
            },
            {
              key: 'completed',
              label: action.statLabels?.completed || 'Bitti',
              value: action.stats.completed,
              Icon: XCircle,
            },
          ]
          const totalOpen = Number(action.stats.pending || 0) + Number(action.stats.ongoing || 0)
          const amount = formatQuickActionAmount(action.stats.pendingAmount)
          const hideCreate = action.id === 'delivered'

          return (
            <article
              key={action.id}
              className={`group relative flex min-h-0 flex-1 overflow-hidden rounded-[15px] bg-white/55 ring-1 ${theme.ring} transition-all hover:bg-white/75`}
            >
              <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.bar}`} />
              <div className="flex min-h-0 flex-1 items-center gap-2 px-2.5 py-1.5 pl-3">
                <Link to={action.href} className="flex min-w-0 flex-[1.15] items-center gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${theme.soft} ${theme.text}`}
                  >
                    <ActionIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-extrabold leading-tight text-[var(--ink)]">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] font-semibold text-[var(--muted)]">
                      {action.id === 'delivered'
                        ? `${action.stats.completed} teslim · ${amount}`
                        : `${totalOpen} açık · ${amount}`}
                    </span>
                  </span>
                </Link>

                <div className="grid min-w-0 flex-[1.35] grid-cols-3 gap-1">
                  {stats.map((stat) => {
                    const StatIcon = stat.Icon
                    return (
                      <Link
                        key={stat.key}
                        to={action.href}
                        className="flex min-h-0 flex-col items-center justify-center rounded-[11px] bg-white/70 px-0.5 py-1 text-center transition-colors hover:bg-white"
                      >
                        <StatIcon className={`h-2.5 w-2.5 ${theme.text}`} />
                        <span
                          className={`mt-0.5 text-[12px] font-black leading-none tabular-nums ${theme.text}`}
                        >
                          {stat.value}
                        </span>
                        <span className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
                          {stat.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>

                <div className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1">
                  {!hideCreate ? (
                    <Link
                      to={createHref}
                      className={`inline-flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wide ${theme.text} transition-opacity hover:opacity-70`}
                    >
                      <Plus className="h-2.5 w-2.5" />
                      Yeni
                    </Link>
                  ) : (
                    <span className="h-[15px]" aria-hidden="true" />
                  )}
                  <Link
                    to={action.href}
                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${theme.text}`}
                  >
                    Aç
                    <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CrmActivityPanel({ className = '' }) {
  const [tick, setTick] = useState(0)
  const summary = useMemo(() => buildCrmActivitySummary(), [tick])

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  return (
    <section className={`${APP_PANEL_CLASS} ${APP_DASHBOARD_PANEL_SIZE_CLASS} ${className}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
        </span>
        <h2 className={APP_PANEL_TITLE_CLASS}>CRM Aktivite Özeti</h2>
      </div>

      <div className={APP_DASHBOARD_PANEL_BODY_CLASS}>
        {summary.categories.map((category) => (
          <CrmCategoryMetricRow key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}

export default function ModernDashboard({
  financeCards,
  issuedInvoiceAnalytics,
  supplierPurchaseAnalytics,
  estimatedVatDue,
  estimatedIncomeTaxDue,
  onOpenIssuedTax,
  onOpenSupplierTax,
}) {
  const metricCards = useMemo(() => enrichFinanceCards(financeCards), [financeCards])
  const [layout, setLayout] = useState(() => loadDashboardLayout())

  useEffect(() => {
    function refreshLayout() {
      setLayout(loadDashboardLayout())
    }
    window.addEventListener(DASHBOARD_LAYOUT_EVENT, refreshLayout)
    window.addEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshLayout)
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_EVENT, refreshLayout)
      window.removeEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshLayout)
    }
  }, [])

  const showFinance = isDashboardSectionVisible(layout, 'finance')
  const showQuickActions = isDashboardSectionVisible(layout, 'quick-actions')
  const showCustomBlocks = isDashboardSectionVisible(layout, 'custom-blocks')
  const showTimeline = isDashboardSectionVisible(layout, 'timeline')
  const showCrmActivity = isDashboardSectionVisible(layout, 'crm-activity')
  const showTaxStatus = isDashboardSectionVisible(layout, 'tax-status')

  const showFinanceTaxRow = showFinance || showTaxStatus
  const showMainStack = showQuickActions || showCrmActivity
  const hasLeftPanels = showFinanceTaxRow || showMainStack

  const taxStatusPanel = showTaxStatus ? (
    <TaxStatusPanel
      issued={issuedInvoiceAnalytics}
      supplier={supplierPurchaseAnalytics}
      estimatedVatDue={estimatedVatDue}
      estimatedIncomeTaxDue={estimatedIncomeTaxDue}
      onOpenIssued={onOpenIssuedTax}
      onOpenSupplier={onOpenSupplierTax}
    />
  ) : null

  const metricStatLabels = useMemo(
    () => collectDashboardMetricStatLabels(layout.quickActions),
    [layout.quickActions],
  )
  const { measurer: metricStatMeasurer, style: metricStatScopeStyle } =
    useDashboardMetricStatColumnWidth(showQuickActions || showCrmActivity ? metricStatLabels : [])

  const leftPanels = (
    <>
      {showFinance ? <FinanceMetricsPanel cards={metricCards} /> : null}
      {taxStatusPanel}
      {showQuickActions ? <QuickActionsPanel quickActions={layout.quickActions} /> : null}
      {showCrmActivity ? <CrmActivityPanel /> : null}
    </>
  )

  const dashboardBody =
    !hasLeftPanels && showTimeline ? (
      <ModernTimeline className="h-auto w-full" />
    ) : showTimeline && hasLeftPanels ? (
      <div className="flex flex-col shell-grid-gap xl:flex-row xl:items-stretch">
        <div
          className="flex min-w-0 flex-col shell-grid-gap xl:flex-[2]"
          style={metricStatScopeStyle}
        >
          {metricStatMeasurer}
          {leftPanels}
        </div>
        <div className={APP_DASHBOARD_TIMELINE_RAIL_CLASS}>
          <ModernTimeline className="h-full min-h-0 w-full" />
        </div>
      </div>
    ) : hasLeftPanels ? (
      <div className="flex flex-col shell-grid-gap" style={metricStatScopeStyle}>
        {metricStatMeasurer}
        {leftPanels}
      </div>
    ) : null

  return (
    <div className="modern-dashboard">
      {showCustomBlocks && layout.customBlocks?.length ? (
        <CustomDashboardBlocks blocks={layout.customBlocks} />
      ) : null}

      {dashboardBody}
    </div>
  )
}
