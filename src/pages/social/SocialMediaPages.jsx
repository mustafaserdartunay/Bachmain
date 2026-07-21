import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare,
  Clock,
  Image,
  Instagram,
  Loader2,
  Mail,
  Megaphone,
  MessageCircle,
  Palette,
  PlugZap,
  Sparkles,
  Wand2,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { publishDomainEvent } from '../../workflow/eventBus'
import { smcApi } from '../../social/api'
import {
  buildLocalAiPackage,
  localAddMedia,
  localListBrandKits,
  localListContent,
  localListMedia,
  localOverview,
  localSaveBrandKit,
  localSaveContent,
} from '../../social/localFallback'
import { runAiGrowthGenerate } from '../../utils/aiGrowthApi'
import { readAiGrowthSettings } from '../../utils/aiGrowthSettings'

function Shell({ title, children, actions }) {
  return (
    <AppPageShell>
      <AppPageHeader
        title={title}
        backTo="/sosyal-medya"
        backLabel="Social Media"
        actions={actions}
      />
      {children}
    </AppPageShell>
  )
}

function useAsync(loader, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    loader()
      .then((d) => {
        if (alive) {
          setData(d)
          setError('')
        }
      })
      .catch((e) => {
        if (alive) setError(e.message || 'Hata')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, error, loading, setData }
}

export function SocialMediaDashboardPage() {
  const { data, loading } = useAsync(async () => {
    try {
      return await smcApi.overview()
    } catch {
      return { ok: true, ...localOverview() }
    }
  }, [])
  const o = data || localOverview()
  return (
    <AppPageShell>
      <AppPageHeader
        title="Social Media Center"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/sosyal-medya/hesaplar" className="btn-ghost !px-3 !py-2 text-xs font-bold">
              Hesaplar
            </Link>
            <Link to="/sosyal-medya/ai-creator" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
              <Wand2 className="h-4 w-4" /> AI Creator
            </Link>
          </div>
        }
      />
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 px-6 py-10 text-white sm:px-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/80">
          Instagram AI Content Studio · SC-0
        </p>
        <h2 className="text-3xl font-bold tracking-tight">Bağla · Üret · Onayla · Yayınla</h2>
        <p className="mt-3 max-w-xl text-sm text-white/70">
          Meta OAuth, OpenAI içerik, zamanlama ve kuyruk. Meta App env yoksa AI yerel/demo; yayın
          gerçek hesap + public media URL ister.
        </p>
      </div>
      {loading ? <p className="text-sm text-[var(--muted)]">Yükleniyor…</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { t: 'Hesap', v: o.accounts, to: '/sosyal-medya/hesaplar' },
          { t: 'İçerik', v: o.content, to: '/sosyal-medya/studio' },
          { t: 'Yayınlanan', v: o.published, to: '/sosyal-medya/analitik' },
          { t: 'Kuyruk', v: o.queuePending, to: '/sosyal-medya/kuyruk' },
          { t: 'Onay', v: o.approvalsPending, to: '/sosyal-medya/onay' },
        ].map((x) => (
          <Link key={x.t} to={x.to} className="glass-inset rounded-[22px] p-5 block">
            <p className="text-xs font-semibold text-[var(--muted)]">{x.t}</p>
            <p className="mt-2 text-2xl font-bold">{x.v ?? 0}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/sosyal-medya/studio', t: 'Content Studio', icon: Sparkles },
          { to: '/sosyal-medya/zamanlama', t: 'Scheduler', icon: Clock },
          { to: '/sosyal-medya/takvim', t: 'Calendar', icon: CalendarDays },
          { to: '/sosyal-medya/marka', t: 'Brand Kit', icon: Palette },
        ].map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="glass-inset rounded-2xl p-4 text-sm font-semibold flex items-center gap-2"
          >
            <x.icon className="h-4 w-4" /> {x.t}
          </Link>
        ))}
      </div>
      {o.health ? (
        <p className="text-xs text-[var(--muted)]">
          Meta: {o.health.metaConfigured ? 'hazır' : 'env yok'} · OpenAI:{' '}
          {o.health.openaiConfigured ? 'hazır' : 'yok / stub'}
          {o.health.localFallback ? ' · yerel fallback' : ''}
        </p>
      ) : null}
    </AppPageShell>
  )
}

