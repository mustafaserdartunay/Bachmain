import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, BarChart3, Trophy, Users } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { formatTL } from '../../utils/productPricing'
import { loadSalesRepSettings } from '../../utils/salesRepSettingsStore'
import { buildMonthlyLeaderboard, formatMonthLabel, monthKey } from '../../utils/salesRepUtils'
import { getFieldSalesReps } from '../../utils/fieldSalesStore'

const LIST_GRID = '60px minmax(160px,1fr) 90px 110px minmax(110px,1fr) minmax(110px,1fr)'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>{item.name}: {item.value}</p>
      ))}
    </div>
  )
}

export default function SalesRepReportsPage() {
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    const events = [
      'bach:sales-rep-settings-updated',
      'bach:quotes-updated',
      'bach:orders-updated',
      'erlenbox:sales-invoices-updated',
      'bach:field-sales-updated',
    ]
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [refresh])

  const settings = useMemo(() => loadSalesRepSettings(), [tick])
  const leaderboard = useMemo(() => buildMonthlyLeaderboard(monthKey()), [tick])
  const totalSales = leaderboard.reduce((sum, row) => sum + row.salesTotal, 0)
  const totalCommission = leaderboard.reduce((sum, row) => sum + row.commission.commission, 0)
  const chartData = leaderboard.map((row) => ({
    name: row.repLabel.split(' ')[0],
    puan: row.total,
    satis: Math.round(row.salesTotal / 1000),
  }))

  return (
    <AppPageShell>
      <AppPageHeader title="Temsilci Raporları" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Temsilci', value: getFieldSalesReps().length, icon: Users, tone: 'blue', valueTone: 'blue' },
          { title: 'Aylık Satış', value: formatTL(totalSales), icon: BarChart3, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam Prim', value: formatTL(totalCommission), icon: Award, tone: 'purple', valueTone: 'purple' },
          { title: 'Ay Birincisi', value: leaderboard[0]?.repLabel || '—', icon: Trophy, tone: 'amber', valueTone: 'amber' },
        ]}
      />

      <AppPagePanel title={`${formatMonthLabel()} Puan Yarışı`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ name: '—', puan: 0, satis: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="puan" name="Puan" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="satis" name="Satış (bin TL)" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppPagePanel>

      <AppPagePanel
        title="Prim ve Performans Tablosu"
        action={(
          <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
            Standart %{settings.baseCommissionRate} · Birinci %{settings.winnerCommissionRate}
          </span>
        )}
      >
        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Sıra', 'Temsilci', 'Puan', 'Teklif', 'Sipariş', { label: 'Satış', align: 'right' }, { label: 'Prim', align: 'right' }]}
        />

        <div className="mt-2 space-y-2">
          {leaderboard.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Rapor verisi bulunamadı.</p>
          ) : leaderboard.map((row) => (
            <div
              key={row.repLabel}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className={`text-sm font-black ${row.rank === 1 ? 'text-amber-300' : 'text-gray-300'}`}>#{row.rank}</p>
              <div>
                <p className="text-sm font-bold text-white">{row.repLabel}</p>
                <p className="text-[13px] text-gray-500">{row.tasksDone} tamamlanan görev</p>
              </div>
              <p className="text-xs font-bold text-blue-300">{row.total}</p>
              <p className="text-xs text-gray-400">{row.quotes}</p>
              <p className="text-xs text-gray-400">{row.orders}</p>
              <p className="text-right text-sm font-black text-emerald-300">{formatTL(row.salesTotal)}</p>
              <p className="text-right text-sm font-black text-purple-300">
                {formatTL(row.commission.commission)}
                <span className="block text-[12px] text-gray-500">%{row.commission.rate}</span>
              </p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
