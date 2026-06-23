import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  buildDynamicQrPayload,
  buildEmployeeQrPayload,
  getDynamicQr,
  getPdksSettings,
  rotateDynamicQr,
  savePdksSettings,
} from '../../utils/pdksStore'
import { loadPersonnel } from '../../utils/personnelStore'
import { qrImageUrl, fullName } from '../../utils/pdksUtils'

export default function PdksSettingsPage() {
  const [settings, setSettings] = useState(() => getPdksSettings())
  const [dynamicQr, setDynamicQr] = useState(() => getDynamicQr())
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const employees = useMemo(() => loadPersonnel().filter((e) => e.status !== 'Ayrıldı'), [])

  useEffect(() => {
    const seconds = Number(settings.dynamicQrSeconds) || 30
    const timer = window.setInterval(() => setDynamicQr(rotateDynamicQr()), seconds * 1000)
    return () => window.clearInterval(timer)
  }, [settings.dynamicQrSeconds])

  function update(patch) {
    const next = savePdksSettings(patch)
    setSettings(next.settings)
  }

  const employeeQr = selectedEmployeeId ? buildEmployeeQrPayload(selectedEmployeeId) : ''
  const kioskQr = buildDynamicQrPayload()
  const remainingSec = Math.max(0, Math.ceil((dynamicQr.expiresAt - Date.now()) / 1000))

  return (
    <AppPageShell>
      <AppPageHeader title="PDKS Ayarları" />

      <div className="grid gap-4 xl:grid-cols-2">
        <AppPagePanel title="Geofence & Güvenlik">
          <div className="space-y-3">
            <label className="block">
              <span className="form-label">Yarıçap (metre)</span>
              <input type="number" className="form-input text-sm" value={settings.geofence.radiusM} onChange={(e) => update({ geofence: { ...settings.geofence, radiusM: Number(e.target.value) } })} />
            </label>
            <label className="block">
              <span className="form-label">Enlem</span>
              <input type="number" step="0.0001" className="form-input text-sm" value={settings.geofence.lat} onChange={(e) => update({ geofence: { ...settings.geofence, lat: Number(e.target.value) } })} />
            </label>
            <label className="block">
              <span className="form-label">Boylam</span>
              <input type="number" step="0.0001" className="form-input text-sm" value={settings.geofence.lng} onChange={(e) => update({ geofence: { ...settings.geofence, lng: Number(e.target.value) } })} />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={settings.requireGps} onChange={(e) => update({ requireGps: e.target.checked })} />
              GPS zorunlu
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={settings.requireSelfie} onChange={(e) => update({ requireSelfie: e.target.checked })} />
              Selfie doğrulama zorunlu
            </label>
            <label className="block">
              <span className="form-label">Dinamik QR yenileme (sn)</span>
              <input type="number" min="15" max="120" className="form-input text-sm" value={settings.dynamicQrSeconds} onChange={(e) => update({ dynamicQrSeconds: Number(e.target.value) })} />
            </label>
          </div>
        </AppPagePanel>

        <AppPagePanel title="İşletme Giriş Ekranı — Dinamik QR">
          <p className="mb-3 text-xs text-gray-500">QR her {settings.dynamicQrSeconds} saniyede yenilenir. Ekran görüntüsü ile kullanım riskini azaltmak için süre dolunca geçersiz olur.</p>
          <div className="flex flex-col items-center rounded-2xl border border-dark-500/40 bg-white p-4">
            <img src={qrImageUrl(kioskQr)} alt="Dinamik QR" className="h-56 w-56" />
            <p className="mt-2 text-sm font-black text-dark-800">Kalan: {remainingSec} sn</p>
          </div>
          <button type="button" onClick={() => setDynamicQr(rotateDynamicQr())} className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300">
            QR Yenile
          </button>
        </AppPagePanel>
      </div>

      <AppPagePanel title="Personel QR Kodları">
        <select className="form-input mb-4 w-full max-w-md text-sm" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
          <option value="">Personel seçin</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{fullName(e)} · {e.employeeNo}</option>)}
        </select>
        {employeeQr && (
          <div className="flex flex-col items-start gap-4 md:flex-row">
            <div className="rounded-2xl border border-dark-500/40 bg-white p-4">
              <img src={qrImageUrl(employeeQr)} alt="Personel QR" className="h-56 w-56" />
            </div>
            <div className="text-xs text-gray-400">
              <p>QR içeriği: personel_id, şifreli_token, oluşturma_tarihi</p>
              <p className="mt-2 break-all font-mono text-[10px] text-gray-500">{employeeQr.slice(0, 120)}...</p>
            </div>
          </div>
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
