import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CircleAlert,
  CircleCheckBig,
  ClipboardList,
  Factory,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
} from 'lucide-react'
import { AppPageBackLink, AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import {
  APP_SURFACE_PANEL_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YFB_TEXT_CLASS,
} from '../utils/dashboardDesign'
import { buildProcessReportsSnapshot, PROCESS_REPORT_SECTIONS } from '../utils/processReportsData'
import { formatTL } from '../utils/productPricing'

const STATUS_STYLES = {
  red: {
    label: 'Düşük',
    badge: 'border-rose-500/25 bg-rose-500/10 text-rose-600',
    text: 'text-rose-600',
    marker: 'border-rose-600 bg-rose-500',
  },
  orange: {
    label: 'Orta',
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

const SECTION_ICONS = {
  teklif: FileText,
  siparis: ShoppingCart,
  uretim: Factory,
  depo: Warehouse,
  sevkiyat: Truck,
  teslim: Package,
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#a855f7', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6']

const REFRESH_EVENTS = [
  'bach:orders-updated',
  'bach:production-updated',
  'bach:depo-updated',
  'bach:quotes-updated',
  'erlenbox:quotes-updated',
  'bachmain:org-scope-changed',
]

function StatusBadge({ tone }) {
  const style = STATUS_STYLES[tone] || STATUS_STYLES.orange
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

function CoverageBar({ tone, coverage }) {
  const style = STATUS_STYLES[tone] || STATUS_STYLES.orange
  const marker = Math.max(4, Math.min(96, Number(coverage) || 0))
  return (
    <div className="pt-1">
      <div className="relative h-3 overflow-visible rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 shadow-inner">
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md ${style.marker}`}
          style={{ left: `${marker}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}

function MetricChip({ label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/45 px-2 py-2">
      <span className="min-w-0">
        <span className="block truncate text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
          {label}
        </span>
        <span className="block truncate text-xs font-black tabular-nums text-[var(--ink)]">
          {value}
        </span>
      </span>
    </div>
  )
}

function ProcessMiniCard({ card, active, onSelect }) {
  const meta = PROCESS_REPORT_SECTIONS.find((s) => s.id === card.id)
  const Icon = SECTION_ICONS[card.id] || ClipboardList
  const style = STATUS_STYLES[card.tone] || STATUS_STYLES.orange
  const secondary =
    typeof card.secondaryValue === 'number' && card.secondaryLabel === 'Tutar'
      ? formatTL(card.secondaryValue)
      : String(card.secondaryValue)

  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className={`glass-inset flex min-w-0 flex-col rounded-2xl p-3 text-left transition-transform hover:-translate-y-0.5 ${
        active ? 'ring-2 ring-blue-500/40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta?.iconTone || 'bg-blue-500/10 text-blue-600'}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="truncate text-xs font-extrabold text-[var(--ink)]">{card.title}</p>
        </div>
        <StatusBadge tone={card.tone} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/35 p-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {card.primaryLabel}
          </p>
          <p className={`truncate text-lg font-black tabular-nums ${style.text}`}>
            {card.primaryValue}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {card.secondaryLabel}
          </p>
          <p className={`truncate text-sm font-black tabular-nums ${style.text}`}>{secondary}</p>
        </div>
      </div>

      <div className="mt-2">
        <CoverageBar tone={card.tone} coverage={card.coverage} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {card.metrics.map((m) => (
          <MetricChip key={m.label} label={m.label} value={m.value} />
        ))}
      </div>
    </button>
  )
}

function ChartCard({ title, children, className = '' }) {
  return (
    <article className={`glass-inset flex min-w-0 flex-col rounded-2xl p-3 ${className}`.trim()}>
      <p className={`${YF_TEXT_CLASS} mb-3 uppercase tracking-wide`}>{title}</p>
      <div className="min-h-[200px] w-full flex-1">{children}</div>
    </article>
  )
}

function StatusBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className={YF_TEXT_CLASS}>Kayıt yok.</p>
      ) : (
        data.map((row, index) => (
          <div key={row.name} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold text-[var(--ink)]">
                {row.name}
              </span>
              <span className={`${YFB_TEXT_CLASS} tabular-nums text-[var(--ink)]`}>
                {row.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/40">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(row.value / max) * 100}%`,
                  background: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function DetailHeader({ section }) {
  const Icon = SECTION_ICONS[section.id] || ClipboardList
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${section.iconTone}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className={`${YFB_TEXT_CLASS} truncate text-[var(--ink)]`}>{section.label}</h2>
          <p className={YF_TEXT_CLASS}>Süreç göstergeleri ve dağılım raporları</p>
        </div>
      </div>
      <Link
        to={section.href}
        className="inline-flex h-10 items-center rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 text-[13px] font-semibold text-[var(--muted)] transition-colors hover:text-[#2563eb]"
      >
        Modüle git
      </Link>
    </div>
  )
}

function TeklifDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Durum dağılımı">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.byStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={78}
            >
              {data.byStatus.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Süreç aşamaları">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byStage}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Müşteri yoğunluğu">
        <StatusBars data={data.topCustomers} />
      </ChartCard>
      <article className="glass-inset grid grid-cols-2 gap-2 rounded-2xl p-3 sm:grid-cols-4">
        <MetricChip label="Toplam" value={data.total} />
        <MetricChip label="Tutar" value={formatTL(data.totalAmount)} />
        <MetricChip label="Onay %" value={`%${Math.round(data.conversion)}`} />
        <MetricChip label="İptal" value={data.cancelled} />
      </article>
    </div>
  )
}

function SiparisDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Sipariş durumları">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Sipariş süreç aşamaları">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.byStage}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#10b981" fill="rgba(16,185,129,0.25)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Müşteri dağılımı">
        <StatusBars data={data.topCustomers} />
      </ChartCard>
      <article className="glass-inset grid grid-cols-2 gap-2 rounded-2xl p-3 sm:grid-cols-3">
        <MetricChip label="Toplam" value={data.total} />
        <MetricChip label="Tutar" value={formatTL(data.totalAmount)} />
        <MetricChip label="Tekliften" value={data.linkedQuotes} />
      </article>
    </div>
  )
}

function UretimDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Üretim aşamaları">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byStage}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Durum">
        <StatusBars data={data.byStatus} />
      </ChartCard>
      <article className="glass-inset grid grid-cols-3 gap-2 rounded-2xl p-3 lg:col-span-2">
        <MetricChip label="İş" value={data.total} />
        <MetricChip label="Tamam" value={data.completed} />
        <MetricChip label="Satır" value={data.lineCount} />
      </article>
    </div>
  )
}

function DepoDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Depo bazlı kalem">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data.byWarehouse}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={78}
            >
              {data.byWarehouse.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Stok durumu">
        <StatusBars data={data.byStatus} />
      </ChartCard>
      <article className="glass-inset grid grid-cols-3 gap-2 rounded-2xl p-3 lg:col-span-2">
        <MetricChip label="Kalem" value={data.total} />
        <MetricChip label="Depo" value={data.warehouses} />
        <MetricChip label="Miktar" value={data.quantity} />
      </article>
    </div>
  )
}

function SevkiyatDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Sevkiyat durumu">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <article className="glass-inset grid grid-cols-2 gap-2 rounded-2xl p-3 sm:grid-cols-4">
        <MetricChip label="Toplam" value={data.total} />
        <MetricChip label="Plan" value={data.planned} />
        <MetricChip label="Yolda" value={data.inTransit} />
        <MetricChip label="Teslim" value={data.delivered} />
      </article>
    </div>
  )
}

function TeslimDetail({ data }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ChartCard title="Teslim zaman çizelgesi">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#f43f5e" fill="rgba(244,63,94,0.22)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <article className="glass-inset grid grid-cols-3 gap-2 rounded-2xl p-3">
        <MetricChip label="Teslim" value={data.total} />
        <MetricChip label="Yolda" value={data.inTransit} />
        <MetricChip label="Oran" value={`%${Math.round(data.rate)}`} />
      </article>
    </div>
  )
}

function DetailBody({ sectionId, snapshot }) {
  if (sectionId === 'teklif') return <TeklifDetail data={snapshot.teklif} />
  if (sectionId === 'siparis') return <SiparisDetail data={snapshot.siparis} />
  if (sectionId === 'uretim') return <UretimDetail data={snapshot.uretim} />
  if (sectionId === 'depo') return <DepoDetail data={snapshot.depo} />
  if (sectionId === 'sevkiyat') return <SevkiyatDetail data={snapshot.sevkiyat} />
  if (sectionId === 'teslim') return <TeslimDetail data={snapshot.teslim} />
  return null
}

export default function ProcessReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const bolum = searchParams.get('bolum') || ''
  const activeSection = PROCESS_REPORT_SECTIONS.some((s) => s.id === bolum) ? bolum : ''
  const [snapshot, setSnapshot] = useState(() => buildProcessReportsSnapshot())

  useEffect(() => {
    const refresh = () => setSnapshot(buildProcessReportsSnapshot())
    REFRESH_EVENTS.forEach((event) => window.addEventListener(event, refresh))
    window.addEventListener('storage', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      REFRESH_EVENTS.forEach((event) => window.removeEventListener(event, refresh))
      window.removeEventListener('storage', refresh)
      window.clearInterval(timer)
    }
  }, [])

  const sectionMeta = useMemo(
    () => PROCESS_REPORT_SECTIONS.find((s) => s.id === activeSection) || null,
    [activeSection],
  )

  function selectSection(id) {
    if (!id || id === activeSection) {
      setSearchParams({}, { replace: true })
      return
    }
    setSearchParams({ bolum: id }, { replace: true })
  }

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="SÜREÇLER RAPORLARI"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className={`${YFB_TEXT_CLASS} text-[var(--ink)]`}>Tüm Süreçler — Minimal Özet</p>
            <p className={YF_TEXT_CLASS}>
              Kartlara tıklayarak detaylı grafik ve süreç göstergelerini açın.
            </p>
          </div>
          {activeSection ? (
            <button
              type="button"
              onClick={() => selectSection('')}
              className="inline-flex h-9 items-center rounded-xl border border-[var(--glass-border)] bg-white/40 px-3 text-[12px] font-semibold text-[var(--muted)]"
            >
              Özet görünüm
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.overview.cards.map((card) => (
            <ProcessMiniCard
              key={card.id}
              card={card}
              active={activeSection === card.id}
              onSelect={selectSection}
            />
          ))}
        </div>

        {!activeSection ? (
          <div className="mt-3">
            <ChartCard title="Süreç hunisi">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={snapshot.overview.funnel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,35,60,0.12)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {snapshot.overview.funnel.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        ) : null}
      </section>

      {sectionMeta ? (
        <section className={`${APP_SURFACE_PANEL_CLASS} overflow-hidden p-3.5`}>
          <DetailHeader section={sectionMeta} />
          <div className="mb-3 flex flex-wrap gap-2">
            {PROCESS_REPORT_SECTIONS.map((item) => {
              const Icon = SECTION_ICONS[item.id]
              const active = item.id === activeSection
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-semibold transition-colors ${
                    active
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-700'
                      : 'border-[var(--glass-border)] bg-white/35 text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.short}
                </button>
              )
            })}
          </div>
          <DetailBody sectionId={activeSection} snapshot={snapshot} />
        </section>
      ) : null}
    </AppPageShell>
  )
}
