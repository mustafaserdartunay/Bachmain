import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  Mic,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { useAuth } from '../auth/AuthContext'
import { openHeaderPopover } from '../hooks/useHeaderPopover'
import { publishDomainEvent } from '../workflow/eventBus'
import { gatewayChatClient } from '../aios/api'
import { listApprovalsLocal, listChatLocal, ensureAiosSeed } from '../aios/localStore'
import { getCustomerProfiles } from '../data/customerProfiles'
import { loadOrders, orderTotals } from '../utils/ordersStore'
import { loadQuotes } from '../utils/quotesStore'
import { loadProductionJobs } from '../utils/productionStore'
import { getCashTreasuryAccounts, getBankTreasuryAccounts } from '../utils/treasuryStore'
import { getCrmSummary, loadAppointments, loadTasks } from '../utils/crmStore'
import { isTaskCompleted } from '../utils/crmProcessHelpers'
import {
  COMMAND_CENTER_UPDATED_EVENT,
  PERSONAS,
  QUICK_ACTIONS,
  TODAY_LANES,
  dismissAlertLocal,
  ensureCommandCenterSeed,
  getInsightsLocal,
  getPersonaLocal,
  listDismissedAlertsLocal,
  listRecommendationsLocal,
  setPersonaLocal,
} from '../commandCenter/localStore'
import { runOmniSearch } from '../utils/omniSearch'

