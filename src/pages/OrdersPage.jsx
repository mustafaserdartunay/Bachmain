import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Factory,
  MoreHorizontal,
  Pencil,
  Printer,
  Save,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Button, Dropdown, DropdownItem, DropdownSeparator, EmptyState } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import QuoteDeletedArchivedPanel from '../components/Common/QuoteDeletedArchivedPanel'
import QuoteOrderInlineConfirm from '../components/Common/QuoteOrderInlineConfirm'
import QuoteRecordMetaPanel from '../components/Common/QuoteRecordMetaPanel'
import {
  QuoteListCell,
  QuoteListColumnHeader,
  QuoteListRowPanel,
  QuoteListSelectionCheckbox,
  TurkishLiraIcon,
} from '../components/Common/QuoteStyleListChrome'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_DIVIDER_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_CTA_SHELL_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import { customerToDocumentPatch } from '../utils/documentCustomerPatch'
import {
  captureDeleteConfirmAnchor,
  DeleteConfirmOverlay,
} from '../components/Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../components/EditableDropdownPill'
import CustomerPicker, {
  DOCUMENT_SIDE_ACTION_WIDTH,
  findDocumentCustomer,
} from '../components/DocumentEditor/CustomerPicker'
import { DocumentMiniButton } from '../components/DocumentEditor/DocumentField'
import DocumentLineItemRow, {
  createEmptyDocumentItem,
} from '../components/DocumentEditor/DocumentLineItemRow'
import DocumentTermsEditor from '../components/DocumentEditor/DocumentTermsEditor'
import DocumentActivityPanel from '../components/DocumentEditor/DocumentActivityPanel'
import DocumentTotalsPanel from '../components/DocumentEditor/DocumentTotalsPanel'
import WorkflowStagePanel from '../components/DocumentEditor/WorkflowStagePanel'
import {
  isReservedPlaceholderLabel,
  filterWorkflowStageList,
  mapProcessOptions,
  matchProcessOption,
  optionsToProcessRecord,
  processRecordToOptions,
  resolveListColumnLabel,
} from '../components/DocumentEditor/processPanelUtils'
import ProcessPanelModule from '../components/DocumentEditor/ProcessPanelModule'
import { stageColors } from '../components/DocumentEditor/stageColors'
import RepresentativeEditor from '../components/DocumentEditor/RepresentativeEditor'
import { formatTL } from '../utils/productPricing'
import { getListCustomerDisplay, findCustomerProfile } from '../data/customerProfiles'
import { getCatalogProducts } from '../utils/productCatalog'
import {
  cancelOrderFromQuote,
  deleteOrder,
  loadOrders,
  orderHasLinkedQuote,
  orderTotals,
  permanentlyDeleteOrder,
  readOpenOrderId,
  clearOpenOrderId,
  restoreDeletedOrder,
  saveOrders,
} from '../utils/ordersStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { publishWorkflowStages } from '../utils/workflowStagePublish'
import { createProductionFromOrder } from '../utils/productionStore'
import { syncQuoteFromOrder } from '../utils/quoteWorkflowSync'
import {
  appendOrderStage,
  DEFAULT_ORDER_STAGE_ID,
  getOrderStageOptions,
  loadWorkflowStages,
  mergeOrderStagesIntoWorkflow,
  resolveOrderActiveStage,
  resolveOrderPanelCurrentStageId,
  toStageDropdownOptions,
} from '../utils/workflowStages'
import { nextDocumentCode, resolveQuoteCode } from '../utils/documentCodes'
import { documentTotals } from '../utils/documentTotals'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'
import { resolveCustomerContactInfo } from '../utils/customerContacts'
import { formatListDateParts, getQuoteCreatedSource } from '../utils/quoteListDateFormat'
import { COP_KUTUSU_ICON_CLASS } from '../utils/buttonStyles'
import ModernDatePicker from '../components/Common/ModernDatePicker'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_MENU_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500', locked: true }
const sortFilterOptions = [
  { label: 'Son işleme göre', color: 'bg-blue-500' },
  { label: 'Tarihe göre', color: 'bg-purple-500' },
  { label: 'İsme göre', color: 'bg-orange-500' },
  { label: 'Fiyata göre', color: 'bg-emerald-500' },
]
const sortModeByLabel = {
  'Son işleme göre': 'latest',
  'Tarihe göre': 'date',
  'İsme göre': 'name',
  'Fiyata göre': 'price',
}
const sortLabelByMode = {
  latest: 'Son işleme göre',
  date: 'Tarihe göre',
  name: 'İsme göre',
  price: 'Fiyata göre',
}
const productionStatusFilterOptions = [
  { label: 'Tümü', color: 'bg-gray-500', locked: true },
  { label: 'Üretimde', color: 'bg-emerald-500' },
  { label: 'Üretimde değil', color: 'bg-orange-500' },
]

function isOrderInProduction(order, workflowStages) {
  const activeStage = resolveOrderActiveStage(order, workflowStages)
  return activeStage?.label === 'Üretime Alındı' || order.status === 'Üretimde'
}

function DateInlineField({ label, value, onChange, dotColor = 'blue' }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <AppPanelDot color={dotColor} />
        <h2 className={APP_PANEL_TITLE_CLASS}>{label}</h2>
      </div>
      <div className="min-w-0 flex-1">
        <ModernDatePicker value={value} onChange={onChange} />
      </div>
    </div>
  )
}

function OrderListRowMoreMenu({
  order,
  onEdit,
  onDelete,
  onProduce,
  onCancelQuoteLink,
  canProduce,
  hasLinkedQuote,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Dropdown
      align="end"
      menuClassName="az customer-filter-dropdown-menu customers-page-menu quote-record-meta-dropdown min-w-[15rem]"
      trigger={
        <Button
          variant="ghost"
          size="iconOnly"
          className="hover:!bg-transparent"
          aria-label="Diğer işlemler"
          onClick={() => setConfirmDelete(false)}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      }
    >
      {({ close }) => (
        <>
          <QuoteRecordMetaPanel quote={order} />
          <DropdownSeparator />
          {hasLinkedQuote ? (
            <DropdownItem
              icon={Undo2}
              label="Teklife Geri Al"
              tone="primary"
              close={close}
              onClick={onCancelQuoteLink}
            />
          ) : null}
          {canProduce ? (
            <DropdownItem
              icon={Factory}
              label="Üretime Al"
              tone="success"
              close={close}
              onClick={onProduce}
            />
          ) : null}
          <DropdownItem
            icon={Pencil}
            label="Düzenle"
            tone="primary"
            close={close}
            onClick={onEdit}
          />
          {confirmDelete ? (
            <div
              className="quote-menu-delete-confirm flex w-full items-center justify-center px-1 py-1"
              onClick={(event) => event.stopPropagation()}
              role="menuitem"
              aria-label="Silmeyi onayla"
            >
              <QuoteOrderInlineConfirm
                label="Sil"
                labelClass="quote-order-undo-sil"
                ariaLabel="Sipariş sil"
                onConfirm={() => {
                  onDelete()
                  setConfirmDelete(false)
                  close()
                }}
                onCancel={() => setConfirmDelete(false)}
              />
            </div>
          ) : (
            <DropdownItem
              icon={Trash2}
              label="Sil"
              tone="danger"
              close={close}
              closeOnClick={false}
              onClick={() => setConfirmDelete(true)}
            />
          )}
        </>
      )}
    </Dropdown>
  )
}

