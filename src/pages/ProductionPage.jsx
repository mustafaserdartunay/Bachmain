import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArchiveRestore,
  CheckCircle2,
  ClipboardList,
  Factory,
  Layers3,
  Package,
  Trash2,
} from 'lucide-react'
import { DataTable } from '@bachmain/ui'
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
import ProductionJobCard, {
  formatShortDate,
} from '../components/Production/ProductionJobCard'
import ProductionProgressRing from '../components/Production/ProductionProgressRing'
import { getListCustomerDisplay } from '../data/customerProfiles'
import { ensureLineItems, getLineFulfillmentOptions } from '../utils/productionLineItems'
import {
  getJobQuantityMetrics,
  jobMatchesProductionStateFilter,
  jobMatchesQuantityFilter,
  PRODUCTION_STATE_FILTER_OPTIONS,
  resolveJobProductionProgress,
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
import { getProductionJobTimelineDates } from '../utils/productionJobTimeline'
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
  PAGE_TABLE_HEADER_CLASS,
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
  const [expandedJobId, setExpandedJobId] = useState(null)
  const [fulfillmentOptions, setFulfillmentOptions] = useState(() => getLineFulfillmentOptions())

  const productionStageOptions = getProductionStageOptions(workflowStages)
  const productionStageDropdownOptions = toStageDropdownOptions(productionStageOptions)
  const productionProcessFilterOptions = [filterAllOption, ...productionStageDropdownOptions]
  const orders = useMemo(() => loadOrders(), [jobs])
  const quotes = useMemo(() => loadQuotes(), [jobs])

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
    if (expandedJobId === job.id) setExpandedJobId(null)
  }

  function toggleJobExpanded(jobId) {
    setExpandedJobId((current) => (current === jobId ? null : jobId))
  }

  function getLineItemActions(job) {
    // Prefer live settings list; fall back to page snapshot if empty.
    const liveStages = getProductionStageOptions(loadWorkflowStages())
    const stageOptions = liveStages.length ? liveStages : productionStageOptions
    return createProductionLineItemActions({
      job,
      productionStageOptions: stageOptions,
      workflowStages,
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

  const expandedJob = filteredJobs.find((job) => job.id === expandedJobId) || null

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

      <AppPagePanel className="customer-filter-panel flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] w-full items-center">
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
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredJobs.length} Kayıt</span>
        </div>

        <DataTable
          emptyTitle="Üretim kaydı bulunamadı"
          emptyDescription='Siparişler sayfasında "Üretime Alındı" seçildiğinde kayıtlar buraya kopyalanır.'
          headerClassName={PAGE_TABLE_HEADER_CLASS}
          mobileHeaderClassName={PAGE_TABLE_HEADER_CLASS}
          data={filteredJobs}
          defaultSort={{ key: 'orderDate', dir: 'desc' }}
          getRowId={(job) => job.id}
          onRowClick={(job) => toggleJobExpanded(job.id)}
          columns={[
            {
              id: 'customer',
              header: 'MÜŞTERİLER',
              sortable: true,
              accessorKey: 'customer',
              className: 'min-w-[18rem] w-[40%]',
              getSortValue: (job) => {
                const display = getListCustomerDisplay(job.customer)
                return display.brandShortName || display.companyTitle || job.customer || ''
              },
              cell: (job) => {
                const display = getListCustomerDisplay(job.customer)
                const companyTitle = display.companyTitle || job.customer || '—'
                return (
                  <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                    <span className="customer-name-primary truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                      {display.brandShortName || companyTitle}
                    </span>
                    <span className="customer-name-secondary font-sans truncate text-[14px] font-normal leading-tight text-[var(--muted)]">
                      {companyTitle}
                    </span>
                  </span>
                )
              },
            },
            {
              id: 'orderDate',
              header: 'SİPARİŞ',
              sortable: true,
              accessorKey: 'orderDate',
              className: 'w-[8.5rem]',
              getSortValue: (job) => {
                const timeline = getProductionJobTimelineDates(
                  job,
                  ensureLineItems(job, workflowStages),
                  { orders, quotes },
                )
                return timeline.orderDate || ''
              },
              cell: (job) => {
                const timeline = getProductionJobTimelineDates(
                  job,
                  ensureLineItems(job, workflowStages),
                  { orders, quotes },
                )
                return (
                  <span className="tabular-nums text-[14px] font-semibold text-[var(--muted)]">
                    {formatShortDate(timeline.orderDate)}
                  </span>
                )
              },
            },
            {
              id: 'productionStart',
              header: 'ÜRETİM',
              sortable: true,
              accessorKey: 'productionStart',
              className: 'w-[8.5rem]',
              getSortValue: (job) => {
                const timeline = getProductionJobTimelineDates(
                  job,
                  ensureLineItems(job, workflowStages),
                  { orders, quotes },
                )
                return timeline.productionStartDate || ''
              },
              cell: (job) => {
                const timeline = getProductionJobTimelineDates(
                  job,
                  ensureLineItems(job, workflowStages),
                  { orders, quotes },
                )
                return (
                  <span className="tabular-nums text-[14px] font-semibold text-[var(--muted)]">
                    {formatShortDate(timeline.productionStartDate)}
                  </span>
                )
              },
            },
            {
              id: 'status',
              header: 'DURUM',
              className: 'w-[11rem]',
              cell: (job) => {
                const lineItems = ensureLineItems(job, workflowStages)
                const progress = resolveJobProductionProgress(
                  job,
                  lineItems,
                  productionStageOptions,
                )
                return (
                  <div className="flex h-full w-full items-center justify-center">
                    <ProductionProgressRing
                      percent={progress.percent}
                      label={progress.label}
                      stageCount={progress.stageCount || productionStageOptions.length}
                      size={52}
                      stroke={5}
                    />
                  </div>
                )
              },
            },
          ]}
          getRowActions={(job) => [
            {
              id: 'expand',
              label: expandedJobId === job.id ? 'Detayı Kapat' : 'Detayı Aç',
              icon: ClipboardList,
              tone: 'primary',
              onClick: () => toggleJobExpanded(job.id),
            },
            {
              id: 'cancel',
              label: 'Vazgeç',
              icon: ArchiveRestore,
              tone: 'orange',
              onClick: () => {
                cancelProductionBackToOrder(job.id)
                refreshJobs()
              },
            },
            {
              id: 'depo',
              label: 'Depoya gönder',
              icon: Package,
              tone: 'success',
              onClick: () => {
                sendProductionJobToDepo(job.id)
                refreshJobs()
                navigate('/depo')
              },
            },
            {
              id: 'delete',
              label: 'Sil',
              icon: Trash2,
              tone: 'danger',
              onClick: () => setPendingDeleteId(job.id),
            },
          ]}
        />

        {expandedJob ? (
          <ProductionJobCard
            job={expandedJob}
            workflowStages={workflowStages}
            productionStages={productionStageOptions}
            fulfillmentOptions={fulfillmentOptions}
            onFulfillmentOptionsChange={setFulfillmentOptions}
            orders={orders}
            pendingDelete={pendingDeleteId === expandedJob.id}
            onRequestDelete={() => setPendingDeleteId(expandedJob.id)}
            onConfirmDelete={() => removeJob(expandedJob)}
            onCancelDelete={() => setPendingDeleteId(null)}
            lineItemActions={getLineItemActions(expandedJob)}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onRefresh={refreshJobs}
          />
        ) : null}
      </AppPagePanel>
    </AppPageShell>
  )
}
