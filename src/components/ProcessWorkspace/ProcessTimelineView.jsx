export default function ProcessTimelineView({ items = [], onOpenItem }) {
  const sorted = [...items].sort((a, b) => {
    const da = a.dueDate || a.startDate || a.createdAt || ''
    const db = b.dueDate || b.startDate || b.createdAt || ''
    return String(db).localeCompare(String(da))
  })

  return (
    <div className="process-timeline">
      {sorted.map((item) => {
        const when = item.dueDate || item.startDate || item.createdAt || '—'
        return (
          <button
            key={item.id}
            type="button"
            className="process-timeline__row"
            onClick={() => onOpenItem?.(item)}
          >
            <div className="process-timeline__dot" aria-hidden />
            <div className="process-timeline__body">
              <div className="process-timeline__when">{when}</div>
              <div className="process-timeline__who">{item.assignee || 'Sistem'}</div>
              <div className="process-timeline__what">
                <strong>{item.title}</strong>
                {item.status ? <span> · {item.status}</span> : null}
              </div>
              {(item.company || item.customer) && (
                <div className="process-timeline__ctx">
                  {[item.company, item.customer].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </button>
        )
      })}
      {!sorted.length ? <p className="process-empty">Zaman çizelgesi boş</p> : null}
    </div>
  )
}