function money(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

function firstName(full) {
  const s = String(full || '').trim()
  if (!s) return 'Kullanıcı'
  return s.split(/\s+/)[0]
}

function greetingForNow() {
  const h = new Date().getHours()
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

function isToday(iso) {
  if (!iso) return false
  const d = String(iso).slice(0, 10)
  return d === new Date().toISOString().slice(0, 10)
}

function Panel({ title, children, action, className = '' }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4 ${className}`.trim()}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
          {title}
        </h2>
        {action || null}
      </div>
      {children}
    </section>
  )
}

function Kpi({ label, value, to }) {
  const body = (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-3 transition hover:-translate-y-0.5`}>
      <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1.5 text-lg font-black tabular-nums text-[var(--ink)]">{value}</p>
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

export default function AiCommandCenterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [persona, setPersona] = useState('ceo')
  const [search, setSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    ensureCommandCenterSeed()
    ensureAiosSeed()
    setPersona(getPersonaLocal())
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(COMMAND_CENTER_UPDATED_EVENT, fn)
    window.addEventListener('bach:crm-updated', fn)
    window.addEventListener('storage', fn)
    return () => {
      window.removeEventListener(COMMAND_CENTER_UPDATED_EVENT, fn)
      window.removeEventListener('bach:crm-updated', fn)
      window.removeEventListener('storage', fn)
    }
  }, [])

  const live = useMemo(() => {
    const orders = loadOrders()
    const quotes = loadQuotes()
    const jobs = loadProductionJobs()
    const tasks = loadTasks()
    const appointments = loadAppointments()
    const customers = getCustomerProfiles()
    const crm = getCrmSummary()
    const cash = [...getCashTreasuryAccounts(), ...getBankTreasuryAccounts()].reduce(
      (s, a) => s + (Number(a.balance) || 0),
      0,
    )
    const todayOrders = orders.filter((o) => isToday(o.createdAt || o.date || o.orderDate))
    const salesToday = todayOrders.reduce((s, o) => s + (orderTotals(o).grandTotal || 0), 0)
    const openQuotes = quotes.filter((q) => (q.status || '').toLowerCase() !== 'converted')
    const pendingTasks = tasks.filter((t) => !isTaskCompleted(t))
    const todayTasks = pendingTasks.filter((t) => isToday(t.dueDate))
    const todayMeetings = appointments.filter((a) => isToday(a.date) && a.status !== 'İptal')
    const delayedJobs = jobs.filter((j) => {
      const st = String(j.status || '').toLowerCase()
      return st.includes('gecik') || st.includes('delay') || st === 'bekliyor'
    })
    return {
      orders: orders.length,
      todayOrders: todayOrders.length,
      salesToday,
      quotes: openQuotes.length,
      jobs: jobs.length,
      delayedJobs: delayedJobs.length,
      customerCount: customers.length,
      cash,
      crm,
      pendingTasks,
      todayTasks,
      todayMeetings,
      tasks,
      appointments,
      customers,
      ordersList: orders,
      quotesList: openQuotes,
      jobsList: jobs,
    }
  }, [tick])

  const dismissed = useMemo(() => listDismissedAlertsLocal(), [tick])

  const alerts = useMemo(() => {
    const rows = [
      {
        id: 'a_delay_orders',
        text: `${live.delayedJobs || 0} üretim / sipariş gecikme riski`,
        to: '/uretim',
        severity: 'critical',
      },
      {
        id: 'a_stock',
        text: 'Kritik stokları kontrol et',
        to: '/stok',
        severity: 'warning',
      },
      {
        id: 'a_prod_wait',
        text: `${live.jobs} üretim kaydı · bekleyenleri gözden geçir`,
        to: '/uretim',
        severity: 'warning',
      },
      {
        id: 'a_collect',
        text: 'Tahsilatı geciken müşterileri tara',
        to: '/finans',
        severity: 'warning',
      },
      {
        id: 'a_price',
        text: 'Fiyatı güncellenmesi gereken ürünler',
        to: '/stok/urunler',
        severity: 'info',
      },
      {
        id: 'a_margin',
        text: 'Kârsız sipariş riski — marj kontrolü',
        to: '/siparisler',
        severity: 'warning',
      },
      {
        id: 'a_risk_cust',
        text: 'Riskli müşteri segmenti incelemesi',
        to: '/musteri-deneyimi',
        severity: 'info',
      },
      {
        id: 'a_machine',
        text: 'Makine / iş merkezi sağlık kontrolü',
        to: '/mes',
        severity: 'info',
      },
    ]
    return rows.filter((r) => !dismissed.has(r.id))
  }, [live, dismissed])

  const attentionCount = alerts.length + live.crm.tasksOverdue + live.delayedJobs
  const recommendations = useMemo(() => listRecommendationsLocal(persona), [persona, tick])
  const insights = useMemo(() => getInsightsLocal(), [tick])
  const approvals = useMemo(
    () => listApprovalsLocal().filter((a) => a.status === 'pending'),
    [tick],
  )
  const chat = useMemo(() => listChatLocal(), [tick])

  const searchHits = useMemo(
    () => runOmniSearch(search, { minLength: 1, limit: 12 }),
    [search],
  )

  const name = firstName(user?.fullName)
  const showExecutive = persona === 'ceo' || persona === 'finance'

  function notify(t) {
    setFlash(t)
    setTimeout(() => setFlash(''), 2000)
  }

  async function sendChat() {
    const q = chatInput.trim()
    if (!q || busy) return
    setBusy(true)
    try {
      await gatewayChatClient({
        agentId: persona === 'ceo' ? 'ai.ceo' : 'ai.ops_director',
        messages: [{ role: 'user', content: q }],
      })
      publishDomainEvent('trigger.aios.chat.completed', { source: 'command-center' })
      setChatInput('')
      setTick((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell className="pb-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 min-w-0">
          <section className={`${APP_SURFACE_PANEL_CLASS} relative overflow-hidden p-5`}>
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at 0% 0%, rgba(16,185,129,0.12), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.08), transparent 45%)',
              }}
            />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Sparkles className="h-5 w-5" />
                    <p className="text-[11px] font-black uppercase tracking-wider">
                      AI Command Center
                    </p>
                  </div>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)] sm:text-3xl">
                    {greetingForNow()} {name}.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                    Bugün senin adına analizleri tamamladım. Dikkat etmen gereken{' '}
                    <span className="font-black text-[var(--ink)]">{attentionCount}</span> konu var.
                    Hazırsan başlayabiliriz.
                  </p>
                  {flash ? (
                    <p className="mt-2 text-xs font-bold text-emerald-600">{flash}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={persona}
                    onChange={(e) => {
                      const v = e.target.value
                      setPersonaLocal(v)
                      setPersona(v)
                      notify('Persona güncellendi')
                    }}
                    className="min-h-11 rounded-2xl border border-white/40 bg-white/40 px-3 text-xs font-black uppercase backdrop-blur"
                    aria-label="Persona"
                  >
                    {PERSONAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <Link
                    to="/guncel-durum"
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/40 bg-white/35 px-3 text-xs font-black uppercase backdrop-blur"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Güncel Durum
                  </Link>
                  <button
                    type="button"
                    onClick={() => openHeaderPopover('ai-assistant')}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-black uppercase text-emerald-800"
                  >
                    <Mic className="h-4 w-4" /> Voice
                  </button>
                </div>
              </div>
            </div>
          </section>

          <Panel title="AI Today">
            <div className="flex flex-wrap gap-2">
              {TODAY_LANES.map((lane) => {
                let count = '—'
                if (lane.id === 'tasks') count = String(live.todayTasks.length)
                if (lane.id === 'meetings') count = String(live.todayMeetings.length)
                if (lane.id === 'production') count = String(live.jobs)
                if (lane.id === 'priorities') count = String(attentionCount)
                if (lane.id === 'risks') count = String(alerts.length)
                return (
                  <div
                    key={lane.id}
                    className="min-w-[7.5rem] rounded-2xl border border-white/35 bg-white/30 px-3 py-2 backdrop-blur"
                  >
                    <p className="text-[10px] font-bold uppercase text-[var(--muted)]">
                      {lane.label}
                    </p>
                    <p className="mt-1 text-base font-black tabular-nums text-[var(--ink)]">
                      {count}
                    </p>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="My Company Today">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Bugünkü Satış" value={money(live.salesToday)} to="/siparisler" />
              <Kpi label="Bugünkü Sipariş" value={live.todayOrders} to="/siparisler" />
              <Kpi label="Nakit / Tahsilat" value={money(live.cash)} to="/finans" />
              <Kpi label="Üretim" value={live.jobs} to="/uretim" />
              <Kpi label="Açık Teklif" value={live.quotes} to="/teklifler" />
              <Kpi label="Görev (bekleyen)" value={live.crm.tasksPending} to="/gorevler" />
              <Kpi label="Toplantı bugün" value={live.crm.appointmentsToday} to="/takvim" />
              <Kpi label="Müşteri" value={live.customerCount} to="/musteriler" />
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel
              title="AI Alerts"
              action={
                <span className="text-[10px] font-bold uppercase text-rose-600">
                  {alerts.length} aktif
                </span>
              }
            >
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-white/30 bg-white/25 px-3 py-2"
                  >
                    <Link to={a.to} className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                            a.severity === 'critical'
                              ? 'text-rose-600'
                              : a.severity === 'warning'
                                ? 'text-amber-600'
                                : 'text-sky-600'
                          }`}
                        />
                        <p className="text-xs font-semibold text-[var(--ink)]">{a.text}</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="text-[10px] font-black uppercase text-[var(--muted)]"
                      onClick={() => {
                        dismissAlertLocal(a.id)
                        setTick((n) => n + 1)
                      }}
                    >
                      Gizle
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="AI Recommendations">
              <ul className="space-y-2">
                {recommendations.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={r.to}
                      className="block rounded-2xl border border-white/30 bg-white/25 px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-white/40"
                    >
                      {r.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Quick Actions">
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.id}
                  to={a.to}
                  className="inline-flex min-h-10 items-center rounded-2xl border border-white/40 bg-white/35 px-3 text-[11px] font-black uppercase tracking-wide text-[var(--ink)] backdrop-blur transition hover:-translate-y-0.5"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Smart Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Müşteri, sipariş, fatura, ürün, telefon, belge, workflow, agent…"
                className="min-h-12 w-full rounded-2xl border border-white/40 bg-white/40 py-2 pl-10 pr-3 text-sm outline-none backdrop-blur focus:border-emerald-400/40"
              />
            </div>
            {searchHits.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {searchHits.map((h, i) => (
                  <li key={`${h.to}-${i}`}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-xl border border-white/25 bg-white/20 px-3 py-2 text-left text-xs"
                      onClick={() => navigate(h.to)}
                    >
                      <span className="font-semibold text-[var(--ink)]">{h.label}</span>
                      <span className="font-black uppercase text-[var(--muted)]">{h.type}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>

          <div className="grid gap-5 lg:grid-cols-3">
            <Panel
              title="Tasks"
              action={
                <Link to="/gorevler" className="text-[10px] font-black uppercase text-emerald-700">
                  Tümü
                </Link>
              }
            >
              <ul className="space-y-1.5">
                {live.todayTasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
                {live.todayTasks.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">
                    Bugün için görev yok · {live.crm.tasksPending} bekleyen
                  </p>
                ) : null}
              </ul>
            </Panel>

            <Panel
              title="Calendar"
              action={
                <Link to="/takvim" className="text-[10px] font-black uppercase text-emerald-700">
                  Takvim
                </Link>
              }
            >
              <ul className="space-y-1.5">
                {live.todayMeetings.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs text-[var(--ink)]">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span className="truncate">
                      {a.startTime ? `${a.startTime} · ` : ''}
                      {a.title}
                    </span>
                  </li>
                ))}
                {live.todayMeetings.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">Bugün randevu yok</p>
                ) : null}
              </ul>
            </Panel>

            <Panel
              title="Workflow"
              action={
                <Link to="/otomasyon" className="text-[10px] font-black uppercase text-emerald-700">
                  <Workflow className="mr-1 inline h-3 w-3" />
                  Engine
                </Link>
              }
            >
              <ul className="space-y-1.5">
                {approvals.slice(0, 4).map((a) => (
                  <li key={a.id} className="text-xs font-semibold text-[var(--ink)]">
                    Onay · {a.label}
                  </li>
                ))}
                <li>
                  <Link
                    to="/aios?tab=approvals"
                    className="text-xs font-black uppercase text-emerald-700"
                  >
                    AI onayları →
                  </Link>
                </li>
                <li>
                  <Link to="/teklifler" className="text-xs text-[var(--muted)]">
                    Teklif onayları
                  </Link>
                </li>
              </ul>
            </Panel>
          </div>

          <Panel title="AI Insights">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">10 gelişme</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--ink)]">
                  {insights.developments.slice(0, 10).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-rose-600">5 risk</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--ink)]">
                  {insights.risks.slice(0, 5).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-700">5 fırsat</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--ink)]">
                  {insights.opportunities.slice(0, 5).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              </div>
            </div>
          </Panel>

          {showExecutive ? (
            <Panel title="Executive Mode">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Finans" value={money(live.cash)} to="/finans" />
                <Kpi label="Üretim" value={live.jobs} to="/uretim" />
                <Kpi label="Satış / Sipariş" value={live.orders} to="/siparisler" />
                <Kpi label="CRM" value={live.customerCount} to="/musteri-deneyimi" />
                <Kpi label="Depo" value="Stok" to="/stok" />
                <Kpi label="Lojistik" value="Rotalar" to="/lojistik" />
                <Kpi label="AI Tahmin" value="Forecast" to="/analitik?tab=forecast" />
                <Kpi label="Analytics" value="AI" to="/analitik?tab=ai" />
              </div>
            </Panel>
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <section className={`${APP_SURFACE_PANEL_CLASS} flex h-[min(70vh,640px)] flex-col p-4`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-700" />
                <h2 className="text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
                  AI Chat
                </h2>
              </div>
              <Link to="/aios" className="text-[10px] font-black uppercase text-emerald-700">
                AIOS
              </Link>
            </div>
            <p className="mb-2 text-[10px] text-[var(--muted)]">
              Gateway üzerinden · riskli işlemler onay ister
            </p>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {chat.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  Örn: “Bugünkü satışları göster” veya “Ali firmasına teklif oluştur.”
                </p>
              ) : (
                chat.slice(-16).map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl px-3 py-2 text-xs ${
                      m.role === 'user'
                        ? 'ml-4 bg-emerald-500/10 text-[var(--ink)]'
                        : 'mr-2 border border-white/30 bg-white/30 text-[var(--ink)]'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChat()
                }}
                placeholder="Komut yaz…"
                className="min-h-11 min-w-0 flex-1 rounded-2xl border border-white/40 bg-white/40 px-3 text-sm outline-none backdrop-blur"
              />
              <button
                type="button"
                disabled={busy}
                onClick={sendChat}
                className="min-h-11 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-[11px] font-black uppercase text-emerald-800"
              >
                {busy ? '…' : 'Gönder'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </AppPageShell>
  )
}
