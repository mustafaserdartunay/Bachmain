import { customers } from '../data/mockData'
import { applyTaskStatusToProcessTrack, isTaskCompleted, normalizeProcessTrack } from './crmProcessHelpers'
import { normalizeStagePhotos } from './productionStagePhotos'
import { getLoggedInUserDisplayName } from './userProfile'
import { appendActivityEntry } from './activityArchiveStore'
import { scheduleTenantPush } from './tenantSync'

const TASKS_KEY = 'bach-crm-tasks'
const APPOINTMENTS_KEY = 'bach-crm-appointments'
const NOTES_KEY = 'bach-crm-agenda-notes'

export const TASK_PRIORITIES = ['Düşük', 'Normal', 'Yüksek', 'Acil']
export const TASK_STATUSES = ['Bekliyor', 'Devam Ediyor', 'Tamamlandı']
export const APPOINTMENT_TYPES = ['Toplantı', 'Telefon', 'Ziyaret', 'Numune', 'Teklif Sunumu']
export const APPOINTMENT_STATUSES = ['Planlandı', 'Onaylandı', 'Tamamlandı', 'İptal']
export const TASK_CATEGORIES = ['Genel', 'Teklif', 'Tahsilat', 'Numune', 'Ziyaret', 'Takip']

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('bach:crm-updated'))
  try {
    scheduleTenantPush('crmRecords', {
      tasks: readJson(TASKS_KEY, []),
      appointments: readJson(APPOINTMENTS_KEY, []),
      notes: readJson(NOTES_KEY, []),
    })
  } catch {
    /* tenant sync optional until DATABASE_URL is live */
  }
}

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function seedTasks() {
  return []
}

function seedAgendaNotes() {
  return []
}

function seedAppointments() {
  return []
}

export function loadTasks() {
  const saved = readJson(TASKS_KEY, null)
  const items = saved || (() => {
    const seeded = seedTasks()
    writeJson(TASKS_KEY, seeded)
    return seeded
  })()
  const normalized = items.map((item) => ({
    ...item,
    processTrack: normalizeProcessTrack(item, 'task'),
    stagePhotos: normalizeStagePhotos(item.stagePhotos),
  }))
  if (items.some((item) => !item.processTrack?.currentStageId)) {
    writeJson(TASKS_KEY, normalized)
  }
  return normalized
}

export function loadAppointments() {
  const saved = readJson(APPOINTMENTS_KEY, null)
  const items = saved || (() => {
    const seeded = seedAppointments()
    writeJson(APPOINTMENTS_KEY, seeded)
    return seeded
  })()
  const normalized = items.map((item) => ({
    ...item,
    processTrack: normalizeProcessTrack(item, 'appointment'),
    stagePhotos: normalizeStagePhotos(item.stagePhotos),
  }))
  if (items.some((item) => !item.processTrack?.currentStageId)) {
    writeJson(APPOINTMENTS_KEY, normalized)
  }
  return normalized
}

export function saveTasks(tasks) {
  writeJson(TASKS_KEY, tasks)
}

export function saveAppointments(appointments) {
  writeJson(APPOINTMENTS_KEY, appointments)
}

export function upsertTask(task) {
  const tasks = loadTasks()
  const index = tasks.findIndex((item) => item.id === task.id)
  const isNew = index < 0
  const merged = isNew
    ? {
        ...task,
        id: task.id || createId('task'),
        createdAt: task.createdAt || offsetDate(0),
        createdBy: task.createdBy || getLoggedInUserDisplayName(),
      }
    : { ...tasks[index], ...task }
  const existing = index >= 0 ? tasks[index] : null
  const statusOrCategoryChanged = !existing
    || existing.status !== merged.status
    || existing.category !== merged.category
  const withProcess = {
    ...merged,
    processTrack: statusOrCategoryChanged
      ? applyTaskStatusToProcessTrack(merged)
      : normalizeProcessTrack(merged, 'task'),
    stagePhotos: normalizeStagePhotos(merged.stagePhotos),
  }
  const next = index >= 0
    ? tasks.map((item) => (item.id === task.id ? withProcess : item))
    : [withProcess, ...tasks]
  saveTasks(next)
  return next
}

