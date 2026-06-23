import { useCallback, useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import DateRangePicker from '../../components/Common/DateRangePicker'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { formatTL } from '../../utils/productPricing'
import { getExpenseReport, getIncomeReport } from '../../utils/incomeExpenseReportUtils'

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end.getFullYear(), 3, 1)
  const toIso = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }
  return { dateFrom: toIso(start), dateTo: toIso(end) }
}

export default function ExpensesReportPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [, setTick] = useState(0)

  const refresh = useCallback(() => setTick((v) => v + 1), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const income = useMemo(
    () => getIncomeReport(dateRange.dateFrom, dateRange.dateTo, true),
    [dateRange, refresh],
  )
  const expense = useMemo(
    () => getExpenseReport(dateRange.dateFrom, dateRange.dateTo, true, income.total),
    [dateRange, income.total, refresh],
  )

  return (
    <AppPageShell>
      <AppPageHeader title="Giderler Raporu" />

      <AppPagePanel
        title="Gider Analizi"
        action={(
          <div className="min-w-[220px]">
            <DateRangePicker
              dateFrom={dateRange.dateFrom}
              dateTo={dateRange.dateTo}
              onChange={(value) => setDateRange((current) => ({ ...current, ...value }))}
              dateLabelFormat="numeric"
            />
          </div>
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-widest text-amber-300">Toplam Gider</p>
          <p className="text-xl font-black text-amber-300">{formatTL(expense.total)}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-3">
            {expense.slices.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-sm text-gray-300">{item.name}</span>
                <span className="text-sm font-bold text-white">{formatTL(item.value)}</span>
              </div>
            ))}
          </div>
          <div className="relative mx-auto h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expense.slices.length ? expense.slices : [{ name: 'Veri yok', value: 1, color: '#334155' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  dataKey="value"
                  stroke="none"
                >
                  {(expense.slices.length ? expense.slices : [{ color: '#334155' }]).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
