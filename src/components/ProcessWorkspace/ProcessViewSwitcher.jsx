import {
  LayoutList,
  Columns3,
  CalendarDays,
  ChartGantt,
  Clock3,
  LayoutGrid,
} from 'lucide-react'

const ICONS = {
  list: LayoutList,
  kanban: Columns3,
  calendar: CalendarDays,
  gantt: ChartGantt,
  timeline: Clock3,
  card: LayoutGrid,
}

const VIEWS = [
  { id: 'list', label: 'Liste', icon: 'list' },
  { id: 'kanban', label: 'Kanban', icon: 'kanban' },
  { id: 'calendar', label: 'Takvim', icon: 'calendar' },
  { id: 'gantt', label: 'Gantt', icon: 'gantt' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'card', label: 'Kart', icon: 'card' },
]

export default function ProcessViewSwitcher({ value, onChange, views = VIEWS, className = '' }) {
  return (
    <div
      className={`process-view-switcher ${className}`.trim()}
      role="tablist"
      aria-label="Görünüm seçici"
    >
      {views.map((view) => {
        const Icon = ICONS[view.icon] || LayoutList
        const active = value === view.id
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`process-view-switcher__btn${active ? ' is-active' : ''}`}
            onClick={() => onChange?.(view.id)}
            title={view.label}
          >
            <Icon size={16} strokeWidth={2.25} aria-hidden />
            <span>{view.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { VIEWS as PROCESS_VIEW_OPTIONS }
