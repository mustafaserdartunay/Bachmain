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

export function SummaryMetricCard({ title, value, icon: Icon, tone = 'blue', valueTone = 'white', subtitle }) {
  const iconToneClass = resolveToneClass(tone, TONE_CLASSES.blue)
  const valueToneClass = resolveToneClass(valueTone, TONE_CLASSES.white)

  return (
    <div className="app-page-metric p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className={APP_LABEL_CLASS}>{title}</span>
        {Icon && (
          <span className={`rounded-xl bg-white/45 p-2 ring-1 ring-white/50 ${iconToneClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`${APP_VALUE_CLASS} text-xl ${valueToneClass}`}>{value}</p>
      {subtitle && <p className={`mt-1 ${APP_LABEL_CLASS}`}>{subtitle}</p>}
    </div>
  )
}

export default function SummaryMetrics({ items, columns = 5 }) {
  return (
    <div className={`grid gap-4 ${columns === 5 ? 'grid-cols-5' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {items.map((item) => (
        <SummaryMetricCard key={item.title} {...item} />
      ))}
    </div>
  )
}
