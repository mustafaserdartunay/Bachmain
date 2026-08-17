import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Languages,
  PenLine,
  Printer,
  QrCode,
  Sparkles,
  Tags,
  Variable,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { DOCUMENT_CENTER_BASE, documentPlatformTabs } from '../../data/documentCenterMenu'
import { loadDocTemplates } from '../../utils/docTemplatesStore'
import { DOC_VARIABLE_GROUPS } from '../../data/docVariableCatalog'
import { DOCUMENT_ENGINE_RULE } from '../../documents/engine'
import {
  DOCUMENTS_UPDATED_EVENT,
  documentsOverviewLocal,
  ensureDocumentsSeed,
  listAiDesignsLocal,
  listAssetsLocal,
  listFontsLocal,
  listMarketplaceLocal,
  runAiDesignLocal,
} from '../../documents/localStore'
import { publishDomainEvent } from '../../workflow/eventBus'
import {
  defaultQuotePrintSettings,
  readQuotePrintSettings,
  saveQuotePrintSettings,
  DOC_PRINT_SETTINGS_EVENT,
} from '../../utils/docPrintSettingsStore'

function QuotePrintSettingsCard() {
  const [settings, setSettings] = useState(readQuotePrintSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function sync() {
      setSettings(readQuotePrintSettings())
    }
    window.addEventListener(DOC_PRINT_SETTINGS_EVENT, sync)
    return () => window.removeEventListener(DOC_PRINT_SETTINGS_EVENT, sync)
  }, [])

  function toggle(field) {
    setSettings((current) => ({ ...current, [field]: !current[field] }))
  }

  function handleSave() {
    saveQuotePrintSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  function handleReset() {
    setSettings({ ...defaultQuotePrintSettings })
    saveQuotePrintSettings(defaultQuotePrintSettings)
  }

  const checks = [
    ['showCompany', 'Firma bilgileri'],
    ['showLogo', 'Firma logosu'],
    ['showCustomer', 'Müşteri bilgileri'],
    ['showRepresentative', 'Temsilci'],
    ['showDates', 'Tarih süreci (oluşturma, geçerlilik, vade)'],
    ['showProductImages', 'Ürün görselleri (büyük)'],
    ['showTerms', 'Koşullar'],
    ['showBanks', 'Banka hesapları'],
    ['showTotals', 'Toplamlar'],
  ]

  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} space-y-4 p-4`}>
      <div>
        <h2 className="text-[14px] font-normal text-[var(--muted)]">Teklif</h2>
        <p className="mt-1 text-[14px] font-normal text-[var(--muted)]">
          Yazdırma önizlemesi, PDF ve şablon bu ayarlarla üretilir. Font Inter / sistem yazı tipidir.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {checks.map(([field, label]) => (
          <label key={field} className="flex min-h-10 items-center gap-2 text-[14px] font-normal text-[var(--muted)]">
            <input
              type="checkbox"
              checked={Boolean(settings[field])}
              onChange={() => toggle(field)}
            />
            {label}
          </label>
        ))}
      </div>
      <label className="block max-w-xs space-y-1">
        <span className="text-[14px] font-normal text-[var(--muted)]">Ürün görsel boyutu</span>
        <select
          className="form-input"
          value={settings.productImageSize}
          onChange={(event) =>
            setSettings((current) => ({ ...current, productImageSize: Number(event.target.value) }))
          }
        >
          <option value={120}>120 px</option>
          <option value={140}>140 px</option>
          <option value={180}>180 px</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className="min-h-10 rounded-xl border px-3 text-[14px] font-normal">
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
        <button type="button" onClick={handleReset} className="min-h-10 rounded-xl border px-3 text-[14px] font-normal">
          Varsayılan
        </button>
      </div>
    </div>
  )
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

export default function DocumentCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [msg, setMsg] = useState('')
  const [prompt, setPrompt] = useState('Modern teklif tasarla.')
  const [tick, setTick] = useState(0)

  const templates = useMemo(() => loadDocTemplates(), [tick])
  const overview = useMemo(() => documentsOverviewLocal(templates.length), [templates.length, tick])
  const assets = useMemo(() => listAssetsLocal(), [tick])
  const fonts = useMemo(() => listFontsLocal(), [tick])
  const market = useMemo(() => listMarketplaceLocal(), [tick])
  const aiDesigns = useMemo(() => listAiDesignsLocal(), [tick])

  useEffect(() => {
    ensureDocumentsSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(DOCUMENTS_UPDATED_EVENT, fn)
    return () => window.removeEventListener(DOCUMENTS_UPDATED_EVENT, fn)
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

  return (
    <AppPageShell>
      <AppPageHeader
        title="Enterprise Document Platform"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to={`${DOCUMENT_CENTER_BASE}/tasarimci`}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <PenLine className="h-4 w-4" /> Builder
            </Link>
            <Link
              to={`${DOCUMENT_CENTER_BASE}/yazdir`}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Printer className="h-4 w-4" /> Print
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <p className="text-sm text-[var(--ink)]">
          BachMain Document Platform 2026 — teklif, sipariş, üretim, depo, lojistik, etiket, QR ve
          mesaj şablonları tek motordan. {DOCUMENT_ENGINE_RULE}
        </p>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {documentPlatformTabs.map((t) => (
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
            <Kpi
              label="Şablon"
              value={overview.templateCount}
              to={`${DOCUMENT_CENTER_BASE}/sablonlar`}
            />
            <Kpi label="Assets" value={overview.assetCount} />
            <Kpi label="Fonts" value={overview.fontCount} />
            <Kpi label="AI tasarım" value={overview.aiDesignCount} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                to: `${DOCUMENT_CENTER_BASE}/tasarimci`,
                t: 'Document Builder',
                d: 'Canva benzeri sürükle-bırak',
                icon: PenLine,
              },
              {
                to: `${DOCUMENT_CENTER_BASE}/etiket`,
                t: 'Label Designer',
                d: 'mm bazlı termal / sticker',
                icon: Tags,
              },
              {
                to: `${DOCUMENT_CENTER_BASE}/barkod`,
                t: 'Barcode / QR',
                d: 'Code128 · EAN · QR',
                icon: QrCode,
              },
              {
                to: `${DOCUMENT_CENTER_BASE}/yazici-profilleri`,
                t: 'Print Profiles',
                d: 'Zebra · TSC · HP…',
                icon: Printer,
              },
              {
                to: `${DOCUMENT_CENTER_BASE}/ai-designer`,
                t: 'AI Designer',
                d: 'Prompt → şablon',
                icon: Sparkles,
              },
              {
                to: '/otomasyon',
                t: 'Approval / Workflow',
                d: 'Yayın öncesi onay',
                icon: Workflow,
              },
            ].map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={`${APP_SURFACE_PANEL_CLASS} block space-y-2 p-4`}
              >
                <x.icon className="h-5 w-5 text-[var(--ink)]" />
                <p className="font-black text-[var(--ink)]">{x.t}</p>
                <p className="text-xs text-[var(--muted)]">{x.d}</p>
              </Link>
            ))}
          </div>
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <p className="mb-3 text-[11px] font-black uppercase text-[var(--muted)]">
              Son şablonlar
            </p>
            {templates.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Henüz şablon yok.{' '}
                <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/tasarimci`}>
                  Builder ile başla
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {templates.slice(0, 8).map((tpl) => (
                  <li key={tpl.id}>
                    <Link
                      to={`${DOCUMENT_CENTER_BASE}/tasarimci?id=${encodeURIComponent(tpl.id)}`}
                      className="flex items-center justify-between rounded-xl border border-dark-500/20 px-3 py-2 text-sm"
                    >
                      <span className="font-bold">{tpl.name}</span>
                      <span className="text-[10px] font-black uppercase text-[var(--muted)]">
                        {tpl.status} · {tpl.docType}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === 'templates' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/sablonlar`}>
            Şablon listesi →
          </Link>
        </div>
      )}

      {tab === 'builder' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          BachDocumentDesigner SoT:{' '}
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/tasarimci`}>
            Belge Tasarımcısı
          </Link>
          . Infinite canvas, layers, snap, undo/redo mevcut builder’da.
        </div>
      )}

      {tab === 'labels' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/etiket`}>
            Label Designer →
          </Link>
        </div>
      )}

      {(tab === 'barcode' || tab === 'qr') && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>
            Barkod / QR bileşenleri Label Designer ve Document Builder içinde. Dedicated yüzeyler:
          </p>
          <Link className="font-bold underline block" to={`${DOCUMENT_CENTER_BASE}/barkod`}>
            Barcode Designer
          </Link>
          <Link className="font-bold underline block" to={`${DOCUMENT_CENTER_BASE}/qr`}>
            QR Designer
          </Link>
          <Link className="font-bold underline block" to={`${DOCUMENT_CENTER_BASE}/etiket`}>
            Etiket (mm)
          </Link>
        </div>
      )}

      {tab === 'print' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`${DOCUMENT_CENTER_BASE}/yazdir`}
            className={`${APP_SURFACE_PANEL_CLASS} p-4 font-bold`}
          >
            Yazdır / PDF / Live Preview
          </Link>
          <Link
            to={`${DOCUMENT_CENTER_BASE}/yazici-profilleri`}
            className={`${APP_SURFACE_PANEL_CLASS} p-4 font-bold`}
          >
            Printer Profiles (Zebra, TSC, HP…)
          </Link>
          <Link
            to={`${DOCUMENT_CENTER_BASE}/kayitlar`}
            className={`${APP_SURFACE_PANEL_CLASS} p-4 font-bold`}
          >
            Print Jobs
          </Link>
        </div>
      )}

      {tab === 'variables' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">
            Kod yazmadan sürükle-bırak: <code>{'{{musteri.unvan}}'}</code>,{' '}
            <code>{'{{siparis.no}}'}</code>, <code>{'{{fatura.toplam}}'}</code>…
          </p>
          {DOC_VARIABLE_GROUPS.map((g) => (
            <div key={g.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-[var(--muted)]">
                <Variable className="h-3.5 w-3.5" /> {g.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.variables.map((v) => (
                  <button
                    key={v.path}
                    type="button"
                    className="rounded-lg border px-2 py-1 text-[11px] font-bold"
                    onClick={() => {
                      navigator.clipboard?.writeText(`{{${v.path}}}`)
                      flash(`Kopyalandı: {{${v.path}}}`)
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'assets' && (
        <div className="grid gap-3 md:grid-cols-3">
          {assets.map((a) => (
            <div key={a.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{a.name}</p>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">{a.kind}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fonts' && (
        <div className="grid gap-3 md:grid-cols-3">
          {fonts.map((f) => (
            <div key={f.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="text-lg font-black" style={{ fontFamily: f.family }}>
                {f.family}
              </p>
              <p className="text-[10px] font-bold uppercase text-[var(--muted)]">
                {f.source} · {(f.weights || []).join('/')}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-3">
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase text-[var(--muted)]">
              <Sparkles className="h-3.5 w-3.5" /> AI Document Designer
            </p>
            <textarea
              className="min-h-24 w-full rounded-xl border bg-white/40 p-3 text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {[
                'Modern teklif tasarla.',
                'Minimal invoice oluştur.',
                'Almanya ihracat packing listesi oluştur.',
                'Palet etiketi oluştur.',
                'Üretim formu oluştur.',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                  onClick={() => setPrompt(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="min-h-11 rounded-2xl border px-4 text-xs font-black uppercase"
              onClick={() => {
                const row = runAiDesignLocal(prompt)
                publishDomainEvent('trigger.document.ai.designed', {
                  designId: row.id,
                  docType: row.docType,
                })
                setTick((n) => n + 1)
                flash(`AI tasarım hazır: ${row.docType}`)
              }}
            >
              AI ile oluştur
            </button>
          </div>
          {aiDesigns.map((d) => (
            <div key={d.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{d.prompt}</p>
              <p className="text-xs text-[var(--muted)]">
                {d.docType} · {d.style} · {d.blocks?.length || 0} blok
              </p>
              <Link
                className="mt-2 inline-block text-xs font-black uppercase underline"
                to={`${DOCUMENT_CENTER_BASE}/tasarimci`}
              >
                Builder’da aç
              </Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {market.map((m) => (
            <div key={m.slug} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <p className="font-bold">{m.title}</p>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">
                {m.sector} · {m.locale} {m.premium ? '· premium' : ''}
              </p>
              <button
                type="button"
                className="mt-3 min-h-10 rounded-xl border px-3 text-[11px] font-black uppercase"
                onClick={() => flash('Kurulum DP-1’de — şimdilik katalog stub')}
              >
                Tek tık kur
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'versions' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          Sürümler şablon kaydında <code>versions[]</code> olarak tutulur.{' '}
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/sablonlar`}>
            Şablonlar
          </Link>{' '}
          ·{' '}
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/versiyonlar`}>
            Version History
          </Link>
        </div>
      )}

      {tab === 'approval' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-6 text-sm`}>
          <p>Belge yayını Workflow Engine onayına bağlanır (fork yok).</p>
          <Link className="font-bold underline" to="/otomasyon">
            Workflow Engine →
          </Link>
          <Link className="font-bold underline block" to={`${DOCUMENT_CENTER_BASE}/workflow`}>
            Document workflow notları
          </Link>
        </div>
      )}

      {tab === 'localization' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <p className="mb-2 flex items-center gap-2 font-bold">
            <Languages className="h-4 w-4" /> TR · EN · DE · FR · ES · IT · AR
          </p>
          <p className="text-[var(--muted)]">
            Şablon başına locale alanı API’de hazır; çok dil paketleri DP-2.
          </p>
        </div>
      )}

      {tab === 'archive' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <Link className="font-bold underline" to={`${DOCUMENT_CENTER_BASE}/arsiv`}>
            Arşiv / soft-delete →
          </Link>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          <QuotePrintSettingsCard />
          <div className={`${APP_SURFACE_PANEL_CLASS} space-y-2 p-4 text-sm`}>
            <p>{DOCUMENT_ENGINE_RULE}</p>
            <p>
              Knowledge ayrı platformdır:{' '}
              <Link className="font-bold underline" to="/bilgi-merkezi">
                /bilgi-merkezi
              </Link>
            </p>
          </div>
        </div>
      )}

      {tab === 'mapping' && (
        <div className={`${APP_SURFACE_PANEL_CLASS} p-6 text-sm`}>
          <p className="mb-3">Veri eşleme — modül seçimi (kod yok):</p>
          <div className="flex flex-wrap gap-2">
            {[
              'CRM',
              'Muhasebe',
              'Üretim',
              'Depo',
              'Lojistik',
              'Satın Alma',
              'İK',
              'B2B',
              'Commerce',
            ].map((m) => (
              <span
                key={m}
                className="rounded-xl border px-3 py-2 text-[11px] font-black uppercase"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[var(--muted)]">
            Context builder: <code>buildDocumentContext</code> · yazdır:{' '}
            <Link className="underline" to={`${DOCUMENT_CENTER_BASE}/yazdir`}>
              /belge-merkezi/yazdir
            </Link>
          </p>
        </div>
      )}
    </AppPageShell>
  )
}
