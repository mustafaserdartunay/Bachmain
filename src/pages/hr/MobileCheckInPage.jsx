import { useCallback, useEffect, useMemo, useState } from 'react'
import { Camera, LogIn, LogOut, MapPin, QrCode } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { loadPersonnel } from '../../utils/personnelStore'
import {
  buildDynamicQrPayload,
  buildEmployeeQrPayload,
  ensureEmployeeQr,
  getOpenAttendance,
  recordCheckIn,
  recordCheckOut,
  todayKey,
} from '../../utils/pdksStore'
import { fullName } from '../../utils/pdksUtils'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

function getGpsPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS desteklenmiyor'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000 },
    )
  })
}

export default function MobileCheckInPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [dynamicToken, setDynamicToken] = useState('')
  const [photo, setPhoto] = useState('')
  const [message, setMessage] = useState('')
  const [tick, setTick] = useState(0)
  const employees = useMemo(() => loadPersonnel().filter((e) => e.status !== 'Ayrıldı'), [tick])

  const refresh = useCallback(() => setTick((v) => v + 1), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  const open = employeeId ? getOpenAttendance(employeeId, todayKey()) : null
  const employee = employees.find((e) => e.id === employeeId)

  async function handleCheckIn() {
    try {
      setMessage('')
      const gps = await getGpsPosition()
      let parsedDynamic = ''
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(dynamicToken.trim() || buildDynamicQrPayload()))))
        parsedDynamic = payload.token || ''
      } catch {
        parsedDynamic = dynamicToken.trim()
      }
      const secret = ensureEmployeeQr(employeeId)
      recordCheckIn({
        employeeId,
        gps,
        photo,
        device: navigator.userAgent,
        dynamicQrToken: parsedDynamic,
        employeeQrToken: secret.token,
      })
      setMessage('Giriş kaydedildi.')
      refresh()
    } catch (error) {
      setMessage(error.message || 'Giriş başarısız.')
    }
  }

  async function handleCheckOut() {
    try {
      setMessage('')
      const gps = await getGpsPosition()
      recordCheckOut({ employeeId, gps })
      setMessage('Çıkış kaydedildi.')
      refresh()
    } catch (error) {
      setMessage(error.message || 'Çıkış başarısız.')
    }
  }

  function handlePhotoCapture(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  return (
    <AppPageShell>
      <AppPageHeader title="Mobil Giriş" />

      <AppPagePanel title="Personel Giriş / Çıkış">
        <div className="mx-auto max-w-md space-y-4">
          <select className="form-input w-full text-sm" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Personel seçin</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{fullName(e)}</option>)}
          </select>

          {employee && (
            <div className="rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4 text-center">
              <p className="text-lg font-black text-white">{fullName(employee)}</p>
              <p className="text-xs text-gray-500">{employee.department} · {employee.position}</p>
              <p className="mt-2 text-sm text-blue-300">{open ? `Giriş: ${open.checkIn}` : 'Bugün giriş yok'}</p>
            </div>
          )}

          <label className="block">
            <span className="form-label flex items-center gap-1"><QrCode className="h-3.5 w-3.5" /> Dinamik QR (kiosk)</span>
            <textarea className="form-input min-h-[80px] text-xs" value={dynamicToken} onChange={(e) => setDynamicToken(e.target.value)} placeholder="Kiosk QR payload veya token" />
          </label>

          <label className="block">
            <span className="form-label flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> Selfie (opsiyonel/zorunlu)</span>
            <input type="file" accept="image/*" capture="user" onChange={handlePhotoCapture} className="form-input text-xs" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={!employeeId || open} onClick={handleCheckIn} className={`${BTN_SUCCESS} flex items-center justify-center gap-2 py-4 text-sm disabled:opacity-50`}>
              <LogIn className="h-5 w-5" /> Giriş Yap
            </button>
            <button type="button" disabled={!employeeId || !open} onClick={handleCheckOut} className={`${BTN_PRIMARY} flex items-center justify-center gap-2 py-4 text-sm disabled:opacity-50`}>
              <LogOut className="h-5 w-5" /> Çıkış Yap
            </button>
          </div>

          <p className="flex items-center justify-center gap-1 text-center text-[11px] text-gray-500">
            <MapPin className="h-3.5 w-3.5" /> GPS doğrulaması otomatik yapılır
          </p>

          {message && (
            <p className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${message.includes('kaydedildi') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
              {message}
            </p>
          )}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
