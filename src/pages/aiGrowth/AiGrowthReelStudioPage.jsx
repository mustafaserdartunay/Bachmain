import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clapperboard, Copy, Instagram, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { runAiGrowthGenerate } from '../../utils/aiGrowthApi'
import { readAiGrowthSettings, saveAiGrowthLibraryItem } from '../../utils/aiGrowthSettings'
import {
  INSTAGRAM_UPDATED_EVENT,
  buildDemoReelPackage,
  listReelDrafts,
  readInstagramConnection,
  saveReelDraft,
} from '../../growth/instagramStore'

const STEPS = [
  { id: 1, label: 'Hesap' },
  { id: 2, label: 'Brief' },
  { id: 3, label: 'Üret' },
  { id: 4, label: 'Önizle' },
]

function parseAiReel(raw, fallback) {
  try {
    const jsonMatch = String(raw).match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallback
    const data = JSON.parse(jsonMatch[0])
    return {
      ...fallback,
      hook: data.hook || fallback.hook,
      caption: data.caption || fallback.caption,
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : fallback.hashtags,
      scenes: Array.isArray(data.scenes) ? data.scenes : fallback.scenes,
      musicHint: data.musicHint || fallback.musicHint,
      cta: data.cta || fallback.cta,
      source: 'ai',
    }
  } catch {
    return { ...fallback, caption: raw || fallback.caption, source: 'ai-text' }
  }
}

