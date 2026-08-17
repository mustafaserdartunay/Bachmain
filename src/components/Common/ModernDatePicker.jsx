import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildCalendarMonthGrid,
  CALENDAR_MONTHS,
  CALENDAR_WEEKDAYS,
  parseCalendarIso,
  sameCalendarDay,
  toCalendarIso,
} from '../../utils/calendarUtils'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

function formatPickerLabel(iso) {
  const date = parseCalendarIso(iso)
  if (!date) return 'Tarih seçin'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year} - ${CALENDAR_MONTHS[date.getMonth()]}`
}

function SingleMonthCalendar({ viewDate, onViewDateChange, value, onSelectDate }) {
  const monthCells = useMemo(() => buildCalendarMonthGrid(viewDate), [viewDate])
  const today = new Date()

  return (
    <div className="header-calendar-month document-date-picker-calendar">
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
          const isSelected = value === iso
          const isToday = sameCalendarDay(day, today)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className={`header-calendar-day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
            >
              <span>{day.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ModernDatePicker({
  value,
  onChange,
  className = '',
  placeholder = 'Tarih seçin',
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseCalendarIso(value) || new Date())
  const wrapperRef = useRef(null)
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'start',
    matchWidth: true,
    offset: 6,
  })

  useEffect(() => {
    if (open) {
      setViewDate(parseCalendarIso(value) || new Date())
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (wrapperRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, menuRef])

  function handleSelect(iso) {
    onChange?.(iso)
    setOpen(false)
  }

  const label = value ? formatPickerLabel(value) : placeholder

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="form-input flex w-full cursor-pointer items-center justify-between gap-2 text-left !pr-2.5"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={`truncate text-[14px] font-normal ${value ? 'text-[var(--muted)]' : 'text-[var(--muted)]/70'}`}>
          {label}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#2563eb]" strokeWidth={2.25} />
      </button>

      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="app-header-dropdown header-popover-panel document-date-picker-panel overflow-hidden p-2.5"
            onClick={(event) => event.stopPropagation()}
          >
            <SingleMonthCalendar
              viewDate={viewDate}
              onViewDateChange={setViewDate}
              value={value}
              onSelectDate={handleSelect}
            />
          </div>,
          document.body,
        )}
    </div>
  )
}
