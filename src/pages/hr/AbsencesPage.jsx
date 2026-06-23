import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { loadPersonnel } from '../../utils/personnelStore'
import { getAttendanceLogs, todayKey } from '../../utils/pdksStore'
import { getLiveEmployeeStatus, fullName, statusBadgeClass } from '../../utils/pdksUtils'

export default function AbsencesPage() {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((v) => v + 1), [])
  useEffect(() => {
    window.addEventListener('bach:pdks-updated', refresh)
    window.addEventListener('bach:personnel-updated', refresh)
    return () => {
      window.removeEventListener('bach:pdks-updated', refresh)
      window.removeEventListener('bach:personnel-updated', refresh)
    }
  }, [refresh])

  const rows = useMemo(() => {
    const employees = loadPersonnel().filter((e) => e.status !== 'Ayrıldı')
    const logs = getAttendanceLogs({ date: todayKey() })
    return employees.map((employee) => {
      const status = getLiveEmployeeStatus(employee)
      const log = logs.find((item) => item.employeeId === employee.id)
      const absences = employee.absences || []
      return { employee, status, log, absences }
    }).filter((row) => row.status.key === 'absent' || (row.log?.lateMinutes || 0) > 0 || row.absences.length > 0)
  }, [tick])

  return (
    <AppPageShell>
      <AppPageHeader title="Devamsızlıklar" />
      <AppPagePanel title="Bugünkü Devamsızlık ve Geç Kalma">
        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Bugün devamsızlık kaydı yok.</p>
          ) : rows.map(({ employee, status, log }) => (
            <div key={employee.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-white">{fullName(employee)}</p>
                <p className="text-xs text-gray-500">{employee.department}</p>
                {log?.lateMinutes > 0 && <p className="text-[11px] text-amber-300">{log.lateMinutes} dk geç kaldı</p>}
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${statusBadgeClass(status.tone)}`}>{status.label}</span>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
