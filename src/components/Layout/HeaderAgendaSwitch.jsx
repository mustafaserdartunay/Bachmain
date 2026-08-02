import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CheckSquare, StickyNote } from 'lucide-react'
import { AGENDA_NOTE_BADGE_CLASS, countIncompleteAgendaNotes } from '../Crm/AgendaNoteBoard'
import { isTaskCompleted } from '../../utils/crmProcessHelpers'
import { loadAgendaNotes, loadAppointments, loadTasks } from '../../utils/crmStore'
import { closeAllHeaderPopovers, useHeaderPopover } from '../../hooks/useHeaderPopover'
import { setHeaderAgendaAnchor } from '../../utils/headerAgendaAnchor'
import {
  requestAppointmentCreateOpen,
  requestNotebookOpen,
  requestTaskCreateOpen,
  useCalendarCreateMode,
} from '../../utils/headerAgendaIntent'

function countOpenTasks(tasks = []) {
  return tasks.filter((task) => !isTaskCompleted(task)).length
}

function countOpenAppointments(appointments = []) {
  return appointments.filter((apt) => apt.status !== 'İptal' && apt.status !== 'Tamamlandı').length
}

function formatBadgeCount(count) {
  return count > 99 ? '99+' : count
}

export default function HeaderAgendaSwitch() {
  const { open: notebookOpen } = useHeaderPopover('notebook')
  const { open: calendarOpen } = useHeaderPopover('calendar')
  const createMode = useCalendarCreateMode()
  const [noteCount, setNoteCount] = useState(() => countIncompleteAgendaNotes(loadAgendaNotes()))
  const [taskCount, setTaskCount] = useState(() => countOpenTasks(loadTasks()))
  const [appointmentCount, setAppointmentCount] = useState(() =>
    countOpenAppointments(loadAppointments()),
  )

  useEffect(() => {
    function refresh() {
      setNoteCount(countIncompleteAgendaNotes(loadAgendaNotes()))
      setTaskCount(countOpenTasks(loadTasks()))
      setAppointmentCount(countOpenAppointments(loadAppointments()))
    }
    refresh()
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  const active = useMemo(() => {
    if (notebookOpen) return 'notebook'
    if (calendarOpen && createMode === 'task') return 'task'
    if (calendarOpen && createMode === 'appointment') return 'appointment'
    if (calendarOpen) return 'appointment'
    return null
  }, [notebookOpen, calendarOpen, createMode])

  function handleNotebook() {
    if (notebookOpen) {
      closeAllHeaderPopovers()
      return
    }
    requestNotebookOpen()
  }

  function handleTask() {
    if (calendarOpen && createMode === 'task') {
      closeAllHeaderPopovers()
      return
    }
    requestTaskCreateOpen()
  }

  function handleAppointment() {
    if (calendarOpen && createMode === 'appointment') {
      closeAllHeaderPopovers()
      return
    }
    requestAppointmentCreateOpen()
  }

  return (
    <div
      className={`header-agenda-switch shrink-0 ${active ? 'is-open' : ''}`}
      data-active={active || 'idle'}
      ref={(node) => setHeaderAgendaAnchor(node)}
    >
      <span className="header-agenda-switch-track">
        <span
          className={`header-agenda-switch-thumb ${
            active === 'notebook'
              ? 'is-notebook'
              : active === 'task'
                ? 'is-task'
                : active === 'appointment'
                  ? 'is-appointment'
                  : ''
          }`}
          aria-hidden="true"
        />
        <button
          type="button"
          data-header-popover-trigger="notebook"
          onClick={handleNotebook}
          className="header-agenda-switch-btn header-agenda-switch-btn--notebook"
          aria-label={`Not Defteri${noteCount ? ` · ${noteCount} tamamlanmayan` : ''}`}
          title="Not Defteri"
          aria-pressed={active === 'notebook'}
        >
          <StickyNote className="h-3.5 w-3.5" strokeWidth={2.25} />
          {noteCount > 0 ? (
            <span className={`${AGENDA_NOTE_BADGE_CLASS} !-right-0.5 !-top-0.5`}>
              {formatBadgeCount(noteCount)}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          data-header-popover-trigger="calendar"
          onClick={handleTask}
          className="header-agenda-switch-btn header-agenda-switch-btn--task"
          aria-label={`Görev oluştur${taskCount ? ` · ${taskCount} açık görev` : ''}`}
          title="Görev oluştur"
          aria-pressed={active === 'task'}
        >
          <CheckSquare className="h-3.5 w-3.5" strokeWidth={2.25} />
          {taskCount > 0 ? (
            <span className={`${AGENDA_NOTE_BADGE_CLASS} !-right-0.5 !-top-0.5`}>
              {formatBadgeCount(taskCount)}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          data-header-popover-trigger="calendar"
          onClick={handleAppointment}
          className="header-agenda-switch-btn header-agenda-switch-btn--appointment"
          aria-label={`Randevu oluştur${appointmentCount ? ` · ${appointmentCount} açık randevu` : ''}`}
          title="Randevu oluştur"
          aria-pressed={active === 'appointment'}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.25} />
          {appointmentCount > 0 ? (
            <span className={`${AGENDA_NOTE_BADGE_CLASS} !-right-0.5 !-top-0.5`}>
              {formatBadgeCount(appointmentCount)}
            </span>
          ) : null}
        </button>
      </span>
    </div>
  )
}
