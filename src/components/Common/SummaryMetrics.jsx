const TONE_CLASSES = {
  white: 'text-white',
  blue: 'text-blue-300',
  cyan: 'text-cyan-300',
  emerald: 'text-emerald-300',
  red: 'text-red-300',
  orange: 'text-orange-300',
  purple: 'text-purple-300',
}

function resolveToneClass(tone, fallback = 'text-white') {
  if (!tone) return fallback
  if (typeof tone === 'string' && tone.startsWith('text-')) return tone
  return TONE_CLASSES[tone] || fallback
}

export function SummaryMetricCard({ title, value, icon: Icon, tone = 'blue', valueTone = 'white', subtitle }) {
  const iconToneClass = resolveToneClass(tone, TONE_CLASSES.blue)
  const valueToneClass = resolveToneClass(valueTone, TONE_CLASSES.white)

  return (
    <div className="min-h-[94px] rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{title}</span>
        {Icon && (
          <span className={`rounded-xl bg-dark-700 p-2 ${iconToneClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`text-xl font-bold ${valueToneClass}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
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
