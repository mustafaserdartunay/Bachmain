import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, ChevronDown, FileText } from 'lucide-react'
import DateRangePicker from '../components/Common/DateRangePicker'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { formatTL } from '../utils/productPricing'
import {
  formatInvoiceDate,
  INVOICE_KIND_LABELS,
  readSalesInvoices,
} from '../utils/salesInvoicesStore'
import {
  aggregateByCustomer,
  aggregateByProduct,
  aggregateCustomerCategories,
  aggregateInvoiceCategories,
  aggregateProductCategories,
  aggregateSalesTimeline,
  filterInvoicesByRange,
  formatReportRangeLabel,
} from '../utils/salesReportUtils'
import { readCustomerMeta } from '../utils/customerMeta'

const LIST_GRID = 'minmax(240px,1.5fr) minmax(180px,1fr) minmax(140px,1fr)'
const TABS = [
  { id: 'invoices', label: 'FATURALAR' },
  { id: 'customers', label: 'MÜŞTERİLER' },
  { id: 'products', label: 'HİZMET/ÜRÜNLER' },
]
const GRANULARITIES = [
  { id: 'day', label: 'Gün' },
  { id: 'week', label: 'Hafta' },
  { id: 'month', label: 'Ay' },
  { id: 'year', label: 'Yıl' },
]
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

function kindBadgeClass(kind) {
  return kind === 'a-fatura'
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
}

