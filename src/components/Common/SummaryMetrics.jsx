import { APP_LABEL_CLASS, APP_VALUE_CLASS } from '../../utils/dashboardDesign'

const TONE_CLASSES = {
  white: 'text-[var(--ink)]',
  blue: 'text-blue-600',
  cyan: 'text-cyan-600',
  emerald: 'text-emerald-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
  purple: 'text-violet-600',
}

function resolveToneClass(tone, fallback = 'text-[var(--ink)]') {
  if (!tone) return fallback
  if (typeof tone === 'string' && tone.startsWith('text-')) return tone
  return TONE_CLASSES[tone] || fallback
}

export function SummaryMetricCard({ title, value, icon: Icon, valueTone = 'white', subtitle }) {
  const valueToneClass = resolveToneClass(valueTone, TONE_CLASSES.white)

  return (
    <div className="app-page-metric flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] items-center justify-center rounded-[18px] px-4 py-2">
      <div className="flex min-w-0 flex-col items-center gap-1 text-center">
        <div className="flex min-w-0 items-center justify-center gap-2 text-[var(--muted)]">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className={APP_LABEL_CLASS}>{title}</span>
        </div>
        <p className={`${APP_VALUE_CLASS} max-w-full truncate text-xl ${valueToneClass}`}>
          {value}
        </p>
        {subtitle && <p className={APP_LABEL_CLASS}>{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SummaryMetrics({ items, columns = 5, className = '' }) {
  const columnsClass =
    columns === 8
      ? 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-8'
      : columns === 5
        ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
        : columns === 4
          ? 'grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-3'

  return (
    <div className={`grid gap-4 ${columnsClass} ${className}`.trim()}>
      {items.map((item) => (
        <SummaryMetricCard key={item.title} {...item} />
      ))}
    </div>
  )
}
