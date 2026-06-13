export function formatMoney(value, currency = 'TRY') {
  const amount = Number(value) || 0
  return `${amount.toLocaleString('tr-TR')} ${currency === 'TRY' ? '₺' : currency}`
}

export function fullName(employee) {
  return `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
}

export function countPresentDays(attendance = []) {
  return attendance.filter((row) => ['Geldi', 'Geç Geldi', 'Yarım Gün'].includes(row.status)).length
}

export function countAbsentDays(attendance = [], absences = []) {
  const fromAttendance = attendance.filter((row) => row.status === 'Gelmedi').length
  const fromAbsences = absences.reduce((sum, row) => sum + (Number(row.days) || 1), 0)
  return fromAttendance + fromAbsences
}

export function sumBonuses(bonuses = [], month = null) {
  return bonuses
    .filter((item) => !month || item.month === month)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
}

export function latestPayroll(payrollHistory = []) {
  if (!payrollHistory.length) return null
  return [...payrollHistory].sort((a, b) => b.month.localeCompare(a.month))[0]
}

export function tenureLabel(hireDate, terminationDate = '') {
  if (!hireDate) return '—'
  const [d, mo, yr] = hireDate.split('.').map(Number)
  const start = new Date(yr, mo - 1, d)
  const end = terminationDate
    ? (() => {
      const [ed, em, ey] = terminationDate.split('.').map(Number)
      return new Date(ey, em - 1, ed)
    })()
    : new Date()
  const months = Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years > 0) return `${years} yıl ${rem} ay`
  return `${rem} ay`
}

export function statusTone(status) {
  switch (status) {
    case 'Aktif':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'İzinli':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    case 'Ayrıldı':
      return 'border-red-500/30 bg-red-500/10 text-red-300'
    case 'Deneme Süreci':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
    default:
      return 'border-dark-500/40 bg-dark-700/60 text-gray-400'
  }
}

export function attendanceTone(status) {
  switch (status) {
    case 'Geldi':
      return 'text-emerald-300'
    case 'Geç Geldi':
      return 'text-amber-300'
    case 'Gelmedi':
      return 'text-red-300'
    case 'Yarım Gün':
      return 'text-orange-300'
    default:
      return 'text-gray-400'
  }
}

export function leaveStatusTone(status) {
  switch (status) {
    case 'Onaylandı':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'Bekliyor':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    case 'Reddedildi':
      return 'border-red-500/30 bg-red-500/10 text-red-300'
    default:
      return 'border-dark-500/40 bg-dark-700/60 text-gray-400'
  }
}

export function computePersonnelSummary(employees) {
  const active = employees.filter((item) => item.status === 'Aktif').length
  const onLeave = employees.filter((item) => item.status === 'İzinli').length
  const terminated = employees.filter((item) => item.status === 'Ayrıldı').length
  const payrollTotal = employees
    .filter((item) => item.status === 'Aktif')
    .reduce((sum, item) => sum + (Number(item.salary?.base) || 0), 0)
  const pendingLeaves = employees.reduce(
    (sum, item) => sum + (item.leaves || []).filter((leave) => leave.status === 'Bekliyor').length,
    0,
  )
  const absentToday = employees.reduce(
    (sum, item) => sum + (item.attendance || []).filter((row) => row.status === 'Gelmedi').length,
    0,
  )
  return { active, onLeave, terminated, payrollTotal, pendingLeaves, absentToday, total: employees.length }
}
