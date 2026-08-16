import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Factory,
  Plus,
  Printer,
  Receipt,
  Save,
  Send,
  Trash2,
  Undo2,
  Users,
} from 'lucide-react'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { MoreMenu } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import SplitCreateButton from '../components/Common/SplitCreateButton'
import CreateCustomerPickModal from '../components/Common/CreateCustomerPickModal'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { customerToDocumentPatch } from '../utils/documentCustomerPatch'
import ListDeleteConfirmPanel, {
  DeleteTrashButton,
  LIST_PILL_CLASS,
} from '../components/Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../components/EditableDropdownPill'
import CustomerPicker, { findDocumentCustomer } from '../components/DocumentEditor/CustomerPicker'
import { DocumentField, DocumentMiniButton } from '../components/DocumentEditor/DocumentField'
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
import { stageColors, getStageColumnSurfaceClasses } from '../components/DocumentEditor/stageColors'
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
  readOpenOrderId,
  clearOpenOrderId,
  saveOrders,
} from '../utils/ordersStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { publishWorkflowStages } from '../utils/workflowStagePublish'
import { createProductionFromOrder, loadProductionJobs } from '../utils/productionStore'
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
import { nextDocumentCode } from '../utils/documentCodes'
import { documentTotals } from '../utils/documentTotals'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'
import { resolveCustomerContactInfo } from '../utils/customerContacts'

const orderListGrid = '118px 72px minmax(180px,1.2fr) 148px 148px 118px 118px minmax(220px,auto)'
const orderListProcessPillClass =
  'flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-dark-500/50 bg-dark-700/70 px-2 py-1 text-[12px] font-bold transition-colors hover:bg-dark-700/80'
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

