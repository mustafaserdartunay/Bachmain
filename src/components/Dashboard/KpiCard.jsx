import Sparkline from './Sparkline'

const toneMap = {
  blue: { text: 'text-blue-400', stroke: '#3b82f6' },
  green: { text: 'text-emerald-400', stroke: '#10b981' },
  orange: { text: 'text-orange-400', stroke: '#f59e0b' },
  purple: { text: 'text-purple-400', stroke: '#8b5cf6' },
  cyan: { text: 'text-cyan-400', stroke: '#06b6d4' },
}

export default function KpiCard({ title, value, trend, color = 'blue', sparkline = [] }) {
  const tone = toneMap[color] || toneMap.blue
  const isPositive = trend?.startsWith('+')

  return (
    <div className="min-w-0 rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">{title}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : trend.startsWith('-') ? 'text-orange-400' : 'text-gray-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      {sparkline.length > 0 && <Sparkline data={sparkline} color={tone.stroke} />}
    </div>
  )
}
