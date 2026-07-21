import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bot,
  Network,
  ShieldAlert,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { publishDomainEvent } from '../workflow/eventBus'
import { loadOrders } from '../utils/ordersStore'
import { loadProductionJobs } from '../utils/productionStore'
import { getCashTreasuryAccounts, getBankTreasuryAccounts } from '../utils/treasuryStore'
import { getCrmSummary } from '../utils/crmStore'
import { listApprovalsLocal } from '../aios/localStore'
import {
  AUTONOMOUS_UPDATED_EVENT,
  OPTIMIZATION_AREAS,
  SCENARIO_PRESETS,
  buildScoresLocal,
  ensureAutonomousSeed,
  eveningReportLocal,
  feedbackSuggestionLocal,
  listScenarioRunsLocal,
  listSuggestionsLocal,
  morningReportLocal,
  risksLocal,
  runScenarioLocal,
  systemHealthLocal,
} from '../autonomous/localStore'

function ScoreCard({ label, value }) {
  const tone = value >= 80 ? 'text-emerald-700' : value >= 60 ? 'text-amber-600' : 'text-rose-600'
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-3`}>
      <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

export default function AiAutonomousCompanyPage() {
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')
  const [report, setReport] = useState('morning')

  useEffect(() => {
    ensureAutonomousSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(AUTONOMOUS_UPDATED_EVENT, fn)
    return () => window.removeEventListener(AUTONOMOUS_UPDATED_EVENT, fn)
  }, [])

  const live = useMemo(() => {
    const orders = loadOrders()
    const jobs = loadProductionJobs()
    const crm = getCrmSummary()
    const cash = [...getCashTreasuryAccounts(), ...getBankTreasuryAccounts()].reduce(
      (s, a) => s + (Number(a.balance) || 0),
      0,
    )
    return {
      orders: orders.length,
      jobs: jobs.length,
      cash,
      overdue: crm.tasksOverdue || 0,
    }
  }, [tick])

  const scores = useMemo(() => buildScoresLocal(live), [live])
  const health = useMemo(() => systemHealthLocal(), [tick])
  const risks = useMemo(() => risksLocal(), [])
  const suggestions = useMemo(() => listSuggestionsLocal(), [tick])
  const scenarios = useMemo(() => listScenarioRunsLocal(), [tick])
  const approvals = useMemo(
    () => listApprovalsLocal().filter((a) => a.status === 'pending'),
    [tick],
  )
  const morning = useMemo(() => morningReportLocal(), [])
  const evening = useMemo(() => eveningReportLocal(), [])

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function onFeedback(id, decision) {
    feedbackSuggestionLocal(id, decision)
    publishDomainEvent('trigger.aios.autonomous.feedback', { suggestionId: id, decision })
    setTick((n) => n + 1)
    flash(
      decision === 'accept'
        ? 'Öneri kabul — learning loop'
        : decision === 'reject'
          ? 'Öneri reddedildi'
          : 'Öneri düzenleme notu kaydedildi',
    )
  }

  function onScenario(id) {
    const run = runScenarioLocal(id)
    if (!run) return
    publishDomainEvent('trigger.aios.autonomous.scenario', { scenarioId: id })
    setTick((n) => n + 1)
    flash('Simülasyon tamam · SoT yazılmadı')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Autonomous Company"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> Command
            </Link>
            <Link
              to="/ai-organizasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Network className="h-4 w-4" /> Org
            </Link>
            <Link
              to="/dijital-ikiz"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Activity className="h-4 w-4" /> Twin
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ink)]">
              Self-Driving Enterprise — 7/24 izleme, öngörü, güvenli otomasyon. Amaç insan yerine
              karar vermek değil; daha doğru ve hızlı karar. Yüksek risk → Human Approval.
              Simülasyon gerçek veriyi değiştirmez.
            </p>
            {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase text-[var(--muted)]">
          AI Control Tower · Business Health
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <ScoreCard label="Genel" value={scores.overall} />
          <ScoreCard label="Finans" value={scores.finance} />
          <ScoreCard label="Operasyon" value={scores.operations} />
          <ScoreCard label="Üretim" value={scores.production} />
          <ScoreCard label="Depo" value={scores.warehouse} />
          <ScoreCard label="Lojistik" value={scores.logistics} />
          <ScoreCard label="Müşteri" value={scores.customer} />
          <ScoreCard label="Çalışan" value={scores.people} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase">Continuous Health (5 dk)</h2>
            <span className="text-[10px] font-bold uppercase text-[var(--muted)]">
              {new Date(health.checkedAt).toLocaleTimeString('tr-TR')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {health.checks.map((c) => (
              <div key={c.id} className="rounded-xl border px-2 py-1.5 text-[11px]">
                <span className="font-semibold text-[var(--ink)]">{c.label}</span>
                <span
                  className={`ml-2 font-black uppercase ${
                    c.status === 'ok' ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Predictive Risk Engine</h2>
          <ul className="mt-3 space-y-2">
            {risks.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
              >
                <span className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                  <AlertTriangle
                    className={`h-3.5 w-3.5 ${
                      r.severity === 'high'
                        ? 'text-rose-600'
                        : r.severity === 'medium'
                          ? 'text-amber-600'
                          : 'text-sky-600'
                    }`}
                  />
                  {r.label}
                </span>
                <span className="font-black tabular-nums text-[var(--muted)]">
                  %{Math.round(r.probability * 100)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-black uppercase">Autonomous Suggestions · Explainable</h2>
          <Link
            to="/aios?tab=approvals"
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700"
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Onay bekleyen: {approvals.length}
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-2xl border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-[var(--ink)]">{s.title}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                    {s.domain} · risk {s.riskLevel} · güven %{Math.round(s.confidence * 100)}
                    {s.safeAuto ? ' · safe-auto adayı' : ' · onay gerekir'}
                  </p>
                </div>
                <Link to={s.to} className="text-[10px] font-black uppercase text-emerald-700">
                  Aç →
                </Link>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-[var(--ink)]">
                <div>
                  <dt className="font-black uppercase text-[var(--muted)]">Neden</dt>
                  <dd>{s.why}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase text-[var(--muted)]">Fayda</dt>
                  <dd>{s.benefit}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase text-rose-600">Risk</dt>
                  <dd>{s.risk}</dd>
                </div>
                <div>
                  <dt className="font-black uppercase text-[var(--muted)]">Alternatifler</dt>
                  <dd>{s.alternatives.join(' · ')}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onFeedback(s.id, 'accept')}
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-800"
                >
                  Kabul
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(s.id, 'reject')}
                  className="rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase text-rose-600"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(s.id, 'edit')}
                  className="rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase"
                >
                  Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Optimization Center</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {OPTIMIZATION_AREAS.map((o) => (
              <Link
                key={o.id}
                to={o.to}
                className="rounded-2xl border px-3 py-2 text-[11px] font-black uppercase"
              >
                {o.label}
              </Link>
            ))}
          </div>
        </section>

        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Scenario Simulation</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Gerçek SoT yazılmaz · sandbox</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCENARIO_PRESETS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onScenario(s.id)}
                className="rounded-2xl border px-3 py-2 text-left text-[11px] font-bold"
              >
                {s.title}
              </button>
            ))}
          </div>
          {scenarios[0] ? (
            <p className="mt-3 text-xs text-[var(--ink)]">
              Son: {scenarios[0].title} — {scenarios[0].summary} (mutate: false)
            </p>
          ) : null}
          <Link
            to="/dijital-ikiz"
            className="mt-3 inline-block text-[10px] font-black uppercase text-emerald-700"
          >
            Digital Twin →
          </Link>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setReport('morning')}
            className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase ${
              report === 'morning' ? 'bg-white/50' : ''
            }`}
          >
            Morning Report
          </button>
          <button
            type="button"
            onClick={() => setReport('evening')}
            className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase ${
              report === 'evening' ? 'bg-white/50' : ''
            }`}
          >
            Evening Summary
          </button>
        </div>
        {report === 'morning' ? (
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <p className="font-black uppercase text-[var(--muted)]">Öncelikler</p>
              <ul className="mt-1 list-disc pl-4">
                {morning.priorities.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black uppercase text-rose-600">Riskler</p>
              <ul className="mt-1 list-disc pl-4">
                {morning.risks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black uppercase text-emerald-700">Fırsatlar</p>
              <ul className="mt-1 list-disc pl-4">
                {morning.opportunities.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <p className="font-black uppercase text-[var(--muted)]">Tamamlanan</p>
              <ul className="mt-1 list-disc pl-4">
                {evening.completed.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black uppercase text-amber-700">Bekleyen</p>
              <ul className="mt-1 list-disc pl-4">
                {evening.pending.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-black uppercase text-emerald-700">AI Başarı</p>
              <p className="mt-1">{evening.aiSuccess}</p>
            </div>
          </div>
        )}
      </section>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <h2 className="text-sm font-black uppercase">Safe Automation · Multi Company</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Düşük risk → otomatik aday; yüksek risk → her zaman onay.</li>
          <li>Platform Core · Workflow Engine · RBAC/ABAC · Audit · Human Approval.</li>
          <li>Çok şirketli konsolide analiz AC-2.</li>
          <li>
            <Link to="/otomasyon" className="font-bold text-emerald-700">
              <Workflow className="mr-1 inline h-3 w-3" />
              Workflow
            </Link>
            {' · '}
            <Link to="/aios" className="font-bold text-emerald-700">
              AIOS
            </Link>
          </li>
        </ul>
      </section>
    </AppPageShell>
  )
}
