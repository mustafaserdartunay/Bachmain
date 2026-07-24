import { APP_VALUE_CLASS } from '../../utils/dashboardDesign'

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
  valueAlign = 'center',
  subtitle,
}) {
  const valueToneClass = resolveToneClass(valueTone, resolveToneClass(tone, TONE_CLASSES.white))
  const valueAlignClass =
    valueAlign === 'right'
      ? 'w-full text-right'
      : valueAlign === 'left'
        ? 'w-full text-left'
        : 'w-full text-center'

  return (
    <div className="app-page-metric flex h-[4.75rem] min-h-[4.75rem] flex-col justify-center gap-1 rounded-[18px] px-4 py-3">
      <div className="flex w-full items-center justify-center gap-1.5">
        {Icon ? (
          <span className="shrink-0 text-gray-300">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <span className="text-xs font-extrabold tracking-wide text-gray-300">{title}</span>
      </div>
      <p
        className={`${APP_VALUE_CLASS} text-xl font-extrabold tracking-wide ${valueAlignClass} ${valueToneClass}`}
      >
        {value}
      </p>
      {subtitle ? (
        <p
          className={`mt-0.5 w-full text-right text-xs font-extrabold tracking-wide text-gray-300`}
        >
          {subtitle}
        </p>
      ) : null}
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
