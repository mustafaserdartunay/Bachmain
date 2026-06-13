import {
  getJobProductionFlowSegments,
  resolveJobProductionFlowBadge,
} from '../../utils/productionQuantityMetrics'

const toneClass = {
  continuing: 'border-blue-500/35 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
  closed: 'border-red-500/45 bg-red-500/15 text-red-300',
}

const ringStyle = {
  continuing: {
    stroke: '#60a5fa',
    track: 'rgba(59,130,246,0.12)',
    text: 'text-blue-300',
    chip: 'border-blue-500/25 bg-blue-500/10',
    glow: 'shadow-[0_0_14px_rgba(59,130,246,0.28)]',
  },
  completed: {
    stroke: '#34d399',
    track: 'rgba(16,185,129,0.12)',
    text: 'text-emerald-300',
    chip: 'border-emerald-500/25 bg-emerald-500/10',
    glow: 'shadow-[0_0_14px_rgba(16,185,129,0.28)]',
  },
  closed: {
    stroke: '#f87171',
    track: 'rgba(239,68,68,0.12)',
    text: 'text-red-300',
    chip: 'border-red-500/25 bg-red-500/10',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,0.28)]',
  },
}

function FlowPercentRing({ segment, size = 32 }) {
  const style = ringStyle[segment.tone] || ringStyle.continuing
  const radius = (size - 6) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, segment.percent))
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-full border px-1 py-0.5 ${style.chip} ${style.glow}`}
      title={`${segment.count} kalem · ${segment.label} (${segment.percent}%)`}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={style.track}
            strokeWidth="3"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={style.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-[9px] font-black tabular-nums leading-none ${style.text}`}
        >
          {segment.percent}
        </span>
      </div>
      <div className="min-w-0 pr-1.5 leading-none">
        <p className="truncate text-[8px] font-black uppercase tracking-wide text-gray-500">
          {segment.shortLabel}
        </p>
        <p className={`text-[10px] font-black tabular-nums ${style.text}`}>
          {segment.count} kalem
        </p>
      </div>
    </div>
  )
}

function AggregateFlowBadge({ lineItems, className = '' }) {
  const segments = getJobProductionFlowSegments(lineItems)

  return (
    <span className={`inline-flex w-full min-w-0 items-center justify-end gap-1.5 ${className}`}>
      {segments.map((segment) => (
        <FlowPercentRing key={segment.tone} segment={segment} />
      ))}
    </span>
  )
}

export default function ProductionJobFlowBadge({
  lineItems,
  jobStatus,
  className = '',
  large = false,
  variant = 'single',
}) {
  if (variant === 'aggregate') {
    return <AggregateFlowBadge lineItems={lineItems} className={className} />
  }

  const state = resolveJobProductionFlowBadge(lineItems, jobStatus)
  const sizeClass = large ? 'h-8 text-[10px]' : 'h-7 text-[9px]'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-2.5 font-black uppercase tracking-wide sm:min-w-[132px] ${sizeClass} ${toneClass[state.tone]} ${className}`}
      title={state.label}
    >
      <span className="truncate">{state.label}</span>
    </span>
  )
}
