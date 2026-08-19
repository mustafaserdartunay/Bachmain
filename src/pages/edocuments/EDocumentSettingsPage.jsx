import { useEffect, useState } from 'react'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { edocumentsApi } from '../../utils/edocumentsApi'
import {
  connectionStatusLabel,
  EdocAlert,
  EDocumentsSubnav,
  formatEdocError,
} from './eDocumentShared'

export default function EDocumentSettingsPage() {
  const [connection, setConnection] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [environment, setEnvironment] = useState('TEST')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [credits, setCredits] = useState([])
  const [busy, setBusy] = useState(false)

  async function load() {
    setError('')
    try {
      const data = await edocumentsApi.connection()
      setConnection(data.connection)
      if (data.connection?.environment) setEnvironment(data.connection.environment)
    } catch (err) {
      setError(formatEdocError(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (!apiKey && !connection?.hasApiKey) {
        throw new Error(
          'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Portal → API Tanımları üzerinden anahtar üretip buraya yapıştırın.',
        )
      }
      const data = await edocumentsApi.saveConnection({ apiKey: apiKey || undefined, environment })
      setConnection(data.connection)
      setApiKey('')
      setMessage('Bağlantı kaydedildi. Anahtar tarayıcıda saklanmaz.')
    } catch (err) {
      setError(formatEdocError(err))
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const data = await edocumentsApi.testConnection()
      setConnection(data.connection)
      setCredits(data.credits || [])
      setMessage(
        `✓ Nilvera bağlantısı başarılı\nŞirket: ${data.company?.Name || data.connection?.companyTitle || '—'}\nOrtam: ${data.environment || data.connection?.environment}\nSon kontrol: ${new Date().toLocaleString('tr-TR')}`,
      )
    } catch (err) {
      setError(`✕ Bağlantı başarısız\n${formatEdocError(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle="E-Belge Ayarları"
        showBack={false}
      />
      <EDocumentsSubnav />
      <AppPagePanel
        title="Nilvera bağlantısı"
        description="API anahtarı şirket bazında şifrelenir. Yönetim paneli ve tarayıcı düz metin anahtarı görmez."
      >
        <EdocAlert>{error}</EdocAlert>
        <EdocAlert tone="emerald">{message}</EdocAlert>
        <div className="mb-6 grid gap-2 rounded-xl border border-dark-500/40 bg-dark-900/40 p-4 text-sm">
          <p className="font-black">{connectionStatusLabel(connection)}</p>
          <p>Şirket: {connection?.companyTitle || '—'}</p>
          <p>VKN: {connection?.taxNumber || '—'}</p>
          <p>
            Anahtar: {connection?.hasApiKey ? connection.apiKeyFingerprint || 'kayıtlı' : 'yok'}
          </p>
          <p>
            Son test:{' '}
            {connection?.lastTestAt ? new Date(connection.lastTestAt).toLocaleString('tr-TR') : '—'}
          </p>
          <p>
            Son senkron:{' '}
            {connection?.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString('tr-TR') : '—'}
          </p>
          {connection?.lastError ? <p className="text-rose-300">{connection.lastError}</p> : null}
        </div>
        <div className="grid max-w-xl gap-4">
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Ortam</span>
            <select
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            >
              <option value="TEST">Test (apitest.nilvera.com)</option>
              <option value="PRODUCTION">Canlı (api.nilvera.com)</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-black uppercase text-gray-500">Nilvera API anahtarı</span>
            <input
              type="password"
              autoComplete="off"
              className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2"
              placeholder={
                connection?.hasApiKey
                  ? 'Kayıtlı anahtar var — değiştirmek için yeni anahtar yazın'
                  : 'Örn. 9EE05B65… (Portal şifresi değil)'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${BTN_SUCCESS} px-4 text-xs`}
              disabled={busy}
              onClick={() => void save()}
            >
              Kaydet
            </button>
            <button
              type="button"
              className={`${BTN_PRIMARY} px-4 text-xs`}
              disabled={busy}
              onClick={() => void test()}
            >
              Bağlantıyı Test Et
            </button>
          </div>
          {credits.length ? (
            <div className="text-sm">
              <p className="font-black">Nilvera kontör</p>
              {credits.map((c) => (
                <p key={c.Name || c.name}>
                  {c.Name || c.name}: {c.RemainingCredit ?? c.remainingCredit} kalan
                </p>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-[var(--muted)]">
            Portal şifresi API anahtarı değildir. Anahtar yalnızca bir kez gösterilir: TEST için
            portaltest.nilvera.com → API Tanımları → Yeni Anahtar. Canlı anahtar yalnızca Canlı
            ortamda çalışır. Canlı gönderim için Nilvera çözüm ortaklığı gerekir.
          </p>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
