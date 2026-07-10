import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCw, Tags, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { formatTL } from '../../utils/productPricing'
import {
  deletePriceList,
  getPriceLists,
  savePriceList,
  syncPriceListFromProducts,
} from '../../utils/stockStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const LIST_GRID = 'minmax(180px,1.2fr) 100px 100px minmax(120px,1fr) 90px'

function emptyForm() {
  return {
    id: '',
    name: '',
    currency: 'TRY',
    isDefault: false,
    notes: '',
    items: [],
  }
}

export default function PriceListsPage() {
  const [lists, setLists] = useState(() => getPriceLists())
  const [selectedId, setSelectedId] = useState(() => getPriceLists()[0]?.id || '')
  const [panelOpen, setPanelOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const refresh = useCallback(() => {
    const next = getPriceLists()
    setLists(next)
    if (!next.some((item) => item.id === selectedId)) {
      setSelectedId(next[0]?.id || '')
    }
  }, [selectedId])

  useEffect(() => {
    window.addEventListener('erlenbox:stock-updated', refresh)
    return () => window.removeEventListener('erlenbox:stock-updated', refresh)
  }, [refresh])

  const selected = lists.find((item) => item.id === selectedId) || lists[0]
  const itemCount = lists.reduce((sum, list) => sum + (list.items?.length || 0), 0)

  const rows = useMemo(() => selected?.items || [], [selected])

  function handleSave(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      window.alert('Liste adı zorunludur.')
      return
    }
    const saved = savePriceList(form)
    setSelectedId(saved.id)
    setPanelOpen(false)
    setForm(emptyForm())
    refresh()
  }

  function handleDelete(listId) {
    if (!window.confirm('Bu fiyat listesini silmek istediğinize emin misiniz?')) return
    deletePriceList(listId)
    refresh()
  }

  function handleSync() {
    if (!selected?.id) return
    try {
      syncPriceListFromProducts(selected.id)
      refresh()
    } catch (error) {
      window.alert(error.message || 'Senkronizasyon başarısız.')
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Fiyat Listeleri"
        actions={(
          <button type="button" onClick={() => { setForm(emptyForm()); setPanelOpen(true) }} className={`${BTN_PRIMARY} gap-1.5 px-4 py-2 text-xs`}>
            <Plus className="h-4 w-4" /> Yeni Liste
          </button>
        )}
      />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Fiyat Listesi', value: lists.length, icon: Tags, tone: 'purple', valueTone: 'purple' },
          { title: 'Toplam Kalem', value: itemCount, icon: Tags, tone: 'blue', valueTone: 'blue' },
          { title: 'Seçili Liste', value: selected?.items?.length || 0, icon: Tags, tone: 'emerald', valueTone: 'emerald' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AppPagePanel title="Listeler">
          <div className="space-y-2">
            {lists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setSelectedId(list.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-colors ${
                  selected?.id === list.id
                    ? 'border-purple-500/40 bg-purple-500/10'
                    : 'border-dark-500/40 bg-dark-800/55 hover:bg-dark-800/80'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-white">{list.name}</p>
                  <p className="text-[13px] text-gray-500">{list.items?.length || 0} kalem · {list.currency}</p>
                </div>
                {!list.isDefault && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDelete(list.id)
                    }}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </button>
            ))}
          </div>
        </AppPagePanel>

        <AppPagePanel
          title={selected ? `${selected.name} Kalemleri` : 'Fiyat Kalemleri'}
          action={selected ? (
            <button type="button" onClick={handleSync} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
              <RefreshCw className="h-3.5 w-3.5" /> Ürünlerden Güncelle
            </button>
          ) : null}
        >
          <ListHeaderRow
            gridTemplate={LIST_GRID}
            columns={['Ürün', 'Stok Kodu', 'KDV', { label: 'Fiyat', align: 'right' }, 'Durum']}
          />

          <div className="mt-2 space-y-2">
            {rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">Bu listede kalem yok. Ürünlerden güncelleyebilirsiniz.</p>
            ) : rows.map((row) => (
              <div
                key={`${selected.id}-${row.productId}-${row.sku}`}
                className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
                style={{ gridTemplateColumns: LIST_GRID }}
              >
                <p className="truncate text-sm font-bold text-white">{row.productName}</p>
                <p className="text-xs text-gray-400">{row.sku || '—'}</p>
                <p className="text-xs text-gray-400">%{row.vatRate ?? 0}</p>
                <p className="text-right text-sm font-black text-purple-300">{formatTL(row.price)}</p>
                <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-bold text-emerald-300">Aktif</span>
              </div>
            ))}
          </div>
        </AppPagePanel>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl border border-dark-500/50 bg-dark-800 p-5 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">Yeni Fiyat Listesi</h3>
            <div className="space-y-3">
              <div>
                <label className="form-label">Liste Adı</label>
                <input className="form-input text-sm" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Para Birimi</label>
                <select className="form-input text-sm" value={form.currency} onChange={(e) => setForm((c) => ({ ...c, currency: e.target.value }))}>
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="form-label">Not</label>
                <textarea className="form-input resize-none text-sm" rows={2} value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-xl px-4 py-2 text-sm text-gray-400 hover:bg-dark-700">Vazgeç</button>
              <button type="submit" className={`${BTN_SUCCESS} px-4 py-2 text-sm`}>Listeyi Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </AppPageShell>
  )
}
