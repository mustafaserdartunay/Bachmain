import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { getGpsLogs } from '../../utils/pdksStore'
import { getCompanyStartPoint } from '../../utils/customerGeo'
import { readCompanySettings } from '../../utils/companySettings'
import FieldSalesMap from '../../components/FieldSales/FieldSalesMap'
import { loadPersonnel } from '../../utils/personnelStore'
import { fullName } from '../../utils/pdksUtils'

export default function MapTrackingPage() {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((v) => v + 1), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    return () => window.removeEventListener('bach:pdks-updated', refresh)
  }, [refresh])

  const logs = useMemo(() => getGpsLogs(), [tick])
  const employees = useMemo(() => loadPersonnel(), [tick])
  const startPoint = useMemo(() => getCompanyStartPoint(readCompanySettings()), [])

  const mapCustomers = useMemo(() => {
    const latestByEmployee = new Map()
    logs.forEach((log) => {
      if (!latestByEmployee.has(log.employeeId)) latestByEmployee.set(log.employeeId, log)
    })
    return Array.from(latestByEmployee.values()).map((log) => ({
      id: log.employeeId,
      company: log.employeeName,
      name: log.employeeName,
      city: log.source,
      lat: log.lat,
      lng: log.lng,
    }))
  }, [logs])

  return (
    <AppPageShell>
      <AppPageHeader title="Harita Takibi" />
      <AppPagePanel title="Canlı / Son Konum">
        <FieldSalesMap
          customers={mapCustomers}
          startPoint={startPoint}
          markerColor="#8b5cf6"
          emptyMessage="Henüz GPS kaydı yok. Giriş/çıkış veya mobil takip ile konum oluşur."
          className="min-h-[420px]"
        />
      </AppPagePanel>
      <AppPagePanel title="Son Konum Kayıtları">
        <div className="space-y-2">
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">{log.employeeName || fullName(employees.find((e) => e.id === log.employeeId) || {})}</p>
                <p className="text-xs text-gray-500">{log.source} · {new Date(log.createdAt).toLocaleString('tr-TR')}</p>
              </div>
              <p className="text-xs font-mono text-gray-400">{log.lat?.toFixed(5)}, {log.lng?.toFixed(5)}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