export default function AiGrowthReelStudioPage() {
  const [conn, setConn] = useState(() => readInstagramConnection())
  const [step, setStep] = useState(conn.connected ? 2 : 1)
  const [topic, setTopic] = useState('Kraft kutu — 48 saatte teslim')
  const [tone, setTone] = useState('Samimi ve satış odaklı')
  const [durationSec, setDurationSec] = useState('20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pkg, setPkg] = useState(null)
  const [savedId, setSavedId] = useState('')
  const drafts = useMemo(() => listReelDrafts(), [savedId, pkg])

  useEffect(() => {
    const sync = () => {
      const c = readInstagramConnection()
      setConn(c)
      if (c.connected && step === 1) setStep(2)
    }
    window.addEventListener(INSTAGRAM_UPDATED_EVENT, sync)
    return () => window.removeEventListener(INSTAGRAM_UPDATED_EVENT, sync)
  }, [step])

  async function handleGenerate(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const demo = buildDemoReelPackage({ topic, tone, durationSec })
    try {
      const settings = readAiGrowthSettings()
      const prompt = `Instagram Reel paketi üret. JSON döndür (yalnızca JSON):
{
  "hook": "...",
  "caption": "...",
  "hashtags": ["#a","#b"],
  "scenes": [{"t":"0-3 sn","shot":"...","voice":"..."}],
  "musicHint": "...",
  "cta": "..."
}
Konu: ${topic}
Ton: ${tone}
Süre: ${durationSec} sn
Marka: ${settings.companyName || 'BachMain müşterisi'}
Dil: Türkçe. 4 sahne öner.`
      const data = await runAiGrowthGenerate({
        feature: 'instagram_reel',
        userPrompt: prompt,
        model: settings.model,
        json: true,
      })
      const next = parseAiReel(data.content, { ...demo, source: 'ai' })
      setPkg(next)
      saveAiGrowthLibraryItem({
        type: 'instagram_reel',
        title: `Reel · ${topic}`,
        content: next.caption,
        form: { topic, tone, durationSec },
      })
      setStep(4)
    } catch {
      // Example still works offline — show the flow with demo package
      setPkg({ ...demo, source: 'demo' })
      setError('OpenAI yoksa örnek paket gösterildi — akış aynı.')
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  function copyCaption() {
    if (!pkg?.caption) return
    navigator.clipboard?.writeText(pkg.caption)
  }

  function publishExample() {
    if (!pkg) return
    const row = saveReelDraft({
      ...pkg,
      status: 'example_published',
      account: conn.username,
      publishedAt: new Date().toISOString(),
    })
    setSavedId(row.id)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Reel oluşturma örneği"
        backTo="/ai-buyume"
        backLabel="AI Growth"
        actions={
          <Link to="/ai-buyume/instagram" className="btn-ghost !px-3 !py-2 text-xs font-bold">
            Instagram hesabı
          </Link>
        }
      />

      <div className="mb-2 flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (s.id === 1 || (s.id === 2 && conn.connected) || (s.id >= 3 && pkg) || s.id === 2)
                setStep(s.id)
            }}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
              step === s.id
                ? 'bg-[var(--ink)] text-[var(--app-bg)]'
                : 'border border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <AppPagePanel title="1 · Instagram bağla">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Reel örneğine geçmeden önce hesabı bağla (demo yeterli).
          </p>
          {conn.connected ? (
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Instagram className="h-4 w-4" /> @{conn.username} bağlı
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Link to="/ai-buyume/instagram" className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}>
              Hesabı bağla
            </Link>
            {conn.connected ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`${BTN_SUCCESS} px-4 text-xs`}
              >
                Brief&apos;e geç
              </button>
            ) : null}
          </div>
        </AppPagePanel>
      )}

      {(step === 2 || step === 3) && (
        <div className="grid gap-5 lg:grid-cols-2">
          <AppPagePanel title="2 · Brief">
            {!conn.connected ? (
              <p className="mb-3 text-xs text-amber-700">
                Hesap bağlı değil — yine de örnek üretebilirsin; yayın hesabı boş kalır.
              </p>
            ) : (
              <p className="mb-3 text-xs text-[var(--muted)]">Hesap: @{conn.username}</p>
            )}
            <form onSubmit={handleGenerate} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">Konu / ürün</span>
                <input
                  className="form-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">Ton</span>
                <select
                  className="form-input"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {['Samimi ve satış odaklı', 'Kurumsal', 'Eğlenceli', 'Eğitici'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">Süre</span>
                <select
                  className="form-input"
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                >
                  {['15', '20', '30', '45'].map((s) => (
                    <option key={s} value={s}>
                      {s} saniye
                    </option>
                  ))}
                </select>
              </label>
              {error ? <p className="text-xs text-amber-700">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {loading ? 'Üretiliyor…' : '3 · Reel paketini üret'}
              </button>
            </form>
          </AppPagePanel>

          <AppPagePanel title="Örnek akış">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--ink)]">
              <li>Hook (0–3 sn) — kaydırmayı durdur</li>
              <li>Ürün / fayda gösterimi</li>
              <li>Sosyal kanıt veya sonuç</li>
              <li>CTA + caption + hashtag</li>
            </ol>
            <p className="mt-4 text-xs text-[var(--muted)]">
              OpenAI anahtarı varsa AI üretir; yoksa hazır demo paket gösterilir.
            </p>
          </AppPagePanel>
        </div>
      )}

      {step === 4 && pkg ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-5">
            <AppPagePanel title="4 · Paket">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border px-2 py-0.5 font-bold uppercase">
                  {pkg.source === 'demo' ? 'Demo paket' : 'AI paket'}
                </span>
                <span className="text-[var(--muted)]">
                  {pkg.durationSec} sn · {pkg.tone}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">{pkg.hook}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--ink)]">{pkg.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(pkg.hashtags || []).map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {(pkg.scenes || []).map((sc, i) => (
                  <div
                    key={`${sc.t}-${i}`}
                    className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{sc.t}</p>
                    <p className="font-semibold">{sc.shot}</p>
                    <p className="text-[var(--muted)]">{sc.voice}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Müzik: {pkg.musicHint} · CTA: {pkg.cta}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyCaption}
                  className="btn-ghost gap-2 !px-3 !py-2 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" /> Caption kopyala
                </button>
                <button
                  type="button"
                  onClick={publishExample}
                  className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}
                >
                  <Sparkles className="h-4 w-4" /> Örnek yayın (kaydet)
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-ghost !px-3 !py-2 text-xs"
                >
                  Yeni brief
                </button>
              </div>
              {savedId ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Örnek yayın kaydedildi · {savedId}
                </p>
              ) : null}
              {pkg.exampleNote ? (
                <p className="mt-2 text-[11px] text-[var(--muted)]">{pkg.exampleNote}</p>
              ) : null}
            </AppPagePanel>

            {drafts.length > 0 ? (
              <AppPagePanel title="Son örnekler">
                <ul className="space-y-2 text-sm">
                  {drafts.slice(0, 5).map((d) => (
                    <li
                      key={d.id}
                      className="flex justify-between gap-2 border-b border-[var(--border)] py-2"
                    >
                      <span className="font-medium">{d.topic || d.hook}</span>
                      <span className="text-[11px] text-[var(--muted)]">{d.status}</span>
                    </li>
                  ))}
                </ul>
              </AppPagePanel>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-[260px]">
            <div className="overflow-hidden rounded-[2rem] border-[6px] border-[var(--ink)] bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-xl">
              <div className="flex items-center justify-between px-4 pt-3 text-[10px] text-white/70">
                <span>@{conn.username || 'ornekmarka'}</span>
                <Clapperboard className="h-3.5 w-3.5" />
              </div>
              <div className="relative mx-3 my-3 aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-700/40 via-stone-800 to-stone-950 p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Reel önizleme
                </p>
                <p className="mt-6 text-lg font-bold leading-snug">{pkg.hook}</p>
                <div className="absolute bottom-4 left-4 right-4 space-y-2">
                  {(pkg.scenes || []).slice(0, 3).map((sc, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-black/35 px-2 py-1.5 text-[10px] backdrop-blur"
                    >
                      <span className="font-bold text-amber-200">{sc.t}</span> · {sc.shot}
                    </div>
                  ))}
                  <p className="text-[11px] font-semibold text-emerald-200">{pkg.cta}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  )
}
