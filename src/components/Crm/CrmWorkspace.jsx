import { useEffect, useMemo, useState } from 'react'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import {
  Calendar,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  GitBranch,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  StickyNote,
  User,
} from 'lucide-react'
import CrmProcessCard from './CrmProcessCard'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  noteTone,
  priorityTone,
  typeTone,
} from '../../utils/crmMeta'
import {
  deleteAgendaNote,
  deleteAppointment,
  deleteTask,
  getAgendaItems,
  getCrmSummary,
  loadAgendaNotes,
  loadAppointments,
  loadTasks,
  upsertAgendaNote,
  upsertAppointment,
  upsertTask,
} from '../../utils/crmStore'
import {
  advanceCrmProcessStage,
  buildCrmProcessRecords,
  isTaskCompleted,
  recordCrmProcessNotification,
  toggleTaskCompletionStatus,
} from '../../utils/crmProcessHelpers'
import { openCrmProcessWhatsApp } from '../../utils/crmWhatsAppNotify'
import { openCrmProcessEmail } from '../../utils/crmEmailNotify'
import {
  AppointmentFormModal,
  emptyAppointmentForm,
  emptyNoteForm,
  emptyTaskForm,
  normalizeTaskForm,
  NoteFormModal,
  TaskFormModal,
} from './CrmForms'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'long' })
}

function formatShortDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function startOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(12, 0, 0, 0)
  return copy
}

function addDays(date, days) {
  const copy = new Date(`${date}T12:00:00`)
  copy.setDate(copy.getDate() + days)
  return copy.toISOString().slice(0, 10)
}

function kindLabel(kind) {
  if (kind === 'task') return 'Görev'
  if (kind === 'appointment') return 'Randevu'
  return 'Not'
}

function kindAccent(kind) {
  if (kind === 'task') return 'border-l-orange-400'
  if (kind === 'appointment') return 'border-l-blue-400'
  return 'border-l-purple-400'
}

function kindIcon(kind) {
  if (kind === 'task') return CheckSquare
  if (kind === 'appointment') return Calendar
  return StickyNote
}

function sortByTime(items) {
  return [...items].sort((a, b) => {
    const timeA = a.time || a.startTime || '99:99'
    const timeB = b.time || b.startTime || '99:99'
    return timeA.localeCompare(timeB)
  })
}

