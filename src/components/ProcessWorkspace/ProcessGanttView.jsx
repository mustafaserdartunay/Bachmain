import { useMemo } from 'react'

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function ProcessGanttView({ items = [], onOpenItem }) {
  const { min, max, rows } = useMemo(() => {
    const dated = items
      .map((item) => {
        const start = parseDate(item.startDate || item.dueDate || item.createdAt)
        const end = parseDate(item.endDate || item.dueDate || item.startDate)
        return { item, start, end: end || start }
      })
      .filter((r) => r.start)
    if (!dated.length) return { min: null, max: null, rows: [] }
    let lo = dated[0].start.getTime()
    let hi = dated[0].end.getTime()
    for (const r of dated) {
      lo = Math.min(lo, r.start.getTime())
      hi = Math.max(hi, r.end.getTime())
    }
    if (hi <= lo) hi = lo + 86400000 * 7
    return { min: lo, max: hi, rows: dated }
  }, [items])

  const span = max && min ? max - min : 1

  return (
    <div className="process-gantt">
      <div className="process-gantt__head">
        <span>Başlangıç / Bitiş / İlerleme</span>
      </div>
      {rows.map(({ item, start, end }) => {
        const left = ((start.getTime() - min) / span) * 100
        const width = Math.max(2, ((end.getTime() - start.getTime()) / span) * 100)
        return (
          <button
            key={item.id}
            type="button"
            className="process-gantt__row"
            onClick={() => onOpenItem?.(item)}
          >
            <div className="process-gantt__label">
              <strong>{item.title}</strong>
              <span>{item.assignee || '—'}</span>
            </div>
            <div className="process-gantt__track">
              <div
                className="process-gantt__bar"
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${item.startDate || ''} → ${item.endDate || item.dueDate || ''}`}
              >
                {typeof item.progress === 'number' ? (
                  <i style={{ width: `${item.progress}%` }} />
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
      {!rows.length ? <p className="process-empty">Gantt için tarihli kayıt yok</p> : null}
    </div>
  )
}
