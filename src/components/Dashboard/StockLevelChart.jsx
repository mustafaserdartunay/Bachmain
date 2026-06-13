import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { criticalStocks } from '../../data/mockData'

const stockData = criticalStocks.map((item) => ({
  name: item.product.split(' ').slice(0, 2).join(' '),
  fill: Math.round((item.current / item.min) * 100),
  current: item.current,
  min: item.min,
}))

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 shadow-card">
      <p className="text-[10px] text-gray-500">{row.name}</p>
      <p className="text-xs font-bold text-white">{row.current} / {row.min} min</p>
    </div>
  )
}

export default function StockLevelChart() {
  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Kritik Stok</h3>
        <p className="text-xs text-gray-500">Minimum seviye karşılaştırması</p>
      </div>
      <div className="relative h-[180px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockData} layout="vertical" barSize={12} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={68} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(239,68,68,0.06)' }} />
            <Bar dataKey="fill" radius={[0, 4, 4, 0]}>
              {stockData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill < 30 ? '#ef4444' : entry.fill < 60 ? '#f59e0b' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
