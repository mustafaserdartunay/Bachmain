import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { formatTL } from '../../utils/productPricing'
import { getCashFlowTimeline } from '../../utils/treasuryReportUtils'
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>{item.name}: {formatTL(item.value)}</p>
      ))}
    </div>
  )
}

export default function CashFlowReportPage() {
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const timeline = useMemo(() => getCashFlowTimeline(), [tick])
  const totalIn = timeline.reduce((sum, item) => sum + item.inflow, 0)
  const totalOut = timeline.reduce((sum, item) => sum + item.outflow, 0)
  const net = totalIn - totalOut

  return (
    <AppPageShell>
      <AppPageHeader title="Nakit Akışı Raporu" />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Toplam Giriş', value: formatTL(totalIn), icon: ArrowDownLeft, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam Çıkış', value: formatTL(totalOut), icon: ArrowUpRight, tone: 'red', valueTone: 'red' },
          { title: 'Net Akış', value: formatTL(net), icon: Scale, tone: net >= 0 ? 'blue' : 'orange', valueTone: net >= 0 ? 'blue' : 'orange' },
        ]}
      />

      <AppPagePanel title="Aylık Nakit Akışı">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline.length ? timeline : [{ label: '—', inflow: 0, outflow: 0 }]} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}bin`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="inflow" name="Giriş" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Çıkış" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
