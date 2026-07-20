import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Bot,
  Boxes,
  Cpu,
  KeyRound,
  Puzzle,
  Settings,
  Shield,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { platformSubMenus } from '../data/platformMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  EVENT_SAMPLES,
  PLATFORM_UPDATED_EVENT,
  enqueueJobLocal,
  ensurePlatformSeed,
  healthLocal,
  listFlagsLocal,
  listIntegrationsLocal,
  listJobsLocal,
  listModulesLocal,
  listPluginsLocal,
  platformOverviewLocal,
  setModuleStatusLocal,
  toggleFlagLocal,
} from '../platform/localStore'

function Kpi({ label, value }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
    </div>
  )
}

function statusTone(status) {
  if (status === 'ok' || status === 'active' || status === 'configured') return 'text-emerald-700'
  if (status === 'degraded' || status === 'queued') return 'text-amber-600'
  if (status === 'inactive') return 'text-[var(--muted)]'
  return 'text-rose-600'
}

export default function PlatformCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'core'
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)

  const overview = useMemo(() => platformOverviewLocal(), [tick])
  const modules = useMemo(() => listModulesLocal(), [tick])
  const flags = useMemo(() => listFlagsLocal(), [tick])
  const jobs = useMemo(() => listJobsLocal(), [tick])
  const health = useMemo(() => healthLocal(), [tick])
  const integrations = useMemo(() => listIntegrationsLocal(), [tick])
  const plugins = useMemo(() => listPluginsLocal(), [tick])

  useEffect(() => {
    ensurePlatformSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(PLATFORM_UPDATED_EVENT, fn)
    return () => window.removeEventListener(PLATFORM_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'core') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Platform Core"
        actions={
          <div className="flex flex-wrap gap-2">
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
            <Link
              to="/marketplace"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Boxes className="h-4 w-4" /> Marketplace
            </Link>
            <Link
              to="/ayarlar"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain Business Operating System — Modular Monolith PC-0. Domain hub’lar SoT; Platform
          yalnızca kayıt, event bus, job, health ve deep-link sağlar. Kod tekrarı ve ikinci event
          bus yok.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {platformSubMenus.map((t) => (
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

      {tab === 'core' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Aktif modül" value={overview.activeModules} />
            <Kpi label="Kuyruk iş" value={overview.queuedJobs} />
            <Kpi label="Flag açık" value={overview.flagsOn} />
            <Kpi label="Mimari" value="Monolith" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/ayarlar/master-data', t: 'Master Data', icon: Boxes },
              { to: '/otomasyon', t: 'Workflow / Events', icon: Workflow },
              { to: '/aios', t: 'AI Gateway', icon: Bot },
              { to: '/hesap/lisans', t: 'License', icon: KeyRound },
              { to: '/ayarlar/kurumsal-yapi', t: 'Authorization / Org', icon: Shield },
              { to: '/kurulum', t: 'Installer', icon: Cpu },
              { to: '/analitik', t: 'Analytics', icon: Activity },
              { to: '/belge-merkezi', t: 'Documents / Files', icon: Puzzle },
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

      {tab === 'identity' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>JWT · MFA · session · trusted devices SoT: Identity API.</p>
          <Link className="font-bold underline" to="/profil">
            Profil / hesap →
          </Link>
        </div>
      )}

      {tab === 'authorization' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>RBAC / org scope — kurumsal yapı ve kullanıcı yetkileri.</p>
          <Link className="font-bold underline" to="/ayarlar/kurumsal-yapi/kullanici-yetkileri">
            Kullanıcı yetkileri →
          </Link>
        </div>
      )}

      {tab === 'settings' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to="/ayarlar">
            Ayarlar merkezi →
          </Link>
        </div>
      )}

      {tab === 'modules' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => (
            <div key={m.code} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{m.label}</p>
                  <p className="text-[10px] font-black uppercase text-[var(--muted)]">
                    {m.domain} · {m.code}
                  </p>
                </div>
                <button
                  type="button"
                  className={`text-[10px] font-black uppercase ${statusTone(m.status)}`}
                  onClick={() => {
                    const next = m.status === 'active' ? 'inactive' : 'active'
                    setModuleStatusLocal(m.code, next)
                    setTick((n) => n + 1)
                    flash(`${m.code} → ${next}`)
                  }}
                >
                  {m.status}
                </button>
              </div>
              {m.route ? (
                <Link className="mt-3 inline-block text-xs font-bold underline" to={m.route}>
                  Aç
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {(tab === 'workflow' || tab === 'automation') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>Kod yazmadan IF/ELSE/WAIT/APPROVAL/EMAIL/SMS/WhatsApp/AI/API — Workflow Engine SoT.</p>
          <Link className="font-bold underline" to="/otomasyon">
            /otomasyon →
          </Link>
        </div>
      )}

      {tab === 'notification' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Mail · SMS · WhatsApp · Push · In-App —{' '}
          <Link className="font-bold underline" to="/ayarlar/mesaj-merkezi">
            Mesaj Merkezi
          </Link>
        </div>
      )}

      {tab === 'events' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <p className="text-sm">Tek event bus: `publishDomainEvent` + Workflow catalog.</p>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_SAMPLES.map((e) => (
              <span key={e} className="rounded-lg border px-2 py-1 font-mono text-[10px]">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {(tab === 'queue' || tab === 'scheduler') && (
        <div className="space-y-3">
          <button
            type="button"
            className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
            onClick={() => {
              enqueueJobLocal(`manual-${Date.now().toString(36)}`)
              publishDomainEvent('trigger.platform.job.queued', {})
              setTick((n) => n + 1)
              flash('Job kuyruğa alındı')
            }}
          >
            + Job
          </button>
          {jobs.map((j) => (
            <div key={j.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{j.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {j.queue} · {j.status} · p{j.priority}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Activity / audit loglar admin ve domain event’lerinden beslenir (PC-1 tenant UI).
        </div>
      )}

      {(tab === 'files' || tab === 'media') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Dosya / medya — Document Platform assets + gelecek `/v1/files`.{' '}
          <Link className="font-bold underline" to="/belge-merkezi?tab=assets">
            Belge Assets
          </Link>
        </div>
      )}

      {tab === 'localization' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Dil · TZ · para · vergi —{' '}
          <Link className="font-bold underline" to="/belge-merkezi/localization">
            Document Localization
          </Link>{' '}
          ·{' '}
          <Link className="font-bold underline" to="/ayarlar/vergi-kdv">
            Vergi/KDV
          </Link>
        </div>
      )}

      {tab === 'themes' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Appearance (iOS cam) header’da; belge temaları{' '}
          <Link className="font-bold underline" to="/belge-merkezi/temalar">
            Belge Temalar
          </Link>
        </div>
      )}

      {tab === 'plugins' && (
        <div className="space-y-3">
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <p className="text-xs text-[var(--muted)]">
              Merkezi katalog ve tek tık kurulum için BachMain Marketplace.
            </p>
            <Link
              to="/marketplace"
              className="mt-2 inline-block text-xs font-black uppercase text-emerald-700"
            >
              Marketplace’i aç →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {plugins.map((p) => (
              <div key={p.slug} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <p className="font-bold">{p.title}</p>
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">
                  {p.kind} · {p.slug}
                </p>
                <button
                  type="button"
                  className="mt-3 min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
                  onClick={() => flash('Plugin SDK PC-2 — kayıt stub')}
                >
                  Kur
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'ai' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>Tek AI katmanı: OpenAI / Claude / Gemini… AIOS gateway.</p>
          <Link className="font-bold underline" to="/aios">
            /aios →
          </Link>
          <Link className="font-bold underline block" to="/ayarlar/ai">
            AI ayarları
          </Link>
        </div>
      )}

      {tab === 'api' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-4 text-sm`}>
          <p className="mb-2 font-bold">REST gateway (Fastify monolith)</p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
            {[
              '/v1/auth',
              '/v1/mdm',
              '/v1/workflows',
              '/v1/aios',
              '/v1/platform',
              '/v1/analytics',
              '/v1/documents',
              '/v1/cxc',
              '/v1/finance',
              '/v1/mes',
            ].map((p) => (
              <span key={p} className="rounded-lg border px-2 py-1">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((i) => (
            <div key={i.code} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{i.label}</p>
              <p className={`text-[10px] font-black uppercase ${statusTone(i.status)}`}>
                {i.status}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'health' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {health.map((h) => (
            <div key={h.service} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{h.service}</p>
              <p className={`mt-2 text-lg font-black uppercase ${statusTone(h.status)}`}>
                {h.status}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'flags' && (
        <div className="space-y-2">
          {flags.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${APP_SURFACE_PANEL_CLASS} flex w-full items-center justify-between p-4 text-left`}
              onClick={() => {
                toggleFlagLocal(f.key)
                setTick((n) => n + 1)
              }}
            >
              <span>
                <span className="block font-bold">{f.key}</span>
                <span className="text-xs text-[var(--muted)]">{f.description}</span>
              </span>
              <span
                className={`text-xs font-black uppercase ${f.enabled ? 'text-emerald-700' : 'text-[var(--muted)]'}`}
              >
                {f.enabled ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>
      )}

      {tab === 'license' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to="/hesap/lisans">
            Lisans merkezi →
          </Link>
        </div>
      )}

      {tab === 'installer' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Yeni şirket wizard —{' '}
          <Link className="font-bold underline" to="/kurulum">
            /kurulum
          </Link>
        </div>
      )}

      {(tab === 'backup' || tab === 'update') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          {tab === 'backup'
            ? 'Şifreli / versiyonlu backup — ops runbook (docs/55). Restore test PC-2.'
            : 'Migration · rollback · health check — drizzle journal + Update Manager PC-2.'}
        </div>
      )}

      {tab === 'developer' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>Debug · events · API explorer · feature toggle · performance.</p>
          <p className="font-mono text-xs">Flag: platform.developer_mode</p>
          <button
            type="button"
            className="min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
            onClick={() => {
              toggleFlagLocal('platform.developer_mode')
              setTick((n) => n + 1)
              flash('Developer mode toggled')
            }}
          >
            Toggle Developer Mode
          </button>
        </div>
      )}
    </AppPageShell>
  )
}
