import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import { formatTL } from '../../utils/productPricing'

const STORAGE_KEY = 'erlenbox-incoming-e-invoices'

function readIncoming() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const seed = [
  { id: 'IN-1', supplier: 'Kağıt Ambalaj Ltd.', invoiceNo: 'GB0202600000012', date: '2026-06-10', amount: 12450, status: 'Onaylandı' },
  { id: 'IN-2', supplier: 'Baskı Mürekkep A.Ş.', invoiceNo: 'GB0202600000008', date: '2026-06-05', amount: 3200, status: 'Bekliyor' },
]

function ensureSeed() {
  const current = readIncoming()
  if (current.length > 0) return current
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

const LIST_GRID = 'minmax(180px,1.2fr) 140px 120px minmax(120px,1fr)'

export default function IncomingEInvoicesPage() {
  const [items] = useState(() => ensureSeed())
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!query) return true
      return [item.supplier, item.invoiceNo, item.status].some((value) => String(value).toLowerCase().includes(query))
    })
  }, [items, search])

  return (
    <AppPageShell>
      <AppPageHeader title="Gelen E-Faturalar" />

      <AppPagePanel
        title="Gelen E-Fatura Kutusu"
        action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filtered.length} fatura</span>}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tedarikçi veya fatura no ara..."
          className="form-input mb-4 w-full max-w-md text-sm"
        />

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tedarikçi', 'Fatura No', 'Tarih', { label: 'Tutar', align: 'right' }]}
        />

        <div className="mt-2 space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{item.supplier}</p>
                  <p className="text-[10px] text-gray-500">{item.status}</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-300">{item.invoiceNo}</p>
              <p className="text-xs text-gray-400">{item.date}</p>
              <p className="text-right text-sm font-black text-blue-300">{formatTL(item.amount)}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
