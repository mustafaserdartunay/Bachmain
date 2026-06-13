import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChevronDown,
  FileText,
  Package,
  Plus,
  Receipt,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react'
import ListHeaderRow from '../Common/ListHeaderRow'
import SummaryMetrics from '../Common/SummaryMetrics'
import { LIST_PILL_CLASS } from '../Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../EditableDropdownPill'
import DepoItemStagePanel from './DepoItemStagePanel'
import { findCustomerProfileByReference, getListCustomerDisplay } from '../../data/customerProfiles'
import { WAREHOUSE_KINDS } from '../../data/depoSeed'
import {
  computeDepoSummary,
  computeDepoLineTotals,
  customerLabel,
  formatDepoDateTime,
  formatQty,
} from '../../utils/depoHelpers'
import { formatTL } from '../../utils/productPricing'
import {
  addWarehouse,
  createDepoWaybill,
  createTransfer,
  issueDepoInvoice,
  loadDepoItems,
  loadDepoTransfers,
  loadDepoWarehouses,
  syncDepoFromProduction,
} from '../../utils/depoStore'
import { getDepoItemStatusLabel, isDepoItemDelivered } from '../../utils/depoStageHelpers'
import { getDepoStageFilterOptions, loadDepoWorkflowStages } from '../../utils/depoWorkflowStages'

const depoListGrid =
  '96px 76px minmax(140px,1fr) minmax(200px,1.5fr) 62px 108px'

const DEPO_PAGE_CONFIG = {
  order: {
    title: 'Depo',
    titleClass: 'text-blue-300',
    subtitle: 'Üretimden gelen ürünler · paketleme ve sevk',
    listTitle: 'Depo Listesi',
    listDescription: 'Depoya gönderilen kalemler burada listelenir',
    emptyHint: 'Üretim takibinde Teslim alanından "Depoya Gönder" ile kalemler buraya gelir.',
    metricInWarehouse: 'Depoda',
  },
}

function canIssueDocuments(item) {
  return getDepoItemStatusLabel(item) !== 'Beklemede'
}

function buildDepoDocumentDraft(item) {
  const totals = computeDepoLineTotals(item)
  const quantity = Math.max(0, Number(item.deliveredQuantity) || totals.quantity)
  const productCode = item.productCode || ''
  const codePrefix = productCode ? `${productCode} · ` : ''
  const invoiceAt = item.invoiceAt || item.depoSentAt || item.createdAt || ''
  return {
    description: [
      item.customer,
      item.product,
      productCode,
      `${quantity} adet`,
      invoiceAt,
    ].filter(Boolean).join(' · '),
    customerName: item.customer || '',
    productName: item.product || '',
    productCode,
    deliveredQuantity: quantity,
    invoiceAt,
    lines: [{
      description: `${codePrefix}${item.product}`,
      quantity,
      unitPrice: totals.unitPriceExcl,
      vat: totals.vatRate,
    }],
    depoItemId: item.id,
    orderId: item.orderId,
  }
}

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function formatListDateTime(value) {
  if (!value) return '—'
  return formatDepoDateTime(value)
}

