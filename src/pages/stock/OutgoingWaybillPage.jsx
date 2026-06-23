import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { getCatalogProducts } from '../../utils/productCatalog'
import {
  createOutgoingWaybill,
  formatStockDate,
  getOutgoingWaybills,
  getWarehouses,
} from '../../utils/stockStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const LIST_GRID = '110px minmax(120px,1fr) minmax(120px,1fr) minmax(140px,1fr) 100px'

function emptyForm(warehouses) {
  return {
    waybillNo: '',
    warehouseId: warehouses[0]?.id || '',
    customerName: '',
    productId: '',
    quantity: '',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  }
}

export default function OutgoingWaybillPage() {
  const [warehouses, setWarehouses] = useState(() => getWarehouses())
  const [waybills, setWaybills] = useState(() => getOutgoingWaybills())
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState(() => emptyForm(getWarehouses()))
  const products = useMemo(() => getCatalogProducts(), [])

  const refresh = useCallback(() => {
    setWarehouses(getWarehouses())
    setWaybills(getOutgoingWaybills())
  }, [])

  useEffect(() => {
    window.addEventListener('erlenbox:stock-updated', refresh)
    return () => window.removeEventListener('erlenbox:stock-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return waybills.filter((item) => {
      if (!query) return true
      return [item.waybillNo, item.customerName, item.warehouseName, item.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [waybills, search])

  const totalQty = rows.reduce((sum, row) => sum + (row.items || []).reduce((inner, item) => inner + (Number(item.quantity) || 0), 0), 0)

  function handleSubmit(event) {
    event.preventDefault()
    const product = products.find((item) => String(item.id) === String(form.productId))
    try {
      createOutgoingWaybill({
        waybillNo: form.waybillNo,
        warehouseId: form.warehouseId,
        customerName: form.customerName,
        date: form.date,
        notes: form.notes,
        items: [{
          productId: product?.id || '',
          productName: product?.name || 'Ürün',
          sku: product?.stockCode || product?.productCode || '',
          unit: product?.salesUnit || 'adet',
          quantity: Number(form.quantity),
        }],
      })
      setForm(emptyForm(getWarehouses()))
      setPanelOpen(false)
      refresh()
    } catch (error) {
      window.alert(error.message || 'İrsaliye kaydedilemedi.')
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Giden İrsaliyeler"
        actions={(
          <button type="button" onClick={() => setPanelOpen(true)} className={`${BTN_PRIMARY} gap-1.5 px-4 py-2 text-xs`}>
            <Plus className="h-4 w-4" /> Yeni İrsaliye
          </button>
        )}
      />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Giden İrsaliye', value: waybills.length, icon: Truck, tone: 'orange', valueTone: 'orange' },
          { title: 'Sevk Edilen Adet', value: totalQty.toLocaleString('tr-TR'), icon: Truck, tone: 'blue', valueTone: 'blue' },
          { title: 'Depo', value: warehouses.length, icon: Truck, tone: 'emerald', valueTone: 'emerald' },
        ]}
      />

      <AppPagePanel title="Giden İrsaliye Listesi">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İrsaliye no, müşteri veya depo ara..."
          className="form-input mb-4 w-full max-w-md text-sm"
        />

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tarih', 'İrsaliye No', 'Müşteri', 'Depo', 'Durum']}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Giden irsaliye bulunamadı.</p>
          ) : rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className="text-xs font-semibold text-gray-300">{formatStockDate(row.date)}</p>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.waybillNo}</p>
                <p className="truncate text-[11px] text-gray-500">
                  {(row.items || []).map((item) => `${item.productName} (${item.quantity})`).join(', ')}
                </p>
              </div>
              <p className="truncate text-xs text-gray-400">{row.customerName || '—'}</p>
              <p className="truncate text-xs text-gray-400">{row.warehouseName}</p>
              <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-bold text-orange-300">{row.status}</span>
            </div>
          ))}
        </div>
      </AppPagePanel>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-dark-500/50 bg-dark-800 p-5 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">Yeni Giden İrsaliye</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">İrsaliye No</label>
                  <input className="form-input text-sm" value={form.waybillNo} onChange={(e) => setForm((c) => ({ ...c, waybillNo: e.target.value }))} placeholder="Otomatik" />
                </div>
                <div>
                  <label className="form-label">Tarih</label>
                  <input type="date" className="form-input text-sm" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Müşteri</label>
                <input className="form-input text-sm" value={form.customerName} onChange={(e) => setForm((c) => ({ ...c, customerName: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Depo</label>
                <select className="form-input text-sm" value={form.warehouseId} onChange={(e) => setForm((c) => ({ ...c, warehouseId: e.target.value }))}>
                  {warehouses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Ürün</label>
                <select className="form-input text-sm" value={form.productId} onChange={(e) => setForm((c) => ({ ...c, productId: e.target.value }))} required>
                  <option value="">Ürün seçin</option>
                  {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Miktar</label>
                <input type="number" min="1" className="form-input text-sm" value={form.quantity} onChange={(e) => setForm((c) => ({ ...c, quantity: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Not</label>
                <textarea className="form-input resize-none text-sm" rows={2} value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:bg-dark-700">Vazgeç</button>
              <button type="submit" className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>İrsaliyeyi Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </AppPageShell>
  )
}