function StatPill({ icon: Icon, label, value, tone = 'text-white' }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark-700/80 text-gray-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`text-lg font-black tabular-nums leading-tight ${tone}`}>{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-dark-500/50 bg-dark-800/30 px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-700/60 text-gray-500">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-gray-500">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function WeekStrip({ weekDays, selectedDate, today, onSelect, onPrev, onNext, itemCountForDate }) {
  return (
    <div className="rounded-2xl border border-dark-500/40 bg-dark-800/50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg border border-dark-500/45 bg-dark-700/50 p-1.5 text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-black text-gray-300">
          {formatShortDate(weekDays[0].date)} – {formatShortDate(weekDays[6].date)}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-dark-500/45 bg-dark-700/50 p-1.5 text-gray-400 transition-colors hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const isToday = day.date === today
          const isSelected = day.date === selectedDate
          const count = itemCountForDate(day.date)
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelect(day.date)}
              className={`flex flex-col items-center rounded-xl px-1 py-2 transition-all ${
                isSelected
                  ? 'bg-blue-500/20 ring-1 ring-blue-500/40'
                  : isToday
                    ? 'bg-dark-700/60 ring-1 ring-blue-500/20'
                    : 'hover:bg-dark-700/40'
              }`}
            >
              <span className="text-[11px] font-bold uppercase text-gray-500">{day.label}</span>
              <span className={`mt-0.5 text-sm font-black tabular-nums ${isSelected || isToday ? 'text-white' : 'text-gray-300'}`}>
                {day.date.slice(8)}
              </span>
              {count > 0 ? (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
              ) : (
                <span className="mt-1 h-1.5 w-1.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FeedItem({ item, today, onEdit, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(false)
  const Icon = kindIcon(item.kind)
  const overdue = item.kind === 'task' && item.date < today && item.status !== 'Tamamlandı'
  const timeLabel = item.time
    ? item.time
    : item.startTime
      ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ''}`
      : null

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-dark-500/40 bg-dark-800/55 pl-4 transition-colors hover:border-blue-500/30 hover:bg-dark-700/40 border-l-[3px] ${kindAccent(item.kind)} ${
        item.kind === 'note' ? noteTone[item.color] || noteTone.Mavi : ''
      } ${overdue ? 'border-red-500/30 bg-red-500/5' : ''}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-dark-700/70 text-gray-400">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-white">{item.title}</h3>
            <span className="rounded-md bg-dark-700/80 px-1.5 py-0.5 text-[11px] font-black uppercase text-gray-500">
              {kindLabel(item.kind)}
            </span>
            {item.priority && (
              <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-black ${priorityTone[item.priority]}`}>
                {item.priority}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-gray-500">
            {timeLabel && (
              <span className="inline-flex items-center gap-1 text-gray-400">
                <Clock className="h-3 w-3" />
                {timeLabel}
              </span>
            )}
            {item.customer && (
              <span>{getCustomerDisplay(item.customer).brandShortName}</span>
            )}
            {item.assignee && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {item.assignee}
              </span>
            )}
            {item.location && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {item.location}
              </span>
            )}
          </div>
          {(item.description || item.notes || item.content) && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
              {item.description || item.notes || item.content}
            </p>
          )}
        </div>
        <div className="relative flex shrink-0 gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-gray-500 hover:bg-dark-600 hover:text-blue-300">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <DeleteTrashButton
            pending={pendingDelete}
            onClick={() => setPendingDelete(true)}
            onConfirm={() => {
              onDelete?.()
              setPendingDelete(false)
            }}
            onCancel={() => setPendingDelete(false)}
            buttonClassName="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 border-0 bg-transparent"
            popoverClassName="absolute right-0 top-full z-40 mt-1"
          />
        </div>
      </div>
    </article>
  )
}

