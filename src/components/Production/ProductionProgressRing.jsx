/**
 * Animated production progress circle — GPU-friendly stroke animation.
 */
export default function ProductionProgressRing({
  percent = 0,
  size = 64,
  stroke = 6,
  className = '',
}) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-label={`İlerleme %${value}`}
    >
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
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
          stroke="var(--accent,#3B82F6)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute text-[13px] font-black tabular-nums text-[var(--bach-navy,#1E3A8A)]">
        %{value}
      </span>
    </div>
  )
}
