import { cn } from '@/lib/utils'
import type { TimelineEvent } from '@/types'
import { formatDateTime } from '@/lib/utils'

const typeColors = {
  info: 'bg-bach-blue',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <ul className={cn('space-y-0', className)}>
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
          )}
          <span
            className={cn(
              'relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface-elevated',
              typeColors[event.type],
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-text">{event.title}</p>
              <span className="text-xs text-text-subtle">{formatDateTime(event.date)}</span>
            </div>
            {event.description && (
              <p className="mt-0.5 text-sm text-text-muted">{event.description}</p>
            )}
            {event.user && (
              <p className="mt-1 text-xs text-text-subtle">{event.user}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