function formatListDate(value) {
  if (!value) return ''
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value
  const [datePart] = String(value).split(' ')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

function getOrderListDateSource(order) {
  return order.activities?.[0]?.date || order.createdAt || ''
}

function formatListDateTime(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}(?::\d{2})?))/)
  if (trMatch) return trMatch[2] ? `${trMatch[1]} ${trMatch[2].slice(0, 5)}` : trMatch[1]

  const formattedDate = formatListDate(raw.split(/[T ]/)[0] || raw)
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1]
  if (!timePart || !timePart.includes(':')) return formattedDate
  const [hours, minutes] = timePart.split(':')
  if (!hours || !minutes) return formattedDate
  return `${formattedDate} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function TurkishLiraIcon({ className = '' }) {
  return (
    <span
      className={`${className} flex items-center justify-center text-base font-black leading-none`}
    >
      ₺
    </span>
  )
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
  const [filters, setFilters] = useState({ priority: 'Tümü', stage: 'Tümü' })
  const [sortMode, setSortMode] = useState('latest')
  const [viewMode, setViewMode] = useState('list')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [openItemMenuId, setOpenItemMenuId] = useState(null)
  const [pendingItemDeleteId, setPendingItemDeleteId] = useState(null)
  const [openSaveMenu, setOpenSaveMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingHeaderOrderDelete, setPendingHeaderOrderDelete] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
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
        order.customer.toLowerCase().includes(q) ||
        (order.contact || '').toLowerCase().includes(q) ||
        (order.quoteId || '').toLowerCase().includes(q)
      const normalizedPriority = orderPriorityLabels.includes(order.priority)
        ? order.priority
        : 'Normal'
      const matchesPriority = filters.priority === 'Tümü' || normalizedPriority === filters.priority
      const matchesStage = filters.stage === 'Tümü' || activeStage?.label === filters.stage
      return matchesSearch && matchesPriority && matchesStage
    })
    .sort((a, b) => {
      if (sortMode === 'date') return getOrderSortDate(b) - getOrderSortDate(a)
      if (sortMode === 'name') return (a.customer || '').localeCompare(b.customer || '', 'tr')
      if (sortMode === 'price') return orderTotals(b).grandTotal - orderTotals(a).grandTotal
      return getOrderSortDate(b) - getOrderSortDate(a)
    })

  const summary = {
    total: filteredOrders.length,
    newOrders: filteredOrders.filter((order) => order.status === 'Yeni').length,
    production: loadProductionJobs().length,
    totalNet: filteredOrders.reduce((sum, order) => sum + orderTotals(order).net, 0),
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

  function handleCreateWithCustomer(customer) {
    setCustomerModalOpen(false)
    addOrder(customerToDocumentPatch(customer))
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

  function removeOrder(order) {
    deleteOrder(order.id)
    setOrders(loadOrders())
    setPendingDeleteId(null)
    if (selectedId === order.id) {
      const remaining = loadOrders()
      setSelectedId(remaining[0]?.id || null)
    }
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

  return (
    <AppPageShell>
      {viewMode === 'list' ? (
        <AppPageHeader
          title="Sipariş Yönetimi"
          actions={
            <SplitCreateButton
              label="Yeni Sipariş Oluştur"
              onPrimaryClick={() => addOrder()}
              menuAriaLabel="Sipariş seçenekleri"
              menuItems={[
                {
                  id: 'customer',
                  label: 'Müşteri Seçerek Oluştur',
                  icon: Users,
                  iconClassName: 'text-blue-300',
                  onClick: () => setCustomerModalOpen(true),
                },
                {
                  id: 'draft',
                  label: 'Hızlı Taslak Sipariş',
                  icon: Receipt,
                  iconClassName: 'text-emerald-300',
                  onClick: () => addOrder(),
                },
              ]}
            />
          }
        />
      ) : (
        <AppPageHeader
          title={isDraftOrder ? 'Yeni Sipariş Oluştur' : 'Sipariş Düzenle'}
          onBack={returnToOrderList}
          backLabel="Sipariş listesine dön"
          actions={
            <div className="relative flex shrink-0 items-center gap-2" data-order-dropdown>
              {selectedOrder && !isDraftOrder ? (
                <Link
                  to={`/belge-merkezi/yazdir?type=order&id=${encodeURIComponent(selectedOrder.id)}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-xs font-black uppercase text-gray-300 hover:bg-dark-700 hover:text-white"
                >
                  <Printer className="h-4 w-4" /> Şablonla Yazdır
                </Link>
              ) : null}
              <div className="relative">
                <div className="btn-split">
                  <button
                    type="button"
                    onClick={() => saveCurrentOrder({ returnToList: false })}
                    disabled={!selectedOrder || isSaving}
                    className={`${BTN_SUCCESS} min-w-[10.5rem] gap-2.5 px-3 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                  <span className="btn-split-divider" aria-hidden />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenSaveMenu((open) => {
                        if (open) setPendingHeaderOrderDelete(false)
                        return !open
                      })
                    }}
                    disabled={!selectedOrder || isSaving}
                    className={`${BTN_SUCCESS} w-14 px-0 disabled:cursor-not-allowed disabled:opacity-50`}
                    title="Kaydet seçenekleri"
                    aria-expanded={openSaveMenu}
                    aria-haspopup="menu"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openSaveMenu ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {openSaveMenu && (
                  <div
                    className="absolute right-0 top-full z-40 mt-2 w-56 rounded-2xl border border-dark-500 bg-dark-900 p-2 text-left shadow-card"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => saveCurrentOrder({ startNew: true })}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-blue-500/15 hover:text-white"
                    >
                      Kaydet ve Yeni Ekle
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => saveCurrentOrder({ returnToList: true })}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-blue-500/15 hover:text-white"
                    >
                      Kaydet ve Listeye Dön
                    </button>
                    <div className="my-1 border-t border-dark-500/40" />
                    {pendingHeaderOrderDelete ? (
                      <ListDeleteConfirmPanel
                        title="Sipariş silinsin mi?"
                        description="Bu işlem geri alınamaz. Sipariş kalıcı olarak silinir."
                        onConfirm={() =>
                          deleteCurrentOrder({ navigateToList: true, skipConfirm: true })
                        }
                        onCancel={() => setPendingHeaderOrderDelete(false)}
                      />
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => setPendingHeaderOrderDelete(true)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Siparişi Sil
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          }
        />
      )}

      {viewMode === 'list' && (
        <SummaryMetrics
          items={[
            { title: 'Toplam Sipariş', value: summary.total, icon: ClipboardList },
            {
              title: 'Yeni Sipariş',
              value: summary.newOrders,
              icon: Send,
              tone: 'orange',
              valueTone: 'orange',
            },
            {
              title: 'Üretimde',
              value: summary.production,
              icon: CheckCircle2,
              tone: 'emerald',
              valueTone: 'emerald',
            },
            {
              title: 'Toplam KDV Hariç',
              value: `${formatTL(summary.totalNet)}`,
              icon: TurkishLiraIcon,
              tone: 'purple',
              valueTone: 'red',
            },
            {
              title: 'Toplam KDV Dahil',
              value: `${formatTL(summary.totalAmount)}`,
              icon: TurkishLiraIcon,
              tone: 'orange',
              valueTone: 'emerald',
            },
          ]}
        />
      )}

      {viewMode === 'list' ? (
        <Panel
          title="Sipariş Listesi"
          action={
            <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
              {filteredOrders.length} kayıt
            </span>
          }
        >
          <div className="mb-4 space-y-3">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş kodu, teklif no, müşteri veya yetkili ara..."
            />
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3 lg:grid-cols-3">
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
                  Öncelik
                </p>
                <EditableDropdownPill
                  value={filters.priority}
                  options={orderPriorityFilterOptions}
                  includePlaceholderOption={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-priority"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('priority', value)}
                  onOptionsChange={(next) => updateOptionList('priority', next)}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
                  Süreç
                </p>
                <EditableDropdownPill
                  value={filters.stage}
                  options={orderStageFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-stage"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('stage', value)}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">
                  Sıralama
                </p>
                <EditableDropdownPill
                  value={sortLabelByMode[sortMode] || 'Son işleme göre'}
                  options={sortFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-sort"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => setSortMode(sortModeByLabel[value] || 'latest')}
                />
              </div>
            </div>
          </div>

          <ListHeaderRow
            gridTemplate={orderListGrid}
            columns={[
              'Tarih',
              'Kod',
              'Müşteri Adı',
              'Öncelik',
              'Süreç',
              { label: 'KDV Hariç', align: 'right', className: 'pr-2 tracking-normal' },
              { label: 'KDV Dahil', align: 'right', className: 'pr-2 tracking-normal' },
            ]}
          />

          <div className="mt-3 space-y-2 overflow-visible">
            {filteredOrders.map((order) => {
              const totals = orderTotals(order)
              const activeStage = resolveOrderActiveStage(order, workflowStages)
              const isInProduction =
                activeStage?.label === 'Üretime Alındı' || order.status === 'Üretimde'
              const productionEntryStage = orderStageOptions.find(
                (item) => item.label === 'Üretime Alındı',
              )
              const stageSurfaceStage = isInProduction ? activeStage || productionEntryStage : null
              const stageColumnSurface = stageSurfaceStage
                ? getStageColumnSurfaceClasses(stageSurfaceStage)
                : ''
              const priorityValue = resolveListColumnLabel(
                order.priority,
                orderPriorityDropdownOptions,
              )
              const customerDisplay = getListCustomerDisplay(order.customer)
              const hasLinkedQuote = orderHasLinkedQuote(order)
              return (
                <div
                  key={order.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => editOrder(order.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') editOrder(order.id)
                  }}
                  className="relative grid cursor-pointer items-center gap-2 rounded-2xl border border-dark-500/45 bg-dark-800/55 px-3 py-3 transition-all hover:border-blue-500/35 hover:bg-dark-700/60"
                  style={{ gridTemplateColumns: orderListGrid }}
                >
                  <div className="min-w-0 text-left">
                    <p className="text-left text-xs font-semibold text-gray-500">
                      {formatListDateTime(getOrderListDateSource(order))}
                    </p>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-left text-xs font-black tabular-nums text-blue-300">
                      {order.id}
                    </p>
                  </div>
                  <div className="min-w-0 w-full text-left">
                    <div className="flex w-full min-w-0 items-center justify-start gap-2 text-left text-sm font-black text-white">
                      <span className="truncate">
                        {customerDisplay.brandShortName || 'Müşteri girilmedi'}
                      </span>
                      {customerDisplay.companyTitle && (
                        <span className="inline-flex min-w-0 items-center rounded-lg border border-dark-500/45 bg-dark-700/60 px-2 py-0.5 text-[12px] font-black text-gray-400">
                          <span className="truncate">{customerDisplay.companyTitle}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="min-w-0 w-full justify-self-start text-left"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EditableDropdownPill
                      value={priorityValue}
                      options={orderPriorityDropdownOptions}
                      buttonClassName={orderListProcessPillClass}
                      openKey={`${order.id}-priority`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => setOrderPriority(order, value)}
                      onOptionsChange={(next) => updateOptionList('priority', next)}
                    />
                  </div>
                  <div
                    className={`min-w-0 w-full justify-self-start text-left rounded-xl transition-colors ${stageColumnSurface ? `${stageColumnSurface} py-0.5` : ''}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EditableDropdownPill
                      value={activeStage?.label || orderStageDropdownOptions[0]?.label || ''}
                      options={orderStageDropdownOptions}
                      editable={false}
                      buttonClassName={
                        stageColumnSurface
                          ? `${orderListProcessPillClass} border-transparent bg-transparent hover:bg-black/10`
                          : orderListProcessPillClass
                      }
                      openKey={`${order.id}-stage`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => handleOrderStageLabelChange(order, value)}
                    />
                  </div>
                  <span className="block min-w-0 w-full pr-2 text-right text-sm font-bold tabular-nums text-gray-200">
                    {formatTL(totals.net)}
                  </span>
                  <span className="block min-w-0 w-full pr-2 text-right text-sm font-black tabular-nums text-white">
                    {formatTL(totals.grandTotal)}
                  </span>
                  <div
                    className="relative z-10 flex h-9 w-full items-center justify-end gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {isInProduction ? (
                      <span className="whitespace-nowrap rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[12px] font-bold text-emerald-400/90">
                        Üretimde
                      </span>
                    ) : null}
                    <MoreMenu
                      items={[
                        ...(hasLinkedQuote
                          ? [
                              {
                                id: 'cancel',
                                label: 'Vazgeç',
                                icon: Undo2,
                                onClick: () =>
                                  handleCancelOrderFromList(order, { stopPropagation: () => {} }),
                              },
                            ]
                          : []),
                        ...(!isInProduction && productionEntryStage
                          ? [
                              {
                                id: 'produce',
                                label: 'Üretime al',
                                icon: Factory,
                                onClick: () => {
                                  transferOrderToProduction(order, productionEntryStage)
                                  navigate('/uretim')
                                },
                              },
                            ]
                          : []),
                        {
                          id: 'delete',
                          label: 'Sil',
                          icon: Trash2,
                          tone: 'danger',
                          onClick: () => setPendingDeleteId(order.id),
                        },
                      ]}
                    />
                    {pendingDeleteId === order.id ? (
                      <DeleteTrashButton
                        pending
                        onClick={() => setPendingDeleteId(order.id)}
                        onConfirm={() => {
                          removeOrder(order)
                          setPendingDeleteId(null)
                        }}
                        onCancel={() => setPendingDeleteId(null)}
                        title="Sipariş silinsin mi?"
                        description="Bu işlem geri alınamaz."
                        popoverClassName="absolute right-0 top-1/2 z-20 -translate-y-1/2"
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-white">Sipariş bulunamadı.</p>
              <p className="mt-1 text-xs text-gray-500">Arama veya filtreleri değiştirin.</p>
            </div>
          )}
        </Panel>
      ) : (
        selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-12 gap-4">
              <section className="col-span-12 rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
                    <DocumentField label="Sipariş Başlığı">
                      <input
                        value={selectedOrder.title}
                        onChange={(e) => patchSelected({ title: e.target.value })}
                        className="form-input"
                      />
                    </DocumentField>
                    {selectedOrder.quoteId && (
                      <DocumentField label="Kaynak Teklif">
                        <div className="form-input flex items-center bg-dark-900/40 font-bold text-emerald-300">
                          {selectedOrder.quoteId}
                        </div>
                      </DocumentField>
                    )}
                  </div>
                  <CustomerPicker record={selectedOrder} onPatch={patchSelected} />
                  <DocumentField label="Oluşturma Tarihi">
                    <input
                      type="date"
                      value={selectedOrder.createdAt}
                      onChange={(e) => patchSelected({ createdAt: e.target.value })}
                      className="form-input"
                    />
                  </DocumentField>
                  <DocumentField label="Teslim Tarihi">
                    <input
                      type="date"
                      value={selectedOrder.deliveryDate || ''}
                      onChange={(e) => patchSelected({ deliveryDate: e.target.value })}
                      className="form-input"
                    />
                  </DocumentField>
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
              </section>
            </div>

            <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
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
            </section>

            <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Ürün Seçimi</h2>
                </div>
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
            </section>

            {selectedTotals && (
              <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                <div className="grid grid-cols-[minmax(0,1fr)_480px] items-start gap-4">
                  <div className="min-w-0">
                    <DocumentTermsEditor
                      record={selectedOrder}
                      onPatch={patchSelected}
                      compact
                      title="Sipariş Koşulları"
                      savedTermsTitle="Hazır Sipariş Koşulları"
                      descriptionPlaceholder="Siparişin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
                    />
                  </div>
                  <DocumentTotalsPanel totals={selectedTotals} onPatch={patchSelected} />
                </div>
              </section>
            )}

            <DocumentActivityPanel
              activities={selectedOrder.activities || []}
              isOpen={isActivityOpen}
              onToggle={() => setIsActivityOpen((current) => !current)}
            />
          </div>
        )
      )}

      <CreateCustomerPickModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={handleCreateWithCustomer}
        description="Sipariş oluşturmak için müşteri seçin."
      />
    </AppPageShell>
  )
}