function OrderListProductionModuleButton({
  order,
  inProduction,
  pendingAction,
  onRequestCreate,
  onConfirmCreate,
  onCancelPending,
}) {
  if (pendingAction === 'create') {
    return (
      <QuoteOrderInlineConfirm
        label="Evet"
        labelClass="quote-order-undo-evet"
        ariaLabel="Üretime al"
        onConfirm={onConfirmCreate}
        onCancel={onCancelPending}
      />
    )
  }

  if (inProduction) {
    return (
      <span className="quote-order-action inline-flex h-9 items-center justify-between">
        <span
          className="quote-order-chip inline-flex h-9 w-[3.75rem] flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-1 text-center text-[10px] font-bold leading-tight text-emerald-700"
          title="Üretime alındı"
        >
          <span>Üretim</span>
          <span>Alındı</span>
        </span>
      </span>
    )
  }

  return (
    <span className="quote-order-create-reveal inline-flex w-full items-center justify-center overflow-hidden">
      <button
        type="button"
        onClick={onRequestCreate}
        className="quote-order-chip quote-order-action inline-flex h-9 flex-col items-center justify-center rounded-xl border border-ds-border bg-transparent px-1 text-center text-[10px] font-semibold leading-tight text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
        title={`${order.customer || order.id} siparişini üretime al`}
        aria-label="Üretime al"
      >
        <span>Üretim</span>
        <span>Al</span>
      </button>
    </span>
  )
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Lütfen geçerli bir görsel dosyası seçin.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Görsel okunamadı.'))
    reader.readAsDataURL(file)
  })
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function getOrderListDateSource(order) {
  return getQuoteCreatedSource(order)
}

function OrderPriorityEditor({ order, onPatch, optionLists, updateOptionList, compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [priorityInput, setPriorityInput] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const priorityLabels = optionLists.priority.map((option) => option.label)
  const priorityValue = priorityLabels.includes(order.priority) ? order.priority : ''

  const record = useMemo(
    () => optionsToProcessRecord(optionLists.priority, priorityValue),
    [optionLists.priority, priorityValue],
  )

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingDeleteId(null)
  }

  function addPriority(chosenColor, inputLabel) {
    const label = (inputLabel || priorityInput).trim()
    if (!label || optionLists.priority.some((option) => option.label === label)) return
    const next = [
      ...optionLists.priority,
      {
        label,
        color: chosenColor || stageColors[optionLists.priority.length % stageColors.length],
      },
    ]
    updateOptionList('priority', next)
    onPatch({ priority: label })
    setPriorityInput('')
  }

  function selectPriority(stage) {
    if (!stage) {
      onPatch({ priority: '' })
      return
    }
    if (order.priority === stage.label) {
      onPatch({ priority: '' })
      return
    }
    onPatch({ priority: stage.label })
  }

  function updateColor(stage, color) {
    updateOptionList(
      'priority',
      mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, color })),
    )
  }

  function updateLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    updateOptionList(
      'priority',
      mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, label: clean })),
    )
    if (order.priority === stage.label) onPatch({ priority: clean })
  }

  function reorder(nextStages) {
    updateOptionList('priority', processRecordToOptions(nextStages))
  }

  function removePriority(stage) {
    const next = optionLists.priority.filter((option) => !matchProcessOption(option, stage))
    updateOptionList('priority', next)
    if (order.priority === stage.label) onPatch({ priority: '' })
    setPendingDeleteId(null)
  }

  return (
    <ProcessPanelModule
      activeLabel="Aktif Öncelik"
      countSuffix="öncelik tanımlı"
      emptyMessage="Henüz öncelik eklenmedi."
      addPlaceholder="Yeni öncelik adı..."
      record={record}
      isOpen={isOpen}
      onToggle={toggleEditor}
      stageInput={priorityInput}
      setStageInput={setPriorityInput}
      onAddStage={addPriority}
      onSelectStage={selectPriority}
      onUpdateStageColor={updateColor}
      onUpdateStageLabel={updateLabel}
      onReorderStages={reorder}
      pendingStageDeleteId={pendingDeleteId}
      setPendingStageDeleteId={setPendingDeleteId}
      onRemoveStage={removePriority}
      compact={compact}
    />
  )
}

function OrderProcessManagement({
  order,
  onPatch,
  optionLists,
  updateOptionList,
  orderStageRecord,
  isStagePanelOpen,
  toggleStagePanel,
  stageInput,
  setStageInput,
  onAddOrderStage,
  onSelectOrderStage,
  onUpdateOrderStageColor,
  onUpdateOrderStageLabel,
  onReorderOrderStages,
  pendingStageDeleteId,
  setPendingStageDeleteId,
  onRemoveOrderStage,
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-white">Süreçler</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="text-xs font-bold text-white">Öncelik</h3>
          <OrderPriorityEditor
            order={order}
            onPatch={onPatch}
            optionLists={optionLists}
            updateOptionList={updateOptionList}
            compact
          />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-xs font-bold text-white">Sipariş Süreci</h3>
          <WorkflowStagePanel
            record={orderStageRecord}
            isOpen={isStagePanelOpen}
            onToggle={toggleStagePanel}
            stageInput={stageInput}
            setStageInput={setStageInput}
            onAddStage={onAddOrderStage}
            onSelectStage={onSelectOrderStage}
            onUpdateStageColor={onUpdateOrderStageColor}
            onUpdateStageLabel={onUpdateOrderStageLabel}
            onReorderStages={onReorderOrderStages}
            pendingStageDeleteId={pendingStageDeleteId}
            setPendingStageDeleteId={setPendingStageDeleteId}
            onRemoveStage={onRemoveOrderStage}
            compact
          />
        </div>
      </div>
    </div>
  )
}

function createEmptyOrderItem() {
  return createEmptyDocumentItem(createId)
}

