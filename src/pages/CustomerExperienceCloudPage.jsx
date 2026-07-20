import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bot,
  Building2,
  CalendarDays,
  HeartPulse,
  MapPinned,
  MessageCircle,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { cxcSubMenus } from '../data/cxcMenu'
import { getCustomerProfiles } from '../data/customerProfiles'
import { readActivity } from '../utils/customerActivity'
import { loadAgendaNotes, loadAppointments, loadTasks } from '../utils/crmStore'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  CXC_UPDATED_EVENT,
  addOpportunityLocal,
  addTicketLocal,
  aiInsightsLocal,
  buildTimelineLocal,
  cxcOverviewLocal,
  ensureCxcSeed,
  healthForCustomerLocal,
  kindLabel,
  listOpportunitiesLocal,
  listStagesLocal,
  listTicketsLocal,
  loyaltyForCustomerLocal,
  moveOpportunityLocal,
  nextActionsLocal,
  TIMELINE_KINDS,
} from '../cxc/localStore'

function money(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

function Kpi({ label, value, to }) {
  const body = (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
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

function SmartCard({ customer }) {
  const health = healthForCustomerLocal(customer.id)
  const loyalty = loyaltyForCustomerLocal(customer.id)
  const name = customer.brandName || customer.companyTitle || customer.name || 'Müşteri'
  return (
    <Link
      to={`/musteri-deneyimi?tab=360&customerId=${encodeURIComponent(customer.id)}`}
      className={`${APP_SURFACE_PANEL_CLASS} flex min-h-[88px] items-stretch gap-3 p-3 transition hover:bg-white/40`}
    >
      <div className="flex w-[42%] flex-col justify-center gap-1 border-r border-dark-500/20 pr-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/50 text-xs font-black uppercase text-[var(--ink)]">
          {String(name).slice(0, 2)}
        </div>
        <p className="truncate text-sm font-bold text-[var(--ink)]">{name}</p>
        <p className="text-[10px] font-bold uppercase text-[var(--muted)]">
          {customer.city || '—'} · AI {health.score}
        </p>
        <p className="text-[10px] font-black uppercase text-emerald-700">{loyalty.tier}</p>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold uppercase text-[var(--muted)]">
        <span>Cari</span>
        <span className="text-right text-[var(--ink)]">{money(customer.openingBalance || 0)}</span>
        <span>Risk</span>
        <span className="text-right text-[var(--ink)]">{health.churnRisk}</span>
        <span>Sadakat</span>
        <span className="text-right text-[var(--ink)]">{loyalty.points} puan</span>
        <span>Son</span>
        <span className="text-right text-[var(--ink)]">CXC</span>
      </div>
    </Link>
  )
}

export default function CustomerExperienceCloudPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const customerId = params.get('customerId') || ''
  const [msg, setMsg] = useState('')
  const [stages, setStages] = useState([])
  const [opps, setOpps] = useState([])
  const [tickets, setTickets] = useState([])
  const [timelineFilter, setTimelineFilter] = useState('all')
  const [dragId, setDragId] = useState(null)
  const [viewMode, setViewMode] = useState('kanban')

  const customers = useMemo(() => getCustomerProfiles(), [msg])
  const overview = useMemo(() => cxcOverviewLocal(customers.length), [customers.length, msg])
  const selected = customers.find((c) => c.id === customerId) || customers[0] || null
  const selectedId = selected?.id || customerId || 'demo'

  const health = useMemo(() => healthForCustomerLocal(selectedId), [selectedId])
  const loyalty = useMemo(() => loyaltyForCustomerLocal(selectedId), [selectedId])
  const insights = useMemo(() => aiInsightsLocal(selectedId), [selectedId])
  const actions = useMemo(() => nextActionsLocal(selectedId), [selectedId])

  const timeline = useMemo(() => {
    const events = buildTimelineLocal(selectedId, {
      activities: readActivity(selectedId),
      tasks: loadTasks(),
      appointments: loadAppointments(),
      notes: loadAgendaNotes(),
    })
    if (timelineFilter === 'all') return events
    return events.filter((e) => e.kind === timelineFilter)
  }, [selectedId, timelineFilter, msg])

  function refresh() {
    setStages(listStagesLocal())
    setOpps(listOpportunitiesLocal())
    setTickets(listTicketsLocal())
  }

  useEffect(() => {
    ensureCxcSeed()
    refresh()
    const fn = () => refresh()
    window.addEventListener(CXC_UPDATED_EVENT, fn)
    return () => window.removeEventListener(CXC_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function onDropStage(stageCode) {
    if (!dragId) return
    moveOpportunityLocal(dragId, stageCode)
    publishDomainEvent('trigger.cxc.opportunity.stage_changed', {
      opportunityId: dragId,
      stageCode,
    })
    setDragId(null)
    refresh()
    flash('Pipeline güncellendi')
  }

  const deepLinks = [
    { to: '/musteriler', t: 'Müşteriler', icon: Users },
    { to: '/crm', t: 'Ajanda', icon: CalendarDays },
    { to: '/mesajlar', t: 'WhatsApp', icon: MessageCircle },
    { to: '/ai-buyume/lead', t: 'Lead Center', icon: Sparkles },
    { to: '/saha-satis', t: 'Harita', icon: MapPinned },
    { to: '/finans', t: 'Finans', icon: Building2 },
    { to: '/otomasyon', t: 'Workflow', icon: Workflow },
    { to: '/aios', t: 'AIOS', icon: Bot },
  ]

  return (
    <AppPageShell>
      <AppPageHeader
        title="Customer Experience Cloud"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/musteriler/yeni"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              Yeni Müşteri
            </Link>
            <Link
              to="/crm/gorev-yeni"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              Görev
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain CXC 2026 — satış, destek, teklif, sipariş, muhasebe, üretim, depo, lojistik ve AI
          tek müşteri deneyiminde. Master Customer SoT: <strong>/musteriler</strong>. Bu hub
          projeksiyon katmanıdır.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cxcSubMenus.map((t) => (
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

      {tab === 'dashboard' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Müşteri" value={overview.customerCount} to="/musteriler" />
            <Kpi label="Açık fırsat" value={overview.openOpportunities} />
            <Kpi label="Pipeline" value={money(overview.pipelineValue)} />
            <Kpi label="Destek" value={overview.openTickets} />
            <Kpi label="Ort. health" value={overview.avgHealthScore} />
            <Kpi label="Riskli" value={overview.customersAtRisk} />
            <Kpi label="Top müşteri" value={overview.topCustomers} />
            <Kpi label="AI aksiyon" value={overview.pendingActions} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {deepLinks.map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={`${APP_SURFACE_PANEL_CLASS} flex min-h-14 items-center gap-2 px-4 text-sm font-bold`}
              >
                <x.icon className="h-4 w-4" /> {x.t}
              </Link>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customers.slice(0, 6).map((c) => (
              <SmartCard key={c.id} customer={c} />
            ))}
            {!customers.length ? (
              <div className={`${APP_SURFACE_PANEL_CLASS} p-4 text-sm text-[var(--muted)]`}>
                Henüz müşteri yok. <Link to="/musteriler/yeni">İlk müşteriyi ekle</Link>
              </div>
            ) : null}
          </div>
        </>
      )}

      {(tab === 'customers' || tab === 'companies') && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {['list', 'kanban', 'map'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase ${
                  viewMode === m ? 'bg-white/55' : ''
                }`}
              >
                {m}
              </button>
            ))}
            <Link
              to="/musteriler"
              className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase leading-10"
            >
              Tam liste →
            </Link>
          </div>
          {viewMode === 'map' ? (
            <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
              Harita görünümü saha satış ile paylaşılır.{' '}
              <Link className="font-bold underline" to="/saha-satis">
                Saha Satış
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {customers.map((c) => (
                <SmartCard key={c.id} customer={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'contacts' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <p className="text-sm text-[var(--muted)]">
            Çoklu yetkili / departman / telefon / WhatsApp kayıtları Master Customer üzerinde
            tutulur.
          </p>
          {customers.slice(0, 12).map((c) => {
            const contacts = Array.isArray(c.contacts) ? c.contacts : []
            return (
              <div key={c.id} className="border-b border-dark-500/15 py-2 last:border-0">
                <Link className="font-bold text-[var(--ink)]" to={`/musteriler/${c.id}`}>
                  {c.brandName || c.companyTitle || c.name}
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  {contacts.length
                    ? contacts.map((x) => x.name || x.fullName || x.phone || 'Yetkili').join(' · ')
                    : 'Yetkili eklenmemiş'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
              onClick={() => {
                const c = customers[0]
                addOpportunityLocal({
                  customerId: c?.id,
                  customerName: c?.brandName || c?.companyTitle || 'Müşteri',
                  title: 'Yeni fırsat',
                  amount: 25000,
                })
                publishDomainEvent('trigger.cxc.opportunity.created', {})
                refresh()
                flash('Fırsat eklendi')
              }}
            >
              + Fırsat
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <div
                key={stage.code}
                className={`${APP_SURFACE_PANEL_CLASS} min-w-[220px] flex-1 p-3`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropStage(stage.code)}
              >
                <p className="mb-2 text-[11px] font-black uppercase" style={{ color: stage.color }}>
                  {stage.label}
                </p>
                <div className="space-y-2">
                  {opps
                    .filter((o) => o.stageCode === stage.code)
                    .map((o) => (
                      <div
                        key={o.id}
                        draggable
                        onDragStart={() => setDragId(o.id)}
                        className="cursor-grab rounded-xl border border-dark-500/20 bg-white/45 p-3 active:cursor-grabbing"
                      >
                        <p className="text-sm font-bold text-[var(--ink)]">{o.title}</p>
                        <p className="text-[11px] text-[var(--muted)]">{o.customerName}</p>
                        <p className="mt-1 text-xs font-black tabular-nums">{money(o.amount)}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(tab === 'timeline' || tab === '360') && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {tab === '360' && selected ? (
              <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-[var(--muted)]">Customer 360</p>
                    <h2 className="text-xl font-black text-[var(--ink)]">
                      {selected.brandName || selected.companyTitle || selected.name}
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                      {selected.city || '—'} · {selected.taxNumber || selected.vergiNo || 'Vergi —'}
                    </p>
                  </div>
                  <Link
                    to={`/musteriler/${selected.id}`}
                    className="rounded-xl border px-3 py-2 text-[11px] font-black uppercase"
                  >
                    Cari detay
                  </Link>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/40 p-3">
                    <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Health</p>
                    <p className="text-2xl font-black">{health.score}</p>
                  </div>
                  <div className="rounded-xl bg-white/40 p-3">
                    <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Loyalty</p>
                    <p className="text-2xl font-black uppercase">{loyalty.tier}</p>
                  </div>
                  <div className="rounded-xl bg-white/40 p-3">
                    <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Churn</p>
                    <p className="text-2xl font-black uppercase">{health.churnRisk}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                  <Link className="rounded-lg border px-2 py-1" to="/teklifler">
                    Teklifler
                  </Link>
                  <Link className="rounded-lg border px-2 py-1" to="/siparisler">
                    Siparişler
                  </Link>
                  <Link className="rounded-lg border px-2 py-1" to="/uretim">
                    Üretim
                  </Link>
                  <Link className="rounded-lg border px-2 py-1" to="/depo">
                    Depo
                  </Link>
                  <Link className="rounded-lg border px-2 py-1" to="/mesajlar">
                    WhatsApp
                  </Link>
                  <Link className="rounded-lg border px-2 py-1" to="/crm">
                    Görevler
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTimelineFilter('all')}
                className={`min-h-9 rounded-lg border px-2 text-[10px] font-black uppercase ${
                  timelineFilter === 'all' ? 'bg-white/55' : ''
                }`}
              >
                Tümü
              </button>
              {TIMELINE_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTimelineFilter(k)}
                  className={`min-h-9 rounded-lg border px-2 text-[10px] font-black uppercase ${
                    timelineFilter === k ? 'bg-white/55' : ''
                  }`}
                >
                  {kindLabel(k)}
                </button>
              ))}
            </div>

            <div className={`${APP_SURFACE_PANEL_CLASS} space-y-0 p-2`}>
              {timeline.map((e) => (
                <div
                  key={e.id}
                  className="flex gap-3 border-b border-dark-500/10 px-3 py-3 last:border-0"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--ink)]/40" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-[var(--muted)]">
                        {kindLabel(e.kind)}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {new Date(e.occurredAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="font-bold text-[var(--ink)]">{e.title}</p>
                    {e.summary ? <p className="text-xs text-[var(--muted)]">{e.summary}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-[var(--muted)]">
                <Sparkles className="h-3.5 w-3.5" /> AI Next Action
              </p>
              <div className="space-y-2">
                {actions.map((a) => (
                  <div key={a.id} className="rounded-xl bg-white/40 p-3">
                    <p className="text-sm font-bold text-[var(--ink)]">{a.action}</p>
                    <p className="text-[11px] text-[var(--muted)]">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-[var(--muted)]">
                <HeartPulse className="h-3.5 w-3.5" /> Health faktörleri
              </p>
              <div className="space-y-1 text-xs font-bold">
                {Object.entries(health.factors).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="uppercase text-[var(--muted)]">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((i) => (
            <div key={i.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">{i.kind}</p>
              <p className="mt-1 font-bold text-[var(--ink)]">{i.title}</p>
              <pre className="mt-2 overflow-auto text-[11px] text-[var(--muted)]">
                {JSON.stringify(i.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {tab === 'support' && (
        <div className="space-y-3">
          <button
            type="button"
            className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
            onClick={() => {
              const c = selected || customers[0]
              addTicketLocal({
                customerId: c?.id,
                customerName: c?.brandName || c?.companyTitle || 'Müşteri',
                subject: 'Yeni destek talebi',
                channel: 'portal',
                aiSummary: 'AI özet stub',
              })
              publishDomainEvent('trigger.cxc.ticket.created', {})
              refresh()
              flash('Ticket oluşturuldu')
            }}
          >
            + Ticket
          </button>
          {tickets.map((t) => (
            <div key={t.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-bold text-[var(--ink)]">{t.subject}</p>
                <span className="text-[10px] font-black uppercase">{t.priority}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">
                {t.customerName} · {t.channel} · {t.status}
              </p>
              {t.aiSummary ? <p className="mt-2 text-sm">{t.aiSummary}</p> : null}
            </div>
          ))}
        </div>
      )}

      {tab === 'loyalty' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {customers.slice(0, 9).map((c) => {
            const L = loyaltyForCustomerLocal(c.id)
            return (
              <div key={c.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <p className="font-bold">{c.brandName || c.companyTitle || c.name}</p>
                <p className="mt-1 text-2xl font-black uppercase">{L.tier}</p>
                <p className="text-xs text-[var(--muted)]">
                  {L.points} puan · %{L.discountPct} indirim
                </p>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'executive' && (
        <div className="grid gap-3 md:grid-cols-3">
          <Kpi label="En değerli (demo)" value={overview.topCustomers} />
          <Kpi label="Riskli müşteri" value={overview.customersAtRisk} />
          <Kpi label="Ort. health" value={overview.avgHealthScore} />
          <div className={`${APP_SURFACE_PANEL_CLASS} col-span-full p-4 text-sm`}>
            Executive harita ve churn grafikleri CXC-1’de canlı veriye bağlanacak. Şimdilik{' '}
            <Link className="font-bold underline" to="/saha-satis">
              saha haritası
            </Link>{' '}
            ve pipeline değeri: {money(overview.pipelineValue)}.
          </div>
        </div>
      )}

      {tab === 'leads' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Lead skorlama AI Growth Lead Center’da. CXC master müşteriye dönüşümü köprüler.{' '}
          <Link className="font-bold underline" to="/ai-buyume/lead">
            Lead Center’a git
          </Link>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Omnichannel SoT:{' '}
          <Link className="font-bold underline" to="/mesajlar">
            Mesaj Merkezi
          </Link>
        </div>
      )}

      {(tab === 'activities' || tab === 'meetings' || tab === 'calendar' || tab === 'tasks') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Ajanda SoT:{' '}
          <Link className="font-bold underline" to="/crm">
            /crm
          </Link>
        </div>
      )}

      {(tab === 'calls' || tab === 'emails') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Çağrı / e-posta timeline’a düşer; omnichannel ve CRM notlarıyla birleşir (CXC-1).
        </div>
      )}

      {tab === 'invoices' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to="/musteriler/faturalar">
            Faturalar
          </Link>
        </div>
      )}

      {tab === 'orders' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to="/siparisler">
            Siparişler
          </Link>
        </div>
      )}

      {tab === 'documents' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Müşteri belgeleri Master Detail + Document Center. Knowledge ile karıştırılmaz.
        </div>
      )}

      {(tab === 'projects' || tab === 'contracts' || tab === 'campaigns') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          {tab} modülü CXC-1/2’de derinleştirilecek; şimdilik müşteri 360 ve pipeline üzerinden
          izlenir.
        </div>
      )}

      {tab === 'map' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Müşteri / bayi / şube / proje pinleri:{' '}
          <Link className="font-bold underline" to="/saha-satis">
            Saha Satış haritası
          </Link>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['/musteriler/satis-raporu', 'Satış raporu'],
            ['/musteriler/tahsilat-raporu', 'Tahsilat'],
            ['/raporlar', 'Raporlar'],
            ['/finans?tab=reports', 'Finans raporları'],
          ].map(([to, label]) => (
            <Link key={to} to={to} className={`${APP_SURFACE_PANEL_CLASS} p-4 font-bold`}>
              {label}
            </Link>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-4 text-sm`}>
          <p>Pipeline kolonları ayarlanabilir (CXC-0 seed + API).</p>
          <p>Master Customer alanları `/musteriler/yeni` üzerinden yönetilir.</p>
          <p>Workflow tetikleyicileri: `trigger.customer.*`, `trigger.cxc.*`.</p>
          <Link className="font-bold underline" to="/otomasyon">
            Workflow Engine
          </Link>
        </div>
      )}
    </AppPageShell>
  )
}
