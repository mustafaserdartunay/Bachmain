import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import { getAttendanceLogs } from '../../utils/pdksStore'

const GRID = 'minmax(140px,1fr) 100px 80px 80px 80px 90px minmax(100px,1fr)'

export default function AttendanceTrackingPage() {
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')

  const refresh = useCallback(() => setTick((v) => v + 1), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return getAttendanceLogs().filter((row) => {
      if (!q) return true
      return [row.employeeName, row.department, row.status].some((v) => String(v).toLowerCase().includes(q))
    })
  }, [tick, search])

  return (
    <AppPageShell>
      <AppPageHeader title="Giriş Çıkış Takibi" />
      <AppPagePanel title="Devam Kayıtları">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Personel veya departman ara..." className="form-input mb-4 w-full max-w-md text-sm" />
        <ListHeaderRow gridTemplate={GRID} columns={['Personel', 'Tarih', 'Giriş', 'Çıkış', 'Saat', 'Mesai', 'Durum']} />
        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Kayıt bulunamadı. Mobil giriş veya kiosk QR ile kayıt oluşturun.</p>
          ) : rows.map((row) => (
            <div key={row.id} className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3" style={{ gridTemplateColumns: GRID }}>
              <div>
                <p className="text-sm font-bold text-white">{row.employeeName}</p>
                <p className="text-[11px] text-gray-500">{row.department}</p>
              </div>
              <p className="text-xs text-gray-400">{row.date}</p>
              <p className="text-xs font-semibold text-emerald-300">{row.checkIn || '—'}</p>
              <p className="text-xs font-semibold text-red-300">{row.checkOut || '—'}</p>
              <p className="text-xs text-gray-300">{row.totalHours || '—'}</p>
              <p className="text-xs text-purple-300">{row.overtimeHours || 0}</p>
              <p className="text-xs font-bold text-white">{row.status}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
