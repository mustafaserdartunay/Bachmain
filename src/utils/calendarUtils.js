import { isTaskCompleted } from './crmProcessHelpers'

export const CALENDAR_WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
export const CALENDAR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export function parseCalendarIso(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toCalendarIso(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function sameCalendarDay(left, right) {
  return left && right && toCalendarIso(left) === toCalendarIso(right)
}

export function buildCalendarMonthGrid(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  return cells
}

export function formatCalendarDayLabel(iso) {
  const date = parseCalendarIso(iso)
  if (!date) return ''
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function collectCalendarDayCounts(tasks = [], appointments = []) {
  const counts = new Map()

  function bump(iso, kind) {
    if (!iso) return
    const current = counts.get(iso) || { tasks: 0, appointments: 0 }
    current[kind] += 1
    counts.set(iso, current)
  }

  tasks.forEach((task) => {
    if (isTaskCompleted(task)) return
    bump(task.dateFrom || task.dueDate, 'tasks')
    if (task.dateTo && task.dateTo !== (task.dateFrom || task.dueDate)) {
      bump(task.dateTo, 'tasks')
    }
  })

  appointments.forEach((appointment) => {
    if (appointment.status === 'İptal') return
    bump(appointment.dateFrom || appointment.date, 'appointments')
    if (appointment.dateTo && appointment.dateTo !== (appointment.dateFrom || appointment.date)) {
      bump(appointment.dateTo, 'appointments')
    }
  })

  return counts
}
