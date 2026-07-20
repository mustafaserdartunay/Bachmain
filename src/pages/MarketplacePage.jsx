import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Cable, Download, Puzzle, ShieldCheck, Sparkles, Star, Store } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { marketplaceSubMenus } from '../data/marketplaceMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  MARKETPLACE_UPDATED_EVENT,
  ensureMarketplaceSeed,
  installLocal,
  isInstalledLocal,
  listCatalogLocal,
  listInstalledLocal,
  overviewLocal,
  recommendLocal,
  uninstallLocal,
} from '../marketplace/localStore'

function Kpi({ label, value }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
    </div>
  )
}

function PackCard({ item, installed, onInstall, onUninstall }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} flex flex-col p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--muted)]">{item.kind}</p>
          <h3 className="mt-1 text-sm font-black text-[var(--ink)]">{item.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{item.summary}</p>
        </div>
        {item.featured ? (
          <span className="rounded-lg border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-700">
            Featured
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[var(--muted)]">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-500" /> {item.rating}
        </span>
        <span>{item.installs} kurulum</span>
        <span>v{item.version}</span>
        <span className="uppercase">{item.license}</span>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-3">
        {item.deepLink ? (
          <Link
            to={item.deepLink}
            className="rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase"
          >
            Aç
          </Link>
        ) : null}
        {installed ? (
          <button
            type="button"
            onClick={() => onUninstall(item.id)}
            className="rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase text-rose-600"
          >
            Kaldır
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onInstall(item)}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-800"
          >
            <Download className="h-3 w-3" /> Kur
          </button>
        )}
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'discover'
  const [tick, setTick] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ensureMarketplaceSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(MARKETPLACE_UPDATED_EVENT, fn)
    return () => window.removeEventListener(MARKETPLACE_UPDATED_EVENT, fn)
  }, [])

  const overview = useMemo(() => overviewLocal(), [tick])
  const installed = useMemo(() => listInstalledLocal(), [tick])
  const items = useMemo(() => {
    if (tab === 'recommend') return recommendLocal()
    if (tab === 'installed' || tab === 'updates' || tab === 'licenses') return []
    return listCatalogLocal(tab)
  }, [tab, tick])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'discover') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  function onInstall(item) {
    const row = installLocal(item)
    if (!row) {
      flash('Zaten kurulu')
      return
    }
    publishDomainEvent('trigger.marketplace.installed', {
      itemId: item.id,
      slug: item.slug,
      pluginCode: row.pluginCode,
    })
    setTick((n) => n + 1)
    flash(`Kuruldu · güvenlik taraması geçti · ${row.pluginCode}`)
  }

  function onUninstall(id) {
    uninstallLocal(id)
    publishDomainEvent('trigger.marketplace.uninstalled', { itemId: id })
    setTick((n) => n + 1)
    flash('Kaldırıldı (rollback stub)')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="BachMain Marketplace"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/platform?tab=plugins"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Puzzle className="h-4 w-4" /> Plugin SDK
            </Link>
            <Link
              to="/ai-uygulama"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> App Builder
            </Link>
            <Link
              to="/belge-merkezi/marketplace"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Store className="h-4 w-4" /> Belge Store
            </Link>
            <Link
              to="/entegrasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Cable className="h-4 w-4" /> Entegrasyon
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          AI Marketplace · Extension Store · Industry Hub — tek tıkla kurulum. Tüm paketler Plugin
          SDK uzantısıdır; çekirdek sisteme doğrudan müdahale yok. Güvenlik taraması zorunlu.
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Katalog" value={overview.total} />
        <Kpi label="Featured" value={overview.featured} />
        <Kpi label="Trend" value={overview.trending} />
        <Kpi label="Kurulu" value={overview.installed} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {marketplaceSubMenus.map((t) => (
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

      {(tab === 'discover' ||
        tab === 'featured' ||
        tab === 'industry' ||
        tab === 'applications' ||
        tab === 'agents' ||
        tab === 'integrations' ||
        tab === 'workflows' ||
        tab === 'documents' ||
        tab === 'dashboards' ||
        tab === 'themes' ||
        tab === 'prompts' ||
        tab === 'recommend') && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PackCard
              key={item.id}
              item={item}
              installed={isInstalledLocal(item.id)}
              onInstall={onInstall}
              onUninstall={onUninstall}
            />
          ))}
          {items.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Bu kategoride paket yok (MP-0 seed).</p>
          ) : null}
        </div>
      )}

      {tab === 'extensions' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Extensions</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            App Builder yayınları ve özel eklentiler Plugin Center’da görünür.
          </p>
          <Link
            to="/platform?tab=plugins"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Plugin Center →
          </Link>
        </section>
      )}

      {(tab === 'printers' || tab === 'languages' || tab === 'assets') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">
            {tab === 'printers'
              ? 'Printer Packs'
              : tab === 'languages'
                ? 'Language Packs'
                : 'Digital Asset Library'}
          </h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            MP-0 stub — Document Platform / Localization / Media ile birleşir (MP-1).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/belge-merkezi"
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              Belge Merkezi
            </Link>
            <Link
              to="/platform?tab=localization"
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              Localization
            </Link>
            <Link
              to="/platform?tab=media"
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              Media
            </Link>
          </div>
        </section>
      )}

      {tab === 'installed' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Installed</h2>
          <ul className="mt-3 space-y-2">
            {installed.length === 0 ? (
              <li className="text-xs text-[var(--muted)]">Kurulu paket yok.</li>
            ) : (
              installed.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-bold text-[var(--ink)]">{row.title}</p>
                    <p className="text-[10px] uppercase text-[var(--muted)]">
                      {row.pluginCode} · v{row.version} · scan {row.securityScan}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUninstall(row.itemId)}
                    className="text-[10px] font-black uppercase text-rose-600"
                  >
                    Kaldır
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      {tab === 'updates' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Update Center</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Tek tık güncelleme · sürüm notları · geri alma — MP-1.
          </p>
        </section>
      )}

      {tab === 'licenses' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">License Center</h2>
          <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {installed.map((r) => (
              <li key={r.id}>
                {r.title} — <span className="uppercase text-[var(--ink)]">{r.license}</span>
              </li>
            ))}
            {installed.length === 0 ? <li>Lisanslı kurulum yok.</li> : null}
          </ul>
          <Link
            to="/hesap/lisans"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Hesap lisansları →
          </Link>
        </section>
      )}

      {tab === 'reviews' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Review Center</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Puan · yorum · kurulum sayısı — katalog rating’leri MP-0 seed; canlı yorum MP-1.
          </p>
        </section>
      )}

      {(tab === 'developer' || tab === 'partner') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">
            {tab === 'developer' ? 'Developer Center' : 'Partner Center'}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
            <li>Plugin SDK · API · CLI · örnek projeler (PC-2 / MP-2)</li>
            <li>Çözüm ortakları · tema / agent geliştiricileri</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/platform?tab=plugins"
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              Plugin Center
            </Link>
            <Link
              to="/ai-uygulama"
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              App Builder
            </Link>
          </div>
        </section>
      )}

      {tab === 'enterprise' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Enterprise Store</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Şirket içi özel modüller, özel AI agent’lar, kurumsal tema ve belge paketleri — private
            catalog (MP-2).
          </p>
        </section>
      )}

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          <h2 className="text-sm font-black uppercase">Install Center kuralları</h2>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          <li>Bağımlılık / uyumluluk analizi · rollback · demo verisi (MP-1)</li>
          <li>Kurulum izole Plugin; Platform Core / Security / Audit zorunlu</li>
          <li>Cloud sync lisans & tema (MP-2)</li>
        </ul>
      </section>
    </AppPageShell>
  )
}
