import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Network, ShieldAlert, Sparkles, Workflow } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { publishDomainEvent } from '../workflow/eventBus'
import { AI_ENTERPRISE_ORG, getOrgChildren, orgOverviewLocal } from '../aios/organizationCatalog'
import { AIOS_ORG_UPDATED_EVENT, dispatchOrgEventLocal, listOrgEventsLocal } from '../aios/orgStore'

function tierLabel(tier) {
  if (tier === 'ceo') return 'CEO'
  if (tier === 'c_suite') return 'C-Suite'
  if (tier === 'director') return 'Director'
  return 'Specialist'
}

function OrgCard({ node, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className={`${APP_SURFACE_PANEL_CLASS} w-full p-3 text-left transition hover:-translate-y-0.5 ${
        selected ? 'ring-2 ring-emerald-500/40' : ''
      }`}
    >
      <p className="text-[10px] font-black uppercase text-[var(--muted)]">{tierLabel(node.tier)}</p>
      <p className="mt-1 text-sm font-black text-[var(--ink)]">{node.title}</p>
      <p className="mt-1 line-clamp-2 text-[11px] text-[var(--muted)]">{node.mandate[0]}</p>
      {node.criticalApprovalRequired ? (
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-700">
          <ShieldAlert className="h-3 w-3" /> Onay gerekli
        </span>
      ) : null}
    </button>
  )
}

export default function AiEnterpriseOrgPage() {
  const [selectedId, setSelectedId] = useState('org.ceo')
  const [intent, setIntent] = useState('Günlük brifing talep et')
  const [targetId, setTargetId] = useState('org.coo')
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')

  const overview = useMemo(() => orgOverviewLocal(), [])
  const selected = useMemo(
    () => AI_ENTERPRISE_ORG.find((n) => n.id === selectedId) || AI_ENTERPRISE_ORG[0],
    [selectedId],
  )
  const cSuite = useMemo(
    () => AI_ENTERPRISE_ORG.filter((n) => n.tier === 'ceo' || n.tier === 'c_suite'),
    [],
  )
  const directors = useMemo(() => AI_ENTERPRISE_ORG.filter((n) => n.tier === 'director'), [])
  const children = useMemo(() => getOrgChildren(selected.id), [selected])
  const events = useMemo(() => listOrgEventsLocal(), [tick])

  useEffect(() => {
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(AIOS_ORG_UPDATED_EVENT, fn)
    return () => window.removeEventListener(AIOS_ORG_UPDATED_EVENT, fn)
  }, [])

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function dispatch() {
    const to = AI_ENTERPRISE_ORG.find((n) => n.id === targetId)
    if (!to) return
    const event = dispatchOrgEventLocal({
      fromOrgId: selected.id,
      toOrgId: to.id,
      fromTitle: selected.title,
      toTitle: to.title,
      intent: intent.trim() || 'Brifing',
      explainWhy: to.explainWhy,
      critical: to.criticalApprovalRequired,
    })
    publishDomainEvent('trigger.aios.org.dispatch', {
      fromOrgId: selected.id,
      toOrgId: to.id,
      intent: event.intent,
    })
    setTick((n) => n + 1)
    flash('Orchestrator event kaydedildi (peer chat yok)')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Enterprise Organization"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/aios"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Bot className="h-4 w-4" /> AIOS
            </Link>
            <Link
              to="/aios?tab=orchestrator"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Orchestrator
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> Command
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <Network className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ink)]">
              Autonomous Digital Workforce — sohbet botu değil; rol bazlı dijital personel.
              Agent’lar birbirleriyle konuşmaz; yalnızca AI Orchestrator üzerinden event alır. Tüm
              işlemler AI Gateway + audit + Human Approval kurallarına bağlıdır.
            </p>
            {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">C-Suite</p>
            <p className="text-xl font-black tabular-nums">{overview.cSuite}</p>
          </div>
          <div className="rounded-2xl border px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Directors</p>
            <p className="text-xl font-black tabular-nums">{overview.directors}</p>
          </div>
          <div className="rounded-2xl border px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-[var(--muted)]">Org nodes</p>
            <p className="text-xl font-black tabular-nums">{overview.total}</p>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[11px] font-black uppercase text-[var(--muted)]">
          Organization Chart
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cSuite.map((n) => (
            <OrgCard
              key={n.id}
              node={n}
              selected={selected.id === n.id}
              onSelect={(node) => setSelectedId(node.id)}
            />
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {directors.map((n) => (
            <OrgCard
              key={n.id}
              node={n}
              selected={selected.id === n.id}
              onSelect={(node) => setSelectedId(node.id)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase text-[var(--ink)]">{selected.title}</h2>
          <p className="mt-1 text-[10px] font-bold uppercase text-[var(--muted)]">
            {selected.agentId} · reportsTo: {selected.reportsTo || '—'}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--ink)]">
            {selected.mandate.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-black uppercase text-emerald-800">
              Explainable AI — Neden?
            </p>
            <p className="mt-1 text-xs text-[var(--ink)]">{selected.explainWhy}</p>
          </div>
          {children.length > 0 ? (
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">
                Doğrudan raporlayanlar
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="rounded-xl border px-2 py-1 text-[10px] font-black uppercase"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Orchestrator Dispatch</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Peer chat yok. Mesaj event olarak kaydedilir; kritik roller Human Approval ister.
          </p>
          <label className="mt-3 block text-[10px] font-black uppercase text-[var(--muted)]">
            Hedef
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3 text-xs font-bold"
            >
              {AI_ENTERPRISE_ORG.filter((n) => n.id !== selected.id).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-[10px] font-black uppercase text-[var(--muted)]">
            Intent
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border bg-transparent px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={dispatch}
            className="mt-3 min-h-11 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
          >
            Orchestrator’a gönder
          </button>

          <h3 className="mt-5 text-[11px] font-black uppercase text-[var(--muted)]">Event log</h3>
          <ul className="mt-2 max-h-56 space-y-2 overflow-auto">
            {events.length === 0 ? (
              <li className="text-xs text-[var(--muted)]">Henüz event yok.</li>
            ) : (
              events.slice(0, 12).map((e) => (
                <li key={e.id} className="rounded-xl border px-3 py-2 text-xs">
                  <p className="font-bold text-[var(--ink)]">
                    {e.fromTitle} → {e.toTitle}
                  </p>
                  <p className="mt-0.5 text-[var(--muted)]">{e.intent}</p>
                  <p className="mt-1 text-[10px] text-emerald-800">Neden: {e.explainWhy}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <h2 className="text-sm font-black uppercase">Kurallar</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Ödeme, stok düşme, fatura, sipariş iptali → insan onayı olmadan uygulanmaz.</li>
          <li>
            Öğrenme: şirket kuralları, geçmiş kararlar, onay politikaları AI Memory’de saklanır.
          </li>
          <li>Her önerinin nedeni kullanıcıya gösterilir (Explainable AI).</li>
          <li>
            Deep-link:{' '}
            <Link to="/aios?tab=approvals" className="font-bold text-emerald-700">
              Approvals
            </Link>
            {' · '}
            <Link to="/bilgi-merkezi" className="font-bold text-emerald-700">
              Knowledge
            </Link>
            {' · '}
            <Link to="/aios?tab=memory" className="font-bold text-emerald-700">
              Memory
            </Link>
          </li>
        </ul>
      </section>
    </AppPageShell>
  )
}
