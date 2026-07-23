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

export function SummaryMetricCard({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  valueTone = 'white',
  subtitle,
}) {
  const valueToneClass = resolveToneClass(valueTone, resolveToneClass(tone, TONE_CLASSES.white))

  return (
    <div className="app-page-metric flex h-[4.75rem] min-h-[4.75rem] flex-col justify-between rounded-[18px] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className={APP_LABEL_CLASS}>{title}</span>
        {Icon ? (
          <span className="shrink-0 text-gray-300">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className={`${APP_VALUE_CLASS} text-xl font-extrabold tracking-wide ${valueToneClass}`}>
        {value}
      </p>
      {subtitle ? <p className={`mt-0.5 ${APP_LABEL_CLASS}`}>{subtitle}</p> : null}
    </div>
  )
}

export default function SummaryMetrics({ items, columns = 5 }) {
  const columnsClass =
    columns === 8
      ? 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-8'
      : columns === 5
        ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
        : columns === 4
          ? 'grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-3'

  return (
    <div className={`grid gap-4 ${columnsClass}`}>
      {items.map((item) => (
        <SummaryMetricCard key={item.title} {...item} />
      ))}
    </div>
  )
}
