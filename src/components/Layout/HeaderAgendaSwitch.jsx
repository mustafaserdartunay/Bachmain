import { useEffect, useMemo, useRef } from 'react'
import { CalendarDays, CheckSquare, StickyNote } from 'lucide-react'
import { closeAllHeaderPopovers, useHeaderPopover } from '../../hooks/useHeaderPopover'
import { setHeaderAgendaAnchor } from '../../utils/headerAgendaAnchor'
import {
  requestAppointmentCreateOpen,
  requestNotebookOpen,
  requestTaskCreateOpen,
  useCalendarCreateMode,
} from '../../utils/headerAgendaIntent'

const ITEMS = [
  {
    id: 'notebook',
    label: 'Not Defteri',
    icon: StickyNote,
    btnClass: 'header-agenda-switch-btn--notebook',
  },
  {
    id: 'task',
    label: 'Görev',
    icon: CheckSquare,
    btnClass: 'header-agenda-switch-btn--task',
  },
  {
    id: 'appointment',
    label: 'Randevu',
    icon: CalendarDays,
    btnClass: 'header-agenda-switch-btn--appointment',
  },
]

/**
 * Header 3’lü pill — not defteri / görev / randevu (eski üst panel).
 */
export default function HeaderAgendaSwitch() {
  const rootRef = useRef(null)
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

  useEffect(() => {
    setHeaderAgendaAnchor(rootRef.current)
    return () => setHeaderAgendaAnchor(null)
  }, [])

  function handleItemClick(id) {
    if (id === 'notebook') {
      if (notebookOpen) {
        closeAllHeaderPopovers()
        return
      }
      requestNotebookOpen()
      return
    }
    if (id === 'task') {
      if (calendarOpen && createMode === 'task') {
        closeAllHeaderPopovers()
        return
      }
      requestTaskCreateOpen()
      return
    }
    if (calendarOpen && createMode === 'appointment') {
      closeAllHeaderPopovers()
      return
    }
    requestAppointmentCreateOpen()
  }

  return (
    <div
      ref={rootRef}
      className={`header-agenda-switch shrink-0 ${active ? 'is-open' : ''}`}
      data-active={active || undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="header-agenda-switch-track">
        <span
          className={`header-agenda-switch-thumb${active ? ` is-${active}` : ''}`}
          aria-hidden="true"
        />
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              data-header-popover-trigger={item.id === 'notebook' ? 'notebook' : 'calendar'}
              onClick={() => handleItemClick(item.id)}
              className={`header-agenda-switch-btn ${item.btnClass}`}
              aria-label={item.label}
              title={item.label}
              aria-pressed={isActive}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          )
        })}
      </span>
    </div>
  )
}