function CategoryPieCard({ title, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="rounded-2xl border border-dark-500/45 bg-dark-900/40 p-4">
      <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-gray-500">{title}</p>
      <div className="flex flex-col items-center gap-4 xl:flex-row xl:items-start">
        <div className="relative h-[140px] w-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length ? data : [{ name: 'Veri yok', value: 1, color: '#334155' }]}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {(data.length ? data : [{ color: '#334155' }]).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white">{formatTL(total)}</span>
          </div>
        </div>
        <div className="w-full min-w-0 flex-1 space-y-2">
          {data.length === 0 ? (
            <p className="text-xs text-gray-500">Bu dönemde kayıt yok.</p>
          ) : data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-gray-400">{item.name}</span>
              <span className="shrink-0 text-[13px] font-bold text-gray-200">{formatTL(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{label}</p>
      <p className="text-emerald-300">{formatTL(payload[0]?.value || 0)}</p>
    </div>
  )
}

export default function SalesReportPage() {
  const [invoices, setInvoices] = useState(() => readSalesInvoices())
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [includeVat, setIncludeVat] = useState(true)
  const [taxMenuOpen, setTaxMenuOpen] = useState(false)
  const [granularity, setGranularity] = useState('month')
  const [activeTab, setActiveTab] = useState('invoices')

  const refresh = useCallback(() => setInvoices(readSalesInvoices()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:sales-invoices-updated', refresh)
    return () => window.removeEventListener('erlenbox:sales-invoices-updated', refresh)
  }, [refresh])

  const customerMetaById = useMemo(() => readCustomerMeta(), [invoices])

  const filtered = useMemo(
    () => filterInvoicesByRange(invoices, dateRange.dateFrom, dateRange.dateTo),
    [invoices, dateRange],
  )

  const invoiceCategories = useMemo(
    () => aggregateInvoiceCategories(filtered, includeVat),
    [filtered, includeVat],
  )
  const customerCategories = useMemo(
    () => aggregateCustomerCategories(filtered, customerMetaById, includeVat),
    [filtered, customerMetaById, includeVat],
  )
  const productCategories = useMemo(
    () => aggregateProductCategories(filtered, includeVat),
    [filtered, includeVat],
  )
  const timeline = useMemo(
    () => aggregateSalesTimeline(filtered, granularity, includeVat),
    [filtered, granularity, includeVat],
  )
  const customerRows = useMemo(() => aggregateByCustomer(filtered, includeVat), [filtered, includeVat])
  const productRows = useMemo(() => aggregateByProduct(filtered, includeVat), [filtered, includeVat])

  const grandTotal = filtered.reduce(
    (sum, item) => sum + (includeVat ? item.totalAmount * 1.2 : item.totalAmount),
    0,
  )
  const rangeLabel = formatReportRangeLabel(dateRange.dateFrom, dateRange.dateTo)

  return (
    <AppPageShell>
      <AppPageHeader title="Satışlar Raporu" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Dönem Satışı', value: formatTL(grandTotal), icon: BarChart3, tone: 'blue', valueTone: 'blue' },
          { title: 'Fatura Sayısı', value: filtered.length, icon: FileText, tone: 'emerald', valueTone: 'emerald' },
          {
            title: 'E-Fatura Payı',
            value: formatTL(invoiceCategories.find((item) => item.name === 'E-FATURA')?.value || 0),
            icon: FileText,
            tone: 'cyan',
            valueTone: 'cyan',
          },
          {
            title: 'A-Fatura Payı',
            value: formatTL(invoiceCategories.find((item) => item.name === 'A-FATURA')?.value || 0),
            icon: FileText,
            tone: 'red',
            valueTone: 'red',
          },
        ]}
      />

      <AppPagePanel
        title="Satış Faturaları"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px]">
              <DateRangePicker
                dateFrom={dateRange.dateFrom}
                dateTo={dateRange.dateTo}
                onChange={(value) => setDateRange((current) => ({ ...current, ...value }))}
                dateLabelFormat="numeric"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTaxMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-[12px] font-black uppercase tracking-wide text-gray-300"
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
        )}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <CategoryPieCard title="Fatura Kategorileri" data={invoiceCategories} />
          <CategoryPieCard title="Müşteri Kategorileri" data={customerCategories} />
          <CategoryPieCard title="Hizmet/Ürün Kategorileri" data={productCategories} />
        </div>
      </AppPagePanel>

      <AppPagePanel title="Satışların dağılımı">
        <div className="mb-4 flex justify-end gap-1">
          {GRANULARITIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGranularity(item.id)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-black uppercase tracking-wide ${
                granularity === item.id
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-500 hover:bg-dark-700 hover:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline.length ? timeline : [{ label: '—', value: 0 }]} barSize={36} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}bin`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {(timeline.length ? timeline : [{ label: '—' }]).map((entry) => (
                  <Cell key={entry.label} fill="#38bdf8" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AppPagePanel>

      <AppPagePanel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-white">{rangeLabel}</p>
          <div className="flex gap-1 rounded-xl border border-dark-500/45 bg-dark-900/50 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-black uppercase tracking-wide ${
                  activeTab === tab.id
                    ? 'bg-dark-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'invoices' && (
          <>
            <ListHeaderRow
              gridTemplate={LIST_GRID}
              columns={['Fatura İsmi', 'Düzenlenme Tarihi', { label: 'Bakiye', align: 'right' }]}
            />
            <div className="mt-2 space-y-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">Bu dönemde fatura yok.</p>
              ) : filtered.map((invoice) => {
                const displayAmount = includeVat ? invoice.totalAmount * 1.2 : invoice.totalAmount
                return (
                  <div
                    key={invoice.id}
                    className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
                    style={{ gridTemplateColumns: LIST_GRID }}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/80 text-gray-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-black text-white">{invoice.title}</p>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-black ${kindBadgeClass(invoice.invoiceKind)}`}>
                            {INVOICE_KIND_LABELS[invoice.invoiceKind]}
                          </span>
                        </div>
                        {invoice.customerId ? (
                          <Link to={`/musteriler/${invoice.customerId}`} className="mt-1 block truncate text-xs text-gray-500 hover:text-blue-300">
                            {invoice.customerName}
                          </Link>
                        ) : (
                          <p className="mt-1 truncate text-xs text-gray-500">{invoice.customerName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">{formatInvoiceDate(invoice.issueDate)}</p>
                      <p className="mt-1 text-[12px] text-gray-500">
                        Satış Faturaları{invoice.invoiceNo ? ` / ${invoice.invoiceNo}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-300">{formatTL(displayAmount)}</p>
                      <p className="mt-1 text-[12px] text-gray-500">Genel Toplam {formatTL(displayAmount)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-2">
            {customerRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Müşteri satış verisi yok.</p>
            ) : customerRows.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
                <p className="text-sm font-bold text-white">{row.name}</p>
                <p className="text-sm font-black text-emerald-300">{formatTL(row.total)}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-2">
            {productRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Ürün satış verisi yok.</p>
            ) : productRows.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3">
                <p className="text-sm font-bold text-white">{row.name}</p>
                <p className="text-sm font-black text-emerald-300">{formatTL(row.total)}</p>
              </div>
            ))}
          </div>
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
