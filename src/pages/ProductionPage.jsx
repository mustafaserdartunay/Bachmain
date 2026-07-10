import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Factory } from 'lucide-react'
import SearchInput from '../components/Common/SearchInput'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { DeleteTrashButton, LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../components/EditableDropdownPill'
import ProductionJobFlowBadge from '../components/Production/ProductionJobFlowBadge'
import ProductionListLineItemRow from '../components/Production/ProductionListLineItemRow'
import { getListCustomerDisplay } from '../data/customerProfiles'
import {
  applyJobProductionStageToLineItems,
  ensureLineItems,
  getLineFulfillmentOptions,
  resolveLineItemOrderQuantity,
  resolveOrderForProductionJob,
} from '../utils/productionLineItems'
import {
  formatQty,
  getJobQuantityMetrics,
  jobMatchesProductionStateFilter,
  jobMatchesQuantityFilter,
  PRODUCTION_STATE_FILTER_OPTIONS,
} from '../utils/productionQuantityMetrics'
import {
  appendProductionJobActivity,
  createProductionLineItemActions,
} from '../utils/productionLineItemActions'
import {
  deleteProductionJob,
  loadProductionJobs,
  updateProductionJob,
} from '../utils/productionStore'
import { getProductionJobTimelineDates } from '../utils/productionJobTimeline'
import { loadOrders } from '../utils/ordersStore'
import { loadQuotes } from '../utils/quotesStore'
import {
  getProductionStageOptions,
  loadWorkflowStages,
  resolveProductionActiveStage,
  toStageDropdownOptions,
} from '../utils/workflowStages'

const productionListGrid =
  '96px minmax(128px, 1fr) 96px 104px 120px 96px 240px 76px'

const LIST_ROW_CELL = 'flex h-full min-w-0 items-center'
const DATE_COL_LINE = 'min-h-[15px] leading-tight'
const DATE_COL_CELL = 'flex h-full min-w-0 flex-col justify-center'

function TwoLineDateHeader({ top }) {
  return (
    <>
      <span className={DATE_COL_LINE}>{top}</span>
      <span className={DATE_COL_LINE}>Tarihi</span>
    </>
  )
}

function TimelineDateCell({ value }) {
  const formatted = formatListDateTime(value)

  if (!formatted) {
    return (
      <div className={LIST_ROW_CELL}>
        <p className="truncate text-[12px] font-semibold tabular-nums text-gray-400">—</p>
      </div>
    )
  }

  const [datePart, timePart] = formatted.split(' ')

  if (timePart) {
    return (
      <div className={DATE_COL_CELL} title={formatted}>
        <p className={`${DATE_COL_LINE} truncate text-[12px] font-semibold tabular-nums text-gray-400`}>
          {datePart}
        </p>
        <p className={`${DATE_COL_LINE} truncate text-[12px] font-semibold tabular-nums text-gray-400`}>
          {timePart}
        </p>
      </div>
    )
  }

  return (
    <div className={LIST_ROW_CELL}>
      <p
        className="truncate text-[12px] font-semibold tabular-nums text-gray-400"
        title={formatted}
      >
        {formatted}
      </p>
    </div>
  )
}

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const quantityFilterOptions = [
  filterAllOption,
  { label: 'Kısmi Teslimat', color: 'bg-amber-500' },
  { label: 'Kalan Adet Var', color: 'bg-orange-500' },
  { label: 'Fazla Üretim', color: 'bg-sky-500' },
]

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

function formatListDate(value) {
  if (!value) return ''
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value
  const [datePart] = String(value).split(' ')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
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

export default function ProductionPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(loadProductionJobs)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ process: 'Tümü', status: 'Tümü', quantity: 'Tümü' })
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [expandedJobIds, setExpandedJobIds] = useState(() => new Set())
  const [fulfillmentOptions, setFulfillmentOptions] = useState(() => getLineFulfillmentOptions())

  const productionStageOptions = getProductionStageOptions(workflowStages)
  const productionStageDropdownOptions = toStageDropdownOptions(productionStageOptions)
  const productionProcessFilterOptions = [filterAllOption, ...productionStageDropdownOptions]
  const productionStatusFilterOptions = PRODUCTION_STATE_FILTER_OPTIONS
  const productionStatusListOptions = fulfillmentOptions

  useEffect(() => {
    function refresh() {
      setJobs(loadProductionJobs())
    }
    function refreshWorkflowStages() {
      setWorkflowStages(loadWorkflowStages())
      setJobs(loadProductionJobs())
    }
    function refreshFulfillmentOptions() {
      setFulfillmentOptions(getLineFulfillmentOptions())
      setJobs(loadProductionJobs())
    }
    window.addEventListener('bach:production-updated', refresh)
    window.addEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
    window.addEventListener('bach:production-fulfillment-updated', refreshFulfillmentOptions)
    return () => {
      window.removeEventListener('bach:production-updated', refresh)
      window.removeEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
      window.removeEventListener('bach:production-fulfillment-updated', refreshFulfillmentOptions)
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

  function refreshJobs() {
    setJobs(loadProductionJobs())
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function removeJob(job) {
    deleteProductionJob(job.id)
    refreshJobs()
    setPendingDeleteId(null)
  }

  function toggleJobExpanded(jobId) {
    setExpandedJobIds((current) => {
      const next = new Set(current)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function handleJobStageChange(job, stageLabel) {
    const stage = productionStageOptions.find((item) => item.label === stageLabel)
    if (!stage || job.stage === stageLabel) return
    const nextLineItems = applyJobProductionStageToLineItems(
      ensureLineItems(job, workflowStages),
      stage.id,
      workflowStages,
    )
    updateProductionJob(job.id, { lineItems: nextLineItems })
    refreshJobs()
    setActiveMenu(null)
  }

  function getLineItemActions(job) {
    return createProductionLineItemActions({
      job,
      productionStageOptions,
      refreshJobs,
      addJobActivity: (text, extraPatch = {}) => {
        updateProductionJob(job.id, appendProductionJobActivity(job.id, text, extraPatch))
        refreshJobs()
      },
      setActiveMenu,
    })
  }

  const filteredJobs = jobs.filter((job) => {
    const activeStage = resolveProductionActiveStage(job, workflowStages)
    const q = searchQuery.toLowerCase()
    const lineItems = ensureLineItems(job, workflowStages)
    const matchesSearch = !q
      || job.id.toLowerCase().includes(q)
      || (job.customer || '').toLowerCase().includes(q)
      || (job.title || '').toLowerCase().includes(q)
      || lineItems.some((line) => (line.product || '').toLowerCase().includes(q))
    const matchesProcess = filters.process === 'Tümü' || activeStage?.label === filters.process
    const matchesStatus = jobMatchesProductionStateFilter(job, filters.status, workflowStages)
    const matchesQuantity = jobMatchesQuantityFilter(job, filters.quantity, workflowStages)
    return matchesSearch && matchesProcess && matchesStatus && matchesQuantity
  })

  const summary = {
    total: filteredJobs.length,
    active: filteredJobs.filter((job) => job.status === 'Devam Ediyor').length,
    partial: filteredJobs.filter((job) => (
      job.status === 'Kısmi Üretim Bitti' || job.status === 'Kısmi Teslimat'
    )).length,
    completed: filteredJobs.filter((job) => job.status === 'Tamamlandı').length,
    quantity: filteredJobs.reduce((sum, job) => sum + Number(job.quantity || 0), 0),
  }

  const orders = loadOrders()
  const quotes = loadQuotes()

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="flex justify-center">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Üretim Takibi</h1>
        </div>
      </div>

      <SummaryMetrics
        items={[
          { title: 'Toplam Sipariş', value: summary.total, icon: Factory },
          { title: 'Devam Eden', value: summary.active, icon: CheckCircle2, tone: 'blue', valueTone: 'blue' },
          { title: 'Kısmi İlerleme', value: summary.partial, icon: ClipboardList, tone: 'orange', valueTone: 'orange' },
          { title: 'Tamamlanan', value: summary.completed, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Toplam Adet', value: summary.quantity.toLocaleString('tr-TR'), icon: Factory, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <Panel
        title="Üretim Listesi"
        action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filteredJobs.length} kayıt</span>}
      >
        <div className="mb-4 space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Sipariş kodu, müşteri veya ürün kalemi ara..."
          />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 lg:grid-cols-3">
            <div>
              <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Süreç</p>
              <EditableDropdownPill
                value={filters.process}
                options={productionProcessFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-process"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('process', value)}
              />
            </div>
            <div>
              <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Durum</p>
              <EditableDropdownPill
                value={filters.status}
                options={productionStatusFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-status"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('status', value)}
              />
            </div>
            <div>
              <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Adet / Teslimat</p>
              <EditableDropdownPill
                value={filters.quantity}
                options={quantityFilterOptions}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={LIST_PILL_CLASS}
                openKey="filter-quantity"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateFilter('quantity', value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark-500/40 bg-dark-800/70">
          <ListHeaderRow
            variant="plain"
            gridTemplate={productionListGrid}
            className="items-stretch gap-3 px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-500"
            columns={[
              { label: 'Kod', className: LIST_ROW_CELL },
              { label: 'Müşteri Adı', className: `${LIST_ROW_CELL} -ml-3` },
              { label: 'Teklif Tarihi', className: DATE_COL_CELL, content: <TwoLineDateHeader top="Teklif" /> },
              { label: 'Sipariş Tarihi', className: DATE_COL_CELL, content: <TwoLineDateHeader top="Sipariş" /> },
              { label: 'Üretim Tarihi', className: DATE_COL_CELL, content: <TwoLineDateHeader top="Üretim" /> },
              { label: 'Teslim Tarihi', className: DATE_COL_CELL, content: <TwoLineDateHeader top="Teslim" /> },
              { label: 'flow', className: LIST_ROW_CELL, content: '' },
              { label: 'action', className: `${LIST_ROW_CELL} justify-end`, content: '' },
            ]}
          />
        </div>

        <div className="mt-3 space-y-2 overflow-visible">
          {filteredJobs.map((job) => {
            const customerDisplay = getListCustomerDisplay(job.customer)
            const order = resolveOrderForProductionJob(job, orders)
            const lineItems = ensureLineItems(job, workflowStages, order)
            const isExpanded = expandedJobIds.has(job.id)
            const isRowMenuOpen = Boolean(activeMenu?.startsWith(`${job.id}-`))
            const isRowOverlayOpen = isRowMenuOpen || pendingDeleteId === job.id
            const lineItemActions = getLineItemActions(job)
            const timeline = getProductionJobTimelineDates(job, lineItems, { orders, quotes })

            return (
              <div
                key={job.id}
                className={`rounded-2xl border transition-all ${
                  isRowOverlayOpen ? 'relative z-40 overflow-visible' : 'overflow-hidden'
                } border-dark-500/45 bg-dark-800/55 hover:border-blue-500/35 hover:bg-dark-700/60`}
              >
                <div className={`relative px-3 ${isExpanded ? 'pt-3 pb-3' : 'py-3'}`}>
                  <div
                    className="grid items-stretch gap-3"
                    style={{ gridTemplateColumns: productionListGrid }}
                  >
                    <div className={LIST_ROW_CELL}>
                      <p className="text-xs font-black tabular-nums text-blue-300">{job.id}</p>
                    </div>
                    <div className={`${LIST_ROW_CELL} -ml-3`}>
                      <p className="flex min-w-0 items-center gap-1.5 text-sm font-black text-white">
                        <span className="shrink-0 truncate">{customerDisplay.brandShortName || 'Müşteri girilmedi'}</span>
                        {customerDisplay.companyTitle && (
                          <span className="inline-flex min-w-0 items-center rounded-lg border border-dark-500/45 bg-dark-700/60 px-2 py-0.5 text-[12px] font-black text-gray-400">
                            <span className="truncate">{customerDisplay.companyTitle}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <TimelineDateCell value={timeline.quoteDate} />
                    <TimelineDateCell value={timeline.orderDate} />
                    <TimelineDateCell value={timeline.productionStartDate} />
                    <TimelineDateCell value={timeline.completedDate} />
                    <div className={`${LIST_ROW_CELL} justify-end`}>
                      <ProductionJobFlowBadge
                        lineItems={lineItems}
                        jobStatus={job.status || 'Devam Ediyor'}
                        variant="aggregate"
                        className="sm:min-w-0"
                      />
                    </div>
                    <div className={`relative z-10 ${LIST_ROW_CELL} justify-end gap-1.5`} onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleJobExpanded(job.id)}
                        className={`rounded-lg border p-2 transition-colors ${
                          isExpanded
                            ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                            : 'border-dark-500/50 bg-dark-700/70 text-gray-400 hover:border-blue-500/35 hover:bg-dark-700/80 hover:text-blue-300'
                        }`}
                        title={isExpanded ? 'Kalemleri gizle' : 'Kalemleri göster'}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <DeleteTrashButton
                        pending={pendingDeleteId === job.id}
                        onClick={() => setPendingDeleteId(job.id)}
                        onConfirm={() => {
                          removeJob(job)
                          setPendingDeleteId(null)
                        }}
                        onCancel={() => setPendingDeleteId(null)}
                        title="Üretim kaydı silinsin mi?"
                        description="Bu işlem geri alınamaz."
                        popoverClassName="absolute right-0 top-1/2 z-20 -translate-y-1/2"
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2 border-t border-dark-500/35 pb-3 pt-2">
                      {lineItems.map((lineItem, lineIndex) => (
                      <ProductionListLineItemRow
                        key={lineItem.id}
                        lineItem={lineItem}
                        lineIndex={lineIndex}
                        lineCount={lineItems.length}
                        productionJobId={job.id}
                        productionStages={productionStageOptions}
                        fulfillmentOptions={productionStatusListOptions}
                        fulfillmentOpenKey={`${job.id}-${lineItem.id}-fulfillment`}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onQuantityRowStageChange={(rowId, stageId) => (
                          lineItemActions.handleQuantityRowStageChange(lineItem, rowId, stageId)
                        )}
                        onAddQuantityRow={(rowId) => lineItemActions.handleAddQuantityRow(lineItem, rowId)}
                        onRemoveQuantityRow={(rowId) => lineItemActions.handleRemoveQuantityRow(lineItem, rowId)}
                        onQuantityRowChange={(rowId, patch) => (
                          lineItemActions.handleLineQuantityRowChange(lineItem, rowId, patch)
                        )}
                        onStagePhotosChange={(photos) => lineItemActions.handleStagePhotosChange(lineItem, photos)}
                        onRemoveLineItem={() => lineItemActions.handleRemoveLineItem(lineItem)}
                        onSendToDepo={(rowId) => {
                          lineItemActions.handleSendRowToDepo(lineItem, rowId, resolveLineItemOrderQuantity(lineItem, order))
                        }}
                        onUndoSendToDepo={(rowId) => {
                          lineItemActions.handleUndoSendRowToDepo(lineItem, rowId)
                        }}
                        jobStatus={job.status}
                        orderLineQuantity={resolveLineItemOrderQuantity(lineItem, order)}
                      />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-8 text-center">
            <Factory className="mx-auto mb-3 h-8 w-8 text-gray-600" />
            <p className="text-sm font-bold text-white">Üretim kaydı bulunamadı.</p>
            <p className="mt-1 text-xs text-gray-500">Siparişler sayfasında &quot;Üretime Alındı&quot; seçildiğinde kayıtlar buraya kopyalanır.</p>
          </div>
        )}
      </Panel>
    </div>
  )
}
