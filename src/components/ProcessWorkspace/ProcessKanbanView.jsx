import { useMemo, useState } from 'react'
import { Paperclip, MessageSquare } from 'lucide-react'

function KanbanCard({ item, onOpen, onDragStart }) {
  return (
    <article
      className="process-kanban-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(item)
      }}
      onClick={() => onOpen?.(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.(item)
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="process-kanban-card__top">
        {item.priority ? (
          <span className={`process-kanban-card__prio process-kanban-card__prio--${String(item.priority).toLowerCase()}`}>
            {item.priority}
          </span>
        ) : null}
        {item.status ? <span className="process-kanban-card__status">{item.status}</span> : null}
      </div>
      <h4 className="process-kanban-card__title">{item.title}</h4>
      {item.company || item.customer ? (
        <p className="process-kanban-card__meta">
          {[item.company, item.customer].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      {item.assignee ? <p className="process-kanban-card__assignee">{item.assignee}</p> : null}
      {(item.tags || []).length ? (
        <div className="process-kanban-card__tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
      <div className="process-kanban-card__foot">
        {item.dueDate ? <span>{item.dueDate}</span> : <span />}
        <span className="process-kanban-card__counts">
          {typeof item.fileCount === 'number' ? (
            <span title="Dosya">
              <Paperclip size={12} /> {item.fileCount}
            </span>
          ) : null}
          {typeof item.commentCount === 'number' ? (
            <span title="Yorum">
              <MessageSquare size={12} /> {item.commentCount}
            </span>
          ) : null}
        </span>
      </div>
      {typeof item.progress === 'number' ? (
        <div className="process-kanban-card__progress" aria-label={`İlerleme %${item.progress}`}>
          <div style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
        </div>
      ) : null}
    </article>
  )
}

export default function ProcessKanbanView({
  items = [],
  stages = [],
  onStageChange,
  onOpenItem,
}) {
  const [dragOverStage, setDragOverStage] = useState(null)

  const byStage = useMemo(() => {
    const map = Object.fromEntries(stages.map((s) => [s.id, []]))
    const fallback = stages[0]?.id
    for (const item of items) {
      const key = item.stageId && map[item.stageId] ? item.stageId : fallback
      if (key && map[key]) map[key].push(item)
    }
    return map
  }, [items, stages])

  function handleDrop(stageId, e) {
    e.preventDefault()
    setDragOverStage(null)
    const id = e.dataTransfer.getData('text/plain')
    if (!id || !stageId) return
    onStageChange?.(id, stageId)
  }

  return (
    <div className="process-kanban">
      {stages.map((stage) => (
        <section
          key={stage.id}
          className={`process-kanban__col${dragOverStage === stage.id ? ' is-drop' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOverStage(stage.id)
          }}
          onDragLeave={() => setDragOverStage((cur) => (cur === stage.id ? null : cur))}
          onDrop={(e) => handleDrop(stage.id, e)}
        >
          <header className="process-kanban__col-head">
            <h3>{stage.label}</h3>
            <span>{(byStage[stage.id] || []).length}</span>
          </header>
          <div className="process-kanban__col-body">
            {(byStage[stage.id] || []).map((item) => (
              <KanbanCard key={item.id} item={item} onOpen={onOpenItem} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
