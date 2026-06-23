import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CircleDollarSign, Clock3, FileText, Wallet } from 'lucide-react'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { formatTL } from '../utils/productPricing'
import { readSalesInvoices } from '../utils/salesInvoicesStore'
import {
  aggregateAgingBuckets,
  buildCollectionRows,
  formatCollectionDate,
  getCollectionsSummary,
} from '../utils/collectionsReportUtils'

const LIST_GRID = 'minmax(150px,1fr) minmax(150px,1fr) minmax(220px,1.4fr) minmax(130px,1fr) minmax(120px,1fr)'

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-white">{label}</p>
      <p className="text-blue-300">{formatTL(row?.amount || 0)}</p>
      <p className="text-gray-500">{row?.count || 0} kayıt</p>
    </div>
  )
}

function SummaryStrip({ summary }) {
  const items = [
    { label: 'Planlanmamış', value: formatTL(summary.unplannedAmount), tone: 'text-gray-400' },
    { label: 'Vadesi Geçen', value: formatTL(summary.overdueAmount), tone: 'text-red-300' },
    { label: 'Toplam Tahsilat', value: formatTL(summary.totalCollected), tone: 'text-blue-300' },
    { label: 'Ort. Vade Aşımı', value: `${summary.avgOverdueDays} Gün`, tone: 'text-white' },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 border-b border-dark-500/40 pb-6 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`text-center ${index < items.length - 1 ? 'xl:border-r xl:border-dark-500/40' : ''}`}
        >
          <p className={`text-2xl font-black ${item.tone}`}>{item.value}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export default function CollectionsReportPage() {
  const [invoices, setInvoices] = useState(() => readSalesInvoices())

  const refresh = useCallback(() => setInvoices(readSalesInvoices()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:sales-invoices-updated', refresh)
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => {
      window.removeEventListener('erlenbox:sales-invoices-updated', refresh)
      window.removeEventListener('erlenbox:treasury-updated', refresh)
    }
  }, [refresh])

  const summary = useMemo(() => getCollectionsSummary(invoices), [invoices])
  const agingBuckets = useMemo(() => aggregateAgingBuckets(invoices), [invoices])
  const collectionRows = useMemo(() => buildCollectionRows(invoices), [invoices])

  const chartData = agingBuckets.map((bucket) => ({
    label: bucket.label,
    amount: bucket.amount,
    count: bucket.count,
    color: bucket.color,
  }))

  return (
    <AppPageShell>
      <AppPageHeader title="Tahsilatlar Raporu" />

      <AppPagePanel title="Tahsilatlar Raporu">
        <SummaryStrip summary={summary} />

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={48} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}bin`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          {agingBuckets.map((bucket) => (
            <div key={bucket.id} className="rounded-xl border border-dark-500/40 bg-dark-900/40 px-3 py-2 text-center">
              <p className="text-[10px] font-bold text-gray-500">{bucket.label}</p>
              <p className="mt-1 text-xs font-black text-white">{formatTL(bucket.amount)}</p>
              <p className="text-[10px] text-gray-600">{bucket.count}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>

      <AppPagePanel title="Tahsilatlar Raporu">
        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={[
            { label: 'Tahsilat Tarihi' },
            { label: 'Fatura / Çek Tarihi' },
            { label: 'Müşteri / Tedarikçi / Çalışan' },
            { label: 'Fatura / Çek' },
            { label: 'Giriş', align: 'right' },
          ]}
        />

        <div className="mt-2 space-y-2">
          {collectionRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-500/45 px-4 py-12 text-center">
              <Wallet className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Henüz tahsilat kaydı yok</p>
              <p className="mt-1 text-xs text-gray-600">Fatura tahsilatları veya kasa hareketleri burada listelenir.</p>
            </div>
          ) : collectionRows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className="text-xs font-semibold text-gray-200">{formatCollectionDate(row.collectionDate)}</p>
              <p className="text-xs font-semibold text-gray-400">{formatCollectionDate(row.documentDate)}</p>
              <p className="truncate text-sm font-bold text-white">{row.partyName}</p>
              <p className="text-xs text-gray-400">
                {row.documentType}
                {row.invoiceNo ? ` / ${row.invoiceNo}` : ''}
              </p>
              <p className="text-right text-sm font-black text-blue-300">{formatTL(row.amount)}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { title: 'Açık Alacak', value: formatTL(summary.overdueAmount + summary.unplannedAmount), icon: CircleDollarSign, iconClass: 'text-orange-300' },
          { title: 'Tahsil Edilen', value: formatTL(summary.totalCollected), icon: Wallet, iconClass: 'text-blue-300' },
          { title: 'Gecikmiş Kayıt', value: agingBuckets.filter((b) => b.id !== 'current' && b.id !== 'unplanned').reduce((s, b) => s + b.count, 0), icon: Clock3, iconClass: 'text-red-300' },
          { title: 'Tahsilat Satırı', value: collectionRows.length, icon: FileText, iconClass: 'text-emerald-300' },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{item.title}</span>
              <span className={`rounded-xl bg-dark-700 p-2 ${item.iconClass}`}>
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xl font-bold text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </AppPageShell>
  )
}
