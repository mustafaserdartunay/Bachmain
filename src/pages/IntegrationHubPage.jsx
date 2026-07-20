import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Cable,
  Link2,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Store,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { integrationHubSubMenus } from '../data/integrationHubMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  CONNECTORS,
  INTEGRATION_HUB_UPDATED_EVENT,
  RETRIES,
  WEBHOOKS,
  connectLocal,
  disconnectLocal,
  ensureIntegrationSeed,
  isConnectedLocal,
  listConnectionsLocal,
  listConnectorsLocal,
  overviewLocal,
  runWizardLocal,
} from '../integrationHub/localStore'

function Kpi({ label, value }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
    </div>
  )
}

function ConnectorCard({ item, connected, onConnect, onDisconnect }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} flex flex-col p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--muted)]">
            {item.kind} · {item.protocol}
          </p>
          <h3 className="mt-1 text-sm font-black text-[var(--ink)]">{item.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{item.summary}</p>
        </div>
        <span
          className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-black uppercase ${
            item.status === 'available'
              ? 'border-emerald-500/30 text-emerald-700'
              : item.status === 'beta'
                ? 'border-amber-500/30 text-amber-700'
                : 'border-dark-500/30 text-[var(--muted)]'
          }`}
        >
          {item.status}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        {item.deepLink ? (
          <Link
            to={item.deepLink}
            className="rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase"
          >
            SoT
          </Link>
        ) : null}
        {connected ? (
          <button
            type="button"
            onClick={() => onDisconnect(item.id)}
            className="rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase text-rose-600"
          >
            Kes
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onConnect(item)}
            disabled={item.status === 'coming'}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-800 disabled:opacity-40"
          >
            <Link2 className="h-3 w-3" /> Bağla
          </button>
        )}
      </div>
    </div>
  )
}

function StubPanel({ title, children, links = [] }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <h2 className="text-sm font-black uppercase">{title}</h2>
      <div className="mt-2 text-xs text-[var(--muted)]">{children}</div>
      {links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default function IntegrationHubPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')
  const [brief, setBrief] = useState('Logo ERP ile stok senkronizasyonu oluştur.')
  const [wizard, setWizard] = useState(null)

  useEffect(() => {
    ensureIntegrationSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(INTEGRATION_HUB_UPDATED_EVENT, fn)
    return () => window.removeEventListener(INTEGRATION_HUB_UPDATED_EVENT, fn)
  }, [])

  const overview = useMemo(() => overviewLocal(), [tick])
  const connections = useMemo(() => listConnectionsLocal(), [tick])
  const catalogFilter =
    tab === 'marketplace'
      ? 'marketplace'
      : tab === 'files'
        ? 'files'
        : tab === 'connections'
          ? 'connections'
          : null
  const items = useMemo(() => {
    if (tab === 'dashboard') return CONNECTORS.filter((c) => c.featured)
    if (catalogFilter) return listConnectorsLocal(catalogFilter)
    return []
  }, [tab, catalogFilter, tick])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2400)
  }

  function onConnect(item) {
    const row = connectLocal(item)
    if (row?.error === 'coming') {
      flash('Yakında — IH-1/2 adaptör')
      return
    }
    if (!row) {
      flash('Zaten bağlı')
      return
    }
    publishDomainEvent('trigger.integration.connected', {
      connectorId: item.id,
      slug: item.slug,
    })
    setTick((n) => n + 1)
    flash(`Bağlandı · ${item.title}`)
  }

  function onDisconnect(id) {
    disconnectLocal(id)
    publishDomainEvent('trigger.integration.disconnected', { connectorId: id })
    setTick((n) => n + 1)
    flash('Bağlantı kesildi')
  }

  function onWizard() {
    const result = runWizardLocal(brief)
    setWizard(result)
    publishDomainEvent('trigger.integration.wizard.drafted', {
      brief: brief.slice(0, 120),
      primary: result.suggested[0]?.slug,
    })
    flash('Taslak akış hazır')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Enterprise Integration Hub"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/otomasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/platform?tab=integrations"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Puzzle className="h-4 w-4" /> Platform
            </Link>
            <Link
              to="/marketplace?tab=integrations"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Store className="h-4 w-4" /> Marketplace
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          Universal API · Automation · Data Exchange — ERP, ticaret, banka, kargo, IoT ve AI tek
          merkez. Event-driven; mevcut adapter’lar SoT olarak korunur.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Katalog" value={overview.connectors} />
        <Kpi label="Bağlı" value={overview.connected} />
        <Kpi label="Webhook" value={overview.webhooks} />
        <Kpi label="Retry" value={overview.retries} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {integrationHubSubMenus.map((t) => (
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

      {(tab === 'dashboard' || tab === 'connections' || tab === 'marketplace') && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ConnectorCard
              key={item.id}
              item={item}
              connected={isConnectedLocal(item.id)}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          ))}
        </div>
      )}

      {tab === 'connections' && connections.length > 0 && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Aktif bağlantılar</h2>
          <ul className="mt-3 space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-bold text-[var(--ink)]">{c.title}</p>
                  <p className="text-[10px] uppercase text-[var(--muted)]">
                    {c.protocol} · {c.health} · {c.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDisconnect(c.connectorId)}
                  className="text-[10px] font-black uppercase text-rose-600"
                >
                  Kes
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'api' && (
        <StubPanel
          title="API Manager"
          links={[
            { to: '/platform?tab=api', label: 'Platform API Gateway' },
            { to: '/marketplace?tab=integrations', label: 'Marketplace' },
          ]}
        >
          REST · GraphQL · Versioning · OpenAPI · Rate limit · OAuth2 · JWT · API Keys — IH-1.
        </StubPanel>
      )}

      {tab === 'webhooks' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Webhook Center</h2>
          <ul className="mt-3 space-y-2">
            {WEBHOOKS.map((w) => (
              <li key={w.id} className="rounded-xl border px-3 py-2 text-xs">
                <p className="font-bold uppercase text-[var(--ink)]">{w.direction}</p>
                <p className="mt-1 break-all text-[var(--muted)]">{w.url}</p>
                <p className="mt-1 text-[10px] uppercase text-[var(--muted)]">
                  {w.status} · signature {w.signature ? 'on' : 'off'}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Signature · retry · replay — IH-1. Billing webhooks API’de kalır.
          </p>
        </section>
      )}

      {(tab === 'etl' || tab === 'transform') && (
        <StubPanel
          title={tab === 'etl' ? 'ETL Studio' : 'Data Transform'}
          links={[{ to: '/otomasyon/designer', label: 'Workflow Designer' }]}
        >
          Extract · Transform · Load · visual field mapping · JSON/XML/CSV/EDI — IH-1 canvas.
        </StubPanel>
      )}

      {tab === 'edi' && (
        <StubPanel title="EDI Center">
          EDIFACT · ANSI X12 · GS1 · UBL · PEPPOL — parser runtime IH-2.
        </StubPanel>
      )}

      {tab === 'files' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listConnectorsLocal('files').map((item) => (
            <ConnectorCard
              key={item.id}
              item={item}
              connected={isConnectedLocal(item.id)}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
            />
          ))}
        </div>
      )}

      {tab === 'scheduler' && (
        <StubPanel title="Scheduler" links={[{ to: '/otomasyon', label: 'Workflow' }]}>
          Realtime · cron · hourly/daily — Platform job queue + Workflow schedules.
        </StubPanel>
      )}

      {tab === 'queues' && (
        <StubPanel title="Queues" links={[{ to: '/platform?tab=jobs', label: 'Platform Jobs' }]}>
          Integration queues · dead-letter — Platform job bus üzerinde (IH-1).
        </StubPanel>
      )}

      {(tab === 'monitoring' || tab === 'logs') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex items-center gap-2 text-emerald-700">
            <Activity className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">
              {tab === 'logs' ? 'Logs' : 'Monitoring'}
            </h2>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Kpi label="Latency" value="—" />
            <Kpi label="Error %" value="0" />
            <Kpi label="Health OK" value={overview.healthOk} />
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Canlı metrikler Analytics + Platform health ile birleşir (IH-1).
          </p>
        </section>
      )}

      {tab === 'retry' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Retry Center</h2>
          <ul className="mt-3 space-y-2">
            {RETRIES.map((r) => (
              <li key={r.id} className="rounded-xl border px-3 py-2 text-xs">
                <p className="font-bold text-[var(--ink)]">{r.connectorSlug}</p>
                <p className="text-[var(--muted)]">
                  {r.error} · deneme {r.attempts}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    publishDomainEvent('trigger.integration.retry', { id: r.id })
                    flash('Retry kuyruğa alındı (stub)')
                  }}
                  className="mt-2 text-[10px] font-black uppercase text-emerald-700"
                >
                  Yeniden dene
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'wizard' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">AI Integration Wizard</h2>
          </div>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-xl border bg-white/40 px-3 py-2 text-sm text-[var(--ink)]"
            placeholder="Örn: Logo ERP ile stok senkronizasyonu oluştur."
          />
          <button
            type="button"
            onClick={onWizard}
            className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase text-emerald-800"
          >
            Analiz et & taslak oluştur
          </button>
          {wizard ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-bold text-[var(--ink)]">Önerilen bağlantılar</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {wizard.suggested.map((s) => (
                  <div key={s.id} className="rounded-xl border p-3 text-xs">
                    <p className="font-black text-[var(--ink)]">{s.title}</p>
                    <p className="text-[var(--muted)]">{s.summary}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-[var(--ink)]">Taslak: {wizard.draftFlow.name}</p>
              <ol className="list-decimal space-y-1 pl-5 text-xs text-[var(--muted)]">
                {wizard.draftFlow.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                to={wizard.draftFlow.deepLink}
                className="inline-block text-xs font-black uppercase text-emerald-700"
              >
                Workflow Designer’da aç →
              </Link>
            </div>
          ) : null}
        </section>
      )}

      {tab === 'flow' && (
        <StubPanel
          title="Visual Flow Builder"
          links={[
            { to: '/otomasyon/designer', label: 'Workflow Designer' },
            { to: '/otomasyon', label: 'Automation Hub' },
          ]}
        >
          Start · Trigger · API · Transform · Decision · Loop · AI · Approval · End — SoT Workflow
          Engine. Kod tekrarı yok.
        </StubPanel>
      )}

      {tab === 'security' && (
        <StubPanel title="Security">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <span>
              OAuth2 · OIDC · JWT · API Keys · mTLS · IP whitelist · rate limit · audit — Security
              Core + Platform (IH-1 vault).
            </span>
          </div>
        </StubPanel>
      )}

      {tab === 'docs' && (
        <StubPanel title="Documentation Center">
          API docs · webhook examples · SDK · Postman · OpenAPI export — IH-2.
        </StubPanel>
      )}

      {tab === 'sandbox' && (
        <StubPanel title="Sandbox">
          Mock API · sample data · simulation — IH-1. Production bağlantılarından izole.
        </StubPanel>
      )}

      {tab === 'settings' && (
        <StubPanel
          title="Settings"
          links={[
            { to: '/platform?tab=integrations', label: 'Platform registry' },
            { to: '/ayarlar/ai', label: 'AI Settings' },
            { to: '/mesajlar?ayarlar=1', label: 'Message Center' },
          ]}
        >
          Tenant varsayılanları · retry politikası · ortam (prod/sandbox).
        </StubPanel>
      )}

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex items-center gap-2 text-emerald-700">
          <Cable className="h-4 w-4" />
          <h2 className="text-sm font-black uppercase">Mimari kurallar</h2>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Marketplace keşfeder · Platform kaydeder · Integration Hub işletir</li>
          <li>Tek event bus: workflow.eventBus — ikinci bus yok</li>
          <li>WhatsApp / OpenAI / Commerce / Billing adapter’ları deep-link SoT</li>
        </ul>
      </section>
    </AppPageShell>
  )
}