export function upsertAppointment(appointment) {
  const appointments = loadAppointments()
  const index = appointments.findIndex((item) => item.id === appointment.id)
  const isNew = index < 0
  const merged = isNew
    ? {
        ...appointment,
        id: appointment.id || createId('apt'),
        createdAt: appointment.createdAt || offsetDate(0),
        createdBy: appointment.createdBy || getLoggedInUserDisplayName(),
      }
    : { ...appointments[index], ...appointment }
  const withProcess = {
    ...merged,
    processTrack: normalizeProcessTrack(merged, 'appointment'),
    stagePhotos: normalizeStagePhotos(merged.stagePhotos),
  }
  const next = index >= 0
    ? appointments.map((item) => (item.id === appointment.id ? withProcess : item))
    : [withProcess, ...appointments]
  saveAppointments(next)
  return next
}

export function deleteTask(taskId) {
  const tasks = loadTasks()
  const task = tasks.find((item) => item.id === taskId)
  if (task) {
    appendActivityEntry({
      module: 'crm',
      action: 'delete',
      entityType: 'task',
      entityId: task.id,
      entityLabel: task.title || 'CRM görevi',
      description: `${task.title || 'CRM görevi'} silindi.`,
      snapshot: task,
      undo: { type: 'crm.restoreTask' },
    })
  }
  saveTasks(tasks.filter((item) => item.id !== taskId))
}

export function deleteAppointment(appointmentId) {
  const appointments = loadAppointments()
  const appointment = appointments.find((item) => item.id === appointmentId)
  if (appointment) {
    appendActivityEntry({
      module: 'crm',
      action: 'delete',
      entityType: 'appointment',
      entityId: appointment.id,
      entityLabel: appointment.title || 'CRM randevusu',
      description: `${appointment.title || 'CRM randevusu'} silindi.`,
      snapshot: appointment,
      undo: { type: 'crm.restoreAppointment' },
    })
  }
  saveAppointments(appointments.filter((item) => item.id !== appointmentId))
}

export function loadAgendaNotes() {
  const saved = readJson(NOTES_KEY, null)
  if (saved) return saved
  const seeded = seedAgendaNotes()
  writeJson(NOTES_KEY, seeded)
  return seeded
}

export function saveAgendaNotes(notes) {
  writeJson(NOTES_KEY, notes)
}

export function upsertAgendaNote(note) {
  const notes = loadAgendaNotes()
  const index = notes.findIndex((item) => item.id === note.id)
  const next = index >= 0
    ? notes.map((item) => (item.id === note.id ? { ...item, ...note } : item))
    : [{ ...note, id: note.id || createId('note'), createdAt: note.createdAt || offsetDate(0) }, ...notes]
  saveAgendaNotes(next)
  return next
}

export function deleteAgendaNote(noteId) {
  const notes = loadAgendaNotes()
  const note = notes.find((item) => item.id === noteId)
  if (note) {
    appendActivityEntry({
      module: 'crm',
      action: 'delete',
      entityType: 'note',
      entityId: note.id,
      entityLabel: note.title || 'CRM notu',
      description: `${note.title || 'CRM notu'} silindi.`,
      snapshot: note,
      undo: { type: 'crm.restoreNote' },
    })
  }
  saveAgendaNotes(notes.filter((item) => item.id !== noteId))
}

export function deleteCompletedAgendaNotes() {
  const notes = loadAgendaNotes()
  const completed = notes.filter((item) => item.completed)
  completed.forEach((note) => {
    appendActivityEntry({
      module: 'crm',
      action: 'delete',
      entityType: 'note',
      entityId: note.id,
      entityLabel: note.title || 'CRM notu',
      description: `${note.title || 'CRM notu'} silindi.`,
      snapshot: note,
      undo: { type: 'crm.restoreNote' },
    })
  })
  saveAgendaNotes(notes.filter((item) => !item.completed))
  return completed.length
}

export function restoreCrmEntry(entryType, snapshot) {
  if (!snapshot?.id) return false
  if (entryType === 'task') {
    const tasks = loadTasks()
    if (!tasks.some((item) => item.id === snapshot.id)) saveTasks([snapshot, ...tasks])
    return true
  }
  if (entryType === 'appointment') {
    const appointments = loadAppointments()
    if (!appointments.some((item) => item.id === snapshot.id)) saveAppointments([snapshot, ...appointments])
    return true
  }
  if (entryType === 'note') {
    const notes = loadAgendaNotes()
    if (!notes.some((item) => item.id === snapshot.id)) saveAgendaNotes([snapshot, ...notes])
    return true
  }
  return false
}

export function getCrmSummary() {
  const tasks = loadTasks()
  const appointments = loadAppointments()
  const today = new Date().toISOString().slice(0, 10)

  return {
    tasksPending: tasks.filter((t) => !isTaskCompleted(t)).length,
    tasksOverdue: tasks.filter((t) => !isTaskCompleted(t) && t.dueDate < today).length,
    appointmentsToday: appointments.filter((a) => a.date === today && a.status !== 'İptal').length,
    appointmentsWeek: appointments.filter((a) => {
      const diff = (new Date(a.date) - new Date(today)) / 86400000
      return diff >= 0 && diff < 7 && a.status !== 'İptal'
    }).length,
  }
}

