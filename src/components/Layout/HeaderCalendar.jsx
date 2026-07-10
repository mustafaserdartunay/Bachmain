import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  AppointmentFormModal,
  emptyAppointmentForm,
  emptyTaskForm,
  TaskFormModal,
} from '../Crm/CrmForms'
import {
  collectCalendarDayCounts,
  buildCalendarMonthGrid,
  CALENDAR_MONTHS,
  CALENDAR_WEEKDAYS,
  formatCalendarDayLabel,
  parseCalendarIso,
  sameCalendarDay,
  toCalendarIso,
} from '../../utils/calendarUtils'
import { isTaskCompleted } from '../../utils/crmProcessHelpers'
import {
  loadAppointments,
  loadTasks,
  upsertAppointment,
  upsertTask,
} from '../../utils/crmStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

function GlassMonthCalendar({
  viewDate,
  onViewDateChange,
  selectedDate,
  onSelectDate,
  dayCounts,
}) {
  const monthCells = useMemo(() => buildCalendarMonthGrid(viewDate), [viewDate])
  const today = new Date()

  return (
    <div className="header-calendar-month">
      <div className="mb-2 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          className="header-calendar-nav-btn"
          aria-label="Önceki ay"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs font-extrabold text-[var(--ink)]">
          {CALENDAR_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          className="header-calendar-nav-btn"
          aria-label="Sonraki ay"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-0.5 grid grid-cols-7 gap-0.5">
        {CALENDAR_WEEKDAYS.map((day) => (
          <span key={day} className="header-calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {monthCells.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} />
          }

          const iso = toCalendarIso(day)
          const markers = dayCounts.get(iso)
          const isSelected = selectedDate === iso
          const isToday = sameCalendarDay(day, today)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`header-calendar-day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
            >
              <span>{day.getDate()}</span>
              {markers ? (
                <span className="header-calendar-day-dots" aria-hidden="true">
                  {markers.tasks > 0 ? <i className="dot dot-task" /> : null}
                  {markers.appointments > 0 ? <i className="dot dot-appointment" /> : null}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HeaderCalendarCreatePanel({
  selectedDate,
  createMode,
  onCreateModeChange,
  onClose,
}) {
  const [taskForm, setTaskForm] = useState(null)
  const [appointmentForm, setAppointmentForm] = useState(null)

  useEffect(() => {
    if (!selectedDate) {
      setTaskForm(null)
      setAppointmentForm(null)
      return
    }
    setTaskForm({
      ...emptyTaskForm(),
      dueDate: selectedDate,
      dateFrom: selectedDate,
      dateTo: selectedDate,
      includeTime: false,
    })
    setAppointmentForm({
      ...emptyAppointmentForm(),
      date: selectedDate,
      dateFrom: selectedDate,
      dateTo: selectedDate,
      includeTime: true,
      timeFrom: '10:00',
      timeTo: '11:00',
      startTime: '10:00',
      endTime: '11:00',
    })
  }, [selectedDate])

  if (!selectedDate) {
    return (
      <div className="header-calendar-create-empty">
        <p className="text-xs font-semibold text-[var(--muted)]">Tarih seçin</p>
      </div>
    )
  }

  function handleTaskSubmit(form) {
    upsertTask({
      ...form,
      dueDate: form.dateFrom || form.dueDate || selectedDate,
    })
    onClose()
  }

  function handleAppointmentSubmit(form) {
    const dateFrom = form.dateFrom || form.date || selectedDate
    upsertAppointment({
      ...form,
      date: dateFrom,
      dateFrom,
      dateTo: form.dateTo || '',
      startTime: form.includeTime ? form.timeFrom || form.startTime || '' : '',
      endTime: form.includeTime ? form.timeTo || form.endTime || '' : '',
    })
    onClose()
  }

  if (createMode === 'task' && taskForm) {
    return (
      <div className="header-calendar-form-shell">
        <TaskFormModal
          initial={taskForm}
          onClose={() => onCreateModeChange(null)}
          onSubmit={handleTaskSubmit}
          fullPage
          compact
        />
      </div>
    )
  }

  if (createMode === 'appointment' && appointmentForm) {
    return (
      <div className="header-calendar-form-shell">
        <AppointmentFormModal
          initial={appointmentForm}
          onClose={() => onCreateModeChange(null)}
          onSubmit={handleAppointmentSubmit}
          fullPage
          compact
        />
      </div>
    )
  }

  return (
    <div className="header-calendar-create-panel">
      <p className="text-xs font-extrabold capitalize text-[var(--ink)]">
        {formatCalendarDayLabel(selectedDate)}
      </p>

      <div className="mt-2 space-y-1.5">
        <button
          type="button"
          onClick={() => onCreateModeChange('task')}
          className="header-calendar-create-btn header-calendar-create-btn--task"
        >
          <CheckSquare className="h-3.5 w-3.5 shrink-0" />
          <span>Görev</span>
        </button>
        <button
          type="button"
          onClick={() => onCreateModeChange('appointment')}
          className="header-calendar-create-btn header-calendar-create-btn--appointment"
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>Randevu</span>
        </button>
      </div>
    </div>
  )
}

export default function HeaderCalendar() {
  const { open, setOpen, toggle } = useHeaderPopover('calendar')
  const [selectedDate, setSelectedDate] = useState('')
  const [createMode, setCreateMode] = useState(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [tasks, setTasks] = useState(() => loadTasks())
  const [appointments, setAppointments] = useState(() => loadAppointments())
  const { anchorRef, menuRef, style: menuStyle, updatePosition } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
  })

  useEffect(() => {
    function refresh() {
      setTasks(loadTasks())
      setAppointments(loadAppointments())
    }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  useEffect(() => {
    if (!open) {
      setCreateMode(null)
      setSelectedDate('')
      return
    }
    setViewDate(parseCalendarIso(selectedDate) || new Date())
  }, [open, selectedDate])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => updatePosition?.())
    }
  }, [open, selectedDate, createMode, updatePosition])

  const dayCounts = useMemo(
    () => collectCalendarDayCounts(tasks, appointments),
    [tasks, appointments],
  )

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const openTasks = tasks.filter((task) => !isTaskCompleted(task))
      .filter((task) => (task.dateFrom || task.dueDate || '') >= today).length
    const openAppointments = appointments.filter((apt) => apt.status !== 'İptal' && apt.status !== 'Tamamlandı')
      .filter((apt) => (apt.dateFrom || apt.date || '') >= today).length
    return openTasks + openAppointments
  }, [tasks, appointments])

  function handleOpen() {
    toggle()
  }

  function handleSelectDate(iso) {
    setSelectedDate(iso)
    setCreateMode(null)
    setViewDate(parseCalendarIso(iso) || new Date())
  }

  function handleClosePanel() {
    setOpen(false)
    setCreateMode(null)
    setSelectedDate('')
  }

  return (
    <div className="relative flex items-center" ref={anchorRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        data-header-popover-trigger="calendar"
        onClick={handleOpen}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Takvim"
        title="Takvim"
      >
        <span className="icon-wrap">
          <CalendarDays className="h-4 w-4 shrink-0" />
        </span>
        {upcomingCount > 0 && (
          <span className="header-calendar-badge">
            {upcomingCount > 99 ? '99+' : upcomingCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle ?? { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', zIndex: 10000 }}
          className="app-header-dropdown header-popover-panel header-calendar-dropdown overflow-hidden"
          data-header-popover="calendar"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="header-popover-head">
            <p className="text-sm font-extrabold text-[var(--ink)]">Takvim</p>
          </div>

          <div className="header-calendar-body">
            <div className="header-calendar-pane header-calendar-pane--month">
              <GlassMonthCalendar
                viewDate={viewDate}
                onViewDateChange={setViewDate}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                dayCounts={dayCounts}
              />
            </div>
            <div className="header-calendar-pane header-calendar-pane--create">
              <HeaderCalendarCreatePanel
                selectedDate={selectedDate}
                createMode={createMode}
                onCreateModeChange={setCreateMode}
                onClose={handleClosePanel}
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
