/**
 * Production progress circle — single green arc (no glow).
 */
const GREEN = '#10b981'

export default function ProductionProgressRing({
  percent = 0,
  size = 52,
  stroke = 5,
  label = '',
  className = '',
}) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const filled = (value / 100) * circumference

  const valueClass =
    size <= 44 ? 'text-[9px]' : size <= 56 ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`.trim()}>
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={`İlerleme %${value}${label ? ` · ${label}` : ''}`}
      >
        <svg
          className="h-full w-full -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border,#E2E8F0)"
            strokeWidth={stroke}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={GREEN}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            style={{
              transition:
                'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1), stroke-dasharray 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </svg>
        <span
          className={`absolute font-bold tabular-nums text-[var(--bach-navy,#1E3A8A)] ${valueClass}`}
        >
          %{value}
        </span>
      </div>
      {label ? (
        <span className="max-w-[5.5rem] text-center text-[11px] font-semibold leading-tight text-[var(--muted,#64748B)]">
          {label}
        </span>
      ) : null}
    </div>
  )
}
