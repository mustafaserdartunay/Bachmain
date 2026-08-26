import { useEffect, useMemo, useRef, useState } from 'react'
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
import { EmptyState } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import QuoteDeletedArchivedPanel from '../components/Common/QuoteDeletedArchivedPanel'
import QuoteOrderInlineConfirm from '../components/Common/QuoteOrderInlineConfirm'
import ProcessListRowMoreMenu from '../components/Common/ProcessListRowMoreMenu'
import {
  QuoteListCell,
  QuoteListColumnHeader,
  QuoteListRowPanel,
  QuoteListSelectionCheckbox,
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
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import ProductionFilterBar from '../components/Production/ProductionFilterBar'
import ProductionProgressRing from '../components/Production/ProductionProgressRing'
import { getListCustomerDisplay } from '../data/customerProfiles'
import { ensureLineItems } from '../utils/productionLineItems'
import {
  formatQty,
  getJobQuantityMetrics,
  jobMatchesProductionStateFilter,
  jobMatchesQuantityFilter,
  PRODUCTION_STATE_FILTER_OPTIONS,
  resolveJobProductionProgress,
} from '../utils/productionQuantityMetrics'
import {
  cancelProductionBackToOrder,
  deleteProductionJob,
  loadProductionJobs,
  permanentlyDeleteProductionJob,
  restoreDeletedProductionJob,
  sendProductionJobToDepo,
} from '../utils/productionStore'
import { loadOrders } from '../utils/ordersStore'
import { loadQuotes } from '../utils/quotesStore'
import { getProductionJobTimelineDates } from '../utils/productionJobTimeline'
import { resolveQuoteCode } from '../utils/documentCodes'
import { formatListDateParts } from '../utils/quoteListDateFormat'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { COP_KUTUSU_ICON_CLASS } from '../utils/buttonStyles'
import {
  getProductionStageOptions,
  loadWorkflowStages,
  resolveProductionActiveStage,
  toStageDropdownOptions,
} from '../utils/workflowStages'
import {
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import EditableDropdownPill from '../components/EditableDropdownPill'

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

function compareSortValue(a, b, dir) {
  const sign = dir === 'desc' ? -1 : 1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign
  return String(a || '').localeCompare(String(b || ''), 'tr', { numeric: true }) * sign
}

export default function ProductionPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(loadProductionJobs)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ process: 'Tümü', status: 'Tümü', quantity: 'Tümü' })
  const [activeMenu, setActiveMenu] = useState(null)
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
  const listColumnSortRef = useRef(listColumnSort)
  listColumnSortRef.current = listColumnSort
  const listColumnSortLockRef = useRef(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedJobIds, setSelectedJobIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [archiveReceiveKey, setArchiveReceiveKey] = useState(0)

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
    window.addEventListener('bach:production-updated', refresh)
    window.addEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
    return () => {
      window.removeEventListener('bach:production-updated', refresh)
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

  function refreshJobs() {
    setJobs(loadProductionJobs())
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function jobTimeline(job) {
    return getProductionJobTimelineDates(job, ensureLineItems(job, workflowStages), {
      orders,
      quotes,
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

  const listJobs = useMemo(() => {
    if (!listColumnSort.key) return filteredJobs
    const dir = listColumnSort.dir
    const ids = jobs.map((item) => item.id)
    return [...filteredJobs].sort((a, b) => {
      const valueOf = (job) => {
        if (listColumnSort.key === 'date') return jobTimeline(job).orderDate || job.createdAt || ''
        if (listColumnSort.key === 'code') return resolveQuoteCode(job.id, ids)
        if (listColumnSort.key === 'customer') {
          const display = getListCustomerDisplay(job.customer)
          return display.brandShortName || display.companyTitle || job.customer || ''
        }
        if (listColumnSort.key === 'process')
          return resolveProductionActiveStage(job, workflowStages)?.label || ''
        if (listColumnSort.key === 'status')
          return resolveJobProductionProgress(
            job,
            ensureLineItems(job, workflowStages),
            productionStageOptions,
          ).percent
        if (listColumnSort.key === 'qty')
          return getJobQuantityMetrics(ensureLineItems(job, workflowStages)).ordered
        return ''
      }
      return compareSortValue(valueOf(a), valueOf(b), dir)
    })
  }, [filteredJobs, listColumnSort, jobs, workflowStages, productionStageOptions, orders, quotes])

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
    setSelectedJobIds([])
  }

  function toggleBulkSelect(jobId) {
    const key = String(jobId)
    setSelectedJobIds((current) =>
      current.includes(key) ? current.filter((id) => id !== key) : [...current, key],
    )
  }

  function toggleBulkSelectAll(ids) {
    const allSelected = ids.length > 0 && ids.every((id) => selectedJobIds.includes(id))
    setSelectedJobIds(allSelected ? [] : ids)
  }

  function softDeleteJobWithAnimation(job) {
    if (!job?.id) return
    const key = String(job.id)
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteProductionJob(job.id)
      setJobs(loadProductionJobs())
      setAnimatingDeleteIds((current) => current.filter((item) => item !== key))
      setArchiveReceiveKey((current) => current + 1)
      flushWorkspaceNow()
    }, 880)
  }

  function handleBulkDelete() {
    listJobs
      .filter((job) => selectedJobIds.includes(String(job.id)))
      .forEach((job) => softDeleteJobWithAnimation(job))
    exitBulkSelectMode()
  }

  const listJobIds = listJobs.map((job) => String(job.id))
  const allVisibleSelected =
    listJobIds.length > 0 && listJobIds.every((id) => selectedJobIds.includes(id))
  const someVisibleSelected =
    listJobIds.some((id) => selectedJobIds.includes(id)) && !allVisibleSelected

  const productionListBaseColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.75rem',
    '6.5rem',
    '3rem',
  ]
  const productionListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...productionListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedJobIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="ÜRETİM TAKİBİ"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <button
            type="button"
            onClick={() => navigate('/uretim/yeni')}
            className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
          >
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Factory className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>Yeni Üretim Oluştur</span>
          </button>
        }
      />

      <SummaryMetrics
        columns={5}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: 'Toplam Üretim',
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
          {
            title: 'Toplam Adet',
            value: formatQty(summary.quantity),
            icon: Package,
            tone: 'orange',
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

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Üretim Listesi :</span>
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
      </AppPagePanel>

      {listJobs.length === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState
            title="Üretim kaydı bulunamadı."
            description='Siparişler sayfasında "Üretime Alındı" seçildiğinde kayıtlar buraya kopyalanır.'
          />
        </AppPagePanel>
      ) : null}

      <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
        <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
          {listJobs.length > 0 ? (
            <div className="quote-list-board">
              <QuoteListRowPanel header gridTemplate={productionListColumnGrid}>
                {bulkSelectMode ? (
                  <QuoteListCell>
                    <QuoteListSelectionCheckbox
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      aria-label="Tümünü seç"
                      onChange={() => toggleBulkSelectAll(listJobIds)}
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
                    label="Durum"
                    sortable
                    sortKey="status"
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
                  {bulkSelectMode && selectedJobIds.length > 0 ? (
                    <QuoteOrderInlineConfirm
                      label="Sil"
                      labelClass="quote-order-undo-sil"
                      ariaLabel={`${selectedJobIds.length} üretim silinsin mi?`}
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
                          setSelectedJobIds([])
                          return
                        }
                        exitBulkSelectMode()
                      }}
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </button>
                  )}
                </QuoteListCell>
              </QuoteListRowPanel>

              {listJobs.map((job, rowIndex) => {
                const stamp = formatListDateParts(jobTimeline(job).orderDate || job.createdAt)
                const display = getListCustomerDisplay(job.customer)
                const jobKey = String(job.id)
                const isBulkSelected = selectedJobIds.includes(jobKey)
                const isAnimatingOut = animatingDeleteIds.includes(jobKey)
                const activeStage = resolveProductionActiveStage(job, workflowStages)
                const lineItems = ensureLineItems(job, workflowStages)
                const progress = resolveJobProductionProgress(
                  job,
                  lineItems,
                  productionStageOptions,
                )
                const qty = getJobQuantityMetrics(lineItems).ordered
                return (
                  <div
                    key={job.id}
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
                      if (bulkSelectMode) toggleBulkSelect(job.id)
                      else navigate(`/uretim/${job.id}`)
                    }}
                    onKeyDown={(event) => {
                      if (bulkSelectMode || isAnimatingOut) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/uretim/${job.id}`)
                      }
                    }}
                  >
                    <QuoteListRowPanel
                      gridTemplate={productionListColumnGrid}
                      className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                    >
                      {bulkSelectMode ? (
                        <QuoteListCell>
                          <QuoteListSelectionCheckbox
                            checked={isBulkSelected}
                            aria-label={`${resolveQuoteCode(
                              job.id,
                              jobs.map((item) => item.id),
                            )} üretimini seç`}
                            onChange={() => toggleBulkSelect(job.id)}
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
                            job.id,
                            jobs.map((item) => item.id),
                          )}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                          <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                            {display.brandShortName || job.customer || 'Müşteri girilmedi'}
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
                            value={
                              activeStage?.label || productionStageDropdownOptions[0]?.label || '—'
                            }
                            options={productionStageDropdownOptions}
                            includePlaceholderOption={false}
                            editable={false}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_FILTER_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${job.id}-process`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={() => {}}
                          />
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <div className="flex h-full w-full items-center justify-center">
                          <ProductionProgressRing
                            percent={progress.percent}
                            label={progress.label}
                            stageCount={progress.stageCount || productionStageOptions.length}
                            size={44}
                            stroke={5}
                          />
                        </div>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}>
                          {formatQty(qty)}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span
                          className="inline-flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ProcessListRowMoreMenu
                            record={job}
                            deleteAriaLabel="Üretim sil"
                            onEdit={() => navigate(`/uretim/${job.id}`)}
                            onDelete={() => softDeleteJobWithAnimation(job)}
                            extraItems={[
                              {
                                id: 'cancel',
                                icon: ArchiveRestore,
                                label: 'Siparişe Geri Al',
                                tone: 'primary',
                                onClick: () => {
                                  cancelProductionBackToOrder(job.id)
                                  refreshJobs()
                                },
                              },
                              {
                                id: 'depo',
                                icon: Package,
                                label: 'Depoya Gönder',
                                tone: 'success',
                                onClick: () => {
                                  sendProductionJobToDepo(job.id)
                                  refreshJobs()
                                  navigate('/depo')
                                },
                              },
                            ]}
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
            collection="production"
            storeEvent="bach:production-updated"
            restoreRecord={restoreDeletedProductionJob}
            permanentlyDelete={permanentlyDeleteProductionJob}
            resolveCode={resolveQuoteCode}
            onRestored={() => {
              setJobs(loadProductionJobs())
              flushWorkspaceNow()
            }}
            emptyMessage="Silinen üretim yok."
            receivePulseKey={archiveReceiveKey}
            className="customer-deleted-archived-panel w-full"
            segmentTabs={[{ id: 'process', label: 'Süreç' }]}
            getProcessValue={(job) =>
              resolveProductionActiveStage(job, workflowStages)?.label || '—'
            }
            getProcessOptions={() => productionStageDropdownOptions}
            getListAmount={() => 0}
            columnGrid={productionListBaseColumnGrid.join(' ')}
          />
        </div>
      </div>
    </AppPageShell>
  )
}
