import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  FileText,
  Package,
  Plus,
  Receipt,
  Trash2,
  Truck,
  Undo2,
  Warehouse,
} from 'lucide-react'
import { EmptyState } from '@bachmain/ui'
import { resolveStockScope } from '../../utils/stockScope'
import { loadLoadPlans } from '../../utils/logisticsStore'
import SearchInput from '../Common/SearchInput'
import SummaryMetrics from '../Common/SummaryMetrics'
import SplitCreateButton from '../Common/SplitCreateButton'
import QuoteDeletedArchivedPanel from '../Common/QuoteDeletedArchivedPanel'
import QuoteOrderInlineConfirm from '../Common/QuoteOrderInlineConfirm'
import ProcessListRowMoreMenu from '../Common/ProcessListRowMoreMenu'
import {
  QuoteListCell,
  QuoteListColumnHeader,
  QuoteListRowPanel,
  QuoteListSelectionCheckbox,
  TurkishLiraIcon,
} from '../Common/QuoteStyleListChrome'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../Layout/AppPageLayout'
import EditableDropdownPill from '../EditableDropdownPill'
import DepoItemStagePanel from './DepoItemStagePanel'
import { findCustomerProfileByReference, getListCustomerDisplay } from '../../data/customerProfiles'
import { WAREHOUSE_KINDS } from '../../data/depoSeed'
import {
  computeDepoSummary,
  computeDepoLineTotals,
  customerLabel,
  formatQty,
} from '../../utils/depoHelpers'
import { formatTL } from '../../utils/productPricing'
import {
  addWarehouse,
  advanceDepoItemStatus,
  createDepoWaybill,
  createTransfer,
  deleteDepoItem,
  issueDepoInvoice,
  loadDepoItems,
  loadDepoTransfers,
  loadDepoWarehouses,
  permanentlyDeleteDepoItem,
  restoreDeletedDepoItem,
  removeDepoItemById,
  syncDepoFromProduction,
} from '../../utils/depoStore'
import { getProductionJobById, updateProductionJob } from '../../utils/productionStore'
import { getLineQuantityRows, syncLineQuantitiesFromRows } from '../../utils/productionLineItems'
import { getDepoItemStatusLabel, isDepoItemDelivered } from '../../utils/depoStageHelpers'
import { getDepoStageFilterOptions, loadDepoWorkflowStages } from '../../utils/depoWorkflowStages'
import { resolveQuoteCode } from '../../utils/documentCodes'
import { formatListDateParts } from '../../utils/quoteListDateFormat'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import {
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
} from '../../utils/dashboardDesign'

const DEPO_STOCK_TABS = [
  { id: 'general', label: 'Genel Stok' },
  { id: 'customer', label: 'Müşteri Stokları' },
  { id: 'pending_ship', label: 'Bekleyen Sevkiyatlar' },
  { id: 'planned', label: 'Planlanan Lojistik' },
  { id: 'in_transit', label: 'Teslimatta' },
  { id: 'delivered', label: 'Teslim Edildi' },
]

