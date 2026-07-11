import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  className?: string
  height?: number
}

export function BarChart({ data, className, height = 200 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn('flex items-end gap-3', className)} style={{ height }}>
      {data.map((item, i) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'w-full min-h-[4px] rounded-t-lg',
              item.color ?? 'bg-bach-blue',
            )}
            style={{ maxHeight: '100%' }}
          />
          <span className="text-[10px] font-medium text-text-subtle">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[]
  size?: number
  className?: string
}

export function DonutChart({ segments, size = 120, className }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let offset = 0

  return (
    <div className={cn('flex items-center gap-6', className)}>
      <svg width={size} height={size} viewBox="0 0 36 36" className="shrink-0 -rotate-90">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100
          const dash = `${pct} ${100 - pct}`
          const el = (
            <circle
              key={seg.label}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={seg.color}
              strokeWidth="3.2"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
          offset += pct
          return el
        })}
      </svg>
      <ul className="space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-text-muted">{seg.label}</span>
            <span className="font-semibold text-text">{seg.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SparklineProps {
  data: number[]
  className?: string
  color?: string
}

export function Sparkline({ data, className, color = '#2d5f8f' }: SparklineProps) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((v - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 30" className={cn('h-8 w-full', className)} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