export default function DepoWorkspace({ warehouseKind = 'order' }) {
  const navigate = useNavigate()
  const pageConfig = DEPO_PAGE_CONFIG[warehouseKind] || DEPO_PAGE_CONFIG.order
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [transfers, setTransfers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ status: 'Tümü' })
  const [activeMenu, setActiveMenu] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [showWarehousePanel, setShowWarehousePanel] = useState(false)
  const [showTransferPanel, setShowTransferPanel] = useState(false)
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    kind: warehouseKind,
    city: '',
  })
  const [transferForm, setTransferForm] = useState({
    depoItemId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '',
    notes: '',
  })
  const [depoStages, setDepoStages] = useState(() => loadDepoWorkflowStages())

  function refresh() {
    syncDepoFromProduction()
    setItems(loadDepoItems())
    setWarehouses(loadDepoWarehouses())
    setTransfers(loadDepoTransfers())
  }

  useEffect(() => {
    refresh()
    function handleDepoStagesUpdated() {
      setDepoStages(loadDepoWorkflowStages())
    }
    window.addEventListener('bach:depo-updated', refresh)
    window.addEventListener('bach:production-updated', refresh)
    window.addEventListener('bach:depo-workflow-stages-updated', handleDepoStagesUpdated)
    return () => {
      window.removeEventListener('bach:depo-updated', refresh)
      window.removeEventListener('bach:production-updated', refresh)
      window.removeEventListener('bach:depo-workflow-stages-updated', handleDepoStagesUpdated)
    }
  }, [])

  const scopedItems = useMemo(() => {
    const warehouseIds = new Set(
      warehouses.filter((warehouse) => warehouse.kind === warehouseKind).map((warehouse) => warehouse.id),
    )
    return items.filter((item) => warehouseIds.has(item.warehouseId))
  }, [items, warehouses, warehouseKind])

  const summary = useMemo(() => computeDepoSummary(scopedItems, warehouses), [scopedItems, warehouses])

  const statusFilterOptions = useMemo(
    () => getDepoStageFilterOptions(depoStages),
    [depoStages],
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return scopedItems.filter((item) => {
      const haystack = `${item.product} ${item.orderId} ${item.productionJobId} ${customerLabel(item.customer)}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (filters.status !== 'Tümü' && getDepoItemStatusLabel(item, depoStages) !== filters.status) return false
      return true
    })
  }, [scopedItems, searchQuery, filters, depoStages])

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function warehouseName(id) {
    return warehouses.find((w) => w.id === id)?.name || '—'
  }

  function handleAddWarehouse(event) {
    event.preventDefault()
    if (!warehouseForm.name.trim()) return
    addWarehouse({
      name: warehouseForm.name.trim(),
      code: warehouseForm.code.trim() || `DEP-${warehouses.length + 1}`,
      kind: warehouseKind,
      city: warehouseForm.city.trim(),
    })
    setWarehouseForm({ name: '', code: '', kind: warehouseKind, city: '' })
    refresh()
  }

  function handleTransfer(event) {
    event.preventDefault()
    if (!transferForm.depoItemId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId) return
    createTransfer(transferForm)
    setTransferForm({ depoItemId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '', notes: '' })
    setShowTransferPanel(false)
    refresh()
  }

  function handleIssueInvoice(item) {
    const updated = issueDepoInvoice(item.id)
    if (!updated) return
    const profile = findCustomerProfileByReference(item.customer)
    if (profile?.id && warehouseKind === 'order') {
      sessionStorage.setItem('erlenbox-depo-document-draft', JSON.stringify(buildDepoDocumentDraft(updated)))
      navigate(`/musteriler/${profile.id}/belge/satis-faturasi`)
      return
    }
    refresh()
  }

  function handleCreateWaybill(item) {
    createDepoWaybill(item.id)
    refresh()
  }

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="flex justify-center">
          <h1 className={`text-2xl font-black uppercase tracking-wide ${pageConfig.titleClass}`}>{pageConfig.title}</h1>
        </div>
        <p className="mt-2 text-xs text-gray-500">{pageConfig.subtitle}</p>
      </div>

      <SummaryMetrics
        items={[
          { title: pageConfig.metricInWarehouse, value: summary.inWarehouse, icon: Package, tone: 'blue', valueTone: 'blue' },
          { title: 'KDV Hariç Toplam', value: formatTL(summary.totalNet), icon: Receipt, tone: 'purple', valueTone: 'red' },
          { title: 'KDV Dahil Toplam', value: formatTL(summary.totalSales), icon: Package, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Faturalanan', value: summary.invoiced, icon: FileText, tone: 'cyan', valueTone: 'cyan' },
          { title: 'Teslim Edildi', value: summary.delivered, icon: Truck, tone: 'orange', valueTone: 'orange' },
        ]}
      />

      <Panel
        title={pageConfig.listTitle}
        description={pageConfig.listDescription}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setShowWarehousePanel((v) => !v); setShowTransferPanel(false) }}
              className="inline-flex items-center gap-1 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              <Warehouse className="h-3.5 w-3.5" />
              Depolar
            </button>
            <button
              type="button"
              onClick={() => { setShowTransferPanel((v) => !v); setShowWarehousePanel(false) }}
              className="inline-flex items-center gap-1 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Transfer
            </button>
            <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
              {filteredItems.length} kayıt
            </span>
          </div>
        )}
      >
        {showWarehousePanel && (
          <div className="mb-4 rounded-2xl border border-dark-500/40 bg-dark-900/30 p-3">
            <form onSubmit={handleAddWarehouse} className="mb-3 grid gap-2 lg:grid-cols-[1fr_100px_120px_auto]">
              <input value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="Depo adı" className="form-input h-9 text-xs" required />
              <input value={warehouseForm.code} onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })} placeholder="Kod" className="form-input h-9 text-xs" />
              <input value={warehouseForm.city} onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })} placeholder="Şehir" className="form-input h-9 text-xs" />
              <button type="submit" className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                <Plus className="h-3.5 w-3.5" />
                Ekle
              </button>
            </form>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {warehouses.filter((warehouse) => warehouse.kind === warehouseKind).map((warehouse) => (
                <div key={warehouse.id} className="rounded-xl border border-dark-500/45 bg-dark-800/55 px-3 py-2">
                  <p className="text-sm font-bold text-white">{warehouse.name}</p>
                  <p className="text-[10px] text-gray-500">{warehouse.code} · {WAREHOUSE_KINDS[warehouse.kind]}</p>
                  <p className="mt-1 text-[10px] font-bold text-cyan-300">
                    {scopedItems.filter((i) => i.warehouseId === warehouse.id && !isDepoItemDelivered(i, depoStages)).length} aktif
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showTransferPanel && (
          <form onSubmit={handleTransfer} className="mb-4 grid gap-2 rounded-2xl border border-dark-500/40 bg-dark-900/30 p-3 lg:grid-cols-6">
            <select value={transferForm.depoItemId} onChange={(e) => setTransferForm({ ...transferForm, depoItemId: e.target.value })} className="form-input h-9 text-xs" required>
              <option value="">Ürün</option>
              {scopedItems.filter((i) => !isDepoItemDelivered(i, depoStages)).map((item) => (
                <option key={item.id} value={item.id}>{item.product}</option>
              ))}
            </select>
            <select value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })} className="form-input h-9 text-xs" required>
              <option value="">Kaynak</option>
              {warehouses.filter((w) => w.kind === warehouseKind).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={transferForm.toWarehouseId} onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })} className="form-input h-9 text-xs" required>
              <option value="">Hedef</option>
              {warehouses.filter((w) => w.kind === warehouseKind).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })} placeholder="Adet" className="form-input h-9 text-xs" />
            <input value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} placeholder="Not" className="form-input h-9 text-xs" />
            <button type="submit" className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Transfer</button>
          </form>
        )}

        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş, ürün veya müşteri ara..."
              className="form-input pl-10"
            />
          </div>
          <div className="rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Durum</p>
            <EditableDropdownPill
              value={filters.status}
              options={statusFilterOptions}
              includePlaceholderOption={false}
              editable={false}
              buttonClassName={LIST_PILL_CLASS}
              openKey={`filter-depo-status-${warehouseKind}`}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onChange={(value) => updateFilter('status', value)}
            />
          </div>
        </div>

        <ListHeaderRow
          gridTemplate={depoListGrid}
          columns={[
            'Tarih',
            'Sipariş',
            'Müşteri Adı',
            'Süreç',
            { label: 'Adet', align: 'right', className: 'pr-1' },
            { label: 'İşlem', align: 'right' },
          ]}
        />

        <div className="mt-3 space-y-2 overflow-visible">
          {filteredItems.map((item) => {
            const customerDisplay = typeof item.customer === 'object'
              ? getListCustomerDisplay(item.customer)
              : { brandShortName: item.customer, companyTitle: '' }
            const isExpanded = expandedId === item.id
            const docsReady = canIssueDocuments(item)

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? 'relative z-40 overflow-visible border-blue-500/40 bg-dark-800/70 shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
                    : 'overflow-hidden border-dark-500/45 bg-dark-800/55 hover:border-blue-500/35 hover:bg-dark-700/60'
                }`}
              >
                <div
                  className="relative grid items-center gap-2 px-3 py-3"
                  style={{ gridTemplateColumns: depoListGrid }}
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{formatListDateTime(item.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black tabular-nums text-blue-300">{item.orderId || item.productionJobId}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-1.5 text-sm font-black text-white">
                      <span className="truncate">{customerDisplay.brandShortName || 'Müşteri yok'}</span>
                      {customerDisplay.companyTitle && (
                        <span className="inline-flex min-w-0 items-center rounded-lg border border-dark-500/45 bg-dark-700/60 px-2 py-0.5 text-[10px] font-black text-gray-400">
                          <span className="truncate">{customerDisplay.companyTitle}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <DepoItemStagePanel
                      item={item}
                      warehouses={warehouses}
                      onRefresh={refresh}
                      compact
                    />
                  </div>
                  <p className="min-w-0 pr-1 text-right text-sm font-black tabular-nums text-white">
                    {formatQty(item.producedQuantity)}
                  </p>
                  <div className="relative z-10 flex items-center justify-end gap-1">
                    {docsReady && !item.invoiceNo && (
                      <button
                        type="button"
                        onClick={() => handleIssueInvoice(item)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 transition-colors hover:bg-emerald-500/20"
                        title="Fatura kes"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {docsReady && !item.waybillNo && (
                      <button
                        type="button"
                        onClick={() => handleCreateWaybill(item)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-1.5 text-blue-300 transition-colors hover:bg-blue-500/20"
                        title="İrsaliye oluştur"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={`rounded-lg border p-1.5 transition-colors ${
                        isExpanded
                          ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                          : 'border-dark-500/50 bg-dark-700/70 text-gray-400 hover:border-blue-500/40 hover:text-blue-300'
                      }`}
                      title={isExpanded ? 'Kapat' : 'Detay ve sevkiyat'}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-dark-500/40 bg-gradient-to-b from-dark-900/50 to-dark-900/20 px-4 py-4">
                    <DepoItemStagePanel
                      item={item}
                      warehouses={warehouses}
                      onRefresh={refresh}
                      onIssueInvoice={handleIssueInvoice}
                      onCreateWaybill={handleCreateWaybill}
                      expanded
                    />
                  </div>
                )}
              </div>
            )
          })}

          {filteredItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-8 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-white">{pageConfig.title} kaydı bulunamadı</p>
              <p className="mt-1 text-xs text-gray-500">{pageConfig.emptyHint}</p>
            </div>
          )}
        </div>

        {transfers.filter((transfer) => {
          const from = warehouses.find((w) => w.id === transfer.fromWarehouseId)
          const to = warehouses.find((w) => w.id === transfer.toWarehouseId)
          return from?.kind === warehouseKind || to?.kind === warehouseKind
        }).length > 0 && (
          <div className="mt-4 rounded-xl border border-dark-500/40 bg-dark-900/20 p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Son transferler</p>
            <div className="space-y-1">
              {transfers
                .filter((transfer) => {
                  const from = warehouses.find((w) => w.id === transfer.fromWarehouseId)
                  const to = warehouses.find((w) => w.id === transfer.toWarehouseId)
                  return from?.kind === warehouseKind || to?.kind === warehouseKind
                })
                .slice(0, 5)
                .map((transfer) => (
                <p key={transfer.id} className="text-[11px] text-gray-400">
                  {formatListDateTime(transfer.createdAt)} · {transfer.product} · {warehouseName(transfer.fromWarehouseId)} → {warehouseName(transfer.toWarehouseId)}
                </p>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  )
}