const DEPO_PAGE_CONFIG = {
  order: {
    title: 'Depo',
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
  const productionCode = item.productionCode || item.productionJobId || ''
  const codePrefix = [productionCode, productCode].filter(Boolean).join(' · ')
  const invoiceAt = item.invoiceAt || item.depoSentAt || item.createdAt || ''
  return {
    description: [
      item.customer,
      item.product,
      productionCode,
      productCode,
      `${quantity} adet`,
      invoiceAt,
    ]
      .filter(Boolean)
      .join(' · '),
    customerName: item.customer || '',
    productName: item.product || '',
    productCode,
    productionCode,
    deliveredQuantity: quantity,
    invoiceAt,
    lines: [
      {
        description: `${codePrefix ? `${codePrefix} · ` : ''}${item.product}`,
        quantity,
        unitPrice: totals.unitPriceExcl,
        vat: totals.vatRate,
      },
    ],
    depoItemId: item.id,
    orderId: item.orderId,
  }
}

function compareSortValue(a, b, dir) {
  const sign = dir === 'desc' ? -1 : 1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign
  return String(a || '').localeCompare(String(b || ''), 'tr', { numeric: true }) * sign
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
  const [stockTab, setStockTab] = useState('customer')
  const [loadPlans, setLoadPlans] = useState(() => loadLoadPlans())
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
  const listColumnSortRef = useRef(listColumnSort)
  listColumnSortRef.current = listColumnSort
  const listColumnSortLockRef = useRef(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [archiveReceiveKey, setArchiveReceiveKey] = useState(0)

  const stockFilterOptions = DEPO_STOCK_TABS.map((tab) => ({
    label: tab.label,
    color: 'bg-gray-500',
    id: tab.id,
  }))
  const stockTabLabel =
    DEPO_STOCK_TABS.find((tab) => tab.id === stockTab)?.label || 'Müşteri Stokları'
  const isLogisticsTab = stockTab === 'planned' || stockTab === 'in_transit'

  function refresh() {
    syncDepoFromProduction()
    setItems(loadDepoItems())
    setWarehouses(loadDepoWarehouses())
    setTransfers(loadDepoTransfers())
    setLoadPlans(loadLoadPlans())
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

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeActiveMenu() {
      setActiveMenu(null)
    }
    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  const scopedItems = useMemo(() => {
    const warehouseIds = new Set(
      warehouses
        .filter((warehouse) => warehouse.kind === warehouseKind)
        .map((warehouse) => warehouse.id),
    )
    return items.filter((item) => warehouseIds.has(item.warehouseId))
  }, [items, warehouses, warehouseKind])

  const summary = useMemo(
    () => computeDepoSummary(scopedItems, warehouses),
    [scopedItems, warehouses],
  )
  const statusFilterOptions = useMemo(() => getDepoStageFilterOptions(depoStages), [depoStages])
  const stageDropdownOptions = useMemo(
    () => statusFilterOptions.filter((option) => option.label !== 'Tümü'),
    [statusFilterOptions],
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return scopedItems.filter((item) => {
      const scope = resolveStockScope(item)
      if (stockTab === 'general' && scope !== 'general') return false
      if (stockTab === 'customer' && scope !== 'customer') return false
      if (stockTab === 'pending_ship') {
        const label = getDepoItemStatusLabel(item, depoStages)
        if (isDepoItemDelivered(item, depoStages)) return false
        if (label === 'Teslim Edildi') return false
      }
      if (stockTab === 'delivered' && !isDepoItemDelivered(item, depoStages)) return false
      if (stockTab === 'planned' || stockTab === 'in_transit') return false

      const haystack =
        `${item.product} ${item.orderId} ${item.productionJobId} ${item.productionCode} ${customerLabel(item.customer)}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (filters.status !== 'Tümü' && getDepoItemStatusLabel(item, depoStages) !== filters.status)
        return false
      return true
    })
  }, [scopedItems, searchQuery, filters, depoStages, stockTab])

  const listItems = useMemo(() => {
    if (!listColumnSort.key) return filteredItems
    const dir = listColumnSort.dir
    const ids = items.map((item) => item.id)
    return [...filteredItems].sort((a, b) => {
      const valueOf = (item) => {
        if (listColumnSort.key === 'date') return item.createdAt || ''
        if (listColumnSort.key === 'code')
          return item.productionCode || resolveQuoteCode(item.id, ids)
        if (listColumnSort.key === 'customer') {
          const display =
            typeof item.customer === 'object'
              ? getListCustomerDisplay(item.customer)
              : getListCustomerDisplay(item.customer)
          return (
            display.brandShortName || display.companyTitle || customerLabel(item.customer) || ''
          )
        }
        if (listColumnSort.key === 'process') return getDepoItemStatusLabel(item, depoStages)
        if (listColumnSort.key === 'qty')
          return Number(item.deliveredQuantity) || Number(item.quantity) || 0
        if (listColumnSort.key === 'amount') return computeDepoLineTotals(item).gross
        return ''
      }
      return compareSortValue(valueOf(a), valueOf(b), dir)
    })
  }, [filteredItems, listColumnSort, items, depoStages])

  const logisticsTabPlans = useMemo(() => {
    if (stockTab === 'planned') {
      return loadPlans.filter((p) => ['draft', 'planned', 'active'].includes(p.status || 'draft'))
    }
    if (stockTab === 'in_transit') {
      return loadPlans.filter((p) => p.status === 'in_transit')
    }
    return []
  }, [loadPlans, stockTab])

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
    if (!transferForm.depoItemId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId)
      return
    createTransfer(transferForm)
    setTransferForm({
      depoItemId: '',
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: '',
      notes: '',
    })
    setShowTransferPanel(false)
    refresh()
  }

  function handleIssueInvoice(item) {
    const updated = issueDepoInvoice(item.id)
    if (!updated) return
    const profile = findCustomerProfileByReference(item.customer)
    if (profile?.id && warehouseKind === 'order') {
      sessionStorage.setItem(
        'erlenbox-depo-document-draft',
        JSON.stringify(buildDepoDocumentDraft(updated)),
      )
      navigate(`/musteriler/${profile.id}/belge/satis-faturasi`)
      return
    }
    refresh()
  }

  function handleCreateWaybill(item) {
    createDepoWaybill(item.id)
    refresh()
  }

  function handleDeliverItem(item) {
    if (isDepoItemDelivered(item, depoStages)) return
    advanceDepoItemStatus(item.id, 'Teslim Edildi')
    refresh()
  }

  function handleCancelDepoItem(item) {
    if (item.productionJobId && item.lineItemId && item.quantityRowId) {
      const job = getProductionJobById(item.productionJobId)
      if (job) {
        const lineItems = (job.lineItems || []).map((line) => {
          if (line.id !== item.lineItemId) return line
          const rows = getLineQuantityRows(line).map((row) =>
            row.id === item.quantityRowId
              ? { ...row, depoItemId: '', depoSentAt: '', invoiceNo: '', invoiceAt: '' }
              : row,
          )
          const synced = syncLineQuantitiesFromRows(rows)
          return { ...line, ...synced, quantityRows: synced.quantityRows }
        })
        updateProductionJob(job.id, { lineItems })
      }
    }
    removeDepoItemById(item.id)
    refresh()
  }

  function toggleListColumnSort(key) {
    if (listColumnSortLockRef.current) return
    listColumnSortLockRef.current = true
    window.setTimeout(() => {
      listColumnSortLockRef.current = false
    }, 0)
    const current = listColumnSortRef.current
    const next =
      current.key !== key
        ? { key, dir: 'asc' }
        : { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    listColumnSortRef.current = next
    setListColumnSort(next)
  }

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedIds([])
  }

  function toggleBulkSelect(id) {
    const key = String(id)
    setSelectedIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleBulkSelectAll(ids) {
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? [] : ids)
  }

  function softDeleteItemWithAnimation(item) {
    if (!item?.id) return
    const key = String(item.id)
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteDepoItem(item.id)
      refresh()
      setAnimatingDeleteIds((current) => current.filter((entry) => entry !== key))
      setArchiveReceiveKey((current) => current + 1)
      flushWorkspaceNow()
    }, 880)
  }

  function handleBulkDelete() {
    listItems
      .filter((item) => selectedIds.includes(String(item.id)))
      .forEach((item) => softDeleteItemWithAnimation(item))
    exitBulkSelectMode()
  }

  const listItemIds = listItems.map((item) => String(item.id))
  const allVisibleSelected =
    listItemIds.length > 0 && listItemIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected =
    listItemIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected

  const depoListBaseColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.5rem',
    '6.75rem',
    '3rem',
  ]
  const depoListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...depoListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  const relatedTransfers = transfers.filter((transfer) => {
    const from = warehouses.find((w) => w.id === transfer.fromWarehouseId)
    const to = warehouses.find((w) => w.id === transfer.toWarehouseId)
    return from?.kind === warehouseKind || to?.kind === warehouseKind
  })

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="DEPO"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <SplitCreateButton
            label="Yeni Depo İşlemi"
            onPrimaryClick={() => {
              setShowWarehousePanel(true)
              setShowTransferPanel(false)
            }}
            menuAriaLabel="Depo seçenekleri"
            menuItems={[
              {
                id: 'warehouse',
                label: 'Yeni Depo Ekle',
                icon: Warehouse,
                iconClassName: 'text-blue-300',
                onClick: () => {
                  setShowWarehousePanel(true)
                  setShowTransferPanel(false)
                },
              },
              {
                id: 'transfer',
                label: 'Transfer Oluştur',
                icon: ArrowLeftRight,
                iconClassName: 'text-emerald-300',
                onClick: () => {
                  setShowTransferPanel(true)
                  setShowWarehousePanel(false)
                },
              },
              {
                id: 'load',
                label: 'Yük Hesaplama',
                icon: Truck,
                iconClassName: 'text-orange-300',
                onClick: () => navigate('/lojistik/yukleme-plani'),
              },
            ]}
          />
        }
      />

      <SummaryMetrics
        columns={5}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: pageConfig.metricInWarehouse,
            value: summary.inWarehouse,
            icon: Package,
            valueTone: 'text-violet-800',
          },
          {
            title: 'KDV Hariç',
            value: formatTL(summary.totalNet),
            icon: TurkishLiraIcon,
            tone: 'purple',
            valueTone: 'text-blue-800',
          },
          {
            title: 'KDV Dahil',
            value: formatTL(summary.totalSales),
            icon: Package,
            tone: 'emerald',
            valueTone: 'text-emerald-800',
          },
          {
            title: 'Faturalanan',
            value: summary.invoiced,
            icon: FileText,
            tone: 'orange',
            valueTone: 'text-[#ea580c]',
          },
          {
            title: 'Teslim Edildi',
            value: summary.delivered,
            icon: Truck,
            tone: 'orange',
            valueTone: 'text-emerald-800',
          },
        ]}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 px-1">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Filtre :</span>
          </div>
          <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Stok :</p>
              <EditableDropdownPill
                value={stockTabLabel}
                options={stockFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-depo-stock"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => {
                  const next = DEPO_STOCK_TABS.find((tab) => tab.label === value)
                  if (next) setStockTab(next.id)
                }}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Durum :</p>
              <EditableDropdownPill
                value={filters.status}
                options={statusFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="filter-depo-status"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('status', value)}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Depo Listesi :</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş, ürün veya müşteri ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>
            {isLogisticsTab ? logisticsTabPlans.length : filteredItems.length} Kayıt
          </span>
        </div>
      </AppPagePanel>

      {showWarehousePanel ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <form
            onSubmit={handleAddWarehouse}
            className="mb-3 grid gap-2 lg:grid-cols-[1fr_100px_120px_auto]"
          >
            <input
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              placeholder="Depo adı"
              className="form-input h-9 text-[14px]"
              required
            />
            <input
              value={warehouseForm.code}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
              placeholder="Kod"
              className="form-input h-9 text-[14px]"
            />
            <input
              value={warehouseForm.city}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
              placeholder="Şehir"
              className="form-input h-9 text-[14px]"
            />
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Ekle
            </button>
          </form>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {warehouses
              .filter((warehouse) => warehouse.kind === warehouseKind)
              .map((warehouse) => (
                <div key={warehouse.id} className="rounded-xl px-3 py-2">
                  <p className={`${YF_TEXT_CLASS} !font-bold`}>{warehouse.name}</p>
                  <p className={YF_TEXT_CLASS}>
                    {warehouse.code} · {WAREHOUSE_KINDS[warehouse.kind]}
                  </p>
                  <p className={YF_TEXT_CLASS}>
                    {
                      scopedItems.filter(
                        (item) =>
                          item.warehouseId === warehouse.id &&
                          !isDepoItemDelivered(item, depoStages),
                      ).length
                    }{' '}
                    aktif
                  </p>
                </div>
              ))}
          </div>
        </AppPagePanel>
      ) : null}

      {showTransferPanel ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <form onSubmit={handleTransfer} className="grid gap-2 lg:grid-cols-6">
            <select
              value={transferForm.depoItemId}
              onChange={(e) => setTransferForm({ ...transferForm, depoItemId: e.target.value })}
              className="form-input h-9 text-[14px]"
              required
            >
              <option value="">Ürün</option>
              {scopedItems
                .filter((item) => !isDepoItemDelivered(item, depoStages))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.product}
                  </option>
                ))}
            </select>
            <select
              value={transferForm.fromWarehouseId}
              onChange={(e) =>
                setTransferForm({ ...transferForm, fromWarehouseId: e.target.value })
              }
              className="form-input h-9 text-[14px]"
              required
            >
              <option value="">Kaynak</option>
              {warehouses
                .filter((w) => w.kind === warehouseKind)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
            <select
              value={transferForm.toWarehouseId}
              onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
              className="form-input h-9 text-[14px]"
              required
            >
              <option value="">Hedef</option>
              {warehouses
                .filter((w) => w.kind === warehouseKind)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
            <input
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              placeholder="Adet"
              className="form-input h-9 text-[14px]"
            />
            <input
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              placeholder="Not"
              className="form-input h-9 text-[14px]"
            />
            <button type="submit" className="btn-primary">
              Transfer
            </button>
          </form>
        </AppPagePanel>
      ) : null}

      {isLogisticsTab ? (
        logisticsTabPlans.length === 0 ? (
          <AppPagePanel className="customer-filter-panel w-full">
            <EmptyState title="Kayıt yok." description="Yük Hesaplama’dan plan kaydedin." />
          </AppPagePanel>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
            <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
              <div className="quote-list-board">
                {logisticsTabPlans.map((plan) => (
                  <QuoteListRowPanel
                    key={plan.id}
                    gridTemplate="6.5rem minmax(16rem,1fr) 8rem 6.5rem"
                  >
                    <QuoteListCell>
                      <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                        {plan.code || plan.id}
                      </span>
                    </QuoteListCell>
                    <QuoteListCell>
                      <span className={YF_TEXT_CLASS}>
                        {(plan.pallets || []).length} palet
                        {plan.meta?.fillPct != null ? ` · %${plan.meta.fillPct} doluluk` : ''}
                      </span>
                    </QuoteListCell>
                    <QuoteListCell>
                      <span className={YF_TEXT_CLASS}>{plan.status || 'draft'}</span>
                    </QuoteListCell>
                    <QuoteListCell>
                      <Link to="/lojistik/planlanan" className={YF_TEXT_CLASS}>
                        Detay
                      </Link>
                    </QuoteListCell>
                  </QuoteListRowPanel>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          {listItems.length === 0 ? (
            <AppPagePanel className="customer-filter-panel w-full">
              <EmptyState title="Depo kaydı bulunamadı." description={pageConfig.emptyHint} />
            </AppPagePanel>
          ) : null}

          <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
            <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
              {listItems.length > 0 ? (
                <div className="quote-list-board">
                  <QuoteListRowPanel header gridTemplate={depoListColumnGrid}>
                    {bulkSelectMode ? (
                      <QuoteListCell>
                        <QuoteListSelectionCheckbox
                          checked={allVisibleSelected}
                          indeterminate={someVisibleSelected}
                          aria-label="Tümünü seç"
                          onChange={() => toggleBulkSelectAll(listItemIds)}
                        />
                      </QuoteListCell>
                    ) : null}
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Tarih"
                        sortable
                        sortKey="date"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Kod"
                        sortable
                        sortKey="code"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Müşteri Adı"
                        sortable
                        sortKey="customer"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Süreç"
                        sortable
                        sortKey="process"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Adet"
                        sortable
                        sortKey="qty"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Tutar"
                        sortable
                        sortKey="amount"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      {bulkSelectMode && selectedIds.length > 0 ? (
                        <QuoteOrderInlineConfirm
                          label="Sil"
                          labelClass="quote-order-undo-sil"
                          ariaLabel={`${selectedIds.length} depo kaydı silinsin mi?`}
                          onConfirm={handleBulkDelete}
                          onCancel={exitBulkSelectMode}
                        />
                      ) : (
                        <button
                          type="button"
                          className={`quote-list-bulk-trash-btn${bulkSelectMode ? ' is-active' : ''}`}
                          title={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil'}
                          aria-label={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil modu'}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (!bulkSelectMode) {
                              setBulkSelectMode(true)
                              setSelectedIds([])
                              return
                            }
                            exitBulkSelectMode()
                          }}
                        >
                          <Trash2
                            className={COP_KUTUSU_ICON_CLASS}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </button>
                      )}
                    </QuoteListCell>
                  </QuoteListRowPanel>

                  {listItems.map((item, rowIndex) => {
                    const stamp = formatListDateParts(item.createdAt)
                    const display =
                      typeof item.customer === 'object'
                        ? getListCustomerDisplay(item.customer)
                        : getListCustomerDisplay(item.customer)
                    const itemKey = String(item.id)
                    const isBulkSelected = selectedIds.includes(itemKey)
                    const isAnimatingOut = animatingDeleteIds.includes(itemKey)
                    const isExpanded = expandedId === item.id
                    const incomingQuantity = Math.max(
                      0,
                      Number(item.deliveredQuantity) ||
                        Number(item.quantity) ||
                        Number(item.producedQuantity) ||
                        0,
                    )
                    const statusLabel = getDepoItemStatusLabel(item, depoStages)
                    const totals = computeDepoLineTotals(item)
                    const docsReady = canIssueDocuments(item)
                    const extraItems = []
                    if (!isDepoItemDelivered(item, depoStages)) {
                      extraItems.push({
                        id: 'cancel',
                        icon: Undo2,
                        label: 'Vazgeç',
                        tone: 'primary',
                        onClick: () => handleCancelDepoItem(item),
                      })
                      extraItems.push({
                        id: 'deliver',
                        icon: Truck,
                        label: 'Teslim et',
                        tone: 'success',
                        onClick: () => handleDeliverItem(item),
                      })
                      if (!item.invoiceNo && docsReady) {
                        extraItems.push({
                          id: 'invoice',
                          icon: Receipt,
                          label: 'Fatura kes',
                          tone: 'primary',
                          onClick: () => handleIssueInvoice(item),
                        })
                      }
                      if (docsReady && !item.waybillNo) {
                        extraItems.push({
                          id: 'waybill',
                          icon: FileText,
                          label: 'İrsaliye oluştur',
                          tone: 'primary',
                          onClick: () => handleCreateWaybill(item),
                        })
                      }
                    }
                    extraItems.push({
                      id: 'detail',
                      icon: Package,
                      label: isExpanded ? 'Detayı Kapat' : 'Detay',
                      tone: 'primary',
                      onClick: () => setExpandedId(isExpanded ? null : item.id),
                    })

                    return (
                      <div key={item.id}>
                        <div
                          className={
                            isAnimatingOut
                              ? 'quote-list-row-into-trash-wrap'
                              : bulkSelectMode
                                ? undefined
                                : 'cursor-pointer'
                          }
                          style={
                            isAnimatingOut
                              ? { animationDelay: `${Math.min(rowIndex, 6) * 70}ms` }
                              : undefined
                          }
                          role={bulkSelectMode && !isAnimatingOut ? undefined : 'button'}
                          tabIndex={bulkSelectMode && !isAnimatingOut ? undefined : 0}
                          onClick={() => {
                            if (isAnimatingOut) return
                            if (bulkSelectMode) toggleBulkSelect(item.id)
                            else setExpandedId(isExpanded ? null : item.id)
                          }}
                          onKeyDown={(event) => {
                            if (bulkSelectMode || isAnimatingOut) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setExpandedId(isExpanded ? null : item.id)
                            }
                          }}
                        >
                          <QuoteListRowPanel
                            gridTemplate={depoListColumnGrid}
                            className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                          >
                            {bulkSelectMode ? (
                              <QuoteListCell>
                                <QuoteListSelectionCheckbox
                                  checked={isBulkSelected}
                                  aria-label={`${item.product || item.id} seç`}
                                  onChange={() => toggleBulkSelect(item.id)}
                                />
                              </QuoteListCell>
                            ) : null}
                            <QuoteListCell>
                              {stamp.date ? (
                                <span className="flex flex-col items-center justify-center gap-0.5 tabular-nums">
                                  <span className="text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
                                    {stamp.date}
                                  </span>
                                  {stamp.time ? (
                                    <span className="text-[12px] font-normal leading-tight text-[var(--muted)]/75">
                                      {stamp.time}
                                    </span>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="block text-center text-[14px] font-normal text-[var(--muted)]">
                                  —
                                </span>
                              )}
                            </QuoteListCell>
                            <QuoteListCell>
                              <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                                {item.productionCode ||
                                  resolveQuoteCode(
                                    item.id,
                                    items.map((entry) => entry.id),
                                  )}
                              </span>
                            </QuoteListCell>
                            <QuoteListCell>
                              <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                                <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                                  {display.brandShortName ||
                                    customerLabel(item.customer) ||
                                    'Müşteri girilmedi'}
                                </span>
                                {display.companyTitle ? (
                                  <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                    {display.companyTitle}
                                  </span>
                                ) : item.product ? (
                                  <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                    {item.product}
                                  </span>
                                ) : null}
                              </span>
                            </QuoteListCell>
                            <QuoteListCell>
                              <span
                                className="flex w-full items-center justify-center"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <EditableDropdownPill
                                  value={statusLabel || stageDropdownOptions[0]?.label || '—'}
                                  options={stageDropdownOptions}
                                  includePlaceholderOption={false}
                                  editable={false}
                                  buttonClassName={PAGE_LIST_PILL_CLASS}
                                  wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                                  menuClassName={PAGE_FILTER_MENU_CLASS}
                                  menuMatchWidth={false}
                                  openKey={`${item.id}-process`}
                                  activeMenu={activeMenu}
                                  setActiveMenu={setActiveMenu}
                                  onChange={(value) => {
                                    advanceDepoItemStatus(item.id, value)
                                    refresh()
                                  }}
                                />
                              </span>
                            </QuoteListCell>
                            <QuoteListCell>
                              <span
                                className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}
                              >
                                {formatQty(incomingQuantity)}
                              </span>
                            </QuoteListCell>
                            <QuoteListCell>
                              <span
                                className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}
                              >
                                {formatTL(totals.gross)}
                              </span>
                            </QuoteListCell>
                            <QuoteListCell>
                              <span
                                className="inline-flex w-full items-center justify-center"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <ProcessListRowMoreMenu
                                  record={item}
                                  deleteAriaLabel="Depo kaydı sil"
                                  onEdit={() => setExpandedId(isExpanded ? null : item.id)}
                                  onDelete={() => softDeleteItemWithAnimation(item)}
                                  extraItems={extraItems}
                                />
                              </span>
                            </QuoteListCell>
                          </QuoteListRowPanel>
                        </div>
                        {isExpanded ? (
                          <AppPagePanel className="customer-list-panel w-full">
                            <DepoItemStagePanel
                              item={item}
                              warehouses={warehouses}
                              onRefresh={refresh}
                              onIssueInvoice={handleIssueInvoice}
                              onCreateWaybill={handleCreateWaybill}
                              expanded
                            />
                          </AppPagePanel>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}

              <QuoteDeletedArchivedPanel
                layoutMode="inline"
                title="Silinenler"
                collection="depo"
                storeEvent="bach:depo-updated"
                restoreRecord={restoreDeletedDepoItem}
                permanentlyDelete={permanentlyDeleteDepoItem}
                resolveCode={(id, extraIds) => {
                  const item = items.find((entry) => entry.id === id)
                  return item?.productionCode || resolveQuoteCode(id, extraIds)
                }}
                onRestored={() => {
                  refresh()
                  flushWorkspaceNow()
                }}
                emptyMessage="Silinen depo kaydı yok."
                receivePulseKey={archiveReceiveKey}
                className="customer-deleted-archived-panel w-full"
                segmentTabs={[{ id: 'process', label: 'Süreç' }]}
                getProcessValue={(item) => getDepoItemStatusLabel(item, depoStages) || '—'}
                getProcessOptions={() => stageDropdownOptions}
                getListAmount={(item) => computeDepoLineTotals(item).gross}
                columnGrid={depoListBaseColumnGrid.join(' ')}
              />
            </div>
          </div>
        </>
      )}

      {relatedTransfers.length > 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <div className="flex items-center gap-2 px-1">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Son transferler :</span>
          </div>
          <div className="mt-2 space-y-1">
            {relatedTransfers.slice(0, 5).map((transfer) => {
              const stamp = formatListDateParts(transfer.createdAt)
              return (
                <p key={transfer.id} className={YF_TEXT_CLASS}>
                  {stamp.date || '—'}
                  {stamp.time ? ` ${stamp.time}` : ''} · {transfer.product} ·{' '}
                  {warehouseName(transfer.fromWarehouseId)} →{' '}
                  {warehouseName(transfer.toWarehouseId)}
                </p>
              )
            })}
          </div>
        </AppPagePanel>
      ) : null}
    </AppPageShell>
  )
}
