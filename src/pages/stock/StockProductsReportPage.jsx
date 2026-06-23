import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, Boxes, PackageX } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { formatTL } from '../../utils/productPricing'
import { getStockProductsReport } from '../../utils/stockStore'
import { Link } from 'react-router-dom'
import { STOCK_PRODUCTS_PATH } from '../../data/stockMenu'

const LIST_GRID = 'minmax(180px,1.2fr) minmax(100px,1fr) minmax(100px,1fr) minmax(120px,1fr) 100px'

export default function StockProductsReportPage() {
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tümü')

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    window.addEventListener('erlenbox:stock-updated', refresh)
    window.addEventListener('erlenbox:products-updated', refresh)
    return () => {
      window.removeEventListener('erlenbox:stock-updated', refresh)
      window.removeEventListener('erlenbox:products-updated', refresh)
    }
  }, [refresh])

  const report = useMemo(() => getStockProductsReport(), [tick])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return report.rows.filter((row) => {
      if (filter === 'Kritik' && !row.isCritical) return false
      if (filter === 'Stok Yok' && !row.isEmpty) return false
      if (!query) return true
      return [row.name, row.sku, row.category].some((value) => String(value).toLowerCase().includes(query))
    })
  }, [report.rows, search, filter])

  return (
    <AppPageShell>
      <AppPageHeader
        title="Stoktaki Ürünler Raporu"
        actions={(
          <Link to={STOCK_PRODUCTS_PATH} className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300">
            Ürünlere Git
          </Link>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Toplam Stok Adedi', value: report.totalUnits.toLocaleString('tr-TR'), icon: Boxes, tone: 'blue', valueTone: 'blue' },
          { title: 'Stok Değeri', value: formatTL(report.totalValue), icon: BarChart3, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Kritik Ürün', value: report.criticalCount, icon: AlertTriangle, tone: 'orange', valueTone: 'orange' },
          { title: 'Stok Yok', value: report.emptyCount, icon: PackageX, tone: 'red', valueTone: 'red' },
        ]}
      />

      <AppPagePanel title="Ürün Bazlı Stok Durumu">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ürün adı, kod veya kategori ara..."
            className="form-input w-full max-w-md text-sm"
          />
          <div className="flex flex-wrap gap-1">
            {['Tümü', 'Kritik', 'Stok Yok'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  filter === item ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:bg-dark-700 hover:text-gray-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Ürün', 'Kategori', 'Stok Kodu', { label: 'Stok', align: 'right' }, 'Durum']}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Rapor için ürün bulunamadı.</p>
          ) : rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.name}</p>
                <p className="truncate text-[11px] text-gray-500">{formatTL(row.value)} değer</p>
              </div>
              <p className="truncate text-xs text-gray-400">{row.category}</p>
              <p className="text-xs text-gray-400">{row.sku}</p>
              <p className="text-right text-sm font-black text-blue-300">{row.totalStock.toLocaleString('tr-TR')}</p>
              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                row.isEmpty
                  ? 'bg-red-500/10 text-red-300'
                  : row.isCritical
                    ? 'bg-orange-500/10 text-orange-300'
                    : 'bg-emerald-500/10 text-emerald-300'
              }`}>
                {row.isEmpty ? 'Stok Yok' : row.isCritical ? 'Kritik' : 'Stokta'}
              </span>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
