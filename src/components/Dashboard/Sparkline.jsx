import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useId } from 'react'

export default function Sparkline({ data, color = '#3b82f6' }) {
  const gradientId = useId()
  const chartData = data.map((value, index) => ({ index, value }))

  return (
    <div className="relative mt-3 h-10 w-full min-h-[40px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
