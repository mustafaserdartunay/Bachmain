import { useMemo, useState } from 'react'
import { Loader2, Sparkles, Copy, Save } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { runAiGrowthGenerate } from '../../utils/aiGrowthApi'
import { readAiGrowthSettings, saveAiGrowthLibraryItem } from '../../utils/aiGrowthSettings'
import { Link } from 'react-router-dom'

export default function AiGrowthGenerateStudio({ config }) {
  const initial = useMemo(() => {
    const values = {}
    for (const field of config.fields || []) {
      values[field.key] = field.type === 'select' ? field.options?.[0] || '' : ''
    }
    return values
  }, [config])

  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [meta, setMeta] = useState(null)
  const settings = readAiGrowthSettings()

  async function handleGenerate(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await runAiGrowthGenerate({
        feature: config.feature,
        userPrompt: config.buildPrompt(form),
        model: settings.model,
      })
      setResult(data.content || '')
      setMeta({ model: data.model, usage: data.usage })
      saveAiGrowthLibraryItem({
        type: config.feature,
        title: `${config.title} · ${form[config.fields?.[0]?.key] || 'Üretim'}`,
        content: data.content || '',
        form,
      })
    } catch (err) {
      setError(err.message || 'Üretim başarısız')
    } finally {
      setLoading(false)
    }
  }

  function copyResult() {
    if (!result) return
    navigator.clipboard?.writeText(result)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={config.title}
        backTo="/ai-buyume"
        backLabel="AI Growth"
        actions={(
          <Link to="/ai-buyume/ayarlar" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
            AI Ayarları
          </Link>
        )}
      />
      <p className="text-sm text-[var(--muted)]">{config.description}</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Brief">
          <form onSubmit={handleGenerate} className="space-y-3">
            {(config.fields || []).map((field) => (
              <label key={field.key} className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    className="form-input"
                    value={form[field.key] || ''}
                    onChange={(e) => setForm((c) => ({ ...c, [field.key]: e.target.value }))}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="form-input min-h-28"
                    value={form[field.key] || ''}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => setForm((c) => ({ ...c, [field.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="form-input"
                    value={form[field.key] || ''}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => setForm((c) => ({ ...c, [field.key]: e.target.value }))}
                    required={field.key !== 'title'}
                  />
                )}
              </label>
            ))}

            {error ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
                {/API anahtarı/i.test(error) ? (
                  <Link className="ml-2 underline" to="/ayarlar/ai/openai">OpenAI ayarlarına git</Link>
                ) : null}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Üretiliyor…' : 'AI ile Üret'}
            </button>
          </form>
        </AppPagePanel>

        <AppPagePanel title="Sonuç">
          <div className="mb-3 flex items-center gap-2">
            <button type="button" onClick={copyResult} className="btn-ghost inline-flex items-center gap-1.5 !px-3 !py-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" /> Kopyala
            </button>
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
              <Save className="h-3.5 w-3.5" /> Kütüphaneye kaydedildi
            </span>
          </div>
          {meta?.usage ? (
            <p className="mb-2 text-[11px] text-[var(--muted)]">
              Model: {meta.model} · Token: {(meta.usage.prompt_tokens || 0) + (meta.usage.completion_tokens || 0)}
            </p>
          ) : null}
          <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-dark-500/40 bg-dark-800/40 p-4 text-sm leading-relaxed text-[var(--ink)]">
            {result || 'Üretim sonucu burada görünecek.'}
          </pre>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
