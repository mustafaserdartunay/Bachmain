import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Factory, Layers3 } from 'lucide-react'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import SearchInput from '../components/Common/SearchInput'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_GRADIENTS,
  HeaderQuickActionCard,
} from '../components/Layout/HeaderCashActionsPanel'
import ProductionFilterBar from '../components/Production/ProductionFilterBar'
import ProductionJobCard from '../components/Production/ProductionJobCard'
import { ensureLineItems, getLineFulfillmentOptions } from '../utils/productionLineItems'
import {
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
  cancelProductionBackToOrder,
  deleteProductionJob,
  loadProductionJobs,
  sendProductionJobToDepo,
  updateProductionJob,
} from '../utils/productionStore'
import { loadOrders } from '../utils/ordersStore'
import { loadQuotes } from '../utils/quotesStore'
import {
  getProductionStageOptions,
  loadWorkflowStages,
  resolveProductionActiveStage,
  toStageDropdownOptions,
} from '../utils/workflowStages'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
} from '../utils/dashboardDesign'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const quantityFilterOptions = [
  filterAllOption,
  { label: 'Kısmi Teslimat', color: 'bg-amber-500' },
  { label: 'Kalan Adet Var', color: 'bg-orange-500' },
  { label: 'Fazla Üretim', color: 'bg-sky-500' },
]
const productionStatusFilterOptions = PRODUCTION_STATE_FILTER_OPTIONS.filter((option) =>
  ['Tümü', 'Devam Eden', 'Tamamlanan', 'Beklemede', 'İptal', 'Depoya Gönderilenler'].includes(
    option.label,
  ),
)

const PRODUCTION_CREATE_ACTION = {
  id: 'production',
  to: () => '/uretim/yeni',
  title: 'Yeni Üretim Oluştur',
  icon: Factory,
  gradient: HEADER_ACTION_GRADIENTS.primary,
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
  const [selectedJobIds, setSelectedJobIds] = useState(() => new Set())
  const [fulfillmentOptions, setFulfillmentOptions] = useState(() => getLineFulfillmentOptions())

  const productionStageOptions = getProductionStageOptions(workflowStages)
  const productionStageDropdownOptions = toStageDropdownOptions(productionStageOptions)
  const productionProcessFilterOptions = [filterAllOption, ...productionStageDropdownOptions]

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

  function toggleJobSelected(jobId) {
    setSelectedJobIds((current) => {
      const next = new Set(current)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
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

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const activeStage = resolveProductionActiveStage(job, workflowStages)
      const q = searchQuery.toLowerCase()
      const lineItems = ensureLineItems(job, workflowStages)
      const matchesSearch =
        !q ||
        job.id.toLowerCase().includes(q) ||
        (job.customer || '').toLowerCase().includes(q) ||
        (job.title || '').toLowerCase().includes(q) ||
        lineItems.some((line) => (line.product || '').toLowerCase().includes(q))
      const matchesProcess = filters.process === 'Tümü' || activeStage?.label === filters.process
      const matchesStatus = jobMatchesProductionStateFilter(job, filters.status, workflowStages)
      const matchesQuantity = jobMatchesQuantityFilter(job, filters.quantity, workflowStages)
      return matchesSearch && matchesProcess && matchesStatus && matchesQuantity
    })
  }, [jobs, searchQuery, filters.process, filters.status, filters.quantity, workflowStages])

  const summary = useMemo(() => {
    const active = filteredJobs.filter((job) =>
      jobMatchesProductionStateFilter(job, 'Devam Eden', workflowStages),
    ).length
    const partial = filteredJobs.filter((job) => {
      const metrics = getJobQuantityMetrics(ensureLineItems(job, workflowStages))
      return (
        metrics.linesWithPartialDelivery > 0 ||
        job.status === 'Kısmi Üretim Bitti' ||
        job.status === 'Kısmi Teslimat'
      )
    }).length
    const completed = filteredJobs.filter((job) =>
      jobMatchesProductionStateFilter(job, 'Tamamlanan', workflowStages),
    ).length
    const quantity = filteredJobs.reduce((sum, job) => {
      const metrics = getJobQuantityMetrics(ensureLineItems(job, workflowStages))
      return sum + metrics.ordered
    }, 0)

    return {
      total: filteredJobs.length,
      active,
      partial,
      completed,
      quantity,
    }
  }, [filteredJobs, workflowStages])

  const orders = loadOrders()
  const quotes = loadQuotes()

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="ÜRETİM"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={<HeaderQuickActionCard fixed action={PRODUCTION_CREATE_ACTION} />}
      />

      <SummaryMetrics
        columns={4}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: 'Toplam Sipariş',
            value: summary.total,
            icon: Factory,
            valueTone: 'text-violet-800',
          },
          {
            title: 'Devam Eden',
            value: summary.active,
            icon: ClipboardList,
            tone: 'emerald',
            valueTone: 'text-blue-800',
          },
          {
            title: 'Kısmi İlerleme',
            value: summary.partial,
            icon: Layers3,
            tone: 'orange',
            valueTone: 'text-[#ea580c]',
          },
          {
            title: 'Tamamlanan',
            value: summary.completed,
            icon: CheckCircle2,
            tone: 'purple',
            valueTone: 'text-emerald-800',
          },
        ]}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <ProductionFilterBar
          searchQuery={searchQuery}
          onSearchChange={(event) => setSearchQuery(event.target.value)}
          filters={filters}
          onFilterChange={updateFilter}
          processOptions={productionProcessFilterOptions}
          statusOptions={productionStatusFilterOptions}
          quantityOptions={quantityFilterOptions}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
      </AppPagePanel>

      <AppPagePanel className="customer-list-panel w-full">
        <div className="mb-4 flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Üretim Listesi</h2>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş, müşteri veya ürün ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>
            {filteredJobs.length} Kayıt
            {selectedJobIds.size ? ` · ${selectedJobIds.size} seçili` : ''}
          </span>
        </div>

        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <ProductionJobCard
              key={job.id}
              job={job}
              workflowStages={workflowStages}
              productionStages={productionStageOptions}
              fulfillmentOptions={fulfillmentOptions}
              orders={orders}
              quotes={quotes}
              expanded={expandedJobIds.has(job.id)}
              onToggleExpand={() => toggleJobExpanded(job.id)}
              pendingDelete={pendingDeleteId === job.id}
              onRequestDelete={() => setPendingDeleteId(job.id)}
              onConfirmDelete={() => removeJob(job)}
              onCancelDelete={() => setPendingDeleteId(null)}
              onCancelProduction={() => {
                cancelProductionBackToOrder(job.id)
                refreshJobs()
              }}
              onSendToDepo={() => {
                sendProductionJobToDepo(job.id)
                refreshJobs()
                navigate('/depo')
              }}
              lineItemActions={getLineItemActions(job)}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              selected={selectedJobIds.has(job.id)}
              onToggleSelect={toggleJobSelected}
            />
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#F8FAFC)]/70 p-10 text-center dark:bg-white/5">
            <Factory className="mx-auto mb-3 h-8 w-8 text-[var(--muted,#94A3B8)]" />
            <p className="text-sm font-bold text-[var(--ink,#0F172A)]">Üretim kaydı bulunamadı.</p>
            <p className="mt-1 text-[13px] text-[var(--muted,#64748B)]">
              Siparişler sayfasında &quot;Üretime Alındı&quot; seçildiğinde kayıtlar buraya
              kopyalanır.
            </p>
          </div>
        ) : null}
      </AppPagePanel>
    </AppPageShell>
  )
}