export function SocialAccountsPage() {
  const [params] = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [health, setHealth] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try {
      const [h, a] = await Promise.all([smcApi.health(), smcApi.accounts()])
      setHealth(h)
      setAccounts(a.accounts || [])
    } catch {
      setHealth({ metaConfigured: false })
      setAccounts([])
    }
  }

  useEffect(() => {
    refresh()
    const oauth = params.get('oauth')
    if (oauth === 'ok') setMsg('Instagram bağlandı.')
    if (oauth === 'error') setMsg(params.get('msg') || 'OAuth hatası')
  }, [params])

  async function connect() {
    setBusy(true)
    setMsg('')
    try {
      const data = await smcApi.oauthStart()
      window.location.href = data.url
    } catch (e) {
      setMsg(e.message || 'OAuth başlatılamadı — META_* env kontrol edin')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell
      title="Instagram Hesapları"
      actions={
        <button
          type="button"
          disabled={busy}
          onClick={connect}
          className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
          Meta ile bağla
        </button>
      }
    >
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {!health?.metaConfigured ? (
        <AppPagePanel title="Meta App kurulumu">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Meta Developer → App oluştur (Business)</li>
            <li>
              Env: <code>META_APP_ID</code>, <code>META_APP_SECRET</code>,{' '}
              <code>META_REDIRECT_URI</code>
            </li>
            <li>
              Redirect: <code>/v1/social/instagram/oauth/callback</code> (API host)
            </li>
            <li>Instagram Graph ürünü + content publish izinleri</li>
          </ol>
        </AppPagePanel>
      ) : null}
      <div className="grid gap-3">
        {accounts.length === 0 ? (
          <AppPagePanel title="Bağlı hesap yok">
            <p className="text-sm text-[var(--muted)]">
              Tek tıkla Instagram Business hesabını bağlayın.
            </p>
          </AppPagePanel>
        ) : (
          accounts.map((a) => (
            <div
              key={a.id}
              className="glass-inset flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5" />
                <div>
                  <p className="font-semibold">@{a.username}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {a.status} · {a.displayName}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 text-xs"
                  onClick={() => smcApi.refresh(a.id).then(refresh)}
                >
                  Token yenile
                </button>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 text-xs text-rose-600"
                  onClick={() => smcApi.disconnect(a.id).then(refresh)}
                >
                  Kes
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Shell>
  )
}

const FEATURES = [
  { id: 'post', label: 'Post' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'story', label: 'Story' },
  { id: 'reel', label: 'Reels' },
  { id: 'full', label: 'Tam paket' },
]

export function SocialAiCreatorPage() {
  const [feature, setFeature] = useState('full')
  const [topic, setTopic] = useState('Yeni kraft kutu modeli')
  const [tone, setTone] = useState('Samimi ve satış odaklı')
  const [pageCount, setPageCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function generate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await smcApi.generate({ feature, topic, tone, pageCount })
      setResult(data.content)
      publishDomainEvent(
        'trigger.social.content.created',
        { contentId: data.content?.id, type: feature },
        { source: 'social' },
      )
    } catch {
      try {
        const settings = readAiGrowthSettings()
        const data = await runAiGrowthGenerate({
          feature: `smc_${feature}`,
          userPrompt: `Instagram ${feature} için JSON paket: caption, hashtags, altText, cta, seo, scenes, slides(${pageCount}), storyIdeas. Konu: ${topic}. Ton: ${tone}.`,
          model: settings.model,
          json: true,
        })
        let payload = {}
        try {
          payload = JSON.parse((data.content || '').match(/\{[\s\S]*\}/)?.[0] || '{}')
        } catch {
          payload = { caption: data.content }
        }
        const item = localSaveContent({
          id: `growth-${Date.now()}`,
          type: feature,
          title: topic,
          status: 'draft',
          payload,
        })
        setResult(item)
        publishDomainEvent(
          'trigger.social.content.created',
          { contentId: item.id, type: feature },
          { source: 'social' },
        )
      } catch {
        const item = localSaveContent(buildLocalAiPackage({ feature, topic, tone, pageCount }))
        setResult(item)
        setError('API yok — yerel örnek paket üretildi')
        publishDomainEvent(
          'trigger.social.content.created',
          { contentId: item.id, type: feature },
          { source: 'social' },
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const payload = result?.payload || {}

  return (
    <Shell title="AI Creator">
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Brief">
          <form onSubmit={generate} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFeature(f.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                    feature === f.id
                      ? 'bg-[var(--ink)] text-[var(--app-bg)]'
                      : 'border border-[var(--border)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              className="form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
            <select className="form-input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {['Samimi ve satış odaklı', 'Kurumsal', 'Eğlenceli', 'Eğitici'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {feature === 'carousel' || feature === 'full' ? (
              <label className="block text-xs">
                Carousel sayfa (1–20)
                <input
                  className="form-input mt-1"
                  type="number"
                  min={1}
                  max={20}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                />
              </label>
            ) : null}
            {error ? <p className="text-xs text-amber-700">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              AI ile oluştur
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Sonuç">
          {!result ? (
            <p className="text-sm text-[var(--muted)]">
              Caption, hashtag, alt, CTA, SEO, sahneler…
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap font-medium">{payload.caption}</p>
              <p className="text-xs text-[var(--muted)]">
                CTA: {payload.cta} · Alt: {payload.altText}
              </p>
              <div className="flex flex-wrap gap-1">
                {(payload.hashtags || []).map((h) => (
                  <span key={h} className="rounded-full bg-black/5 px-2 py-0.5 text-[11px]">
                    {h}
                  </span>
                ))}
              </div>
              {result.id ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to="/sosyal-medya/studio" className={`${BTN_PRIMARY} px-3 text-xs`}>
                    Studio&apos;da aç
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-2 text-xs"
                    onClick={() => smcApi.requestApproval(result.id).catch(() => {})}
                  >
                    Onaya gönder
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function SocialContentStudioPage() {
  const [tab, setTab] = useState('post')
  const [items, setItems] = useState([])
  useEffect(() => {
    smcApi
      .content()
      .then((d) => setItems(d.items || []))
      .catch(() => setItems(localListContent()))
  }, [])
  const filtered = items.filter((i) => (tab === 'all' ? true : i.type === tab || tab === 'post'))
  return (
    <Shell
      title="Content Studio"
      actions={
        <Link to="/sosyal-medya/ai-creator" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
          <Sparkles className="h-4 w-4" /> AI Creator
        </Link>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {['post', 'carousel', 'story', 'reel', 'all'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
              tab === t ? 'bg-[var(--ink)] text-[var(--app-bg)]' : 'border'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {(filtered.length ? filtered : items).slice(0, 30).map((item) => (
          <div key={item.id} className="glass-inset rounded-2xl p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-semibold">
                {item.title || item.type} ·{' '}
                <span className="text-[var(--muted)]">{item.status}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost !px-2 !py-1 text-[10px]"
                  onClick={() =>
                    smcApi
                      .publish(item.id)
                      .then(() =>
                        publishDomainEvent(
                          'trigger.social.content.published',
                          { contentId: item.id },
                          { source: 'social' },
                        ),
                      )
                  }
                >
                  Hemen paylaş
                </button>
                <Link to="/sosyal-medya/zamanlama" className="btn-ghost !px-2 !py-1 text-[10px]">
                  Zamanla
                </Link>
              </div>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-[var(--muted)]">
              {item.payload?.caption || JSON.stringify(item.payload || {}).slice(0, 160)}
            </p>
          </div>
        ))}
        {items.length === 0 ? (
          <AppPagePanel title="Henüz içerik yok">
            <Link to="/sosyal-medya/ai-creator" className="text-sm font-semibold underline">
              AI Creator ile üret
            </Link>
          </AppPagePanel>
        ) : null}
      </div>
      {tab === 'reel' ? (
        <AppPagePanel title="Reels Studio ipuçları">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Kapak görseli · Başlık · Açıklama · Müzik notu</li>
            <li>Metin katmanları · Logo · Animasyon / sahne planı</li>
            <li>Public video_url Graph publish için zorunlu</li>
          </ul>
          <Link
            to="/sosyal-medya/ai-creator"
            className="mt-3 inline-flex text-xs font-bold underline"
          >
            Reel senaryosu üret
          </Link>
        </AppPagePanel>
      ) : null}
      {tab === 'story' ? (
        <AppPagePanel title="Story Studio">
          <p className="text-sm text-[var(--muted)]">
            Tekli / çoklu · Anket · Soru kutusu · Countdown · Duyuru
          </p>
        </AppPagePanel>
      ) : null}
      {tab === 'carousel' ? (
        <AppPagePanel title="Carousel Builder">
          <p className="text-sm text-[var(--muted)]">
            1–20 sayfa · AI her sayfa için başlık / metin / görsel / CTA
          </p>
        </AppPagePanel>
      ) : null}
    </Shell>
  )
}

export function SocialMediaLibraryPage() {
  const [assets, setAssets] = useState([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [folder, setFolder] = useState('/')
  const [tags, setTags] = useState('')

  function load() {
    smcApi
      .media()
      .then((d) => setAssets(d.assets || []))
      .catch(() => setAssets(localListMedia()))
  }
  useEffect(() => {
    load()
  }, [])

  async function add(e) {
    e.preventDefault()
    try {
      await smcApi.addMedia({
        name,
        url,
        folder,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
    } catch {
      localAddMedia({
        id: `m-${Date.now()}`,
        name,
        url,
        folder,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
    }
    setName('')
    setUrl('')
    load()
  }

  return (
    <Shell title="Media Library">
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Yükle / URL">
          <form onSubmit={add} className="space-y-3" onDragOver={(e) => e.preventDefault()}>
            <p className="text-xs text-[var(--muted)]">
              Sürükle-bırak URL ekleme · klasör · etiket
            </p>
            <input
              className="form-input"
              placeholder="Ad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="form-input"
              placeholder="https://… public URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <input
              className="form-input"
              placeholder="Klasör /urunler"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <input
              className="form-input"
              placeholder="etiket1, etiket2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <button type="submit" className={`${BTN_PRIMARY} px-4 text-xs`}>
              <Image className="mr-1 inline h-4 w-4" /> Ekle
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Kütüphane">
          <ul className="space-y-2 text-sm">
            {assets.map((a) => (
              <li
                key={a.id}
                className="flex justify-between gap-2 border-b border-[var(--border)] py-2"
              >
                <span>
                  {a.name} · {a.folder}
                </span>
                <a className="underline" href={a.url} target="_blank" rel="noreferrer">
                  aç
                </a>
              </li>
            ))}
          </ul>
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function SocialCampaignsPage() {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  useEffect(() => {
    smcApi
      .campaigns()
      .then((d) => setRows(d.campaigns || []))
      .catch(() => setRows([]))
  }, [])
  return (
    <Shell title="Campaigns">
      <form
        className="mb-4 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await smcApi.createCampaign(name)
          setName('')
          const d = await smcApi.campaigns()
          setRows(d.campaigns || [])
        }}
      >
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kampanya adı"
        />
        <button className={`${BTN_PRIMARY} px-4 text-xs`} type="submit">
          <Megaphone className="mr-1 inline h-4 w-4" /> Ekle
        </button>
      </form>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="glass-inset rounded-xl px-4 py-3 text-sm font-semibold">
            {r.name} · {r.status}
          </li>
        ))}
      </ul>
    </Shell>
  )
}

const RECURRENCE_LABELS = [
  ['once', 'Hemen / tek sefer'],
  ['daily', 'Her gün'],
  ['weekdays', 'Hafta içi'],
  ['weekends', 'Hafta sonu'],
  ['weekly', 'Haftalık'],
  ['monthly', 'Aylık'],
  ['yearly', 'Yıllık'],
  ['every_2_days', 'Her 2 gün'],
  ['every_3_days', 'Her 3 gün'],
  ['every_7_days', 'Her 7 gün'],
  ['monday', 'Pazartesi'],
  ['tuesday', 'Salı'],
  ['wednesday', 'Çarşamba'],
  ['thursday', 'Perşembe'],
  ['friday', 'Cuma'],
  ['saturday', 'Cumartesi'],
  ['sunday', 'Pazar'],
  ['first_monday', 'Ayın ilk Pazartesi'],
  ['last_friday', 'Ayın son Cuması'],
  ['cron', 'Cron benzeri'],
  ['custom', 'Özel tekrar'],
]

export function SocialSchedulerPage() {
  const [contentId, setContentId] = useState('')
  const [recurrence, setRecurrence] = useState('once')
  const [runAt, setRunAt] = useState('')
  const [items, setItems] = useState([])
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    smcApi
      .content()
      .then((d) => setItems(d.items || []))
      .catch(() => setItems(localListContent()))
    smcApi
      .schedules()
      .then((d) => setSchedules(d.schedules || []))
      .catch(() => setSchedules([]))
  }, [])

  return (
    <Shell title="Scheduler">
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Zamanla">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              await smcApi.createSchedule({
                contentId,
                recurrence,
                runAt: runAt || undefined,
              })
              const d = await smcApi.schedules()
              setSchedules(d.schedules || [])
            }}
          >
            <select
              className="form-input"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              required
            >
              <option value="">İçerik seç</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title || i.type}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              {RECURRENCE_LABELS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              className="form-input"
              type="datetime-local"
              value={runAt}
              onChange={(e) => setRunAt(e.target.value)}
            />
            <button type="submit" className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
              <Clock className="h-4 w-4" /> Kaydet
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Planlar">
          <ul className="space-y-2 text-sm">
            {schedules.map((s) => (
              <li key={s.id} className="border-b border-[var(--border)] py-2">
                {s.recurrence} · {s.nextRunAt || s.runAt} · {s.status}
              </li>
            ))}
          </ul>
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function SocialCalendarPage() {
  const [schedules, setSchedules] = useState([])
  const [view, setView] = useState('month')
  useEffect(() => {
    smcApi
      .schedules()
      .then((d) => setSchedules(d.schedules || []))
      .catch(() => setSchedules([]))
  }, [])
  return (
    <Shell title="Content Calendar">
      <div className="mb-3 flex flex-wrap gap-2">
        {['day', 'week', 'month', 'list', 'timeline'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
              view === v ? 'bg-[var(--ink)] text-[var(--app-bg)]' : 'border'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <AppPagePanel title={`${view} görünüm`}>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Sürükle-bırak: tarihi değiştirmek için satırı düzenle.
        </p>
        <ul className="space-y-2">
          {schedules.map((s) => (
            <li
              key={s.id}
              className="glass-inset flex flex-wrap items-center gap-2 rounded-xl p-3 text-sm"
              draggable
            >
              <CalendarDays className="h-4 w-4" />
              <span className="font-semibold">{s.contentId?.slice(0, 8)}</span>
              <input
                className="form-input !py-1 text-xs"
                type="datetime-local"
                defaultValue={s.runAt ? new Date(s.runAt).toISOString().slice(0, 16) : ''}
                onBlur={async (e) => {
                  if (!e.target.value) return
                  await smcApi.patchSchedule(s.id, {
                    runAt: new Date(e.target.value).toISOString(),
                    nextRunAt: new Date(e.target.value).toISOString(),
                  })
                }}
              />
            </li>
          ))}
        </ul>
      </AppPagePanel>
    </Shell>
  )
}

export function SocialTemplatesPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    smcApi
      .templates()
      .then((d) => setRows(d.templates || []))
      .catch(() =>
        setRows([
          { slug: 'yeni-urun', title: 'Yeni Ürün', category: 'product' },
          { slug: 'kampanya', title: 'Kampanya', category: 'campaign' },
          { slug: 'bayram', title: 'Bayram', category: 'seasonal' },
        ]),
      )
  }, [])
  return (
    <Shell title="Templates">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((t) => (
          <Link
            key={t.slug || t.id}
            to={`/sosyal-medya/ai-creator?topic=${encodeURIComponent(t.title)}`}
            className="glass-inset rounded-2xl p-4"
          >
            <p className="font-semibold">{t.title}</p>
            <p className="text-xs text-[var(--muted)]">{t.category}</p>
          </Link>
        ))}
      </div>
    </Shell>
  )
}

export function SocialBrandKitPage() {
  const [kits, setKits] = useState([])
  const [form, setForm] = useState({
    name: 'Default',
    voice: '',
    rules: '',
    colors: '#111,#C4A574',
  })
  useEffect(() => {
    smcApi
      .brandKits()
      .then((d) => setKits(d.kits || []))
      .catch(() => setKits(localListBrandKits()))
  }, [])
  return (
    <Shell title="Brand Kit">
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Marka">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              const payload = {
                name: form.name,
                voice: form.voice,
                rules: form.rules,
                colors: form.colors.split(',').map((c) => c.trim()),
                isDefault: true,
              }
              try {
                await smcApi.saveBrandKit(payload)
                const d = await smcApi.brandKits()
                setKits(d.kits || [])
              } catch {
                localSaveBrandKit({ id: `bk-${Date.now()}`, ...payload })
                setKits(localListBrandKits())
              }
            }}
          >
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Renkler #111,#C4A574"
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
            />
            <textarea
              className="form-input min-h-20"
              placeholder="Kurumsal dil / ton"
              value={form.voice}
              onChange={(e) => setForm({ ...form, voice: e.target.value })}
            />
            <textarea
              className="form-input min-h-20"
              placeholder="Marka kuralları"
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
            />
            <button type="submit" className={`${BTN_PRIMARY} px-4 text-xs`}>
              <Palette className="mr-1 inline h-4 w-4" /> Kaydet
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Kayıtlı">
          {kits.map((k) => (
            <div key={k.id} className="mb-2 rounded-xl border px-3 py-2 text-sm">
              <p className="font-semibold">{k.name}</p>
              <p className="text-xs text-[var(--muted)]">{k.voice}</p>
            </div>
          ))}
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function SocialApprovalPage() {
  const [rows, setRows] = useState([])
  function load() {
    smcApi
      .approvals()
      .then((d) => setRows(d.approvals || []))
      .catch(() => setRows([]))
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <Shell title="Approval Center">
      <p className="mb-3 text-xs text-[var(--muted)]">
        Taslak → İnceleniyor → Onay bekliyor → Onaylandı → Planlandı → Paylaşıldı / İptal
      </p>
      <ul className="space-y-2">
        {rows.map((a) => (
          <li
            key={a.id}
            className="glass-inset flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 text-sm"
          >
            <span>
              <CheckSquare className="mr-1 inline h-4 w-4" />
              {a.contentId?.slice(0, 8)} · {a.decision}
            </span>
            {a.decision === 'pending' ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  className={`${BTN_SUCCESS} !px-2 !py-1 text-[10px]`}
                  onClick={() =>
                    smcApi.decideApproval(a.id, 'approved').then(() => {
                      publishDomainEvent(
                        'trigger.social.content.approved',
                        { contentId: a.contentId },
                        { source: 'social' },
                      )
                      load()
                    })
                  }
                >
                  Onayla
                </button>
                <button
                  type="button"
                  className="btn-ghost !px-2 !py-1 text-[10px]"
                  onClick={() => smcApi.decideApproval(a.id, 'rejected').then(load)}
                >
                  Reddet
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Shell>
  )
}

export function SocialQueuePage() {
  const [rows, setRows] = useState([])
  function load() {
    smcApi
      .queue()
      .then((d) => setRows(d.queue || []))
      .catch(() => setRows([]))
  }
  useEffect(() => {
    load()
  }, [])
  return (
    <Shell
      title="Publishing Queue"
      actions={
        <button
          type="button"
          className="btn-ghost !px-3 !py-2 text-xs"
          onClick={() => smcApi.tick().then(load)}
        >
          <Workflow className="mr-1 inline h-4 w-4" /> Tick çalıştır
        </button>
      }
    >
      <ul className="space-y-2 text-sm">
        {rows.map((q) => (
          <li key={q.id} className="glass-inset rounded-xl p-3">
            {q.status} · attempts {q.attempts} · {q.scheduledAt}
            {q.lastError ? <p className="text-xs text-rose-600">{q.lastError}</p> : null}
          </li>
        ))}
      </ul>
    </Shell>
  )
}

export function SocialAnalyticsPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    smcApi
      .analytics()
      .then((d) => setRows(d.snapshots || []))
      .catch(() => setRows([]))
  }, [])
  return (
    <Shell title="Analytics">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {['Erişim', 'Gösterim', 'Etkileşim'].map((t) => (
          <div key={t} className="glass-inset rounded-2xl p-4">
            <p className="text-xs text-[var(--muted)]">{t}</p>
            <p className="text-xl font-bold">
              <BarChart3 className="mr-1 inline h-4 w-4" />—
            </p>
          </div>
        ))}
      </div>
      <AppPagePanel title="Snapshot">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Graph insights senkronu SC-1. Yayın sonrası snapshot dolacak.
          </p>
        ) : (
          <ul className="text-sm">
            {rows.map((r) => (
              <li key={r.id}>
                reach {r.reach} · eng {r.engagement}
              </li>
            ))}
          </ul>
        )}
      </AppPagePanel>
    </Shell>
  )
}

export function SocialCommentsPage() {
  return (
    <Shell title="Comments">
      <AppPagePanel title="Yorumlar">
        <p className="text-sm text-[var(--muted)]">
          <MessageCircle className="mr-1 inline h-4 w-4" />
          Graph inbox okuma SC-1. Bağlı hesap + App Review sonrası canlı yorumlar.
        </p>
      </AppPagePanel>
    </Shell>
  )
}

export function SocialMessagesPage() {
  return (
    <Shell title="Messages">
      <AppPagePanel title="DM">
        <p className="text-sm text-[var(--muted)]">
          <Mail className="mr-1 inline h-4 w-4" />
          Instagram Messaging API SC-1. Omnichannel ile birleşecek.
        </p>
      </AppPagePanel>
    </Shell>
  )
}

export function SocialSettingsPage() {
  const [health, setHealth] = useState(null)
  useEffect(() => {
    smcApi
      .health()
      .then(setHealth)
      .catch(() => setHealth({ metaConfigured: false, localFallback: true }))
  }, [])
  return (
    <Shell title="Settings">
      <AppPagePanel title="Bağlantı durumu">
        <pre className="overflow-auto rounded-xl bg-black/5 p-3 text-xs">
          {JSON.stringify(health, null, 2)}
        </pre>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Lisans: AI / çoklu hesap kısıtı entitlement ile; OAuth yolu ortak.
        </p>
        <Link to="/ayarlar/ai/openai" className="mt-2 inline-block text-xs font-bold underline">
          OpenAI ayarları
        </Link>
      </AppPagePanel>
    </Shell>
  )
}
