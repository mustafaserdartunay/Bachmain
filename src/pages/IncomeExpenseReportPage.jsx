import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts'
import { ChevronDown, Download, Filter } from 'lucide-react'
import DateRangePicker from '../components/Common/DateRangePicker'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { formatTL } from '../utils/productPricing'
import { downloadExcelCsv, sanitizeExportFilename } from '../utils/spreadsheetExport'
import {
  buildIncomeExpenseExportRows,
  getExpenseReport,
  getIncomeReport,
  getNetReport,
} from '../utils/incomeExpenseReportUtils'

const TAX_OPTIONS = [
  { id: 'incl', label: 'Vergiler Dahil' },
  { id: 'excl', label: 'Vergiler Hariç' },
]

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end.getFullYear(), 3, 1)
  const toIso = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }
  return { dateFrom: toIso(start), dateTo: toIso(end) }
}

function DistributionSection({ title, total, slices, totalTone = 'text-blue-300' }) {
  return (
    <div className="border-b border-dark-500/40 py-6 last:border-b-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">{title}</h3>
        <p className={`text-xl font-black ${totalTone}`}>{formatTL(total)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
        <div className="space-y-3">
          {slices.length === 0 ? (
            <p className="text-sm text-gray-500">Bu dönemde kayıt yok.</p>
          ) : slices.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-300">{item.name}</span>
              <span className="shrink-0 text-sm font-bold text-white">{formatTL(item.value)}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
            {title === 'GELİRLER' ? 'Gelirlerin Dağılımı' : 'Giderlerin Dağılımı'}
          </p>
          <div className="relative mx-auto h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices.length ? slices : [{ name: 'Veri yok', value: 1, color: '#334155' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {(slices.length ? slices : [{ color: '#334155' }]).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IncomeExpenseReportPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [includeVat, setIncludeVat] = useState(true)
  const [taxMenuOpen, setTaxMenuOpen] = useState(false)
  const [, setTick] = useState(0)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    window.addEventListener('erlenbox:sales-invoices-updated', refresh)
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => {
      window.removeEventListener('erlenbox:sales-invoices-updated', refresh)
      window.removeEventListener('erlenbox:treasury-updated', refresh)
    }
  }, [refresh])

  const income = useMemo(
    () => getIncomeReport(dateRange.dateFrom, dateRange.dateTo, includeVat),
    [dateRange, includeVat, refresh],
  )
  const expense = useMemo(
    () => getExpenseReport(dateRange.dateFrom, dateRange.dateTo, includeVat, income.total),
    [dateRange, includeVat, income.total, refresh],
  )
  const net = useMemo(() => getNetReport(income.total, expense.total), [income.total, expense.total])

  function handleExport() {
    const rows = buildIncomeExpenseExportRows(income, expense, net)
    downloadExcelCsv(
      sanitizeExportFilename('gelir-gider-raporu'),
      ['Kalem', 'Tutar'],
      rows,
    )
  }

  return (
    <AppPageShell>
      <AppPageHeader title="Gelir ve Gider Raporu" />

      <AppPagePanel>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-300"
          >
            <Filter className="h-4 w-4" />
            Filtrele
          </button>
          <div className="min-w-[240px] flex-1 sm:max-w-xs">
            <DateRangePicker
              dateFrom={dateRange.dateFrom}
              dateTo={dateRange.dateTo}
              onChange={(value) => setDateRange((current) => ({ ...current, ...value }))}
              dateLabelFormat="numeric"
            />
          </div>
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setTaxMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-300"
            >
              {includeVat ? 'Vergiler Dahil' : 'Vergiler Hariç'}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {taxMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800 shadow-xl">
                {TAX_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setIncludeVat(option.id === 'incl')
                      setTaxMenuOpen(false)
                    }}
                    className="block w-full px-4 py-2.5 text-left text-xs font-bold text-gray-300 hover:bg-dark-700"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DistributionSection title="GELİRLER" total={income.total} slices={income.slices} totalTone="text-blue-300" />
        <DistributionSection title="GİDERLER" total={expense.total} slices={expense.slices} totalTone="text-amber-300" />

        {expense.isDemo && (
          <p className="mb-4 text-[11px] text-gray-500">
            Gider verisi henüz kasa hareketlerinde yok; örnek dağılım gösteriliyor.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-500/40 pt-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Net</p>
            <p className={`text-2xl font-black ${net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatTL(net)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
          >
            <Download className="h-4 w-4" />
            Dışarı Aktar
          </button>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