function AppointmentCard({ apt, onEdit, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(false)
  return (
    <article className="group rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4 transition-colors hover:border-blue-500/30 hover:bg-dark-700/40">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 h-10 w-1 shrink-0 rounded-full ${typeTone[apt.type] || 'bg-blue-500'}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-white">{apt.title}</h3>
            <span className="rounded-md bg-dark-700/80 px-1.5 py-0.5 text-[11px] font-black text-gray-400">{apt.type}</span>
          </div>
          <p className="mt-1 text-xs font-bold text-gray-400">
            {getCustomerDisplay(apt.customer).brandShortName}
            {apt.contact ? ` · ${apt.contact}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-[13px] font-semibold text-gray-500">
            <span className="inline-flex items-center gap-1 text-blue-300">
              <Calendar className="h-3 w-3" />
              {formatShortDate(apt.date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {apt.startTime}–{apt.endTime}
            </span>
            {apt.location && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {apt.location}
              </span>
            )}
          </div>
          {apt.notes && <p className="mt-2 line-clamp-2 text-xs text-gray-500">{apt.notes}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[12px] font-black text-blue-300">
            {apt.status}
          </span>
          <div className="flex gap-0.5 opacity-70 group-hover:opacity-100">
            <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-gray-500 hover:text-blue-300">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <DeleteTrashButton
              pending={pendingDelete}
              onClick={() => setPendingDelete(true)}
              onConfirm={() => {
                onDelete?.()
                setPendingDelete(false)
              }}
              onCancel={() => setPendingDelete(false)}
              buttonClassName="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 border-0 bg-transparent"
              popoverClassName="absolute right-0 top-full z-40 mt-1"
            />
          </div>
        </div>
      </div>
    </article>
  )
}

function TaskRow({ task, today, onToggle, onEdit, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(false)
  const isOverdue = !isTaskCompleted(task) && task.dueDate < today
  const done = isTaskCompleted(task)

  return (
    <article className={`group flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors hover:border-blue-500/30 hover:bg-dark-700/35 ${
      isOverdue ? 'border-red-500/25 bg-red-500/5' : 'border-dark-500/40 bg-dark-800/55'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          done ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' : 'border-dark-500/60 hover:border-blue-500/40'
        }`}
      >
        {done && <span className="text-[12px] font-black">✓</span>}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-black ${done ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
          {task.category && (
            <span className="rounded-md bg-dark-700/80 px-1.5 py-0.5 text-[11px] font-black uppercase text-gray-500">
              {task.category}
            </span>
          )}
        </div>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-3 text-[13px] font-semibold text-gray-500">
          <span>{getCustomerDisplay(task.customer).brandShortName}</span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assignee}
          </span>
          <span className={isOverdue ? 'text-red-400' : ''}>
            {formatShortDate(task.dueDate)}
          </span>
        </div>
      </div>
      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[12px] font-black ${priorityTone[task.priority]}`}>
        {task.priority}
      </span>
      <div className="relative flex shrink-0 gap-0.5 opacity-70 group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-gray-500 hover:text-blue-300">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <DeleteTrashButton
          pending={pendingDelete}
          onClick={() => setPendingDelete(true)}
          onConfirm={() => {
            onDelete?.()
            setPendingDelete(false)
          }}
          onCancel={() => setPendingDelete(false)}
          buttonClassName="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300 border-0 bg-transparent"
          popoverClassName="absolute right-0 top-full z-40 mt-1"
        />
      </div>
    </article>
  )
}

export default function CrmWorkspace({ variant = 'full', defaultTab = 'processes' }) {
  const compact = variant === 'compact'
  const initialTab = defaultTab === 'agenda' ? 'plan' : defaultTab
  const today = new Date().toISOString().slice(0, 10)

  const [tab, setTab] = useState(initialTab)
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [tasks, setTasks] = useState(loadTasks)
  const [appointments, setAppointments] = useState(loadAppointments)
  const [notes, setNotes] = useState(loadAgendaNotes)
  const [modal, setModal] = useState(null)
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm)
  const [noteForm, setNoteForm] = useState(emptyNoteForm())
  const [taskFilter, setTaskFilter] = useState('open')
  const [processFilter, setProcessFilter] = useState('active')

  const summary = useMemo(() => getCrmSummary(), [tasks, appointments])
  const agendaItems = useMemo(() => getAgendaItems(), [tasks, appointments, notes])
  const processRecords = useMemo(
    () => buildCrmProcessRecords(tasks, appointments),
    [tasks, appointments],
  )
  const activeProcessCount = useMemo(
    () => processRecords.filter((entry) => {
      const terminalId = entry.template.stages.find((stage) => stage.isTerminal)?.id
      return entry.record.processTrack?.currentStageId !== terminalId
    }).length,
    [processRecords],
  )

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart.toISOString().slice(0, 10), index)
    return { date, label: WEEKDAYS[index] }
  }), [weekStart])

  useEffect(() => {
    function refresh() {
      setTasks(loadTasks())
      setAppointments(loadAppointments())
      setNotes(loadAgendaNotes())
    }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  function refresh() {
    setTasks(loadTasks())
    setAppointments(loadAppointments())
    setNotes(loadAgendaNotes())
  }

  function openTaskModal(task) {
    setTaskForm(task ? normalizeTaskForm(task) : { ...emptyTaskForm(), dueDate: selectedDate })
    setModal('task')
  }

  function openAppointmentModal(appointment, presetDate) {
    if (appointment) {
      setAppointmentForm({ ...appointment })
    } else {
      setAppointmentForm({ ...emptyAppointmentForm(), date: presetDate || selectedDate || today })
    }
    setModal('appointment')
  }

  function openNoteModal(note, presetDate) {
    if (note) {
      setNoteForm({ ...note })
    } else {
      setNoteForm(emptyNoteForm(presetDate || selectedDate || today))
    }
    setModal('note')
  }

  function submitTask(form) {
    upsertTask(form)
    refresh()
    setModal(null)
  }

  function submitAppointment(form) {
    upsertAppointment(form)
    refresh()
    setModal(null)
  }

  function submitNote(form) {
    upsertAgendaNote(form)
    refresh()
    setModal(null)
  }

  function toggleTaskStatus(task) {
    upsertTask({ ...task, status: toggleTaskCompletionStatus(task) })
    refresh()
  }

  function agendaForDate(date) {
    return sortByTime(agendaItems.filter((item) => item.date === date))
  }

  function itemCountForDate(date) {
    return agendaItems.filter((item) => item.date === date).length
  }

  function selectDate(date) {
    setSelectedDate(date)
    setTab('plan')
  }

  function shiftWeek(delta) {
    const currentStart = weekStart.toISOString().slice(0, 10)
    const selectedIndex = weekDays.findIndex((day) => day.date === selectedDate)
    const nextStartDate = addDays(currentStart, delta * 7)
    setWeekStart(new Date(`${nextStartDate}T12:00:00`))
    setSelectedDate(addDays(nextStartDate, selectedIndex >= 0 ? selectedIndex : 0))
  }

  function handleFeedEdit(item) {
    if (item.kind === 'task') openTaskModal(tasks.find((entry) => entry.id === item.id))
    else if (item.kind === 'appointment') openAppointmentModal(appointments.find((entry) => entry.id === item.id))
    else openNoteModal(notes.find((entry) => entry.id === item.id))
  }

  function handleFeedDelete(item) {
    if (item.kind === 'task') deleteTask(item.id)
    else if (item.kind === 'appointment') deleteAppointment(item.id)
    else deleteAgendaNote(item.id)
    refresh()
  }

  function handleProcessStagePhotosChange(entry, photos) {
    const { kind, record } = entry
    const next = { ...record, stagePhotos: photos }
    if (kind === 'task') upsertTask(next)
    else upsertAppointment(next)
    refresh()
  }

  function handleProcessStageClick(entry, stageId) {
    const { kind, record } = entry
    const next = advanceCrmProcessStage(record, stageId, kind)
    if (kind === 'task') upsertTask(next)
    else upsertAppointment(next)
    refresh()
  }

  function handleProcessWhatsApp(entry, step) {
    const { kind, record, template } = entry
    const result = openCrmProcessWhatsApp({ record, stage: step, template, kind })
    if (!result.ok) {
      window.alert(result.reason)
      return
    }
    const stageId = step.id
    const notified = recordCrmProcessNotification(record, stageId, kind, 'whatsapp')
    if (kind === 'task') upsertTask(notified)
    else upsertAppointment(notified)
    refresh()
  }

  function handleProcessMail(entry, step) {
    const { kind, record, template } = entry
    const result = openCrmProcessEmail({ record, stage: step, template, kind })
    if (!result.ok) {
      window.alert(result.reason)
      return
    }
    const stageId = step.id
    const notified = recordCrmProcessNotification(record, stageId, kind, 'email')
    if (kind === 'task') upsertTask(notified)
    else upsertAppointment(notified)
    refresh()
  }

  function handleProcessEdit(entry) {
    if (entry.kind === 'task') openTaskModal(tasks.find((item) => item.id === entry.id))
    else openAppointmentModal(appointments.find((item) => item.id === entry.id))
  }

  function handleProcessDelete(entry) {
    if (entry.kind === 'task') deleteTask(entry.id)
    else deleteAppointment(entry.id)
    refresh()
  }

  const filteredProcessRecords = processRecords.filter((entry) => {
    const active = entry.record.processTrack?.currentStageId
    const template = entry.template
    const terminalId = template.stages.find((stage) => stage.isTerminal)?.id
    const isTerminal = active === terminalId
    if (processFilter === 'active') return !isTerminal
    if (processFilter === 'done') return isTerminal
    return true
  })

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'open') return !isTaskCompleted(task)
    if (taskFilter === 'done') return isTaskCompleted(task)
    if (taskFilter === 'overdue') return !isTaskCompleted(task) && task.dueDate < today
    return true
  })

  const activeAppointments = appointments.filter((apt) => apt.status !== 'İptal')
  const dayItems = agendaForDate(selectedDate)

  const addMenu = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => openNoteModal(null)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/45 bg-dark-700/50 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Not
      </button>
      <button
        type="button"
        onClick={() => openTaskModal(null)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dark-500/45 bg-dark-700/50 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700"
      >
        <CheckSquare className="h-3.5 w-3.5" />
        Görev
      </button>
      <button
        type="button"
        onClick={() => openAppointmentModal(null)}
        className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Randevu
      </button>
    </div>
  )

  const tabs = [
    { id: 'processes', label: 'Süreçler', icon: GitBranch },
    { id: 'plan', label: 'Günüm', icon: CalendarDays },
    { id: 'tasks', label: 'Görevler', icon: CheckSquare },
    { id: 'appointments', label: 'Randevular', icon: Calendar },
  ]

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {!compact && (
        <header className="flex flex-col gap-4 rounded-2xl border border-dark-500/40 bg-gradient-to-br from-dark-800/80 to-dark-900/40 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-blue-400/80">CRM</p>
            <h1 className="mt-1 text-xl font-black text-white">Randevu & Süreç Merkezi</h1>
            <p className="mt-1 text-xs text-gray-500">Müşteri süreçlerini takip et, aşama bildirimlerini WhatsApp ile gönder.</p>
          </div>
          {addMenu}
        </header>
      )}

      {compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">CRM merkezi</p>
          {addMenu}
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-2">
          <StatPill icon={Calendar} label="Bugün randevu" value={summary.appointmentsToday} tone="text-blue-300" />
          <StatPill icon={CalendarDays} label="Bu hafta" value={summary.appointmentsWeek} tone="text-cyan-300" />
          <StatPill icon={CheckSquare} label="Açık görev" value={summary.tasksPending} tone="text-emerald-300" />
          <StatPill icon={Clock} label="Geciken" value={summary.tasksOverdue} tone="text-red-300" />
          <StatPill icon={MessageCircle} label="Aktif süreç" value={activeProcessCount} tone="text-green-300" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
                tab === item.id
                  ? 'border-blue-500/35 bg-blue-500/10 text-blue-200'
                  : 'border-dark-500/45 bg-dark-800/50 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'processes' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'active', label: 'Devam eden' },
              { id: 'done', label: 'Tamamlanan' },
              { id: 'all', label: 'Tümü' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setProcessFilter(filter.id)}
                className={`rounded-lg border px-3 py-1.5 text-[13px] font-bold transition-colors ${
                  processFilter === filter.id
                    ? 'border-blue-500/35 bg-blue-500/10 text-blue-200'
                    : 'border-dark-500/45 bg-dark-800/50 text-gray-500 hover:text-gray-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <p className="ml-auto text-[12px] font-bold text-gray-500">
              Her aşamanın yanındaki WA ile müşteriye bildirim gönderilir
            </p>
          </div>

          {filteredProcessRecords.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="Süreç kaydı yok"
              hint="Randevu veya görev ekleyerek numune, teklif ve ziyaret süreçlerini buradan yönetin."
              action={(
                <button type="button" onClick={() => openAppointmentModal(null)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Randevu ekle
                </button>
              )}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProcessRecords.map((entry) => (
                <CrmProcessCard
                  key={`${entry.kind}-${entry.id}`}
                  entry={entry}
                  onStageClick={handleProcessStageClick}
                  onStagePhotosChange={handleProcessStagePhotosChange}
                  onMailClick={handleProcessMail}
                  onWhatsAppClick={handleProcessWhatsApp}
                  onEdit={() => handleProcessEdit(entry)}
                  onDelete={() => handleProcessDelete(entry)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <WeekStrip
          weekDays={weekDays}
          selectedDate={selectedDate}
          today={today}
          onSelect={selectDate}
          onPrev={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
          itemCountForDate={itemCountForDate}
        />

        <div className="min-w-0 space-y-3">
          <div className={compact ? 'max-h-[420px] overflow-y-auto pr-1' : ''}>
            {tab === 'plan' && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dark-500/40 bg-dark-800/45 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">Seçili gün</p>
                    <p className="text-sm font-black capitalize text-white">{formatDateLabel(selectedDate)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => openNoteModal(null, selectedDate)} className="rounded-lg border border-dark-500/45 px-2.5 py-1.5 text-[12px] font-black text-gray-400 hover:text-white">Not</button>
                    <button type="button" onClick={() => openTaskModal({ ...emptyTaskForm(), dueDate: selectedDate })} className="rounded-lg border border-dark-500/45 px-2.5 py-1.5 text-[12px] font-black text-gray-400 hover:text-white">Görev</button>
                    <button type="button" onClick={() => openAppointmentModal(null, selectedDate)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-[12px] font-black text-blue-300">Randevu</button>
                  </div>
                </div>

                {dayItems.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Bu gün boş"
                    hint="Not, görev veya randevu ekleyerek gününü planla."
                    action={(
                      <button type="button" onClick={() => openAppointmentModal(null, selectedDate)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        İlk randevuyu ekle
                      </button>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <FeedItem
                        key={`${item.kind}-${item.id}`}
                        item={item}
                        today={today}
                        onEdit={() => handleFeedEdit(item)}
                        onDelete={() => handleFeedDelete(item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'tasks' && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'open', label: 'Açık' },
                    { id: 'overdue', label: 'Geciken' },
                    { id: 'done', label: 'Tamamlanan' },
                    { id: 'all', label: 'Tümü' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setTaskFilter(filter.id)}
                      className={`rounded-lg border px-3 py-1.5 text-[13px] font-bold transition-colors ${
                        taskFilter === filter.id
                          ? 'border-blue-500/35 bg-blue-500/10 text-blue-200'
                          : 'border-dark-500/45 bg-dark-800/50 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => openTaskModal(null)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-dark-500/45 px-3 py-1.5 text-[13px] font-bold text-gray-400 hover:text-white">
                    <Plus className="h-3 w-3" />
                    Yeni
                  </button>
                </div>

                {filteredTasks.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    title="Görev bulunamadı"
                    hint="Bu filtrede kayıt yok. Yeni görev ekleyebilirsin."
                    action={(
                      <button type="button" onClick={() => openTaskModal(null)} className="rounded-xl border border-dark-500/45 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white">
                        Görev ekle
                      </button>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        today={today}
                        onToggle={() => toggleTaskStatus(task)}
                        onEdit={() => openTaskModal(task)}
                        onDelete={() => { deleteTask(task.id); refresh() }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {tab === 'appointments' && (
              <section className="space-y-3">
                {activeAppointments.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="Henüz randevu yok"
                    hint="Müşteri görüşmelerini ve ziyaretlerini buradan planla."
                    action={(
                      <button type="button" onClick={() => openAppointmentModal(null)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        Randevu oluştur
                      </button>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    {[...activeAppointments]
                      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
                      .map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          apt={apt}
                          onEdit={() => openAppointmentModal(apt)}
                          onDelete={() => { deleteAppointment(apt.id); refresh() }}
                        />
                      ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
      )}

      {modal === 'task' && (
        <TaskFormModal initial={taskForm} onClose={() => setModal(null)} onSubmit={submitTask} />
      )}
      {modal === 'appointment' && (
        <AppointmentFormModal initial={appointmentForm} onClose={() => setModal(null)} onSubmit={submitAppointment} />
      )}
      {modal === 'note' && (
        <NoteFormModal initial={noteForm} onClose={() => setModal(null)} onSubmit={submitNote} />
      )}
    </div>
  )
}