export function getAgendaItems() {
  const tasks = loadTasks().filter((t) => !isTaskCompleted(t))
  const appointments = loadAppointments().filter((a) => a.status !== 'İptal')
  const notes = loadAgendaNotes()

  const taskItems = tasks.map((task) => ({
    id: task.id,
    kind: 'task',
    title: task.title,
    customer: task.customer,
    date: task.dueDate,
    time: '',
    assignee: task.assignee,
    priority: task.priority,
    status: task.status,
    description: task.description,
    category: task.category,
  }))

  const appointmentItems = appointments.map((apt) => ({
    id: apt.id,
    kind: 'appointment',
    title: apt.title,
    customer: apt.customer,
    date: apt.date,
    time: apt.startTime,
    endTime: apt.endTime,
    assignee: apt.assignee,
    type: apt.type,
    status: apt.status,
    location: apt.location,
    notes: apt.notes,
    contact: apt.contact,
  }))

  const noteItems = notes.map((note) => ({
    id: note.id,
    kind: 'note',
    title: note.title,
    customer: '',
    date: note.date,
    time: note.timeFrom || note.time,
    dateFrom: note.dateFrom,
    dateTo: note.dateTo,
    timeFrom: note.timeFrom,
    timeTo: note.timeTo,
    includeTime: note.includeTime,
    content: note.content,
    color: note.color,
    status: 'Not',
  }))

  return [...taskItems, ...appointmentItems, ...noteItems].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.time || '').localeCompare(b.time || '')
  })
}

/** Zamanı gelmiş görev, randevu ve ajanda notları — header zil bildirimleri için */
export function getCrmNotifications() {
  const today = new Date().toISOString().slice(0, 10)
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const notifications = []

  loadTasks()
    .filter((task) => !isTaskCompleted(task))
    .forEach((task) => {
      const overdue = task.dueDate < today
      const dueToday = task.dueDate === today
      if (!overdue && !dueToday) return
      notifications.push({
        id: `crm-task-${task.id}`,
        kind: 'task',
        entityId: task.id,
        title: task.title,
        subtitle: `${task.customer || 'Genel'} · ${task.assignee}`,
        detail: task.description,
        date: task.dueDate,
        overdue,
        dueToday,
        urgency: overdue ? 'overdue' : 'today',
        link: '/crm',
      })
    })

  loadAppointments()
    .filter((apt) => apt.status !== 'İptal' && apt.status !== 'Tamamlandı')
    .forEach((apt) => {
      const overdue = apt.date < today
      const dueToday = apt.date === today
      if (!overdue && !dueToday) return
      const [hour, minute] = (apt.startTime || '00:00').split(':').map(Number)
      const aptMinutes = hour * 60 + minute
      const isNow = dueToday && Math.abs(aptMinutes - nowMinutes) <= 30
      notifications.push({
        id: `crm-apt-${apt.id}`,
        kind: 'appointment',
        entityId: apt.id,
        title: apt.title,
        subtitle: `${apt.startTime}–${apt.endTime} · ${apt.customer}`,
        detail: apt.location,
        date: apt.date,
        overdue,
        dueToday,
        urgency: overdue ? 'overdue' : isNow ? 'now' : 'today',
        link: '/crm',
      })
    })

  loadAgendaNotes().forEach((note) => {
    const overdue = note.date < today
    const dueToday = note.date === today
    if (!overdue && !dueToday) return
    notifications.push({
      id: `crm-note-${note.id}`,
      kind: 'note',
      entityId: note.id,
      title: note.title,
      subtitle: note.content,
      detail: note.time ? `Saat ${note.time}` : 'Ajanda notu',
      date: note.date,
      overdue,
      dueToday,
      urgency: overdue ? 'overdue' : 'today',
      link: '/crm',
    })
  })

  const urgencyRank = { overdue: 0, now: 1, today: 2 }
  return notifications.sort((a, b) => {
    const rankDiff = (urgencyRank[a.urgency] ?? 9) - (urgencyRank[b.urgency] ?? 9)
    if (rankDiff !== 0) return rankDiff
    return a.date.localeCompare(b.date)
  })
}

export function getUpcomingItems(limit = 5) {
  const today = new Date().toISOString().slice(0, 10)
  return getAgendaItems()
    .filter((item) => item.date >= today)
    .slice(0, limit)
}
