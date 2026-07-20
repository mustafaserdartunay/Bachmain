import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Bot,
  CalendarDays,
  Factory,
  Gauge,
  LayoutGrid,
  List,
  Package,
  Settings2,
  Tablet,
  Truck,
  Warehouse,
  Wrench,
  Zap,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { mesSubMenus } from '../data/mesMenu'
import { loadProductionJobs } from '../utils/productionStore'
import { getProductionStageOptions, loadWorkflowStages } from '../utils/workflowStages'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  MES_UPDATED_EVENT,
  addBomLocal,
  addRoutingLocal,
  aiInsightsLocal,
  ensureMesSeed,
  listBomsLocal,
  listEventsLocal,
  listMaintenanceLocal,
  listOperatorsLocal,
  listRoutingsLocal,
  listScrapLocal,
  listShiftsLocal,
  listWorkCentersLocal,
  mesOverviewLocal,
} from '../mes/localStore'

function Kpi({ label, value, hint, to }) {
  const body = (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4 transition hover:-translate-y-0.5`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[var(--muted)]">{hint}</p> : null}
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

export default function ManufacturingCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [view, setView] = useState('kanban') // list | kanban | cards
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const jobs = useMemo(
    () =>
      loadProductionJobs()
        .map((j) => j)
        .slice(0, 80),
    [tab, msg],
  )
  const stages = useMemo(() => getProductionStageOptions(loadWorkflowStages()), [])
  const overview = useMemo(() => {
    const active = jobs.filter((j) => !j.completedAt && j.status !== 'completed').length
    const completed = jobs.filter((j) => j.status === 'completed' || j.completedAt).length
    const pending = jobs.filter((j) => !j.currentStageId).length
    return mesOverviewLocal({ active, completed, pending })
  }, [jobs])

  const [centers, setCenters] = useState([])
  const [operators, setOperators] = useState([])
  const [shifts, setShifts] = useState([])
  const [boms, setBoms] = useState([])
  const [routings, setRoutings] = useState([])
  const [events, setEvents] = useState([])
  const [scrap, setScrap] = useState([])
  const [maint, setMaint] = useState([])
  const insights = useMemo(() => aiInsightsLocal(), [])

  function refreshMes() {
    setCenters(listWorkCentersLocal())
    setOperators(listOperatorsLocal())
    setShifts(listShiftsLocal())
    setBoms(listBomsLocal())
    setRoutings(listRoutingsLocal())
    setEvents(listEventsLocal())
    setScrap(listScrapLocal())
    setMaint(listMaintenanceLocal())
  }

  useEffect(() => {
    ensureMesSeed()
    refreshMes()
    const fn = () => refreshMes()
    window.addEventListener(MES_UPDATED_EVENT, fn)
    window.addEventListener('bach:production-updated', fn)
    return () => {
      window.removeEventListener(MES_UPDATED_EVENT, fn)
      window.removeEventListener('bach:production-updated', fn)
    }
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2000)
  }

  const kanbanColumns = useMemo(() => {
    const cols =
      stages.length > 0
        ? stages.map((s) => ({ id: s.id, label: s.label || s.name || s.id }))
        : [
            { id: 'planned', label: 'Planlandı' },
            { id: 'in_progress', label: 'Üretimde' },
            { id: 'qc', label: 'Kalite' },
            { id: 'pack', label: 'Paketleme' },
            { id: 'depo', label: 'Depoya Hazır' },
          ]
    return cols.map((col) => ({
      ...col,
      items: jobs.filter((j) => {
        const sid = j.currentStageId || j.stageId || ''
        if (stages.length === 0) {
          if (col.id === 'planned') return !sid
          return false
        }
        return sid === col.id
      }),
    }))
  }, [jobs, stages])

  return (
    <AppPageShell>
      <AppPageHeader
        title="Manufacturing Center"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/mes/operator"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-dark-500/40 bg-white/40 px-4 text-xs font-black uppercase"
            >
              <Tablet className="h-4 w-4" /> Operatör
            </Link>
            <Link
              to="/uretim"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-dark-500/40 bg-white/40 px-4 text-xs font-black uppercase"
            >
              <Factory className="h-4 w-4" /> Üretim (/uretim)
            </Link>
            <Link
              to="/dijital-ikiz"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-dark-500/40 bg-white/40 px-4 text-xs font-black uppercase"
            >
              Twin
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain MES — planla, izle, operatör/makine/kalite/fire. Mevcut <strong>/uretim</strong>{' '}
          iş emirleri korunur; MES event ile Depo · Lojistik · Workflow · AIOS bağlanır.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {mesSubMenus.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-black uppercase ${
              tab === t.id
                ? 'border-[var(--ink)]/20 bg-white/55 text-[var(--ink)]'
                : 'border-dark-500/30 bg-dark-800/40 text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Aktif üretim" value={overview.activeProduction} to="/uretim" />
            <Kpi label="Bekleyen iş emri" value={overview.pendingWorkOrders} to="/uretim" />
            <Kpi label="Makine kullanımı %" value={overview.machineUtilization} />
            <Kpi label="Operatör" value={overview.operatorsOnFloor} />
            <Kpi label="Verimlilik" value={overview.efficiency} />
            <Kpi label="Fire" value={overview.scrapQty} />
            <Kpi label="Kalite" value={overview.qualityScore} />
            <Kpi label="OEE" value={overview.oee} />
            <Kpi label="Enerji kW" value={overview.energyKw.toFixed?.(1) ?? overview.energyKw} />
            <Kpi label="Bakım bekleyen" value={overview.maintenanceDue} />
            <Kpi label="Tamamlanan" value={overview.completedOrders} to="/uretim" />
            <Kpi label="Canlı olay" value={events.length} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/depo', t: 'Depo (WMS)', icon: Warehouse },
              { to: '/lojistik', t: 'Lojistik', icon: Truck },
              { to: '/otomasyon', t: 'Workflow', icon: Settings2 },
              { to: '/aios', t: 'AIOS', icon: Bot },
            ].map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={`${APP_SURFACE_PANEL_CLASS} flex min-h-14 items-center gap-2 px-4 text-sm font-bold`}
              >
                <x.icon className="h-4 w-4" /> {x.t}
              </Link>
            ))}
          </div>
        </>
      )}

      {tab === 'orders' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'kanban', icon: LayoutGrid, label: 'Kanban' },
              { id: 'list', icon: List, label: 'Liste' },
              { id: 'cards', icon: Package, label: 'Kart' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-black uppercase ${
                  view === v.id ? 'bg-white/55' : 'border-dark-500/30'
                }`}
              >
                <v.icon className="h-3.5 w-3.5" /> {v.label}
              </button>
            ))}
            <Link to="/uretim/yeni" className="ml-auto text-xs font-bold underline">
              Yeni iş emri
            </Link>
          </div>

          {view === 'kanban' && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {kanbanColumns.map((col) => (
                <div key={col.id} className={`${APP_SURFACE_PANEL_CLASS} w-64 shrink-0 p-3`}>
                  <p className="mb-2 text-[11px] font-black uppercase text-[var(--muted)]">
                    {col.label} · {col.items.length}
                  </p>
                  <div className="space-y-2">
                    {col.items.length === 0 ? (
                      <p className="text-[11px] text-[var(--muted)]">Boş</p>
                    ) : (
                      col.items.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => navigate(`/uretim/${j.id}`)}
                          className="w-full rounded-xl border border-dark-500/30 bg-white/40 p-3 text-left"
                        >
                          <p className="text-sm font-bold text-[var(--ink)]">
                            {j.code || j.documentCode || j.id}
                          </p>
                          <p className="text-[11px] text-[var(--muted)]">
                            {j.customerName || j.companyName || '—'}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(view === 'list' || view === 'cards') && (
            <div
              className={
                view === 'cards' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'
              }
            >
              {jobs.map((j) => (
                <Link
                  key={j.id}
                  to={`/uretim/${j.id}`}
                  className={`${APP_SURFACE_PANEL_CLASS} block p-4`}
                >
                  <p className="font-bold">{j.code || j.documentCode || j.id}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {j.customerName || '—'} · {j.currentStageLabel || j.status || '—'}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <p className="text-[11px] text-[var(--muted)]">
            Kanban kolonları Ayarlar → Workflow üretim aşamalarından gelir (sabit değil). Timeline /
            takvim görünümü MES-1.
          </p>
        </section>
      )}

      {(tab === 'machines' || tab === 'workCenters') && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((c) => (
            <div key={c.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black">{c.name}</p>
                  <p className="text-[11px] uppercase text-[var(--muted)]">
                    {c.code} · {c.status}
                  </p>
                </div>
                <Gauge className="h-5 w-5 text-[var(--muted)]" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span>OEE {c.oee}</span>
                <span>{c.energyKw} kW</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'operators' && (
        <section className="grid gap-3 sm:grid-cols-2">
          {operators.map((o) => (
            <div key={o.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{o.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {o.code} · {o.status}
              </p>
            </div>
          ))}
          <Link
            to="/mes/operator"
            className={`${APP_SURFACE_PANEL_CLASS} flex items-center gap-2 p-4 font-bold`}
          >
            <Tablet className="h-4 w-4" /> Operatör tableti aç
          </Link>
        </section>
      )}

      {tab === 'shifts' && (
        <section className="grid gap-3 sm:grid-cols-2">
          {shifts.map((s) => (
            <div key={s.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{s.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {s.startTime} – {s.endTime}
              </p>
            </div>
          ))}
        </section>
      )}

      {tab === 'bom' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addBomLocal('Demo Reçete', 'prd_demo')
              publishDomainEvent(
                'trigger.mes.bom.created',
                { name: 'Demo Reçete' },
                { source: 'mes' },
              )
              flash('BOM eklendi')
              refreshMes()
            }}
          >
            Reçete ekle
          </button>
          {boms.map((b) => (
            <p key={b.id} className="text-sm">
              {b.name} · {b.productId}
            </p>
          ))}
        </section>
      )}

      {tab === 'routing' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <button
            type="button"
            className="min-h-12 rounded-2xl border px-4 text-xs font-black uppercase"
            onClick={() => {
              addRoutingLocal('Standart Rota', 'prd_demo')
              flash('Routing eklendi')
              refreshMes()
            }}
          >
            Routing ekle
          </button>
          {routings.map((r) => (
            <div key={r.id} className="text-sm">
              <p className="font-bold">{r.name}</p>
              <p className="text-[11px] text-[var(--muted)]">
                {(r.operations || []).map((o) => o.name).join(' → ')}
              </p>
            </div>
          ))}
        </section>
      )}

      {tab === 'maintenance' && (
        <section className="space-y-2">
          {maint.map((m) => (
            <div key={m.id} className={`${APP_SURFACE_PANEL_CLASS} flex items-center gap-2 p-4`}>
              <Wrench className="h-4 w-4" />
              <div>
                <p className="font-bold">{m.title}</p>
                <p className="text-[11px] text-[var(--muted)]">
                  {m.kind} · {m.status}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === 'energy' && (
        <section className="grid gap-3 sm:grid-cols-3">
          {centers.map((c) => (
            <div key={c.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <Zap className="mb-2 h-4 w-4" />
              <p className="font-bold">{c.name}</p>
              <p className="text-xl font-black">{c.energyKw} kW</p>
            </div>
          ))}
        </section>
      )}

      {tab === 'ai' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <p className="text-sm font-bold">{insights.planSuggestion}</p>
          {insights.bottlenecks.map((b) => (
            <p key={b.workCenter} className="text-sm text-[var(--muted)]">
              Darboğaz: {b.workCenter} %{b.utilizationPct}
            </p>
          ))}
          {insights.delayRisk.map((d) => (
            <p key={d.jobRef} className="text-sm text-[var(--muted)]">
              Gecikme riski %{d.riskPct}: {d.reason}
            </p>
          ))}
        </section>
      )}

      {(tab === 'planning' ||
        tab === 'calendar' ||
        tab === 'capacity' ||
        tab === 'quality' ||
        tab === 'packaging' ||
        tab === 'pallet' ||
        tab === 'iot' ||
        tab === 'reports') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex items-center gap-2">
            {tab === 'calendar' ? (
              <CalendarDays className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            <h2 className="text-sm font-black uppercase">
              {mesSubMenus.find((m) => m.id === tab)?.label}
            </h2>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            MES-0 kabuk. Canlı kapasite/AI plan, AI Quality foto analizi, paket→koli→palet→tır ve
            IoT MES-1/2. Fire kayıtları: {scrap.length}. Olaylar: {events.length}.
          </p>
          {tab === 'quality' && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Aşama fotoğrafları mevcut üretim detayında; AI çizik/renk analizi MES-2.
            </p>
          )}
          {tab === 'packaging' || tab === 'pallet' ? (
            <Link to="/lojistik" className="mt-3 inline-block text-xs font-bold underline">
              Lojistik palet / yükleme
            </Link>
          ) : null}
        </section>
      )}
    </AppPageShell>
  )
}
