import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, MapPinned } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import {
  maskSecret,
  readLiveFlags,
  readLiveRetentionDays,
  readMapboxPublicToken,
  saveLiveFlags,
  saveLiveRetentionDays,
  saveMapboxPublicToken,
} from '../../live/flags'
import { FEATURE_FLAGS, RETENTION_DAYS } from '../../live/constants'
import { fetchMapboxStatus, testMapboxConnection } from '../../live/mapboxClient'
import { loadLiveSettings, saveLiveSettings } from '../../live/store'

const LABELS = {
  LIVE_MAP: 'Canlı harita',
  EMPLOYEE_TRACKING: 'Personel takibi',
  DRIVER_TRACKING: 'Sürücü takibi',
  VEHICLE_TRACKING: 'Araç takibi',
  ROUTE_OPTIMIZATION: 'Rota optimizasyonu',
  GEOFENCE: 'Geofence',
  LOCATION_HISTORY: 'Konum geçmişi',
  CUSTOMER_TRACKING: 'Müşteri takibi',
  NAVIGATION: 'Navigasyon',
  AI_LIVE_ASSISTANT: 'AI canlı asistan',
}

export default function MapboxSettingsPage() {
  const [status, setStatus] = useState(null)
  const [tokenInput, setTokenInput] = useState('')
  const [flags, setFlags] = useState(() => readLiveFlags())
  const [retention, setRetention] = useState(() => readLiveRetentionDays())
  const [notice, setNotice] = useState(() => loadLiveSettings().trackingNotice)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function refresh() {
    const next = await fetchMapboxStatus()
    setStatus(next)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleTest() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await testMapboxConnection()
      setMessage(
        `Test tamam · geocoding ${result.geocoding ? 'ok' : 'yok'} · rota ${result.route ? 'ok' : 'yok'} · matrix ${result.matrix ? 'ok' : 'yok'}`,
      )
      await refresh()
    } catch (err) {
      setError(err.message || 'Harita servisine şu anda ulaşılamıyor.')
    } finally {
      setBusy(false)
    }
  }

  function handleSaveToken() {
    saveMapboxPublicToken(tokenInput)
    setTokenInput('')
    setMessage('Public token kaydedildi (maskeli). Secret token yalnızca sunucu ortamına yazılır.')
  }

  const stored = readMapboxPublicToken()
  const cards = [
    ['Mapbox bağlı', status?.connected],
    ['Harita API', status?.services?.maps],
    ['Rota API', status?.services?.directions],
    ['Geocoding', status?.services?.geocoding],
    ['Canlı takip', status?.services?.live],
  ]

  return (
    <AppPageShell>
      <AppPageHeader title="Harita & Konum — Mapbox" backTo="/ayarlar" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, ok]) => (
          <AppPagePanel key={label} title={label}>
            <p className={`text-sm font-black ${ok ? 'text-emerald-400' : 'text-amber-300'}`}>
              {ok ? 'Aktif' : 'Bekliyor'}
            </p>
          </AppPagePanel>
        ))}
      </div>
      <AppPagePanel title="Token durumu">
        <p className="text-sm text-[var(--muted)]">
          Public token: {stored ? maskSecret(stored) : 'tanımsız'} · Secret token:{' '}
          {status?.hasSecretToken ? 'tanımlı (gizli)' : 'tanımsız'}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Token değerleri açık gösterilmez. Secret tarayıcıya gönderilmez.
        </p>
        <label className="mt-4 block text-xs font-black uppercase text-[var(--muted)]">
          Public token (isteğe bağlı yerel)
          <input
            type="password"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-dark-500/40 bg-transparent px-3 py-2"
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder="pk. ile başlayan public token"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={BTN_PRIMARY} onClick={handleSaveToken}>
            Kaydet
          </button>
          <button
            type="button"
            className="btn-ghost inline-flex items-center gap-2"
            onClick={handleTest}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPinned className="h-4 w-4" />
            )}
            Bağlantıyı test et
          </button>
        </div>
        {message ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </AppPagePanel>
      <AppPagePanel title="Özellik bayrakları">
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.keys(FEATURE_FLAGS).map((code) => (
            <label
              key={code}
              className="flex items-center justify-between gap-3 rounded-xl border border-dark-500/30 px-3 py-2 text-sm"
            >
              {LABELS[code] || code}
              <input
                type="checkbox"
                checked={flags[code] !== false}
                onChange={(event) => {
                  const next = { ...flags, [code]: event.target.checked }
                  setFlags(next)
                  saveLiveFlags(next)
                }}
              />
            </label>
          ))}
        </div>
      </AppPagePanel>
      <AppPagePanel title="Saklama ve gizlilik">
        <label className="block text-sm font-bold">
          Konum geçmişi
          <select
            className="mt-2 w-full rounded-xl border border-dark-500/40 bg-transparent px-3 py-2"
            value={retention}
            onChange={(event) => {
              const days = Number(event.target.value)
              setRetention(days)
              saveLiveRetentionDays(days)
            }}
          >
            {RETENTION_DAYS.map((days) => (
              <option key={days} value={days}>
                {days} gün
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notice}
            onChange={(event) => {
              setNotice(event.target.checked)
              saveLiveSettings({ trackingNotice: event.target.checked })
            }}
          />
          Personelde “Konum Takibi Aktif” bilgilendirmesini göster
        </label>
      </AppPagePanel>
    </AppPageShell>
  )
}
