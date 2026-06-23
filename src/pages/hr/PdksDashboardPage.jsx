import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock3, MapPin, UserCheck, UserMinus, Users, UserX } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { loadPersonnel } from '../../utils/personnelStore'
import {
  getDepartmentAttendanceRates,
  getLast30DaysAttendanceSeries,
  getLiveEmployeeStatus,
  getPdksDashboardStats,
  statusBadgeClass,
  fullName,
} from '../../utils/pdksUtils'

export default function PdksDashboardPage() {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    const events = ['bach:pdks-updated', 'bach:personnel-updated']
    events.forEach((e) => window.addEventListener(e, refresh))
    return () => events.forEach((e) => window.removeEventListener(e, refresh))
  }, [refresh])

  const stats = useMemo(() => getPdksDashboardStats(), [tick])
  const series = useMemo(() => getLast30DaysAttendanceSeries(), [tick])
  const departments = useMemo(() => getDepartmentAttendanceRates(), [tick])
  const liveRows = useMemo(() => loadPersonnel()
    .filter((item) => item.status !== 'Ayrıldı')
    .map((employee) => ({ employee, status: getLiveEmployeeStatus(employee) })), [tick])

  return (
    <AppPageShell>
      <AppPageHeader title="Personel Takip ve Devam Kontrol" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Toplam Personel', value: stats.total, icon: Users, tone: 'blue', valueTone: 'blue' },
          { title: 'Bugün Gelen', value: stats.present + stats.field, icon: UserCheck, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Geç Kalan', value: stats.late, icon: Clock3, tone: 'amber', valueTone: 'amber' },
          { title: 'İzinde', value: stats.onLeave, icon: UserMinus, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Sahada', value: stats.field, icon: MapPin, tone: 'orange', valueTone: 'orange' },
          { title: 'Çıkış Yapan', value: stats.checkedOut, icon: UserX, tone: 'red', valueTone: 'red' },
          { title: 'Gelmedi', value: stats.absent, icon: UserMinus, tone: 'gray', valueTone: 'gray' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AppPagePanel title="Son 30 Gün Devam Analizi">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="present" name="Giriş" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Geç" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AppPagePanel>

        <AppPagePanel title="Departman Bazlı Devam Oranı">
          <div className="space-y-2">
            {departments.map((item) => (
              <div key={item.department} className="rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">{item.department}</p>
                  <p className="text-sm font-black text-blue-300">%{item.rate}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-700">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.rate}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">{item.present}/{item.total} personel</p>
              </div>
            ))}
          </div>
        </AppPagePanel>
      </div>

      <AppPagePanel
        title="Canlı Personel Durumu"
        action={<Link to="/ik/giris-cikis" className="text-xs font-black text-blue-300">Giriş Çıkış →</Link>}
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {liveRows.map(({ employee, status }) => (
            <div key={employee.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3">
              <div>
                <p className="text-sm font-bold text-white">{fullName(employee)}</p>
                <p className="text-[11px] text-gray-500">{employee.department} · {employee.employeeNo}</p>
              </div>
              <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${statusBadgeClass(status.tone)}`}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
