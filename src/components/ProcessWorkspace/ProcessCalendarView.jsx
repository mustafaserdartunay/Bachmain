import { useMemo, useState } from 'react'

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function toIsoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MODES = [
  { id: 'day', label: 'Gün' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Ay' },
  { id: 'year', label: 'Yıl' },
]

export default function ProcessCalendarView({ items = [], onOpenItem, onDateChange }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [mode, setMode] = useState('month')
  const [dragId, setDragId] = useState(null)

  const byDate = useMemo(() => {
    const map = {}
    for (const item of items) {
      const key = (item.dueDate || item.startDate || '').slice(0, 10)
      if (!key) continue
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [items])

  const monthStart = startOfMonth(cursor)
  const totalDays = daysInMonth(cursor)
  const startPad = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1
  const cells = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day))
  }

  function dropOn(date, e) {
    e.preventDefault()
    const id = dragId || e.dataTransfer.getData('text/plain')
    if (!id || !date) return
    onDateChange?.(id, toIsoDate(date))
    setDragId(null)
  }

  return (
    <div className="process-calendar">
      <div className="process-calendar__toolbar">
        <div className="process-calendar__modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`process-btn${mode === m.id ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="process-calendar__nav">
          <button
            type="button"
            className="process-btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - (mode === 'year' ? 12 : 1), 1))
            }
          >
            ‹
          </button>
          <strong>
            {cursor.toLocaleDateString('tr-TR', {
              month: mode === 'year' ? undefined : 'long',
              year: 'numeric',
            })}
          </strong>
          <button
            type="button"
            className="process-btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + (mode === 'year' ? 12 : 1), 1))
            }
          >
            ›
          </button>
        </div>
      </div>

      {mode === 'month' || mode === 'week' || mode === 'day' ? (
        <div className="process-calendar__grid">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
            <div key={d} className="process-calendar__dow">
              {d}
            </div>
          ))}
          {cells.map((date, idx) => {
            if (!date) return <div key={`pad-${idx}`} className="process-calendar__cell is-empty" />
            const iso = toIsoDate(date)
            const dayItems = byDate[iso] || []
            return (
              <div
                key={iso}
                className="process-calendar__cell"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => dropOn(date, e)}
              >
                <span className="process-calendar__daynum">{date.getDate()}</span>
                <div className="process-calendar__events">
                  {dayItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="process-calendar__event"
                      draggable
                      onDragStart={(e) => {
                        setDragId(item.id)
                        e.dataTransfer.setData('text/plain', item.id)
                      }}
                      onClick={() => onOpenItem?.(item)}
                    >
                      {item.title}
                    </button>
                  ))}
                  {dayItems.length > 4 ? (
                    <span className="process-calendar__more">+{dayItems.length - 4}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="process-calendar__year">
          {Array.from({ length: 12 }, (_, i) => {
            const label = new Date(cursor.getFullYear(), i, 1).toLocaleDateString('tr-TR', {
              month: 'short',
            })
            const count = items.filter((it) => {
              const d = (it.dueDate || it.startDate || '').slice(0, 7)
              return d === `${cursor.getFullYear()}-${String(i + 1).padStart(2, '0')}`
            }).length
            return (
              <button
                key={i}
                type="button"
                className="process-calendar__year-cell"
                onClick={() => {
                  setCursor(new Date(cursor.getFullYear(), i, 1))
                  setMode('month')
                }}
              >
                <strong>{label}</strong>
                <span>{count} kayıt</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
