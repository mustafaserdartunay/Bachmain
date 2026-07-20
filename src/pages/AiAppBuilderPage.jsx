import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Boxes, FileCode2, LayoutDashboard, Puzzle, Sparkles, Store, Workflow } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { appBuilderSubMenus } from '../data/aiAppBuilderMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  APP_BUILDER_UPDATED_EVENT,
  FIELD_TYPES,
  MARKETPLACE_PACKS,
  TEMPLATES,
  appBuilderOverviewLocal,
  createDraftFromNlLocal,
  ensureAppBuilderSeed,
  listDraftsLocal,
  listVersionsLocal,
  setDraftStatusLocal,
} from '../appBuilder/localStore'

function Kpi({ label, value }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
    </div>
  )
}

function DeepLink({ to, title, desc }) {
  return (
    <Link
      to={to}
      className={`${APP_SURFACE_PANEL_CLASS} block p-4 transition hover:-translate-y-0.5`}
    >
      <p className="text-sm font-black uppercase text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{desc}</p>
    </Link>
  )
}

export default function AiAppBuilderPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'home'
  const [prompt, setPrompt] = useState('')
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)
  const [selectedId, setSelectedId] = useState(null)

  const overview = useMemo(() => appBuilderOverviewLocal(), [tick])
  const drafts = useMemo(() => listDraftsLocal(), [tick])
  const versions = useMemo(() => listVersionsLocal(), [tick])
  const selected = useMemo(
    () => drafts.find((d) => d.id === selectedId) || drafts[0] || null,
    [drafts, selectedId],
  )

  useEffect(() => {
    ensureAppBuilderSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(APP_BUILDER_UPDATED_EVENT, fn)
    return () => window.removeEventListener(APP_BUILDER_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'home') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function generate(text) {
    const q = (text || prompt).trim()
    if (!q) return
    const row = createDraftFromNlLocal(q)
    publishDomainEvent('trigger.aios.app_builder.drafted', { draftId: row.id, slug: row.slug })
    setSelectedId(row.id)
    setPrompt('')
    setTick((n) => n + 1)
    setTab('applications')
    flash('Modül taslağı oluşturuldu')
  }

  function publish(id) {
    const row = setDraftStatusLocal(id, 'published')
    publishDomainEvent('trigger.aios.app_builder.published', {
      draftId: id,
      pluginCode: row?.publishMeta?.pluginCode,
    })
    setTick((n) => n + 1)
    flash('Publish stub → Plugin SDK')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI App Builder"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/otomasyon/designer"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/analitik?tab=builder"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              to="/platform?tab=plugins"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Puzzle className="h-4 w-4" /> Plugins
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Store className="h-4 w-4" /> Marketplace
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <FileCode2 className="mt-0.5 h-5 w-5 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ink)]">
              AI Native Low-Code — doğal dil ile modül, ekran, form, rapor ve workflow iskeleti. SoT
              builder’lar deep-link; yayın Plugin SDK uzantısıdır. Çekirdek tablolara doğrudan
              müdahale yok.
            </p>
            {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {appBuilderSubMenus.map((t) => (
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

      {tab === 'home' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Taslak" value={overview.drafts} />
            <Kpi label="Preview" value={overview.preview} />
            <Kpi label="Published" value={overview.published} />
          </div>
          <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="text-sm font-black uppercase">Natural Language Development</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Örn: “Servis Takip Modülü oluştur.” · “Makine Bakım Takvimi hazırla.”
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generate()
                }}
                placeholder="Ne oluşturmak istiyorsunuz?"
                className="min-h-12 min-w-0 flex-1 rounded-2xl border bg-transparent px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => generate()}
                className="min-h-12 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
              >
                AI Oluştur
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => generate(t.prompt)}
                  className="rounded-lg border px-2 py-1 text-[10px] font-bold text-[var(--muted)]"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DeepLink
              to="/otomasyon/designer"
              title="Workflow Designer"
              desc="IF · APPROVAL · AI · WEBHOOK"
            />
            <DeepLink
              to="/analitik?tab=builder"
              title="Dashboard Builder"
              desc="KPI · widget · layout"
            />
            <DeepLink
              to="/belge-merkezi/tasarimci"
              title="Document Designer"
              desc="PDF · etiket · yazdırma"
            />
            <DeepLink to="/platform?tab=plugins" title="Plugin Center" desc="Yayın / SDK stub" />
          </div>
        </>
      )}

      {(tab === 'applications' || tab === 'modules' || tab === 'preview' || tab === 'publish') && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="text-sm font-black uppercase">Drafts</h2>
            <ul className="mt-3 space-y-2">
              {drafts.length === 0 ? (
                <li className="text-xs text-[var(--muted)]">
                  Henüz taslak yok — NL ile oluşturun.
                </li>
              ) : (
                drafts.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                        selected?.id === d.id ? 'border-emerald-500/40 bg-emerald-500/5' : ''
                      }`}
                    >
                      <span className="font-bold text-[var(--ink)]">{d.name}</span>
                      <span className="font-black uppercase text-[var(--muted)]">{d.status}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            {selected ? (
              <>
                <h2 className="text-sm font-black uppercase">{selected.name}</h2>
                <p className="mt-1 text-[10px] font-bold uppercase text-[var(--muted)]">
                  {selected.slug} · v{selected.version} · {selected.status}
                </p>
                <p className="mt-2 text-xs text-[var(--ink)]">{selected.scaffold.description}</p>
                <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                  <p className="font-black uppercase text-emerald-800">Explainable</p>
                  <p className="mt-1">{selected.scaffold.explainWhy}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
                  <div>
                    <p className="font-black uppercase text-[var(--muted)]">Ekranlar</p>
                    <p>{selected.scaffold.screens.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase text-[var(--muted)]">Yetkiler</p>
                    <p>{selected.scaffold.permissions.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase text-[var(--muted)]">Workflow</p>
                    <p>{selected.scaffold.workflows.join(' · ')}</p>
                  </div>
                  <div>
                    <p className="font-black uppercase text-[var(--muted)]">Raporlar</p>
                    <p>{selected.scaffold.reports.join(' · ')}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftStatusLocal(selected.id, 'preview')
                      setTick((n) => n + 1)
                      flash('Preview modu')
                    }}
                    className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => publish(selected.id)}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[10px] font-black uppercase text-emerald-800"
                  >
                    Publish
                  </button>
                  <Link
                    to="/otomasyon/designer"
                    className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
                  >
                    Workflow’a geç
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-xs text-[var(--muted)]">Taslak seçin.</p>
            )}
          </section>
        </div>
      )}

      {(tab === 'pages' || tab === 'forms' || tab === 'tables') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">
            {tab === 'forms'
              ? 'Form Designer'
              : tab === 'tables'
                ? 'Table Designer'
                : 'Page Designer'}
          </h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            AB-0: alan / görünüm kataloğu hazır. Sürükle-bırak canvas AB-1.
          </p>
          {tab === 'forms' ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {FIELD_TYPES.map((f) => (
                <span key={f} className="rounded-lg border px-2 py-1 text-[10px] font-bold">
                  {f}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <DeepLink
                to="/belge-merkezi/tasarimci"
                title="Document / Print"
                desc="Kurumsal belge tasarımı SoT"
              />
              <DeepLink
                to="/analitik?tab=builder"
                title="Analytics views"
                desc="Liste · grafik · pivot"
              />
            </div>
          )}
        </section>
      )}

      {tab === 'dashboards' && (
        <DeepLink
          to="/analitik?tab=builder"
          title="Dashboard Builder"
          desc="Analytics SoT — widget · layout · KPI"
        />
      )}

      {(tab === 'workflow' || tab === 'automation') && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DeepLink
            to="/otomasyon/designer"
            title="Visual Workflow Designer"
            desc="IF ELSE WAIT APPROVAL MAIL SMS WHATSAPP AI API WEBHOOK LOOP"
          />
          <DeepLink
            to="/otomasyon"
            title="Workflow Hub"
            desc="Business rules · templates · yayın"
          />
          <DeepLink
            to="/platform?tab=automation"
            title="Platform Automation"
            desc="Queue · scheduler · jobs"
          />
          <DeepLink to="/aios?tab=approvals" title="Human Approval" desc="Kritik adımlar" />
        </div>
      )}

      {(tab === 'api' || tab === 'integrations') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">API / Integration Builder</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            REST · Webhook · Import/Export · Auth · Rate limit · Docs — AB-1 otomatik üretir.
          </p>
          <Link
            to="/platform?tab=api"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Platform API Gateway →
          </Link>
        </section>
      )}

      {tab === 'designer' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-700" />
            <h2 className="text-sm font-black uppercase">AI UI Designer</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            “Minimal iOS cam ekran oluştur” — brief → tasarım sistemi token’larına map (AB-1
            canvas).
          </p>
          <button
            type="button"
            onClick={() => generate('Minimal iOS cam efektli servis listesi ekranı oluştur.')}
            className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase text-emerald-800"
          >
            Örnek brief çalıştır
          </button>
        </section>
      )}

      {tab === 'marketplace' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">App Builder Packs</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Tam ekosistem kataloğu BachMain Marketplace’te. Burada App Builder şablon paketleri.
          </p>
          <Link
            to="/marketplace?tab=applications"
            className="mt-2 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Marketplace Applications →
          </Link>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_PACKS.map((p) => (
              <div key={p.id} className="rounded-xl border p-3">
                <p className="text-sm font-black text-[var(--ink)]">{p.name}</p>
                <p className="text-[10px] font-bold uppercase text-[var(--muted)]">{p.kind}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'templates' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Templates</h2>
          <ul className="mt-3 space-y-2">
            {TEMPLATES.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-xl border px-3 py-2"
              >
                <span className="text-sm font-bold text-[var(--ink)]">{t.name}</span>
                <button
                  type="button"
                  onClick={() => generate(t.prompt)}
                  className="text-[10px] font-black uppercase text-emerald-700"
                >
                  Kullan
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'versions' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Version Manager</h2>
          <ul className="mt-3 space-y-2">
            {versions.length === 0 ? (
              <li className="text-xs text-[var(--muted)]">Yayın geçmişi yok.</li>
            ) : (
              versions.map((v) => (
                <li key={v.id} className="rounded-xl border px-3 py-2 text-xs">
                  <span className="font-bold text-[var(--ink)]">{v.name}</span>
                  <span className="ml-2 text-[var(--muted)]">
                    v{v.version} · {new Date(v.at).toLocaleString('tr-TR')}
                  </span>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Rollback / diff AB-1. Güvenlik: RBAC · ABAC · Field Security · Audit otomatik.
          </p>
        </section>
      )}

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4" />
          <h2 className="text-sm font-black uppercase">Extension Model</h2>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Platform Core · AIOS · Workflow · Document · Analytics · Plugin SDK entegrasyonu</li>
          <li>WCAG · cam / iOS yüzey dili · performans hedefleri</li>
          <li>Hiçbir üretilen modül çekirdeğe doğrudan yazmaz</li>
        </ul>
      </section>
    </AppPageShell>
  )
}
