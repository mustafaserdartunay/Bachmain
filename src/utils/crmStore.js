import { customers } from '../data/mockData'
import { applyTaskStatusToProcessTrack, isTaskCompleted, normalizeProcessTrack } from './crmProcessHelpers'
import { normalizeStagePhotos } from './productionStagePhotos'
import { getLoggedInUserDisplayName } from './userProfile'

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
}

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function seedTasks() {
  const list = customers.list
  return [
    {
      id: 'task-1',
      title: 'Teklif revizyonu gönder',
      description: 'ABC Ambalaj 5000 adet kraft kutu teklif revizyonu',
      customer: list[0]?.company || '',
      assignee: 'Ayşe Demir',
      priority: 'Acil',
      status: 'Devam Ediyor',
      category: 'Teklif',
      dueDate: offsetDate(0),
      createdAt: offsetDate(-2),
    },
    {
      id: 'task-2',
      title: 'Numune teslim takibi',
      description: 'Delta Kozmetik numune onayı',
      customer: list[2]?.company || '',
      assignee: 'Mehmet Kaya',
      priority: 'Normal',
      status: 'Bekliyor',
      category: 'Numune',
      dueDate: offsetDate(1),
      createdAt: offsetDate(-1),
    },
    {
      id: 'task-3',
      title: 'Tahsilat hatırlatması',
      description: 'Prime Lojistik vadesi geçen bakiye',
      customer: 'Prime Lojistik',
      assignee: 'Serdar Tünay',
      priority: 'Yüksek',
      status: 'Bekliyor',
      category: 'Tahsilat',
      dueDate: offsetDate(-1),
      createdAt: offsetDate(-3),
    },
    {
      id: 'task-4',
      title: 'Bayi sözleşme yenileme',
      description: 'İstanbul bayi yıllık sözleşme',
      customer: list[3]?.company || '',
      assignee: 'Ayşe Demir',
      priority: 'Düşük',
      status: 'Tamamlandı',
      category: 'Genel',
      dueDate: offsetDate(-2),
      createdAt: offsetDate(-5),
    },
  ]
}

function seedAgendaNotes() {
  return [
    {
      id: 'note-1',
      title: 'Haftalık satış toplantısı hazırlığı',
      content: 'KPI raporları ve pipeline güncellemesi',
      date: offsetDate(0),
      time: '09:00',
      color: 'Mavi',
      createdAt: offsetDate(-1),
    },
    {
      id: 'note-2',
      title: 'Prime Lojistik tahsilat takibi',
      content: 'Vadesi geçen bakiye için arama yapılacak',
      date: offsetDate(0),
      time: '',
      color: 'Turuncu',
      createdAt: offsetDate(0),
    },
  ]
}

function seedAppointments() {
  const list = customers.list
  return [
    {
      id: 'apt-1',
      title: 'Teklif sunumu',
      customer: list[0]?.company || '',
      contact: list[0]?.contact || '',
      type: 'Toplantı',
      date: offsetDate(0),
      startTime: '10:00',
      endTime: '11:00',
      location: 'Ofis · Toplantı Odası A',
      notes: 'Kraft kutu fiyatlandırması',
      status: 'Onaylandı',
      assignee: 'Ayşe Demir',
    },
    {
      id: 'apt-2',
      title: 'Numune teslimi',
      customer: list[2]?.company || '',
      contact: list[2]?.contact || '',
      type: 'Numune',
      date: offsetDate(1),
      startTime: '14:30',
      endTime: '15:30',
      location: 'Delta Kozmetik · Gebze',
      notes: 'Premium kutu numunesi',
      status: 'Planlandı',
      assignee: 'Mehmet Kaya',
    },
    {
      id: 'apt-3',
      title: 'Telefon görüşmesi',
      customer: list[1]?.company || '',
      contact: list[1]?.contact || '',
      type: 'Telefon',
      date: offsetDate(0),
      startTime: '16:00',
      endTime: '16:30',
      location: 'Telefon',
      notes: 'Teslim tarihi netleştirme',
      status: 'Planlandı',
      assignee: 'Serdar Tünay',
    },
    {
      id: 'apt-4',
      title: 'Teklif sunumu',
      customer: 'Star Gıda',
      contact: 'Burak Yılmaz',
      type: 'Teklif Sunumu',
      date: offsetDate(2),
      startTime: '11:00',
      endTime: '12:00',
      location: 'Online · Teams',
      notes: 'Aylık tedarik anlaşması',
      status: 'Planlandı',
      assignee: 'Ayşe Demir',
    },
    {
      id: 'apt-5',
      title: 'Fabrika ziyareti',
      customer: list[4]?.company || '',
      contact: list[4]?.contact || '',
      type: 'Ziyaret',
      date: offsetDate(3),
      startTime: '09:30',
      endTime: '11:30',
      location: 'Nova Elektronik · Tuzla',
      notes: 'Üretim kapasitesi tanıtımı',
      status: 'Onaylandı',
      assignee: 'Mehmet Kaya',
    },
  ]
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
  saveTasks(loadTasks().filter((item) => item.id !== taskId))
}

export function deleteAppointment(appointmentId) {
  saveAppointments(loadAppointments().filter((item) => item.id !== appointmentId))
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
  saveAgendaNotes(loadAgendaNotes().filter((item) => item.id !== noteId))
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
    time: note.time,
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
