import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { formatTL } from '../../utils/productPricing'
import { getTreasuryMovements } from '../../utils/treasuryStore'

function parseDate(value) {
  const raw = String(value || '')
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (trMatch) return `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`
  const date = new Date(raw)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

function monthLabel(iso) {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
}

export default function PaymentsReportPage() {
  const [movements, setMovements] = useState(() => getTreasuryMovements())

  const refresh = useCallback(() => setMovements(getTreasuryMovements()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const payments = useMemo(
    () => movements.filter((item) => item.direction === 'out' && item.type !== 'Bakiye Sabitleme'),
    [movements],
  )

  const chartData = useMemo(() => {
    const buckets = new Map()
    payments.forEach((item) => {
      const key = monthLabel(parseDate(item.date))
      buckets.set(key, (buckets.get(key) || 0) + (Number(item.amount) || 0))
    })
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }))
  }, [payments])

  const total = payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <AppPageShell>
      <AppPageHeader title="Ödemeler Raporu" />

      <AppPagePanel title="Ödeme Dağılımı">
        <p className="mb-4 text-2xl font-black text-blue-300">{formatTL(total)}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ label: '—', value: 0 }]} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}bin`} />
              <Tooltip formatter={(value) => formatTL(value)} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {(chartData.length ? chartData : [{ label: '—' }]).map((entry) => (
                  <Cell key={entry.label} fill="#38bdf8" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