function createOrderDraft(baseOrders = []) {
  const stages = loadWorkflowStages()
  return {
    id: nextDocumentCode(baseOrders.map((order) => order.id)),
    quoteId: null,
    title: '',
    customer: '',
    contact: '',
    phone: '',
    email: '',
    status: 'Yeni',
    priority: 'Normal',
    source: 'Manuel',
    owner: '',
    createdAt: new Date().toISOString().slice(0, 10),
    deliveryDate: '',
    notes: '',
    termsDescription: '',
    terms: [],
    currentStageId: DEFAULT_ORDER_STAGE_ID,
    stages,
    items: [createEmptyOrderItem()],
    showDocumentDiscount: false,
    documentDiscountMode: 'percent',
    documentDiscountRate: 0,
    documentDiscountAmount: 0,
    activities: [
      {
        id: createId('act'),
        date: new Date().toLocaleString('tr-TR'),
        text: 'Yeni sipariş oluşturuldu.',
      },
    ],
  }
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState(loadOrders)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [draftOrder, setDraftOrder] = useState(null)
  const [selectedId, setSelectedId] = useState(orders[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    priority: 'Tümü',
    stage: 'Tümü',
    productionStatus: 'Tümü',
  })
  const [sortMode, setSortMode] = useState('latest')
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
  const listColumnSortRef = useRef(listColumnSort)
  listColumnSortRef.current = listColumnSort
  const listColumnSortLockRef = useRef(false)
  const [viewMode, setViewMode] = useState('list')
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [archiveReceiveKey, setArchiveReceiveKey] = useState(0)
  const [pendingProductionAction, setPendingProductionAction] = useState(null)
  const [deleteConfirmAnchor, setDeleteConfirmAnchor] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [openItemMenuId, setOpenItemMenuId] = useState(null)
  const [pendingItemDeleteId, setPendingItemDeleteId] = useState(null)
  const [openSaveMenu, setOpenSaveMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingHeaderOrderDelete, setPendingHeaderOrderDelete] = useState(false)
  const [isStagePanelOpen, setIsStagePanelOpen] = useState(false)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const syncedCustomerKeyRef = useRef('')

  const selectedOrder =
    draftOrder || orders.find((order) => order.id === selectedId) || orders[0] || null
  const selectedCustomer =
    selectedOrder?.customerId || selectedOrder?.customer
      ? findDocumentCustomer(selectedOrder.customerId || selectedOrder.customer)
      : null
  const selectedTotals = selectedOrder ? documentTotals(selectedOrder) : null
  const isDraftOrder = Boolean(draftOrder && selectedOrder?.id === draftOrder.id)
  const orderStageOptions = getOrderStageOptions(workflowStages)
  const orderStageDropdownOptions = toStageDropdownOptions(orderStageOptions)
  const orderStageFilterOptions = [filterAllOption, ...orderStageDropdownOptions]
  const orderPriorityDropdownOptions = optionLists.priority
  const orderPriorityLabels = optionLists.priority.map((option) => option.label)
  const orderPriorityFilterOptions = [filterAllOption, ...orderPriorityDropdownOptions]

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
  }, [])

  useEffect(() => {
    const openOrderId = readOpenOrderId()
    if (!openOrderId) return
    clearOpenOrderId()
    const freshOrders = loadOrders()
    setOrders(freshOrders)
    const match = freshOrders.find((order) => order.id === openOrderId)
    if (match) {
      setDraftOrder(null)
      setSelectedId(match.id)
      setViewMode('prepare')
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    const customerId = searchParams.get('customerId')
    const customer = customerId ? findCustomerProfile(customerId) : null
    const freshOrders = loadOrders()
    const next = {
      ...createOrderDraft(freshOrders),
      ...customerToDocumentPatch(customer),
    }
    setOrders(freshOrders)
    setDraftOrder(next)
    setSelectedId(next.id)
    setViewMode('prepare')
    navigate('/siparisler', { replace: true })
  }, [searchParams, navigate])

  useEffect(() => {
    function refresh() {
      setOrders(loadOrders())
    }
    function refreshWorkflowStages() {
      setWorkflowStages(loadWorkflowStages())
      // Don't reload orders here — saveOrders(normalize) can emit workflow
      // compaction events mid-save and would clobber in-memory list state.
    }
    window.addEventListener('bach:orders-updated', refresh)
    window.addEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
    return () => {
      window.removeEventListener('bach:orders-updated', refresh)
      window.removeEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
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

  useEffect(() => {
    if (!openItemMenuId && !openSaveMenu) return undefined

    function closeDropdownsOnOutsideClick(event) {
      if (
        event.target.closest('[data-document-dropdown]') ||
        event.target.closest('[data-order-dropdown]')
      )
        return
      setOpenItemMenuId(null)
      setOpenSaveMenu(false)
      setPendingHeaderOrderDelete(false)
    }

    document.addEventListener('mousedown', closeDropdownsOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeDropdownsOnOutsideClick)
  }, [openItemMenuId, openSaveMenu])

  useEffect(() => {
    if (viewMode !== 'prepare' || !selectedOrder?.customer?.trim()) return
    const customer = findDocumentCustomer(selectedOrder.customer)
    if (!customer) return
    const contactInfo = resolveCustomerContactInfo(customer)
    const syncKey = `${selectedOrder.id}::${customer.id || customer.company}`
    if (syncedCustomerKeyRef.current === syncKey) return
    syncedCustomerKeyRef.current = syncKey

    const patch = {}
    if (contactInfo.contactName && selectedOrder.contact !== contactInfo.contactName)
      patch.contact = contactInfo.contactName
    if (contactInfo.email && selectedOrder.email !== contactInfo.email)
      patch.email = contactInfo.email
    if (contactInfo.phone && selectedOrder.phone !== contactInfo.phone)
      patch.phone = contactInfo.phone
    if (Object.keys(patch).length > 0) patchSelected(patch)
  }, [selectedOrder?.id, selectedOrder?.customer, viewMode])

  useEffect(() => {
    if (viewMode === 'list') {
      syncedCustomerKeyRef.current = ''
      setIsStagePanelOpen(false)
      setIsActivityOpen(false)
    }
  }, [viewMode])

  useEffect(() => {
    if (viewMode === 'list' || !selectedOrder || (selectedOrder.items || []).length > 0) return
    patchSelected({ items: [createEmptyOrderItem()] })
  }, [selectedOrder?.id, selectedOrder?.items?.length, viewMode])

  function updateOptionList(field, nextOptions) {
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  function updateOrders(nextOrders) {
    if (!saveOrders(nextOrders)) return false
    setOrders(nextOrders)
    return true
  }

  function patchOrder(id, patch) {
    if (draftOrder?.id === id) {
      setDraftOrder((prev) => ({ ...prev, ...patch }))
      if (patch.currentStageId) {
        syncQuoteFromOrder({
          ...draftOrder,
          ...patch,
          id,
          quoteId: draftOrder.quoteId || draftOrder.id,
        })
      }
      return
    }
    const nextOrders = orders.map((order) => (order.id === id ? { ...order, ...patch } : order))
    const updated = nextOrders.find((order) => order.id === id)
    updateOrders(nextOrders)
    if (updated && patch.currentStageId) {
      syncQuoteFromOrder(updated)
    }
  }

  function patchSelected(patch) {
    if (!selectedOrder) return

    if (patch.stages) {
      const syncedStages = publishWorkflowStages(patch.stages) || loadWorkflowStages()
      setWorkflowStages([...syncedStages])
      if (draftOrder?.id === selectedOrder.id) {
        setDraftOrder((prev) => ({ ...prev, ...patch, stages: syncedStages }))
        if (patch.currentStageId) {
          syncQuoteFromOrder({
            ...draftOrder,
            ...patch,
            id: selectedOrder.id,
            quoteId: draftOrder.quoteId,
          })
        }
        return
      }
      const reloaded = loadOrders().map((order) =>
        order.id === selectedOrder.id ? { ...order, ...patch, stages: syncedStages } : order,
      )
      if (!saveOrders(reloaded)) return
      setOrders(reloaded)
      if (patch.currentStageId) {
        const updated = reloaded.find((order) => order.id === selectedOrder.id)
        if (updated) syncQuoteFromOrder(updated)
      }
      return
    }

    patchOrder(selectedOrder.id, patch)
  }

  function getOrderSortDate(order) {
    const lastActivityDate = (order.activities || []).at(-1)?.date
    const rawDate = lastActivityDate || order.createdAt || ''
    const normalized = String(rawDate).replace(' ', 'T')
    const time = new Date(normalized).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  const filteredOrders = orders
    .filter((order) => {
      const activeStage = resolveOrderActiveStage(order, workflowStages)
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        (order.title || '').toLowerCase().includes(q) ||
        (order.customer || '').toLowerCase().includes(q) ||
        (order.contact || '').toLowerCase().includes(q) ||
        (order.quoteId || '').toLowerCase().includes(q)
      const normalizedPriority = orderPriorityLabels.includes(order.priority)
        ? order.priority
        : 'Normal'
      const matchesPriority = filters.priority === 'Tümü' || normalizedPriority === filters.priority
      const matchesStage = filters.stage === 'Tümü' || activeStage?.label === filters.stage
      const inProduction = isOrderInProduction(order, workflowStages)
      const productionFilter = filters.productionStatus || 'Tümü'
      const matchesProduction =
        productionFilter === 'Tümü' ||
        (productionFilter === 'Üretimde' && inProduction) ||
        (productionFilter === 'Üretimde değil' && !inProduction)
      return matchesSearch && matchesPriority && matchesStage && matchesProduction
    })
    .sort((a, b) => {
      if (listColumnSort.key) return 0
      if (sortMode === 'date') return getOrderSortDate(b) - getOrderSortDate(a)
      if (sortMode === 'name') return (a.customer || '').localeCompare(b.customer || '', 'tr')
      if (sortMode === 'price') return orderTotals(b).grandTotal - orderTotals(a).grandTotal
      return getOrderSortDate(b) - getOrderSortDate(a)
    })

  const listOrders = (() => {
    if (!listColumnSort.key) return filteredOrders
    const dir = listColumnSort.dir === 'desc' ? -1 : 1
    const orderIds = orders.map((item) => item.id)
    return [...filteredOrders].sort((a, b) => {
      const valueOf = (order) => {
        if (listColumnSort.key === 'date') return getOrderSortDate(order)
        if (listColumnSort.key === 'code') return resolveQuoteCode(order.id, orderIds)
        if (listColumnSort.key === 'customer') {
          const display = getListCustomerDisplay(order.customer)
          return display.brandShortName || display.companyTitle || order.customer || ''
        }
        if (listColumnSort.key === 'amount') return orderTotals(order).grandTotal
        if (listColumnSort.key === 'production')
          return isOrderInProduction(order, workflowStages) ? 1 : 0
        if (listColumnSort.key === 'priority') return order.priority || ''
        if (listColumnSort.key === 'stage')
          return resolveOrderActiveStage(order, workflowStages)?.label || ''
        return ''
      }
      const av = valueOf(a)
      const bv = valueOf(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), 'tr', { sensitivity: 'base' }) * dir
    })
  })()

  const summary = {
    total: filteredOrders.length,
    newOrders: filteredOrders.filter((order) => order.status === 'Yeni').length,
    cancelled: filteredOrders.filter((order) => order.status === 'İptal').length,
    production: filteredOrders.filter((order) => isOrderInProduction(order, workflowStages)).length,
    totalAmount: filteredOrders.reduce((sum, order) => sum + orderTotals(order).grandTotal, 0),
  }

  function transferOrderToProduction(order, stage) {
    const productionStage =
      stage || orderStageOptions.find((item) => item.label === 'Üretime Alındı')
    if (!productionStage) return null

    const job = createProductionFromOrder({ ...order, currentStageId: productionStage.id })
    if (!job) return null

    patchOrder(order.id, {
      currentStageId: productionStage.id,
      status: 'Üretimde',
      activities: [
        ...(order.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Sipariş üretime aktarıldı. Üretim kaydı: ${order.id}`,
        },
      ],
    })
    setActiveMenu(null)
    return job
  }

  function setOrderStage(order, stage) {
    if (stage.label === 'Üretime Alındı') {
      const ok = window.confirm(
        `"${order.customer || order.id}" siparişini üretime aktarmak istediğinize emin misiniz? Kayıt üretim takibine kopyalanacak ve bu listede kalacaktır.`,
      )
      if (!ok) return
      transferOrderToProduction(order, stage)
      return
    }

    patchOrder(order.id, {
      currentStageId: stage.id,
      activities: [
        ...(order.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Süreç "${stage.label}" olarak güncellendi.`,
        },
      ],
    })
    setActiveMenu(null)
  }

  function setOrderPriority(order, priority) {
    patchOrder(order.id, { priority })
    setActiveMenu(null)
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function handleOrderStageLabelChange(order, stageLabel) {
    const stage = orderStageOptions.find((item) => item.label === stageLabel)
    if (!stage || order.currentStageId === stage.id) return
    setOrderStage(order, stage)
  }

  function addOrder(customerPatch = {}) {
    const next = { ...createOrderDraft(orders), ...customerPatch }
    setDraftOrder(next)
    setSelectedId(next.id)
    setViewMode('prepare')
  }

  function returnToOrderList() {
    setDraftOrder(null)
    setViewMode('list')
  }

  function addSelectedActivity(text, extraPatch = {}) {
    if (!selectedOrder) return
    const activity = {
      id: createId('act'),
      date: new Date().toLocaleString('tr-TR'),
      text,
    }
    patchSelected({
      ...extraPatch,
      activities: [...(selectedOrder.activities || []), activity],
    })
  }

  function saveCurrentOrder({ startNew = false, returnToList = false } = {}) {
    if (!selectedOrder || isSaving) return false
    const sanitized = {
      ...selectedOrder,
      customer: String(selectedOrder.customer || '').trim(),
      notes: selectedOrder.termsDescription || selectedOrder.notes || '',
      items: (selectedOrder.items || []).filter((item) => item.product || item.unitPrice > 0),
    }
    if (!sanitized.customer) {
      window.alert('Kaydetmeden önce müşteri seçin veya müşteri adı girin.')
      return false
    }
    if (sanitized.items.length === 0) {
      window.alert('Kaydetmeden önce en az bir ürün satırı ekleyin.')
      return false
    }

    setIsSaving(true)
    setOpenSaveMenu(false)
    setPendingHeaderOrderDelete(false)

    const exists = orders.some((order) => order.id === sanitized.id)
    const nextOrders = exists
      ? orders.map((order) =>
          order.id === sanitized.id
            ? {
                ...sanitized,
                activities: [
                  ...(sanitized.activities || []),
                  {
                    id: createId('act'),
                    date: new Date().toLocaleString('tr-TR'),
                    text: 'Sipariş güncellenerek kaydedildi.',
                  },
                ],
              }
            : order,
        )
      : [
          {
            ...sanitized,
            activities: [
              ...(sanitized.activities || []),
              {
                id: createId('act'),
                date: new Date().toLocaleString('tr-TR'),
                text: 'Sipariş kaydedildi.',
              },
            ],
          },
          ...orders,
        ]

    const saved = updateOrders(nextOrders)
    if (!saved) {
      setIsSaving(false)
      return false
    }

    flushWorkspaceNow()

    window.setTimeout(() => {
      if (startNew) {
        const next = createOrderDraft(nextOrders)
        setDraftOrder(next)
        setSelectedId(next.id)
        setViewMode('prepare')
        setIsSaving(false)
        return
      }
      setDraftOrder(null)
      setSelectedId(sanitized.id)
      setOrders(loadOrders())
      if (returnToList) {
        setViewMode('list')
      }
      setIsSaving(false)
    }, 650)

    return true
  }

  function deleteCurrentOrder({ navigateToList = false, skipConfirm = false } = {}) {
    if (!selectedOrder) return
    if (!skipConfirm) {
      const ok = window.confirm(
        `Son onay: "${selectedOrder.id}" siparişi kalıcı olarak silinecek. Devam edilsin mi?`,
      )
      if (!ok) return
    }
    deleteOrder(selectedOrder.id)
    const remaining = loadOrders()
    setOrders(remaining)
    setDraftOrder(null)
    setOpenSaveMenu(false)
    setPendingHeaderOrderDelete(false)
    setSelectedId(remaining[0]?.id || null)
    if (navigateToList) setViewMode('list')
  }

  function editOrder(orderId) {
    setDraftOrder(null)
    setSelectedId(orderId)
    setViewMode('prepare')
  }

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedOrderIds([])
  }

  function toggleBulkOrderSelect(orderId) {
    const key = String(orderId)
    setSelectedOrderIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleBulkOrderSelectAll(ids) {
    const keys = ids.map(String)
    setSelectedOrderIds((current) => {
      const allOn = keys.length > 0 && keys.every((id) => current.includes(id))
      return allOn ? [] : keys
    })
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

  function softDeleteOrderWithAnimation(order) {
    if (!order?.id) return
    const key = String(order.id)
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteOrder(order.id)
      setOrders(loadOrders())
      setAnimatingDeleteIds((current) => current.filter((item) => item !== key))
      setArchiveReceiveKey((current) => current + 1)
      flushWorkspaceNow()
      if (selectedId === order.id) {
        const remaining = loadOrders()
        setSelectedId(remaining[0]?.id || null)
      }
    }, 880)
  }

  function handleBulkDeleteOrders() {
    const selected = listOrders.filter((order) => selectedOrderIds.includes(String(order.id)))
    selected.forEach((order) => softDeleteOrderWithAnimation(order))
    exitBulkSelectMode()
  }

  function handleCancelOrderFromList(order, event) {
    event?.stopPropagation?.()
    if (!orderHasLinkedQuote(order)) return
    cancelOrderFromQuote(order)
    const remaining = loadOrders()
    setOrders(remaining)
    if (selectedId === order.id) {
      setSelectedId(remaining[0]?.id || null)
    }
  }

  function updateItem(id, field, value) {
    patchSelected({
      items: selectedOrder.items.map((item) => {
        if (item.id !== id) return item
        if (field === 'discountRate') {
          return {
            ...item,
            discountRate: value,
            showDiscount: value > 0 ? true : item.showDiscount,
          }
        }
        return { ...item, [field]: value }
      }),
    })
  }

  function selectProductForItem(id, productOrName) {
    const product =
      typeof productOrName === 'string'
        ? getCatalogProducts().find((item) => item.name === productOrName)
        : productOrName
    const productName =
      typeof productOrName === 'string' ? productOrName : productOrName?.name || ''
    patchSelected({
      items: selectedOrder.items.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: product?.id || item.productId || '',
              product: productName,
              description: product?.notes || item.description || '',
              unitPrice: Number(
                product?.salesPriceExcl || product?.purchasePriceExcl || item.unitPrice || 0,
              ),
              vatRate: Number(product?.vatRate ?? item.vatRate ?? 20),
            }
          : item,
      ),
    })
  }

  function enableItemOption(id, option) {
    updateItem(id, option, true)
    setOpenItemMenuId(null)
  }

  function disableItemOption(id, option, resetPatch = {}) {
    patchSelected({
      items: selectedOrder.items.map((item) =>
        item.id === id ? { ...item, [option]: false, ...resetPatch } : item,
      ),
    })
  }

  async function uploadItemLineImage(id, file) {
    if (!file) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      updateItem(id, 'lineImage', dataUrl)
    } catch (error) {
      window.alert(error.message)
    }
  }

  function addItem() {
    patchSelected({ items: [...(selectedOrder.items || []), createEmptyOrderItem()] })
  }

  function removeItem(id) {
    patchSelected({ items: selectedOrder.items.filter((item) => item.id !== id) })
    setPendingItemDeleteId(null)
  }

  function handleSelectOrderStage(stage) {
    if (!selectedOrder || !stage) return
    if (stage.label === 'Üretime Alındı') {
      const ok = window.confirm(
        `"${selectedOrder.customer || selectedOrder.id}" siparişini üretime aktarmak istediğinize emin misiniz? Kayıt üretim takibine kopyalanacak ve bu listede kalacaktır.`,
      )
      if (!ok) return
      saveCurrentOrder({ returnToList: false })
      transferOrderToProduction({ ...selectedOrder, currentStageId: stage.id }, stage)
      return
    }
    addSelectedActivity(`Süreç "${stage.label}" olarak güncellendi.`, { currentStageId: stage.id })
  }

  function toggleStagePanel() {
    setIsStagePanelOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  function addOrderStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || !selectedOrder || isReservedPlaceholderLabel(label)) return

    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages)
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[orderStages.length % stageColors.length],
      note: 'Yeni süreç aşaması eklendi.',
    }
    const nextFullStages = mergeOrderStagesIntoWorkflow(
      currentStages,
      appendOrderStage(orderStages, nextStage),
    )
    const activity = {
      id: createId('act'),
      date: new Date().toLocaleString('tr-TR'),
      text: `Yeni süreç eklendi ve aktif edildi: "${label}".`,
    }

    patchSelected({
      stages: nextFullStages,
      currentStageId: nextStage.id,
      activities: [...(selectedOrder.activities || []), activity],
    })
    setStageInput('')
  }

  function updateOrderStageColor(stage, color) {
    if (!selectedOrder) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, orderStages) })
  }

  function updateOrderStageLabel(stage, label) {
    if (!selectedOrder || isReservedPlaceholderLabel(label)) return
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, label: cleanLabel } : item,
    )
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, orderStages) })
  }

  function reorderOrderStages(nextOrderStages) {
    if (!selectedOrder) return
    const currentStages = loadWorkflowStages()
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, nextOrderStages) })
  }

  function selectOrderStageInEditor(stage) {
    if (!selectedOrder || !stage) return
    if (stage.label === 'Üretime Alındı') {
      handleSelectOrderStage(stage)
      return
    }
    if (selectedOrder.currentStageId === stage.id) return
    addSelectedActivity(`Süreç "${stage.label}" olarak güncellendi.`, { currentStageId: stage.id })
  }

  function removeOrderStage(stage) {
    if (!selectedOrder) return
    const ok = window.confirm(`Son onay: "${stage.label}" süreci kaldırılacak. Devam edilsin mi?`)
    if (!ok) return
    const nextOrderStages = getOrderStageOptions(workflowStages).filter(
      (item) => item.id !== stage.id,
    )
    addSelectedActivity(`Süreç silindi: "${stage.label}".`, {
      stages: mergeOrderStagesIntoWorkflow(workflowStages, nextOrderStages),
      currentStageId:
        selectedOrder.currentStageId === stage.id
          ? nextOrderStages[0]?.id || ''
          : selectedOrder.currentStageId,
    })
    setPendingStageDeleteId(null)
  }

  const orderStageRecord = {
    stages: filterWorkflowStageList(getOrderStageOptions(workflowStages)),
    currentStageId: resolveOrderPanelCurrentStageId(selectedOrder, workflowStages),
  }

  const listOrderIds = listOrders.map((order) => String(order.id))
  const allVisibleOrdersSelected =
    listOrderIds.length > 0 && listOrderIds.every((id) => selectedOrderIds.includes(id))
  const someVisibleOrdersSelected =
    listOrderIds.some((id) => selectedOrderIds.includes(id)) && !allVisibleOrdersSelected

  const orderListBaseColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.75rem',
    '6.5rem',
    '3rem',
  ]
  const orderListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...orderListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedOrderIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  return (
    <AppPageShell className="customers-page-type w-full">
      {viewMode === 'list' ? (
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink />}
          centerTitle="SİPARİŞLER"
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <button
              type="button"
              onClick={() => addOrder()}
              className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
            >
              <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                <ClipboardList
                  className={HEADER_ACTION_CTA_ICON_CLASS}
                  strokeWidth={2.25}
                  aria-hidden
                />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>Yeni Sipariş Oluştur</span>
            </button>
          }
        />
      ) : (
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to={false} onClick={returnToOrderList} label="Siparişler" />}
          centerTitle={isDraftOrder ? 'YENİ SİPARİŞ OLUŞTUR' : 'SİPARİŞ DÜZENLE'}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <div className="relative flex shrink-0 items-center gap-2" data-order-dropdown>
              {selectedOrder && !isDraftOrder ? (
                <Link
                  to={`/belge-merkezi/yazdir?type=order&id=${encodeURIComponent(selectedOrder.id)}`}
                  className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.violet}`}
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <Printer
                      className={HEADER_ACTION_CTA_ICON_CLASS}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>Şablonla Yazdır</span>
                </Link>
              ) : null}
              <div
                className={`relative inline-flex overflow-hidden ${HEADER_ACTION_CTA_SHELL_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}
              >
                <button
                  type="button"
                  onClick={() => saveCurrentOrder({ returnToList: true })}
                  disabled={!selectedOrder || isSaving}
                  className="inline-flex h-full items-center gap-2.5 bg-transparent px-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </span>
                </button>
                <span className={HEADER_ACTION_CTA_DIVIDER_CLASS} aria-hidden="true" />
                <Dropdown
                  align="end"
                  className="h-full"
                  menuClassName={PAGE_FILTER_MENU_CLASS}
                  trigger={
                    <button
                      type="button"
                      disabled={!selectedOrder || isSaving}
                      className="inline-flex h-full w-12 items-center justify-center bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      title="Kaydet seçenekleri"
                      aria-label="Kaydet seçenekleri"
                    >
                      <ChevronDown className={HEADER_ACTION_CTA_ICON_CLASS} aria-hidden="true" />
                    </button>
                  }
                >
                  {({ close }) => (
                    <>
                      <DropdownItem
                        icon={Save}
                        label="Kaydet ve Düzenlemeye Devam Et"
                        tone="primary"
                        close={close}
                        onClick={() => saveCurrentOrder({ returnToList: false })}
                      />
                      <DropdownSeparator />
                      <DropdownItem
                        icon={Trash2}
                        label="Siparişi Sil"
                        tone="danger"
                        close={close}
                        onClick={(event) => {
                          setDeleteConfirmAnchor(captureDeleteConfirmAnchor(event))
                          setPendingHeaderOrderDelete(true)
                        }}
                      />
                    </>
                  )}
                </Dropdown>
              </div>
            </div>
          }
        />
      )}

      {viewMode === 'list' && (
        <SummaryMetrics
          columns={5}
          className="customer-summary-metrics w-full"
          items={[
            {
              title: 'Toplam Sipariş',
              value: summary.total,
              icon: ClipboardList,
              valueTone: 'text-violet-800',
            },
            {
              title: 'Yeni',
              value: summary.newOrders,
              icon: Send,
              tone: 'orange',
              valueTone: 'text-blue-800',
            },
            {
              title: 'İptal',
              value: summary.cancelled,
              icon: Ban,
              tone: 'red',
              valueTone: 'text-red-700',
            },
            {
              title: 'Üretimde',
              value: summary.production,
              icon: CheckCircle2,
              tone: 'emerald',
              valueTone: 'text-emerald-800',
            },
            {
              title: 'Toplam Tutar',
              value: `${formatTL(summary.totalAmount)}`,
              icon: TurkishLiraIcon,
              tone: 'orange',
              valueTone: 'text-emerald-800',
            },
          ]}
        />
      )}

      {viewMode === 'list' ? (
        <>
          <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-2 px-1">
                <AppPanelDot color="blue" />
                <span className={YF_TEXT_CLASS}>Filtre :</span>
              </div>
              <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Öncelik Durumu :</p>
                  <EditableDropdownPill
                    value={filters.priority}
                    options={orderPriorityFilterOptions}
                    includePlaceholderOption={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-priority"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('priority', value)}
                    onOptionsChange={(next) => updateOptionList('priority', next)}
                  />
                </div>
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Sipariş Durumu :</p>
                  <EditableDropdownPill
                    value={filters.stage}
                    options={orderStageFilterOptions}
                    includePlaceholderOption={false}
                    editable={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-stage"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('stage', value)}
                  />
                </div>
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Sıralama :</p>
                  <EditableDropdownPill
                    value={sortLabelByMode[sortMode] || 'Son işleme göre'}
                    options={sortFilterOptions}
                    includePlaceholderOption={false}
                    editable={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-sort"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => setSortMode(sortModeByLabel[value] || 'latest')}
                  />
                </div>
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Üretim Durumu :</p>
                  <EditableDropdownPill
                    value={filters.productionStatus || 'Tümü'}
                    options={productionStatusFilterOptions}
                    includePlaceholderOption={false}
                    editable={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-production-status"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('productionStatus', value)}
                  />
                </div>
              </div>
            </div>
          </AppPagePanel>

          <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
            <div className="flex w-full min-w-0 items-center gap-3 px-1">
              <div className="flex shrink-0 items-center gap-2">
                <AppPanelDot color="blue" />
                <span className={YF_TEXT_CLASS}>Sipariş Listesi :</span>
              </div>
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Sipariş kodu, müşteri, yetkili veya teklif no ara..."
                  className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                />
              </div>
              <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredOrders.length} Kayıt</span>
            </div>
          </AppPagePanel>

          {listOrders.length === 0 ? (
            <AppPagePanel className="customer-filter-panel w-full">
              <EmptyState
                title="Sipariş bulunamadı."
                description="Arama veya filtreleri değiştirin."
              />
            </AppPagePanel>
          ) : null}

          <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
            <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
              {listOrders.length > 0 ? (
                <div className="quote-list-board">
                  <QuoteListRowPanel header gridTemplate={orderListColumnGrid}>
                    {bulkSelectMode ? (
                      <QuoteListCell>
                        <QuoteListSelectionCheckbox
                          checked={allVisibleOrdersSelected}
                          indeterminate={someVisibleOrdersSelected}
                          aria-label="Tümünü seç"
                          onChange={() => toggleBulkOrderSelectAll(listOrderIds)}
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
                        label="Öncelik"
                        sortable
                        sortKey="priority"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      <QuoteListColumnHeader
                        label="Sipariş Durumu"
                        sortable
                        sortKey="stage"
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
                      <QuoteListColumnHeader
                        label="Üretim"
                        sortable
                        sortKey="production"
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                    <QuoteListCell>
                      {bulkSelectMode && selectedOrderIds.length > 0 ? (
                        <QuoteOrderInlineConfirm
                          label="Sil"
                          labelClass="quote-order-undo-sil"
                          ariaLabel={`${selectedOrderIds.length} sipariş silinsin mi?`}
                          onConfirm={handleBulkDeleteOrders}
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
                              setSelectedOrderIds([])
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

                  {listOrders.map((order, rowIndex) => {
                    const stamp = formatListDateParts(getOrderListDateSource(order))
                    const display = getListCustomerDisplay(order.customer)
                    const orderKey = String(order.id)
                    const isBulkSelected = selectedOrderIds.includes(orderKey)
                    const isAnimatingOut = animatingDeleteIds.includes(orderKey)
                    const inProduction = isOrderInProduction(order, workflowStages)
                    const productionEntryStage = orderStageOptions.find(
                      (item) => item.label === 'Üretime Alındı',
                    )
                    const priorityValue = resolveListColumnLabel(
                      order.priority,
                      orderPriorityDropdownOptions,
                    )
                    const activeStage = resolveOrderActiveStage(order, workflowStages)
                    const pending =
                      pendingProductionAction?.id === order.id ? pendingProductionAction.type : null
                    return (
                      <div
                        key={order.id}
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
                          if (bulkSelectMode) toggleBulkOrderSelect(order.id)
                          else editOrder(order.id)
                        }}
                        onKeyDown={(event) => {
                          if (bulkSelectMode || isAnimatingOut) return
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            editOrder(order.id)
                          }
                        }}
                      >
                        <QuoteListRowPanel
                          gridTemplate={orderListColumnGrid}
                          className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                        >
                          {bulkSelectMode ? (
                            <QuoteListCell>
                              <QuoteListSelectionCheckbox
                                checked={isBulkSelected}
                                aria-label={`${resolveQuoteCode(
                                  order.id,
                                  orders.map((item) => item.id),
                                )} siparişini seç`}
                                onChange={() => toggleBulkOrderSelect(order.id)}
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
                              {resolveQuoteCode(
                                order.id,
                                orders.map((item) => item.id),
                              )}
                            </span>
                          </QuoteListCell>
                          <QuoteListCell>
                            <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                              <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                                {display.brandShortName || 'Müşteri girilmedi'}
                              </span>
                              {display.companyTitle ? (
                                <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                  {display.companyTitle}
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
                                value={priorityValue}
                                options={orderPriorityDropdownOptions}
                                includePlaceholderOption={false}
                                buttonClassName={PAGE_LIST_PILL_CLASS}
                                wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                                menuClassName={PAGE_LIST_MENU_CLASS}
                                menuMatchWidth={false}
                                openKey={`${order.id}-priority`}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                                onChange={(value) => setOrderPriority(order, value)}
                                onOptionsChange={(next) => updateOptionList('priority', next)}
                              />
                            </span>
                          </QuoteListCell>
                          <QuoteListCell>
                            <span
                              className="flex w-full items-center justify-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <EditableDropdownPill
                                value={
                                  activeStage?.label || orderStageDropdownOptions[0]?.label || ''
                                }
                                options={orderStageDropdownOptions}
                                includePlaceholderOption={false}
                                editable={false}
                                buttonClassName={PAGE_LIST_PILL_CLASS}
                                wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                                menuClassName={PAGE_LIST_MENU_CLASS}
                                menuMatchWidth={false}
                                openKey={`${order.id}-stage`}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                                onChange={(value) => handleOrderStageLabelChange(order, value)}
                              />
                            </span>
                          </QuoteListCell>
                          <QuoteListCell>
                            <span
                              className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}
                            >
                              {formatTL(orderTotals(order).grandTotal)}
                            </span>
                          </QuoteListCell>
                          <QuoteListCell>
                            <span
                              className="inline-flex w-full items-center justify-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <OrderListProductionModuleButton
                                order={order}
                                inProduction={inProduction}
                                pendingAction={pending}
                                onRequestCreate={() =>
                                  setPendingProductionAction({ id: order.id, type: 'create' })
                                }
                                onConfirmCreate={() => {
                                  if (productionEntryStage) {
                                    transferOrderToProduction(order, productionEntryStage)
                                  }
                                  setPendingProductionAction(null)
                                }}
                                onCancelPending={() => setPendingProductionAction(null)}
                              />
                            </span>
                          </QuoteListCell>
                          <QuoteListCell>
                            <span
                              className="inline-flex w-full items-center justify-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <OrderListRowMoreMenu
                                order={order}
                                onEdit={() => editOrder(order.id)}
                                onDelete={() => softDeleteOrderWithAnimation(order)}
                                canProduce={!inProduction && Boolean(productionEntryStage)}
                                hasLinkedQuote={orderHasLinkedQuote(order)}
                                onProduce={() => {
                                  if (productionEntryStage) {
                                    transferOrderToProduction(order, productionEntryStage)
                                    navigate('/uretim')
                                  }
                                }}
                                onCancelQuoteLink={() =>
                                  handleCancelOrderFromList(order, { stopPropagation: () => {} })
                                }
                              />
                            </span>
                          </QuoteListCell>
                        </QuoteListRowPanel>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              <QuoteDeletedArchivedPanel
                layoutMode="inline"
                title="Silinenler"
                collection="orders"
                storeEvent="bach:orders-updated"
                restoreRecord={restoreDeletedOrder}
                permanentlyDelete={permanentlyDeleteOrder}
                resolveCode={resolveQuoteCode}
                onRestored={(restored) => {
                  setOrders(loadOrders())
                  if (restored?.id) setSelectedId(restored.id)
                  flushWorkspaceNow()
                }}
                emptyMessage="Silinen sipariş yok."
                receivePulseKey={archiveReceiveKey}
                className="customer-deleted-archived-panel w-full"
                segmentTabs={[
                  { id: 'priority', label: 'Öncelik' },
                  { id: 'stage', label: 'Sipariş Durumu' },
                ]}
                getProcessValue={(order, tab) =>
                  tab.id === 'priority'
                    ? resolveListColumnLabel(order.priority, orderPriorityDropdownOptions)
                    : resolveOrderActiveStage(order, workflowStages)?.label || '—'
                }
                getProcessOptions={(tab) =>
                  tab.id === 'priority' ? orderPriorityDropdownOptions : orderStageDropdownOptions
                }
                getListAmount={(order) => orderTotals(order).grandTotal}
                isOrderCreated={(order) => isOrderInProduction(order, workflowStages)}
                columnGrid={orderListBaseColumnGrid.join(' ')}
              />
            </div>
          </div>
        </>
      ) : (
        selectedOrder && (
          <div className="space-y-5 document-compact-controls">
            <AppPagePanel className="customer-list-panel w-full">
              <div className="mb-4 flex min-w-0 items-center gap-3">
                <div className="flex shrink-0 items-center gap-2">
                  <AppPanelDot color="blue" />
                  <h2 className={APP_PANEL_TITLE_CLASS}>Sipariş Başlığı :</h2>
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    value={selectedOrder.title}
                    onChange={(e) => patchSelected({ title: e.target.value })}
                    className="form-input !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                  />
                </div>
                <div className="flex min-w-0 shrink-0 items-center gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <AppPanelDot color="blue" />
                    <h2 className={APP_PANEL_TITLE_CLASS}>Sipariş Kodu :</h2>
                  </div>
                  <div className={DOCUMENT_SIDE_ACTION_WIDTH}>
                    <input
                      value={resolveQuoteCode(
                        selectedOrder.id,
                        orders.map((item) => item.id),
                      )}
                      readOnly
                      className="form-input !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                      title="Sipariş kodu"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CustomerPicker record={selectedOrder} onPatch={patchSelected} allowCreate />
                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <DateInlineField
                    label="Oluşturma Tarihi :"
                    value={selectedOrder.createdAt}
                    onChange={(value) => patchSelected({ createdAt: value })}
                  />
                  <DateInlineField
                    label="Teslim Tarihi :"
                    value={selectedOrder.deliveryDate || ''}
                    onChange={(value) => patchSelected({ deliveryDate: value })}
                  />
                  {selectedOrder.quoteId ? (
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex shrink-0 items-center gap-2">
                        <AppPanelDot color="blue" />
                        <h2 className={APP_PANEL_TITLE_CLASS}>Kaynak Teklif :</h2>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="form-input flex items-center !text-[14px] !font-normal !text-[var(--muted)]">
                          {selectedOrder.quoteId}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
                <div className="col-span-2">
                  <RepresentativeEditor
                    record={selectedOrder}
                    onPatch={patchSelected}
                    optionLists={optionLists}
                    updateOptionList={updateOptionList}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    openKey="order-representative"
                  />
                </div>
              </div>
            </AppPagePanel>

            <AppPagePanel className="w-full" title="Sipariş Süreci :" dotColor="violet">
              <OrderProcessManagement
                order={selectedOrder}
                onPatch={patchSelected}
                optionLists={optionLists}
                updateOptionList={updateOptionList}
                orderStageRecord={orderStageRecord}
                isStagePanelOpen={isStagePanelOpen}
                toggleStagePanel={toggleStagePanel}
                stageInput={stageInput}
                setStageInput={setStageInput}
                onAddOrderStage={addOrderStage}
                onSelectOrderStage={selectOrderStageInEditor}
                onUpdateOrderStageColor={updateOrderStageColor}
                onUpdateOrderStageLabel={updateOrderStageLabel}
                onReorderOrderStages={reorderOrderStages}
                pendingStageDeleteId={pendingStageDeleteId}
                setPendingStageDeleteId={setPendingStageDeleteId}
                onRemoveOrderStage={removeOrderStage}
              />
            </AppPagePanel>

            <AppPagePanel className="w-full" title="Ürün Seçimi :" dotColor="violet">
              <div className="mb-3 flex items-center justify-between">
                <span />
                <DocumentMiniButton onClick={addItem}>Ürün Ekle</DocumentMiniButton>
              </div>
              <div className="space-y-3">
                {(selectedOrder.items || []).map((item) => (
                  <DocumentLineItemRow
                    key={item.id}
                    item={item}
                    openItemMenuId={openItemMenuId}
                    setOpenItemMenuId={setOpenItemMenuId}
                    pendingItemDeleteId={pendingItemDeleteId}
                    setPendingItemDeleteId={setPendingItemDeleteId}
                    onUpdate={updateItem}
                    onSelectProduct={selectProductForItem}
                    onEnableOption={enableItemOption}
                    onDisableOption={disableItemOption}
                    onUploadImage={uploadItemLineImage}
                    onRemove={removeItem}
                    customerId={selectedCustomer?.id || ''}
                    customerLabel={selectedOrder.customer || ''}
                  />
                ))}
                {(selectedOrder.items || []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-700/20 p-8 text-center text-sm font-semibold text-gray-500">
                    Henüz ürün eklenmedi. Ürün Ekle butonu ile sipariş satırı oluşturun.
                  </div>
                )}
              </div>
            </AppPagePanel>

            {selectedTotals && (
              <AppPagePanel className="w-full" title="Sipariş Koşulları :" dotColor="orange">
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_480px]">
                  <div className="min-w-0">
                    <DocumentTermsEditor
                      record={selectedOrder}
                      onPatch={patchSelected}
                      compact
                      hideTitle
                      savedTermsTitle="Hazır Sipariş Koşulları"
                      descriptionPlaceholder="Siparişin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
                    />
                  </div>
                  <DocumentTotalsPanel totals={selectedTotals} onPatch={patchSelected} />
                </div>
              </AppPagePanel>
            )}

            <DocumentActivityPanel
              activities={selectedOrder.activities || []}
              isOpen={isActivityOpen}
              onToggle={() => setIsActivityOpen((current) => !current)}
            />
          </div>
        )
      )}

      {pendingHeaderOrderDelete ? (
        <DeleteConfirmOverlay
          open
          title="Sipariş silinsin mi?"
          description="Sipariş silinenlere taşınır ve geri yüklenebilir."
          confirmLabel="Sil"
          anchor={deleteConfirmAnchor}
          onConfirm={() => {
            if (selectedOrder) {
              deleteCurrentOrder({ navigateToList: true, skipConfirm: true })
            }
            setPendingHeaderOrderDelete(false)
            setDeleteConfirmAnchor(null)
          }}
          onCancel={() => {
            setPendingHeaderOrderDelete(false)
            setDeleteConfirmAnchor(null)
          }}
        />
      ) : null}
    </AppPageShell>
  )
}
