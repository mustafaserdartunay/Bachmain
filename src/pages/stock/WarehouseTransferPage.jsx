import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SearchInput from '../../components/Common/SearchInput'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { getCatalogProducts } from '../../utils/productCatalog'
import {
  createTransfer,
  formatStockDate,
  getTransfers,
  getWarehouses,
} from '../../utils/stockStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const LIST_GRID = '110px minmax(120px,1fr) minmax(120px,1fr) minmax(140px,1fr) 80px 100px'

function emptyForm(warehouses) {
  return {
    fromWarehouseId: warehouses[0]?.id || '',
    toWarehouseId: warehouses[1]?.id || warehouses[0]?.id || '',
    productId: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

export default function WarehouseTransferPage() {
  const [warehouses, setWarehouses] = useState(() => getWarehouses())
  const [transfers, setTransfers] = useState(() => getTransfers())
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState(() => emptyForm(getWarehouses()))
  const products = useMemo(() => getCatalogProducts(), [])

  const refresh = useCallback(() => {
    setWarehouses(getWarehouses())
    setTransfers(getTransfers())
  }, [])

  useEffect(() => {
    window.addEventListener('erlenbox:stock-updated', refresh)
    return () => window.removeEventListener('erlenbox:stock-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return transfers.filter((item) => {
      if (!query) return true
      return [item.documentNo, item.productName, item.fromWarehouseName, item.toWarehouseName, item.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [transfers, search])

  function handleSubmit(event) {
    event.preventDefault()
    const product = products.find((item) => String(item.id) === String(form.productId))
    try {
      createTransfer({
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        productId: product?.id || '',
        productName: product?.name || 'Ürün',
        sku: product?.stockCode || product?.productCode || '',
        unit: product?.salesUnit || 'adet',
        criticalStock: product?.criticalStock || 0,
        unitValue: product?.costPrice || product?.purchasePriceExcl || 0,
        quantity: Number(form.quantity),
        notes: form.notes,
        date: form.date,
      })
      setForm(emptyForm(getWarehouses()))
      setPanelOpen(false)
      refresh()
    } catch (error) {
      window.alert(error.message || 'Transfer kaydedilemedi.')
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Depolar Arası Transfer"
        actions={(
          <button type="button" onClick={() => setPanelOpen(true)} className={`${BTN_PRIMARY} gap-1.5 px-4 py-2 text-xs`}>
            <Plus className="h-4 w-4" /> Yeni Transfer
          </button>
        )}
      />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Toplam Transfer', value: transfers.length, icon: ArrowLeftRight, tone: 'blue', valueTone: 'blue' },
          { title: 'Aktif Depo', value: warehouses.length, icon: ArrowLeftRight, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Bu Ay', value: rows.length, icon: ArrowLeftRight, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <AppPagePanel title="Transfer Kayıtları">
        <SearchInput
          wrapperClassName="mb-4 w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Belge no, ürün veya depo ara..."
        />

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tarih', 'Belge No', 'Kaynak', 'Hedef', 'Miktar', 'Durum']}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Transfer kaydı bulunamadı.</p>
          ) : rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className="text-xs font-semibold text-gray-300">{formatStockDate(row.date)}</p>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.documentNo}</p>
                <p className="truncate text-[13px] text-gray-500">{row.productName}</p>
              </div>
              <p className="truncate text-xs text-gray-400">{row.fromWarehouseName}</p>
              <p className="truncate text-xs text-gray-400">{row.toWarehouseName}</p>
              <p className="text-xs font-black text-blue-300">{row.quantity} {row.unit}</p>
              <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-bold text-emerald-300">{row.status}</span>
            </div>
          ))}
        </div>
      </AppPagePanel>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-dark-500/50 bg-dark-800 p-5 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">Yeni Depo Transferi</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Kaynak Depo</label>
                  <select className="form-input text-sm" value={form.fromWarehouseId} onChange={(e) => setForm((c) => ({ ...c, fromWarehouseId: e.target.value }))}>
                    {warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Hedef Depo</label>
                  <select className="form-input text-sm" value={form.toWarehouseId} onChange={(e) => setForm((c) => ({ ...c, toWarehouseId: e.target.value }))}>
                    {warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Ürün</label>
                <select className="form-input text-sm" value={form.productId} onChange={(e) => setForm((c) => ({ ...c, productId: e.target.value }))} required>
                  <option value="">Ürün seçin</option>
                  {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Miktar</label>
                  <input type="number" min="1" className="form-input text-sm" value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Tarih</label>
                  <input type="date" className="form-input text-sm" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Not</label>
                <textarea className="form-input resize-none text-sm" rows={2} value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:bg-dark-700">Vazgeç</button>
              <button type="submit" className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>Transferi Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </AppPageShell>
  )
}
