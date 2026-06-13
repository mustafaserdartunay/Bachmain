import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dealers } from '../../data/mockData'

const dealerData = dealers.performance.map((item) => ({
  city: item.city,
  orders: item.orders,
}))

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 shadow-card">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="text-xs font-bold text-white">{payload[0].value} sipariş</p>
    </div>
  )
}

export default function DealerPerformanceChart() {
  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Bayi Performansı</h3>
        <p className="text-xs text-gray-500">Şehir bazlı sipariş adedi</p>
      </div>
      <div className="relative h-[160px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dealerData} barSize={22} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <XAxis dataKey="city" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
            <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
              {dealerData.map((_, index) => (
                <Cell key={index} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
