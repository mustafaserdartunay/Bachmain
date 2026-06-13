import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { quotes } from '../../data/mockData'

const pipelineData = [
  { name: 'Bekleyen', value: quotes.summary.pending, color: '#f59e0b' },
  { name: 'Kabul', value: quotes.summary.accepted, color: '#10b981' },
  { name: 'Red', value: quotes.summary.rejected, color: '#ef4444' },
]

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-xs font-bold text-white shadow-card">
      {payload[0].value} teklif
    </div>
  )
}

export default function QuotesPipelineChart() {
  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Teklif Hunisi</h3>
        <p className="text-xs text-gray-500">{quotes.summary.total} teklif · bu ay</p>
      </div>
      <div className="relative h-[160px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pipelineData} barSize={28} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {pipelineData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
