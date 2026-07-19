import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, PlugZap, RefreshCw } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import {
  AI_GROWTH_MODEL_PRESETS,
  readAiGrowthSettings,
  saveAiGrowthSettings,
  readAiGrowthUsage,
  summarizeAiGrowthUsage,
} from '../../utils/aiGrowthSettings'
import { fetchAiGrowthHealth, fetchAiGrowthModels, testAiGrowthConnection } from '../../utils/aiGrowthApi'

export default function AiGrowthSettingsPage({ title = 'AI Growth Ayarları' }) {
  const [settings, setSettings] = useState(() => readAiGrowthSettings())
  const [models, setModels] = useState(AI_GROWTH_MODEL_PRESETS)
  const [health, setHealth] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const usage = useMemo(() => summarizeAiGrowthUsage(readAiGrowthUsage().entries || []), [message])

  async function refreshMeta() {
    try {
      const [h, m] = await Promise.all([fetchAiGrowthHealth(), fetchAiGrowthModels()])
      setHealth(h)
      if (Array.isArray(m.models) && m.models.length) setModels(m.models)
    } catch (err) {
      setHealth({ hasApiKey: false, warning: err.message })
    }
  }

  useEffect(() => {
    refreshMeta()
  }, [])

  function update(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  function handleSave() {
    saveAiGrowthSettings(settings)
    setMessage('Ayarlar kaydedildi.')
    setError('')
  }

  async function handleTest() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      saveAiGrowthSettings(settings)
      const result = await testAiGrowthConnection({
        apiKey: settings.apiKey,
        model: settings.model,
      })
      setMessage(`Bağlantı başarılı · model ${result.model}`)
      await refreshMeta()
    } catch (err) {
      setError(err.message || 'Bağlantı testi başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={title}
        backTo="/ai-buyume"
        actions={(
          <button type="button" onClick={refreshMeta} className="btn-ghost inline-flex items-center gap-2 !px-3 !py-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Yenile
          </button>
        )}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="OpenAI Bağlantısı">
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">
              `.env` içinde `OPENAI_API_KEY` varsa sunucu onu otomatik kullanır.
              Yoksa buraya anahtar girin (yalnızca tarayıcıda saklanır, isteklerde `X-OpenAI-Key` ile gönderilir).
            </p>
            <div className="rounded-xl border border-dark-500/40 bg-dark-800/40 px-3 py-2 text-xs">
              Durum:{' '}
              {health?.hasApiKey ? (
                <span className="text-emerald-400">Bağlı ({health.source})</span>
              ) : (
                <span className="text-amber-300">Anahtar yok</span>
              )}
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">OpenAI API Key</span>
              <input
                className="form-input"
                type="password"
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">Model</span>
              <select
                className="form-input"
                value={settings.model}
                onChange={(e) => update('model', e.target.value)}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>{model.label || model.id}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleSave} className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}>
                Kaydet
              </button>
              <button type="button" disabled={busy} onClick={handleTest} className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                Bağlantıyı test et
              </button>
            </div>
            {message ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {message}
              </p>
            ) : null}
            {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          </div>
        </AppPagePanel>

        <AppPagePanel title="Marka & Token Raporu">
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">Şirket adı</span>
              <input className="form-input" value={settings.companyName} onChange={(e) => update('companyName', e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">Web sitesi</span>
              <input className="form-input" value={settings.website} onChange={(e) => update('website', e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">Sektör</span>
              <input className="form-input" value={settings.industry} onChange={(e) => update('industry', e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[var(--muted)]">Marka tonu</span>
              <textarea className="form-input min-h-20" value={settings.brandVoice} onChange={(e) => update('brandVoice', e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-dark-500/40 p-3">
                <p className="text-[11px] text-[var(--muted)]">Bu ay token</p>
                <p className="text-xl font-bold">{usage.monthTokens.toLocaleString('tr-TR')}</p>
              </div>
              <div className="rounded-2xl border border-dark-500/40 p-3">
                <p className="text-[11px] text-[var(--muted)]">Tahmini maliyet</p>
                <p className="text-xl font-bold">${usage.monthCostUsd.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
