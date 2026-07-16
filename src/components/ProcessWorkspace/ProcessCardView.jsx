export default function ProcessCardView({ items = [], onOpenItem }) {
  return (
    <div className="process-card-grid">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="process-card-tile"
          onClick={() => onOpenItem?.(item)}
        >
          <div className="process-card-tile__badge">{item.kind || item.status || 'Kayıt'}</div>
          <h3>{item.title}</h3>
          {(item.company || item.customer) && (
            <p className="process-card-tile__sub">{[item.company, item.customer].filter(Boolean).join(' · ')}</p>
          )}
          <div className="process-card-tile__meta">
            {item.assignee ? <span>{item.assignee}</span> : null}
            {item.dueDate ? <span>{item.dueDate}</span> : null}
            {item.priority ? <span>{item.priority}</span> : null}
          </div>
          {typeof item.progress === 'number' ? (
            <div className="process-kanban-card__progress">
              <div style={{ width: `${item.progress}%` }} />
            </div>
          ) : null}
        </button>
      ))}
      {!items.length ? <p className="process-empty">Kart yok</p> : null}
    </div>
  )
}
