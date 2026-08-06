import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { loadAppointments, loadTasks, upsertAppointment, upsertTask } from '../../utils/crmStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import {
  consumeCalendarCreateIntent,
  HEADER_CALENDAR_INTENT_EVENT,
  publishCalendarCreateMode,
} from '../../utils/headerAgendaIntent'
import { getHeaderAgendaAnchor } from '../../utils/headerAgendaAnchor'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function selectionHint(selectedDateFrom, selectedDateTo) {
  if (!selectedDateFrom) return 'Başlangıç tarihini seçin'
  if (!selectedDateTo) return 'Bitiş tarihini seçin · aynı güne tıklayınca tek gün olur'
  if (selectedDateTo === selectedDateFrom) return 'Tek gün seçildi · yeni aralık için tekrar tıklayın'
  return 'Aralık seçildi · yeni aralık için tekrar tıklayın'
}

function GlassMonthCalendar({
  viewDate,
  onViewDateChange,
  selectedDateFrom = '',
  selectedDateTo = '',
  onSelectDate,
  onClearSelection,
  includeTime = false,
  timeFrom = '',
  timeTo = '',
  onIncludeTimeChange,
  onTimeFromChange,
  onTimeToChange,
  dayCounts,
}) {
  const monthCells = useMemo(() => buildCalendarMonthGrid(viewDate), [viewDate])
  const today = new Date()
  const rangeStart = selectedDateFrom || ''
  const rangeEnd = selectedDateTo || selectedDateFrom || ''
  const pickingEnd = Boolean(selectedDateFrom && !selectedDateTo)

  return (
    <div className="header-calendar-month">
      <div className="mb-2 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() =>
            onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
          }
          className="header-calendar-nav-btn"
          aria-label="Önceki ay"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <p className="text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
          {CALENDAR_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() =>
            onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
          }
          className="header-calendar-nav-btn"
          aria-label="Sonraki ay"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mb-1.5 text-[12px] font-normal leading-tight text-[var(--muted)]">
        {selectionHint(selectedDateFrom, selectedDateTo)}
      </p>

      {selectedDateFrom ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="header-calendar-range-chip is-start">
            <span className="header-calendar-range-chip-label">Başlangıç</span>
            <span className="header-calendar-range-chip-value">
              {formatCalendarDayLabel(selectedDateFrom)}
              {includeTime && timeFrom ? ` · ${timeFrom}` : ''}
            </span>
          </span>
          <span className={`header-calendar-range-chip ${selectedDateTo ? 'is-end' : 'is-pending'}`}>
            <span className="header-calendar-range-chip-label">Bitiş</span>
            <span className="header-calendar-range-chip-value">
              {selectedDateTo
                ? `${formatCalendarDayLabel(selectedDateTo)}${includeTime && timeTo ? ` · ${timeTo}` : ''}`
                : 'Seçin…'}
            </span>
          </span>
          {onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="header-calendar-range-clear"
            >
              Temizle
            </button>
          ) : null}
        </div>
      ) : null}

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
          const isStart = rangeStart === iso
          const isEnd = Boolean(selectedDateTo) && rangeEnd === iso
          const isSelected = isStart || isEnd
          const inRange =
            rangeStart &&
            selectedDateTo &&
            rangeStart !== rangeEnd &&
            iso >= rangeStart &&
            iso <= rangeEnd
          const isToday = sameCalendarDay(day, today)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`header-calendar-day ${isSelected ? 'is-selected' : ''} ${inRange ? 'is-in-range' : ''} ${isToday ? 'is-today' : ''} ${pickingEnd && !isSelected ? 'is-picking-end' : ''}`}
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

      <div className="header-calendar-time-block">
        <label className="header-calendar-time-toggle">
          <input
            type="checkbox"
            checked={includeTime}
            onChange={(event) => onIncludeTimeChange?.(event.target.checked)}
          />
          <span>Saat aralığı ekle</span>
        </label>

        {includeTime ? (
          <div className="header-calendar-time-fields">
            <label className="header-calendar-time-field">
              <span>Başlangıç</span>
              <input
                type="time"
                value={timeFrom}
                onChange={(event) => onTimeFromChange?.(event.target.value)}
                className="form-input header-calendar-time-input"
              />
            </label>
            <label className="header-calendar-time-field">
              <span>Bitiş</span>
              <input
                type="time"
                value={timeTo}
                onChange={(event) => onTimeToChange?.(event.target.value)}
                className="form-input header-calendar-time-input"
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function HeaderCalendarCreatePanel({
  selectedDateFrom,
  selectedDateTo,
  includeTime = false,
  timeFrom = '',
  timeTo = '',
  createMode,
  onCreateModeChange,
  onClose,
}) {
  const [taskForm, setTaskForm] = useState(null)
  const [appointmentForm, setAppointmentForm] = useState(null)

  useEffect(() => {
    if (!selectedDateFrom) {
      setTaskForm(null)
      setAppointmentForm(null)
      return
    }
    const dateTo = selectedDateTo || selectedDateFrom
    const nextTimeFrom = includeTime ? timeFrom || '09:00' : ''
    const nextTimeTo = includeTime ? timeTo || timeFrom || '10:00' : ''
    setTaskForm({
      ...emptyTaskForm(),
      dueDate: selectedDateFrom,
      dateFrom: selectedDateFrom,
      dateTo,
      includeTime,
      timeFrom: nextTimeFrom,
      timeTo: nextTimeTo,
    })
    setAppointmentForm({
      ...emptyAppointmentForm(),
      date: selectedDateFrom,
      dateFrom: selectedDateFrom,
      dateTo,
      includeTime: true,
      timeFrom: includeTime ? timeFrom || '10:00' : '10:00',
      timeTo: includeTime ? timeTo || timeFrom || '11:00' : '11:00',
      startTime: includeTime ? timeFrom || '10:00' : '10:00',
      endTime: includeTime ? timeTo || timeFrom || '11:00' : '11:00',
    })
  }, [selectedDateFrom, selectedDateTo, includeTime, timeFrom, timeTo])

  if (!selectedDateFrom) {
    return (
      <div className="header-calendar-create-empty">
        <p className="text-[14px] font-normal leading-tight text-[var(--muted)]">
          Başlangıç tarihini seçin
        </p>
      </div>
    )
  }

  function handleTaskSubmit(form) {
    upsertTask({
      ...form,
      dateFrom: form.dateFrom || selectedDateFrom,
      dateTo: form.dateTo || selectedDateTo || selectedDateFrom,
      dueDate: form.dateFrom || form.dueDate || selectedDateFrom,
      includeTime: Boolean(form.includeTime),
      timeFrom: form.includeTime ? form.timeFrom || '' : '',
      timeTo: form.includeTime ? form.timeTo || '' : '',
    })
    onClose()
  }

  function handleAppointmentSubmit(form) {
    const dateFrom = form.dateFrom || form.date || selectedDateFrom
    upsertAppointment({
      ...form,
      date: dateFrom,
      dateFrom,
      dateTo: form.dateTo || selectedDateTo || '',
      startTime: form.includeTime ? form.timeFrom || form.startTime || '' : '',
      endTime: form.includeTime ? form.timeTo || form.endTime || '' : '',
    })
    onClose()
  }

  if (createMode === 'task' && taskForm) {
    return (
      <div className="header-calendar-form-shell">
        <TaskFormModal
          key={`task-${selectedDateFrom}-${selectedDateTo}-${includeTime}-${timeFrom}-${timeTo}`}
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
          key={`apt-${selectedDateFrom}-${selectedDateTo}-${includeTime}-${timeFrom}-${timeTo}`}
          initial={appointmentForm}
          onClose={() => onCreateModeChange(null)}
          onSubmit={handleAppointmentSubmit}
          fullPage
          compact
        />
      </div>
    )
  }

  const rangeLabel =
    selectedDateTo && selectedDateTo !== selectedDateFrom
      ? `${formatCalendarDayLabel(selectedDateFrom)}${includeTime && timeFrom ? ` ${timeFrom}` : ''} – ${formatCalendarDayLabel(selectedDateTo)}${includeTime && timeTo ? ` ${timeTo}` : ''}`
      : `${formatCalendarDayLabel(selectedDateFrom)}${includeTime && timeFrom ? ` ${timeFrom}` : ''}`

  return (
    <div className="header-calendar-create-panel">
      <p className="text-[14px] font-bold capitalize leading-tight tracking-normal text-[var(--muted)]">
        {rangeLabel}
      </p>
      {!selectedDateTo || selectedDateTo === selectedDateFrom ? (
        <p className="mt-1 text-[12px] font-normal text-[var(--muted)]">
          İsterseniz bitiş tarihi için ikinci bir gün seçin
        </p>
      ) : null}

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

export default function HeaderCalendar({ hideTrigger = false }) {
  const { open, setOpen, toggle } = useHeaderPopover('calendar')
  const [selectedDateFrom, setSelectedDateFrom] = useState('')
  const [selectedDateTo, setSelectedDateTo] = useState('')
  const [includeTime, setIncludeTime] = useState(false)
  const [timeFrom, setTimeFrom] = useState('09:00')
  const [timeTo, setTimeTo] = useState('10:00')
  const [createMode, setCreateMode] = useState(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [tasks, setTasks] = useState(() => loadTasks())
  const [appointments, setAppointments] = useState(() => loadAppointments())
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
    updatePosition,
  } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
    getAnchor: hideTrigger ? getHeaderAgendaAnchor : null,
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
      setSelectedDateFrom('')
      setSelectedDateTo('')
      setIncludeTime(false)
      setTimeFrom('09:00')
      setTimeTo('10:00')
      publishCalendarCreateMode(null)
      return
    }

    const intent = consumeCalendarCreateIntent()
    if (intent === 'task' || intent === 'appointment') {
      const iso = todayIso()
      setSelectedDateFrom(iso)
      setSelectedDateTo(iso)
      setCreateMode(intent)
      setViewDate(parseCalendarIso(iso) || new Date())
      publishCalendarCreateMode(intent)
      return
    }

    setViewDate(parseCalendarIso(selectedDateFrom) || new Date())
  }, [open])

  useEffect(() => {
    function applyIntent(event) {
      const intent = event?.detail
      if (intent !== 'task' && intent !== 'appointment') return
      consumeCalendarCreateIntent()
      const iso = todayIso()
      setSelectedDateFrom(iso)
      setSelectedDateTo(iso)
      setCreateMode(intent)
      setViewDate(parseCalendarIso(iso) || new Date())
      publishCalendarCreateMode(intent)
    }

    window.addEventListener(HEADER_CALENDAR_INTENT_EVENT, applyIntent)
    return () => window.removeEventListener(HEADER_CALENDAR_INTENT_EVENT, applyIntent)
  }, [])

  useEffect(() => {
    if (open) publishCalendarCreateMode(createMode)
  }, [open, createMode])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => updatePosition?.())
    }
  }, [open, selectedDateFrom, selectedDateTo, createMode, updatePosition])

  const dayCounts = useMemo(
    () => collectCalendarDayCounts(tasks, appointments),
    [tasks, appointments],
  )

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const openTasks = tasks
      .filter((task) => !isTaskCompleted(task))
      .filter((task) => (task.dateFrom || task.dueDate || '') >= today).length
    const openAppointments = appointments
      .filter((apt) => apt.status !== 'İptal' && apt.status !== 'Tamamlandı')
      .filter((apt) => (apt.dateFrom || apt.date || '') >= today).length
    return openTasks + openAppointments
  }, [tasks, appointments])

  function handleOpen() {
    toggle()
  }

  function handleSelectDate(iso) {
    setCreateMode(null)
    setViewDate(parseCalendarIso(iso) || new Date())

    if (!selectedDateFrom || (selectedDateFrom && selectedDateTo)) {
      setSelectedDateFrom(iso)
      setSelectedDateTo('')
      return
    }

    if (iso < selectedDateFrom) {
      setSelectedDateTo(selectedDateFrom)
      setSelectedDateFrom(iso)
      return
    }

    setSelectedDateTo(iso)
  }

  function handleClearSelection() {
    setCreateMode(null)
    setSelectedDateFrom('')
    setSelectedDateTo('')
    publishCalendarCreateMode(null)
  }

  function handleIncludeTimeChange(checked) {
    setIncludeTime(checked)
    if (!checked) return
    setTimeFrom((current) => current || '09:00')
    setTimeTo((current) => current || '10:00')
  }

  function handleCreateModeChange(mode) {
    setCreateMode(mode)
    publishCalendarCreateMode(mode)
  }

  function handleClosePanel() {
    setOpen(false)
    setCreateMode(null)
    setSelectedDateFrom('')
    setSelectedDateTo('')
    setIncludeTime(false)
    setTimeFrom('09:00')
    setTimeTo('10:00')
    publishCalendarCreateMode(null)
  }

  return (
    <div
      className={
        hideTrigger
          ? 'pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden opacity-0'
          : 'relative flex items-center'
      }
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      {!hideTrigger ? (
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
      ) : null}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={
              menuStyle ?? {
                position: 'fixed',
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: 10000,
              }
            }
            className="app-header-dropdown header-popover-panel header-calendar-dropdown overflow-hidden"
            data-header-popover="calendar"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="header-popover-head">
              <p className="text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                {createMode === 'task'
                  ? 'Görev Oluştur'
                  : createMode === 'appointment'
                    ? 'Randevu Oluştur'
                    : 'Takvim'}
              </p>
            </div>

            <div className="header-calendar-body">
              <div className="header-calendar-pane header-calendar-pane--month">
                <GlassMonthCalendar
                  viewDate={viewDate}
                  onViewDateChange={setViewDate}
                  selectedDateFrom={selectedDateFrom}
                  selectedDateTo={selectedDateTo}
                  onSelectDate={handleSelectDate}
                  onClearSelection={handleClearSelection}
                  includeTime={includeTime}
                  timeFrom={timeFrom}
                  timeTo={timeTo}
                  onIncludeTimeChange={handleIncludeTimeChange}
                  onTimeFromChange={setTimeFrom}
                  onTimeToChange={setTimeTo}
                  dayCounts={dayCounts}
                />
              </div>
              <div className="header-calendar-pane header-calendar-pane--create">
                <HeaderCalendarCreatePanel
                  selectedDateFrom={selectedDateFrom}
                  selectedDateTo={selectedDateTo}
                  includeTime={includeTime}
                  timeFrom={timeFrom}
                  timeTo={timeTo}
                  createMode={createMode}
                  onCreateModeChange={handleCreateModeChange}
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
