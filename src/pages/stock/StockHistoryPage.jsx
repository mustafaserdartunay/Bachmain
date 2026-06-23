import { useCallback, useEffect, useMemo, useState } from 'react'
import { History } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { formatStockDate, getStockHistory } from '../../utils/stockStore'

const LIST_GRID = '110px minmax(120px,1fr) minmax(120px,1fr) minmax(140px,1fr) 80px minmax(120px,1fr)'

const TYPE_OPTIONS = ['Tümü', 'Gelen İrsaliye', 'Giden İrsaliye', 'Depolar Arası Transfer']

const directionTone = {
  in: 'text-emerald-300',
  out: 'text-red-300',
  transfer: 'text-blue-300',
}

export default function StockHistoryPage() {
  const [history, setHistory] = useState(() => getStockHistory())
  const [search, setSearch] = useState('')
  const [type, setType] = useState('Tümü')

  const refresh = useCallback(() => setHistory(getStockHistory()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:stock-updated', refresh)
    return () => window.removeEventListener('erlenbox:stock-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return history.filter((item) => {
      if (type !== 'Tümü' && item.type !== type) return false
      if (!query) return true
      return [item.type, item.productName, item.documentNo, item.warehouseName, item.partyName, item.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [history, search, type])

  const inCount = history.filter((item) => item.direction === 'in').length
  const outCount = history.filter((item) => item.direction === 'out').length

  return (
    <AppPageShell>
      <AppPageHeader title="Stok Geçmişi" />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Toplam Hareket', value: history.length, icon: History, tone: 'blue', valueTone: 'blue' },
          { title: 'Giriş', value: inCount, icon: History, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Çıkış', value: outCount, icon: History, tone: 'red', valueTone: 'red' },
        ]}
      />

      <AppPagePanel title="Stok Hareketleri">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün, belge no veya depo ara..."
            className="form-input w-full max-w-md text-sm"
          />
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setType(item)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  type === item ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:bg-dark-700 hover:text-gray-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tarih', 'Tür', 'Depo', 'Ürün', 'Miktar', 'Belge / Cari']}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Stok hareketi bulunamadı.</p>
          ) : rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className="text-xs font-semibold text-gray-300">{formatStockDate(row.date)}</p>
              <p className="text-xs font-bold text-white">{row.type}</p>
              <p className="truncate text-xs text-gray-400">{row.warehouseName || '—'}</p>
              <p className="truncate text-sm font-bold text-white">{row.productName || '—'}</p>
              <p className={`text-xs font-black ${directionTone[row.direction] || 'text-gray-300'}`}>
                {row.direction === 'out' ? '-' : '+'}{row.quantity} {row.unit || 'adet'}
              </p>
              <div className="min-w-0">
                <p className="truncate text-xs text-gray-400">{row.documentNo || '—'}</p>
                <p className="truncate text-[11px] text-gray-500">{row.partyName || row.relatedWarehouseName || row.notes || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
