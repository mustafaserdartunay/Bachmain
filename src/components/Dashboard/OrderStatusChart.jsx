import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { orderStatusData } from '../../data/mockData'

export default function OrderStatusChart() {
  const total = orderStatusData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Sipariş Dağılımı</h3>
        <p className="text-xs text-gray-500">{total} aktif sipariş</p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {orderStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{total}</span>
            <span className="text-[10px] text-gray-500">toplam</span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-2">
          {orderStatusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate text-xs text-gray-400">{item.name}</span>
              <span className="shrink-0 text-xs font-bold text-gray-300">{item.value}</span>
              <span className="w-8 shrink-0 text-right text-[10px] text-gray-600">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
