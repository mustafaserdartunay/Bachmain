import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useId } from 'react'
import { salesData, formatCurrency } from '../../data/mockData'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 shadow-card">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function SalesChart() {
  const gradientId = useId()

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">Satış Trendi</h3>
          <p className="text-xs text-gray-500">Aylık ciro · 2026</p>
        </div>
        <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">+18.4%</span>
      </div>
      <div className="relative h-[220px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#243052" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: '#1e3a8a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
