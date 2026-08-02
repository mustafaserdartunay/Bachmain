import { useMemo } from 'react'
import { CalendarDays, CheckSquare, StickyNote } from 'lucide-react'
import { closeAllHeaderPopovers, useHeaderPopover } from '../../hooks/useHeaderPopover'
import { setHeaderAgendaAnchor } from '../../utils/headerAgendaAnchor'
import {
  requestAppointmentCreateOpen,
  requestNotebookOpen,
  requestTaskCreateOpen,
  useCalendarCreateMode,
} from '../../utils/headerAgendaIntent'

export default function HeaderAgendaSwitch() {
  const { open: notebookOpen } = useHeaderPopover('notebook')
  const { open: calendarOpen } = useHeaderPopover('calendar')
  const createMode = useCalendarCreateMode()

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
          aria-label="Not Defteri"
          title="Not Defteri"
          aria-pressed={active === 'notebook'}
        >
          <StickyNote className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          data-header-popover-trigger="calendar"
          onClick={handleTask}
          className="header-agenda-switch-btn header-agenda-switch-btn--task"
          aria-label="Görev oluştur"
          title="Görev oluştur"
          aria-pressed={active === 'task'}
        >
          <CheckSquare className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <button
          type="button"
          data-header-popover-trigger="calendar"
          onClick={handleAppointment}
          className="header-agenda-switch-btn header-agenda-switch-btn--appointment"
          aria-label="Randevu oluştur"
          title="Randevu oluştur"
          aria-pressed={active === 'appointment'}
        >
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </span>
    </div>
  )
}
