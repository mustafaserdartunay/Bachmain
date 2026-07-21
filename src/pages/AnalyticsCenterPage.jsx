import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  LayoutDashboard,
  MapPinned,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { analyticsSubMenus } from '../data/analyticsMenu'
import { getCustomerProfiles } from '../data/customerProfiles'
import { loadOrders } from '../utils/ordersStore'
import { loadQuotes } from '../utils/quotesStore'
import { loadProductionJobs } from '../utils/productionStore'
import { getCashTreasuryAccounts, getBankTreasuryAccounts } from '../utils/treasuryStore'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  ANALYTICS_UPDATED_EVENT,
  WIDGET_LIBRARY,
  addAlertLocal,
  addKpiLocal,
  addWidgetLocal,
  aiInsightsLocal,
  analyticsOverviewLocal,
  boardReportLocal,
  ensureAnalyticsSeed,
  forecastsLocal,
  getExecutiveDashboardLocal,
  listAlertsLocal,
  listGoalsLocal,
  listKpisLocal,
  listOkrsLocal,
  saveDashboardLayoutLocal,
} from '../analytics/localStore'

function money(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

function Kpi({ label, value, to, hint }) {
  const body = (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4 transition hover:-translate-y-0.5`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

function severityClass(s) {
  if (s === 'critical') return 'text-rose-600'
  if (s === 'warning') return 'text-amber-600'
  return 'text-emerald-700'
}

export default function AnalyticsCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'executive'
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)
  const [dragId, setDragId] = useState(null)

  const live = useMemo(() => {
    const orders = loadOrders()
    const quotes = loadQuotes()
    const production = loadProductionJobs()
    const customers = getCustomerProfiles()
    const cash =
      [...getCashTreasuryAccounts(), ...getBankTreasuryAccounts()].reduce(
        (s, a) => s + (Number(a.balance) || 0),
        0,
      ) || null
    return {
      orders: orders.length,
      quotes: quotes.filter((q) => (q.status || '').toLowerCase() !== 'converted').length,
      production: production.length,
      customers: customers.length,
      cash: cash || undefined,
    }
  }, [tick])

  const overview = useMemo(() => analyticsOverviewLocal(live), [live])
  const dash = useMemo(() => getExecutiveDashboardLocal(), [tick])
  const layout = dash?.layout || []
  const kpis = useMemo(() => listKpisLocal(), [tick])
  const alerts = useMemo(() => listAlertsLocal(), [tick])
  const goals = useMemo(() => listGoalsLocal(), [tick])
  const okrs = useMemo(() => listOkrsLocal(), [tick])
  const insights = useMemo(() => aiInsightsLocal(), [])
  const forecasts = useMemo(() => forecastsLocal(), [])
  const board = useMemo(() => boardReportLocal(), [])

  useEffect(() => {
    ensureAnalyticsSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(ANALYTICS_UPDATED_EVENT, fn)
    return () => window.removeEventListener(ANALYTICS_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'executive') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function moveWidget(targetId) {
    if (!dragId || !dash || dragId === targetId) return
    const next = [...layout]
    const from = next.findIndex((w) => w.id === dragId)
    const to = next.findIndex((w) => w.id === targetId)
    if (from < 0 || to < 0) return
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    saveDashboardLayoutLocal(dash.id, next)
    publishDomainEvent('trigger.analytics.dashboard.layout_saved', { dashboardId: dash.id })
    setDragId(null)
    setTick((n) => n + 1)
    flash('Layout kaydedildi')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Analytics Center"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <LayoutDashboard className="h-4 w-4" /> AI Command
            </Link>
            <Link
              to="/otomasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/aios"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Bot className="h-4 w-4" /> AIOS
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain Analytics Platform 2026 — canlı, tahmine dayalı, AI destekli. KPI’lar domain
          SoT’tan; ModernDashboard yeniden yazılmaz. Ölçüm çatalı yok.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {analyticsSubMenus.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-black uppercase ${
              tab === t.id
                ? 'border-[var(--ink)]/20 bg-white/55 text-[var(--ink)]'
                : 'border-dark-500/30 text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'executive' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Toplam Satış"
              value={money(overview.salesTotal)}
              to="/musteriler/satis-raporu"
            />
            <Kpi label="Bugünkü Satış" value={money(overview.salesToday)} />
            <Kpi label="Sipariş" value={overview.orders} to="/siparisler" />
            <Kpi label="Teklif" value={overview.quotes} to="/teklifler" />
            <Kpi label="Üretim" value={overview.production} to="/mes" />
            <Kpi label="Depo kritik" value={overview.warehouse} to="/depo" />
            <Kpi label="Lojistik" value={overview.logistics} to="/lojistik" />
            <Kpi
              label="Tahsilat"
              value={money(overview.collections)}
              to="/musteriler/tahsilat-raporu"
            />
            <Kpi label="Borç" value={money(overview.payables)} to="/giderler/liste" />
            <Kpi label="Nakit" value={money(overview.cash)} to="/nakit/nakit-akisi-raporu" />
            <Kpi label="Karlılık" value={`%${overview.profitability}`} to="/finans?tab=reports" />
            <Kpi label="Fire" value={`%${overview.scrap}`} to="/mes" />
            <Kpi label="OEE" value={`%${overview.oee}`} to="/mes" />
            <Kpi label="Personel" value={overview.personnel} to="/ik" />
            <Kpi label="Müşteri" value={overview.customers} to="/musteri-deneyimi" />
            <Kpi label="Bayi" value={overview.dealers} />
            <Kpi label="Aktif kullanıcı" value={overview.activeUsers} />
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="mb-3 text-[11px] font-black uppercase text-[var(--muted)]">
                AI Önerileri
              </p>
              <div className="space-y-2">
                {insights.slice(0, 5).map((i) => (
                  <p key={i.id} className={`text-sm font-bold ${severityClass(i.severity)}`}>
                    {i.headline}
                  </p>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {[
                { to: '/', t: 'Güncel Durum', icon: LayoutDashboard },
                { to: '/finans', t: 'Finance', icon: BarChart3 },
                { to: '/saha-satis', t: 'Harita', icon: MapPinned },
                { to: '/musteri-deneyimi', t: 'CXC', icon: Target },
              ].map((x) => (
                <Link
                  key={x.to}
                  to={x.to}
                  className={`${APP_SURFACE_PANEL_CLASS} flex min-h-12 items-center gap-2 px-4 text-sm font-bold`}
                >
                  <x.icon className="h-4 w-4" /> {x.t}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'builder' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {WIDGET_LIBRARY.map((w) => (
              <button
                key={w.type}
                type="button"
                className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
                onClick={() => {
                  if (!dash) return
                  addWidgetLocal(dash.id, { type: w.type, label: w.label, code: w.type })
                  publishDomainEvent('trigger.analytics.dashboard.layout_saved', {})
                  setTick((n) => n + 1)
                  flash(`${w.label} eklendi`)
                }}
              >
                + {w.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Sürükle-bırak ile sırala · boyutlandırma AP-1. Kaydet otomatik.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {layout.map((w) => (
              <div
                key={w.id}
                draggable
                onDragStart={() => setDragId(w.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => moveWidget(w.id)}
                className={`${APP_SURFACE_PANEL_CLASS} cursor-grab p-4 active:cursor-grabbing`}
              >
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">{w.type}</p>
                <p className="font-bold text-[var(--ink)]">{w.label || w.code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['/musteriler/satis-raporu', 'Satış Raporu'],
            ['/musteriler/tahsilat-raporu', 'Tahsilat'],
            ['/musteriler/gelir-gider-raporu', 'Gelir Gider'],
            ['/nakit/nakit-akisi-raporu', 'Nakit Akışı'],
            ['/giderler/giderler-raporu', 'Giderler'],
            ['/stok/stoktaki-urunler-raporu', 'Stok'],
            ['/saha-satis/temsilci-raporlari', 'Saha Temsilci'],
            ['/finans?tab=reports', 'Finance Reports'],
            ['/ai-buyume/raporlar', 'Growth Reports'],
            ['/', 'Güncel Durum'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className={`${APP_SURFACE_PANEL_CLASS} p-4 font-bold`}>
              {label}
            </Link>
          ))}
        </div>
      )}

      {tab === 'kpi' && (
        <div className="space-y-3">
          <button
            type="button"
            className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
            onClick={() => {
              addKpiLocal({ label: 'Yeni KPI', code: `custom_${Date.now().toString(36)}` })
              setTick((n) => n + 1)
              flash('KPI eklendi')
            }}
          >
            + KPI
          </button>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {kpis.map((k) => (
              <div key={k.code} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <p className="font-bold">{k.label}</p>
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">
                  {k.code} · {k.source} · {k.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((i) => (
            <div key={i.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className={`font-bold ${severityClass(i.severity)}`}>{i.headline}</p>
              <p className="mt-1 text-[10px] font-black uppercase text-[var(--muted)]">
                {i.domain}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'forecast' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {forecasts.map((f) => (
            <div key={f.kind} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">{f.horizon}</p>
              <p className="font-bold">{f.kind}</p>
              <p className="mt-2 text-xl font-black tabular-nums">{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'explorer' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Kod yazmadan filtre · pivot · drill-down (AP-1). Şimdilik mevcut raporlara git:
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="rounded-xl border px-3 py-2 font-bold" to="/musteriler/satis-raporu">
              Satış
            </Link>
            <Link className="rounded-xl border px-3 py-2 font-bold" to="/nakit/nakit-akisi-raporu">
              Nakit
            </Link>
          </div>
        </div>
      )}

      {(tab === 'maps' || tab === 'charts') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          {tab === 'maps' ? (
            <>
              Harita analitikleri saha/lojistik ile paylaşılır.{' '}
              <Link className="font-bold underline" to="/saha-satis">
                Saha Satış
              </Link>
            </>
          ) : (
            <>Recharts rapor sayfalarında. Executive chart widget’ları builder’da.</>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          <button
            type="button"
            className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
            onClick={() => {
              addAlertLocal({ name: 'Yeni uyarı kuralı' })
              publishDomainEvent('trigger.analytics.alert.created', {})
              setTick((n) => n + 1)
              flash('Uyarı eklendi')
            }}
          >
            + Alert
          </button>
          {alerts.map((a) => (
            <div key={a.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{a.name}</p>
              <p className="text-xs text-[var(--muted)]">{(a.channels || []).join(' · ')}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'goals' && (
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((g) => {
            const pct = g.target ? Math.round((Number(g.actual) / Number(g.target)) * 100) : 0
            return (
              <div key={g.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <p className="font-bold">{g.title}</p>
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">{g.scope}</p>
                <p className="mt-2 text-sm">
                  {g.actual?.toLocaleString?.('tr-TR') || g.actual} /{' '}
                  {g.target?.toLocaleString?.('tr-TR') || g.target} · %{pct}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'okr' && (
        <div className="space-y-3">
          {okrs.map((o) => (
            <div key={o.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{o.objective}</p>
              <p className="text-xs text-[var(--muted)]">İlerleme %{o.progressPct}</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {(o.keyResults || []).map((kr) => (
                  <li key={kr}>{kr}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {(tab === 'scorecards' || tab === 'benchmark') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          {tab} — AP-1/2. KPI Center ve Executive skorlarıyla beslenecek.
        </div>
      )}

      {tab === 'exports' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <p className="text-sm">PDF · Excel · CSV · Word · PowerPoint · JSON · XML</p>
          <div className="flex flex-wrap gap-2">
            {['pdf', 'xlsx', 'csv', 'pptx', 'json'].map((f) => (
              <button
                key={f}
                type="button"
                className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
                onClick={() => {
                  publishDomainEvent('trigger.analytics.export.queued', { format: f })
                  flash(`${f.toUpperCase()} kuyruğa alındı (stub)`)
                }}
              >
                Export {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'cockpit' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-4 p-6`}>
          <p className="text-sm font-bold">
            Executive Cockpit — TV / toplantı modu (tam ekran AP-1)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Nakit" value={money(overview.cash)} />
            <Kpi label="Satış" value={money(overview.salesTotal)} />
            <Kpi label="OEE" value={`%${overview.oee}`} />
            <Kpi label="Sipariş" value={overview.orders} />
          </div>
          <div className="space-y-1">
            {insights.slice(0, 3).map((i) => (
              <p key={i.id} className={`text-sm font-bold ${severityClass(i.severity)}`}>
                <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                {i.headline}
              </p>
            ))}
          </div>
        </div>
      )}

      {tab === 'board' && (
        <div className="space-y-3">
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <p className="text-lg font-black">{board.title}</p>
            <p className="text-xs text-[var(--muted)]">
              PDF / sunum — Document Platform motoru ile (DP bağlanacak)
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {board.sections.map((s) => (
              <div key={s.title} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <p className="text-[11px] font-black uppercase text-[var(--muted)]">{s.title}</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-4 text-sm`}>
          <p>Yetki: rol · departman · şirket · şube · kullanıcı (AP-1).</p>
          <p>Hub: `/analitik` · `/raporlar` yönlendirir.</p>
          <p>Spec: docs/88 · docs/89</p>
        </div>
      )}
    </AppPageShell>
  )
}
