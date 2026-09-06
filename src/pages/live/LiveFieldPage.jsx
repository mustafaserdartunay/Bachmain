import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { loadPersonnel } from '../../utils/personnelStore'
import { fullName } from '../../utils/personnelHelpers'
import { BachmainMobileProvider } from '../../live/providers/BachmainMobileProvider'
import { watchFieldPosition } from '../../live/watchPosition'
import { getActiveOrgScope } from '../../utils/orgScope'
import { loadLiveSettings } from '../../live/store'
import '../../live/live.css'

export default function LiveFieldPage() {
  const employees = useMemo(() => loadPersonnel().filter((row) => row.status !== 'Ayrıldı'), [])
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '')
  const [permission, setPermission] = useState('prompt')
  const [lastFix, setLastFix] = useState(null)
  const [message, setMessage] = useState('')
  const [tracking, setTracking] = useState(false)
  const settings = loadLiveSettings()
  const provider = useMemo(() => new BachmainMobileProvider(), [])
  const scope = getActiveOrgScope()

  useEffect(() => {
    if (!tracking || !employeeId) return undefined
    const stop = watchFieldPosition(async (sample, error) => {
      if (error && error.code === 1) {
        setPermission('denied')
        setMessage('Konum izni kapalı. Uygulama çalışmaya devam eder; canlı takip pasif.')
        return
      }
      if (!sample) return
      setPermission('granted')
      setLastFix(sample)
      try {
        if (!navigator.onLine) {
          await provider.ingest({
            ...sample,
            entityId: employeeId,
            entityKind: 'personnel',
            companyId: scope.companyId || null,
            idempotencyKey: `${employeeId}:${sample.timestamp}`,
          })
          setMessage('Çevrimdışı kuyruğa alındı. Bağlantı gelince gönderilecek.')
          return
        }
        await provider.ingest({
          ...sample,
          entityId: employeeId,
          entityKind: 'personnel',
          companyId: scope.companyId || null,
          idempotencyKey: `${employeeId}:${sample.timestamp}`,
        })
        setMessage('Konum gönderildi.')
      } catch (err) {
        setMessage(err.message || 'Konum gönderilemedi.')
      }
    })
    function onOnline() {
      provider.flush().catch(() => {})
    }
    window.addEventListener('online', onOnline)
    return () => {
      stop()
      window.removeEventListener('online', onOnline)
    }
  }, [tracking, employeeId, provider, scope.companyId])

  return (
    <AppPageShell>
      <AppPageHeader title="Saha konum takibi" backTo="/live" />
      <AppPagePanel title="Konum Takibi Aktif">
        <div className="live-field space-y-4">
          {settings.trackingNotice ? (
            <p className="text-sm text-[var(--muted)]">
              Konum, görev ve teslimat operasyonu için şirketiniz tarafından toplanabilir. İzin
              vermezseniz diğer CRM özellikleri çalışmaya devam eder; yalnızca canlı takip pasif
              olur.
            </p>
          ) : null}
          <label className="block text-sm font-bold">
            Personel
            <select
              className="mt-2 w-full rounded-xl border border-dark-500/40 bg-transparent px-3 py-2"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {fullName(employee)}
                </option>
              ))}
            </select>
          </label>
          {!employees.length ? (
            <p className="text-sm text-[var(--muted)]">Önce İK’dan personel tanımlayın.</p>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            onClick={() => setTracking((value) => !value)}
            disabled={!employeeId}
          >
            {tracking ? 'Takibi durdur' : 'Canlı takibi başlat'}
          </button>
          <p className="text-xs text-[var(--muted)]">İzin durumu: {permission}</p>
          {lastFix ? (
            <p className="font-mono text-xs">
              {lastFix.latitude.toFixed(5)}, {lastFix.longitude.toFixed(5)} · {lastFix.activity}
            </p>
          ) : null}
          {message ? <p className="text-sm">{message}</p> : null}
          <Link to="/live" className="text-sm font-bold text-sky-400">
            LIVE haritasına dön
          </Link>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
