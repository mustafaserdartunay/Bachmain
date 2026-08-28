import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CheckSquare, StickyNote } from 'lucide-react'
import { countIncompleteAgendaNotes } from '../Crm/AgendaNoteBoard'
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
import { TEAM_HUB_NOTICE_BADGE_CLASS } from '../../utils/teamHubStore'

const AGENDA_ITEMS = [
  {
    id: 'notebook',
    label: 'Not Defteri',
    icon: StickyNote,
    iconWrap: 'bg-gradient-to-br from-amber-400 to-orange-500',
    activeRing: 'ring-amber-400/45',
    trigger: 'notebook',
  },
  {
    id: 'task',
    label: 'Görev',
    icon: CheckSquare,
    iconWrap: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    activeRing: 'ring-emerald-400/40',
    trigger: 'calendar',
    createMode: 'task',
  },
  {
    id: 'appointment',
    label: 'Randevu',
    icon: CalendarDays,
    iconWrap: 'bg-gradient-to-br from-sky-400 to-blue-600',
    activeRing: 'ring-sky-400/40',
    trigger: 'calendar',
    createMode: 'appointment',
  },
]

function countOpenTasks(tasks = []) {
  return tasks.filter((task) => !isTaskCompleted(task)).length
}

function countOpenAppointments(appointments = []) {
  return appointments.filter((apt) => apt.status !== 'İptal' && apt.status !== 'Tamamlandı').length
}

function formatBadgeCount(count) {
  return count > 99 ? '99+' : count
}

function AgendaNoticeBadge({ count }) {
  if (!count) return null
  return (
    <span className={`${TEAM_HUB_NOTICE_BADGE_CLASS} !-right-0.5 !-top-0.5`}>
      {formatBadgeCount(count)}
    </span>
  )
}

/**
 * Sağ panel ajanda grubu — not defteri, görev ve randevu ayrı ikonlar.
 */
export default function SidebarAgendaHub({ collapsed = false, compact = false, className = '' }) {
  const rootRef = useRef(null)
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

  const badgeById = {
    notebook: noteCount,
    task: taskCount,
    appointment: appointmentCount,
  }

  function bindAnchor(node) {
    setHeaderAgendaAnchor(node)
  }

  useEffect(() => {
    bindAnchor(rootRef.current)
    return () => bindAnchor(null)
  }, [])

  useEffect(() => {
    if (!active || !rootRef.current) return
    const button = rootRef.current.querySelector(`[data-agenda-id="${active}"]`)
    if (button) bindAnchor(button)
  }, [active, collapsed])

  function handleItemClick(item, event) {
    bindAnchor(event.currentTarget)

    if (item.id === 'notebook') {
      if (notebookOpen) {
        closeAllHeaderPopovers()
        return
      }
      requestNotebookOpen()
      return
    }

    if (item.createMode === 'task') {
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
    <section
      ref={rootRef}
      className={`sidebar-agenda-hub shrink-0 ${compact ? 'sidebar-agenda-hub--compact' : ''} ${className}`}
      aria-label="Ajanda araçları"
    >
      {!compact ? (
        <div
          className={`mb-2 flex items-center gap-2 ${collapsed ? 'justify-center px-0' : 'px-1'}`}
        >
          {!collapsed ? (
            <>
              <span className="sidebar-agenda-hub-dot" aria-hidden="true" />
              <p className="truncate text-xs font-extrabold leading-none text-[var(--ink)]">
                Ajanda
              </p>
            </>
          ) : (
            <span className="sidebar-agenda-hub-dot" aria-hidden="true" title="Ajanda" />
          )}
        </div>
      ) : null}

      <nav
        className={
          collapsed || compact
            ? 'flex flex-col items-center gap-1.5'
            : 'sidebar-agenda-hub-row team-hub-icon-tabs-row'
        }
      >
        {AGENDA_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              data-agenda-id={item.id}
              data-header-popover-trigger={item.trigger}
              onClick={(event) => handleItemClick(item, event)}
              className={`sidebar-agenda-hub-btn flex h-10 shrink-0 items-center justify-center rounded-[14px] p-1 transition-all ${
                isActive
                  ? `bg-white/78 ring-2 ${item.activeRing} shadow-sm`
                  : 'bg-white/30 hover:bg-white/58'
              } ${collapsed || compact ? 'w-10' : ''}`}
              title={item.label}
              aria-label={`${item.label}${badgeById[item.id] ? ` · ${badgeById[item.id]}` : ''}`}
              aria-pressed={isActive}
            >
              <span
                className={`relative flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${item.iconWrap}`}
              >
                <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
                <AgendaNoticeBadge count={badgeById[item.id]} />
              </span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
