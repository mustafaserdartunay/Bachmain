import { loadPersonnel } from './personnelStore'
import { fullName } from './personnelHelpers'
import {
  getAttendanceLogs,
  getGpsLogs,
  getLeaveRequests,
  getOpenAttendance,
  todayKey,
} from './pdksStore'

export { fullName }

export function getLiveEmployeeStatus(employee) {
  const today = todayKey()
  const open = getOpenAttendance(employee.id, today)
  const todayLogs = getAttendanceLogs({ employeeId: employee.id, date: today })
  const onLeave = getLeaveRequests().some((item) => (
    item.employeeId === employee.id
    && item.status.includes('Onay')
    && item.startDate <= today
    && item.endDate >= today
  ))

  if (employee.status === 'Ayrıldı') return { key: 'inactive', label: 'Pasif', tone: 'gray' }
  if (onLeave || employee.status === 'İzinli') return { key: 'leave', label: 'İzinde', tone: 'blue' }
  if (open) {
    const lastGps = getGpsLogs(employee.id)[0]
    if (lastGps?.source === 'track' || lastGps?.source === 'field') {
      return { key: 'field', label: 'Sahada', tone: 'amber' }
    }
    return { key: 'inside', label: 'İş Yerinde', tone: 'emerald' }
  }
  if (todayLogs.some((item) => item.checkOut)) {
    return { key: 'out', label: 'Çıkış Yaptı', tone: 'red' }
  }
  return { key: 'absent', label: 'Gelmedi', tone: 'gray' }
}

export function getPdksDashboardStats() {
  const employees = loadPersonnel().filter((item) => item.status !== 'Ayrıldı')
  const today = todayKey()
  const todayLogs = getAttendanceLogs({ date: today })
  const statuses = employees.map((employee) => getLiveEmployeeStatus(employee))

  return {
    total: employees.length,
    present: statuses.filter((item) => item.key === 'inside').length,
    late: todayLogs.filter((item) => (item.lateMinutes || 0) > 0).length,
    onLeave: statuses.filter((item) => item.key === 'leave').length,
    field: statuses.filter((item) => item.key === 'field').length,
    checkedOut: statuses.filter((item) => item.key === 'out').length,
    absent: statuses.filter((item) => item.key === 'absent').length,
  }
}

export function getLast30DaysAttendanceSeries() {
  const rows = getAttendanceLogs()
  const map = new Map()
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    map.set(key, { date: key, label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), present: 0, late: 0, absent: 0 })
  }
  rows.forEach((row) => {
    const bucket = map.get(row.date)
    if (!bucket) return
    bucket.present += 1
    if ((row.lateMinutes || 0) > 0) bucket.late += 1
  })
  return Array.from(map.values())
}

export function getDepartmentAttendanceRates() {
  const employees = loadPersonnel().filter((item) => item.status !== 'Ayrıldı')
  const today = todayKey()
  const grouped = new Map()

  employees.forEach((employee) => {
    const dept = employee.department || 'Genel'
    const current = grouped.get(dept) || { department: dept, total: 0, present: 0 }
    current.total += 1
    const status = getLiveEmployeeStatus(employee)
    if (status.key === 'inside' || status.key === 'field') current.present += 1
    grouped.set(dept, current)
  })

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    rate: item.total ? Math.round((item.present / item.total) * 100) : 0,
    date: today,
  }))
}

export function statusBadgeClass(tone) {
  switch (tone) {
    case 'emerald': return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    case 'amber': return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'red': return 'bg-red-500/15 text-red-300 border-red-500/30'
    case 'blue': return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    default: return 'bg-dark-700/60 text-gray-400 border-dark-500/40'
  }
}

export function qrImageUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(data)}`
}
