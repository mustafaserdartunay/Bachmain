import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function parseIso(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIso(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sameDay(left, right) {
  return left && right && toIso(left) === toIso(right)
}

function isBetween(date, start, end) {
  if (!date || !start || !end) return false
  const value = date.getTime()
  return value >= start.getTime() && value <= end.getTime()
}

function formatShortDate(iso) {
  const date = parseIso(iso)
  if (!date) return ''
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatNumericDate(iso) {
  const date = parseIso(iso)
  if (!date) return ''
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildDisplayLabel({ dateFrom, dateTo, timeFrom, timeTo, includeTime, dateLabelFormat, showTimeInLabel }) {
  if (!dateFrom && !dateTo) return 'Tarih aralığı seçin'
  const formatLabel = dateLabelFormat === 'numeric' ? formatNumericDate : formatShortDate
  const fromLabel = formatLabel(dateFrom) || '...'
  if (dateFrom && !dateTo) {
    return showTimeInLabel && includeTime && timeFrom ? `${fromLabel} ${timeFrom}` : fromLabel
  }
  const toLabel = formatLabel(dateTo) || '...'
  if (showTimeInLabel && includeTime && (timeFrom || timeTo)) {
    return `${fromLabel}${timeFrom ? ` ${timeFrom}` : ''} – ${toLabel}${timeTo ? ` ${timeTo}` : ''}`
  }
  return `${fromLabel} – ${toLabel}`
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  return cells
}

export default function DateRangePicker({
  dateFrom = '',
  dateTo = '',
  timeFrom = '',
  timeTo = '',
  includeTime = false,
  onChange,
  className = '',
  dateLabelFormat = 'short',
  showTimeInLabel = true,
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => parseIso(dateFrom) || new Date())
  const [localIncludeTime, setLocalIncludeTime] = useState(includeTime)
  const [localTimeFrom, setLocalTimeFrom] = useState(timeFrom)
  const [localTimeTo, setLocalTimeTo] = useState(timeTo)

  const displayLabel = buildDisplayLabel({
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    includeTime,
    dateLabelFormat,
    showTimeInLabel,
  })
  const monthCells = useMemo(() => buildMonthGrid(viewDate), [viewDate])
  const selectingEnd = Boolean(dateFrom && !dateTo)

  useEffect(() => {
    if (!open) return undefined
    setLocalIncludeTime(includeTime)
    setLocalTimeFrom(timeFrom)
    setLocalTimeTo(timeTo)
    setViewDate(parseIso(dateFrom) || parseIso(dateTo) || new Date())

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, dateFrom, dateTo, timeFrom, timeTo, includeTime])

  function emitChange(next) {
    onChange?.({
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      includeTime,
      ...next,
    })
  }

  function handleDaySelect(day) {
    const iso = toIso(day)

    if (dateFrom && dateTo) {
      emitChange({
        dateFrom: iso,
        dateTo: '',
        timeFrom: localTimeFrom,
        timeTo: localTimeTo,
        includeTime: localIncludeTime,
      })
      return
    }

    if (dateFrom && !dateTo) {
      const start = dateFrom <= iso ? dateFrom : iso
      const end = dateFrom <= iso ? iso : dateFrom
      emitChange({
        dateFrom: start,
        dateTo: end,
        timeFrom: localTimeFrom,
        timeTo: localTimeTo,
        includeTime: localIncludeTime,
      })
      return
    }

    emitChange({
      dateFrom: iso,
      dateTo: '',
      timeFrom: localTimeFrom,
      timeTo: localTimeTo,
      includeTime: localIncludeTime,
    })
  }

  function handleClear(event) {
    event.stopPropagation()
    emitChange({
      dateFrom: '',
      dateTo: '',
      timeFrom: '',
      timeTo: '',
      includeTime: false,
    })
    setLocalIncludeTime(false)
    setLocalTimeFrom('')
    setLocalTimeTo('')
  }

  const rangeStart = parseIso(dateFrom)
  const rangeEnd = parseIso(dateTo)

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-full min-w-0 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-left text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700/80"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500" />
        <span className={`min-w-0 flex-1 truncate ${dateFrom || dateTo ? 'text-gray-200' : 'text-gray-500'}`}>
          {displayLabel}
        </span>
        {(dateFrom || dateTo) && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleClear(event)
              }
            }}
            className="shrink-0 rounded p-0.5 text-gray-500 hover:bg-dark-600 hover:text-gray-300"
            aria-label="Tarih aralığını temizle"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,320px)] rounded-2xl border border-dark-500/50 bg-dark-900 p-3 shadow-2xl shadow-black/40">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs font-black text-white">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 hover:bg-dark-700 hover:text-white"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1 text-center text-[9px] font-black uppercase tracking-wide text-gray-500">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((day, index) => {
              if (!day) {
                return <span key={`empty-${index}`} />
              }

              const isStart = sameDay(day, rangeStart)
              const isEnd = sameDay(day, rangeEnd)
              const inRange = rangeStart && rangeEnd && isBetween(day, rangeStart, rangeEnd)
              const isToday = sameDay(day, new Date())

              return (
                <button
                  key={toIso(day)}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                    isStart || isEnd
                      ? 'bg-emerald-500 text-white'
                      : inRange
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : isToday
                          ? 'border border-dark-500/50 text-white'
                          : 'text-gray-300 hover:bg-dark-700'
                  }`}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-[10px] font-medium text-gray-500">
            {selectingEnd ? 'Bitiş tarihini seçin' : 'Başlangıç ve bitiş tarihini seçin'}
          </p>

          <div className="mt-3 border-t border-dark-500/40 pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-gray-400">
              <input
                type="checkbox"
                checked={localIncludeTime}
                onChange={(event) => {
                  const checked = event.target.checked
                  setLocalIncludeTime(checked)
                  emitChange({
                    dateFrom,
                    dateTo,
                    timeFrom: checked ? localTimeFrom : '',
                    timeTo: checked ? localTimeTo : '',
                    includeTime: checked,
                  })
                }}
                className="rounded border-dark-500/50 bg-dark-800"
              />
              Saat aralığı ekle
            </label>

            {localIncludeTime && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-gray-500">Başlangıç</p>
                  <input
                    type="time"
                    value={localTimeFrom}
                    onChange={(event) => {
                      const value = event.target.value
                      setLocalTimeFrom(value)
                      emitChange({
                        dateFrom,
                        dateTo,
                        timeFrom: value,
                        timeTo: localTimeTo,
                        includeTime: true,
                      })
                    }}
                    className="form-input"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-gray-500">Bitiş</p>
                  <input
                    type="time"
                    value={localTimeTo}
                    onChange={(event) => {
                      const value = event.target.value
                      setLocalTimeTo(value)
                      emitChange({
                        dateFrom,
                        dateTo,
                        timeFrom: localTimeFrom,
                        timeTo: value,
                        includeTime: true,
                      })
                    }}
                    className="form-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
