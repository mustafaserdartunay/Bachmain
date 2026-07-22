import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Factory, Layers3, Package, ShoppingCart } from 'lucide-react'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import SplitCreateButton from '../components/Common/SplitCreateButton'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import ProductionFilterBar from '../components/Production/ProductionFilterBar'
import ProductionJobCard from '../components/Production/ProductionJobCard'
import ProductionStatusTabs from '../components/Production/ProductionStatusTabs'
import ProductionToolbar from '../components/Production/ProductionToolbar'
import { ensureLineItems, getLineFulfillmentOptions } from '../utils/productionLineItems'
import {
  getJobQuantityMetrics,
  jobMatchesProductionStateFilter,
  jobMatchesQuantityFilter,
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

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const quantityFilterOptions = [
  filterAllOption,
  { label: 'Kısmi Teslimat', color: 'bg-amber-500' },
  { label: 'Kalan Adet Var', color: 'bg-orange-500' },
  { label: 'Fazla Üretim', color: 'bg-sky-500' },
]

export default function ProductionPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(loadProductionJobs)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusTab, setStatusTab] = useState('Tümü')
  const [filters, setFilters] = useState({ process: 'Tümü', status: 'Tümü', quantity: 'Tümü' })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [expandedJobIds, setExpandedJobIds] = useState(() => new Set())
  const [selectedJobIds, setSelectedJobIds] = useState(() => new Set())
  const [fulfillmentOptions, setFulfillmentOptions] = useState(() => getLineFulfillmentOptions())
  const [entered, setEntered] = useState(false)

  const productionStageOptions = getProductionStageOptions(workflowStages)
  const productionStageDropdownOptions = toStageDropdownOptions(productionStageOptions)
  const productionProcessFilterOptions = [filterAllOption, ...productionStageDropdownOptions]

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 20)
    return () => window.clearTimeout(timer)
  }, [])

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

  const searchedJobs = useMemo(() => {
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
      const matchesQuantity = jobMatchesQuantityFilter(job, filters.quantity, workflowStages)
      return matchesSearch && matchesProcess && matchesQuantity
    })
  }, [jobs, searchQuery, filters.process, filters.quantity, workflowStages])

  const tabCounts = useMemo(() => {
    const counts = {
      Tümü: searchedJobs.length,
      'Devam Eden': 0,
      Tamamlanan: 0,
      Beklemede: 0,
      İptal: 0,
    }
    for (const job of searchedJobs) {
      if (jobMatchesProductionStateFilter(job, 'Devam Eden', workflowStages))
        counts['Devam Eden'] += 1
      if (jobMatchesProductionStateFilter(job, 'Tamamlanan', workflowStages)) counts.Tamamlanan += 1
      if (jobMatchesProductionStateFilter(job, 'Beklemede', workflowStages)) counts.Beklemede += 1
      if (jobMatchesProductionStateFilter(job, 'İptal', workflowStages)) counts.İptal += 1
    }
    return counts
  }, [searchedJobs, workflowStages])

  const filteredJobs = useMemo(() => {
    return searchedJobs.filter((job) =>
      jobMatchesProductionStateFilter(job, statusTab, workflowStages),
    )
  }, [searchedJobs, statusTab, workflowStages])

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

  const bulkMenuItems = [
    {
      id: 'bulk-depo',
      label: 'Seçilileri Depoya Gönder',
      icon: Package,
      iconClassName: 'text-orange-300',
      onClick: () => {
        selectedJobIds.forEach((jobId) => sendProductionJobToDepo(jobId))
        refreshJobs()
        setSelectedJobIds(new Set())
        if (selectedJobIds.size) navigate('/depo')
      },
    },
    {
      id: 'bulk-cancel',
      label: 'Seçililerden Vazgeç',
      icon: ClipboardList,
      iconClassName: 'text-blue-300',
      onClick: () => {
        selectedJobIds.forEach((jobId) => cancelProductionBackToOrder(jobId))
        refreshJobs()
        setSelectedJobIds(new Set())
      },
    },
  ]

  return (
    <AppPageShell className="w-full max-w-none">
      <div
        className={`space-y-6 transition-all duration-500 ${
          entered ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <AppPageHeader
          title="ÜRETİM TAKİBİ"
          backTo="/"
          backLabel="Güncel Durum"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/mes"
                className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-3 text-xs font-black uppercase"
              >
                MES
              </Link>
              <SplitCreateButton
                label="Yeni Üretim Oluştur"
                onPrimaryClick={() => navigate('/uretim/yeni')}
                menuAriaLabel="Üretim seçenekleri"
                menuItems={[
                  {
                    id: 'quick',
                    label: 'Hızlı Üretim Kaydı',
                    icon: Factory,
                    iconClassName: 'text-blue-300',
                    onClick: () => navigate('/uretim/yeni'),
                  },
                  {
                    id: 'from-order',
                    label: 'Siparişlerden Devam Et',
                    icon: ShoppingCart,
                    iconClassName: 'text-emerald-300',
                    onClick: () => navigate('/siparisler'),
                  },
                ]}
              />
              <SplitCreateButton
                label="Toplu İşlem"
                onPrimaryClick={() => {
                  if (!selectedJobIds.size) {
                    window.alert('Önce listeden üretim seçin.')
                  }
                }}
                menuAriaLabel="Toplu işlemler"
                menuItems={bulkMenuItems}
              />
            </div>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ProductionStatusTabs value={statusTab} onChange={setStatusTab} counts={tabCounts} />
          <ProductionToolbar
            showFilters={showAdvancedFilters}
            onFilter={() => setShowAdvancedFilters((current) => !current)}
            onGroup={() => window.alert('Gruplama yakında eklenecek.')}
            onColumns={() => window.alert('Kolon görünümü yakında eklenecek.')}
            onExport={() => window.alert('Dışa aktarma yakında eklenecek.')}
            onMore={() => window.print()}
          />
        </div>

        <SummaryMetrics
          columns={5}
          items={[
            {
              title: 'Toplam Sipariş',
              value: summary.total,
              icon: Factory,
              tone: 'blue',
              valueTone: 'blue',
            },
            {
              title: 'Devam Eden',
              value: summary.active,
              icon: ClipboardList,
              tone: 'purple',
              valueTone: 'purple',
            },
            {
              title: 'Kısmi İlerleme',
              value: summary.partial,
              icon: Layers3,
              tone: 'orange',
              valueTone: 'orange',
            },
            {
              title: 'Tamamlanan',
              value: summary.completed,
              icon: CheckCircle2,
              tone: 'emerald',
              valueTone: 'emerald',
            },
            {
              title: 'Toplam Adet',
              value: summary.quantity.toLocaleString('tr-TR'),
              icon: Package,
              tone: 'purple',
              valueTone: 'purple',
            },
          ]}
        />

        {showAdvancedFilters ? (
          <ProductionFilterBar
            searchQuery={searchQuery}
            onSearchChange={(event) => setSearchQuery(event.target.value)}
            filters={filters}
            onFilterChange={updateFilter}
            processOptions={productionProcessFilterOptions}
            statusOptions={[filterAllOption]}
            quantityOptions={quantityFilterOptions}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        ) : (
          <div className="rounded-[18px] border border-[var(--border)] bg-white/55 p-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:p-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Sipariş, müşteri veya ürün ara..."
              className="form-input h-11 w-full text-[13px] font-semibold"
            />
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-[16px] font-bold text-[var(--ink)]">Üretim Listesi</h2>
            <span className="rounded-xl bg-[rgba(121,166,210,0.12)] px-3 py-1.5 text-[12px] font-black text-[var(--bach-navy,#203375)]">
              {filteredJobs.length} kayıt
              {selectedJobIds.size ? ` · ${selectedJobIds.size} seçili` : ''}
            </span>
          </div>

          <div className="hidden rounded-[18px] border border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#F8FAFC)] px-4 py-2.5 text-[11px] font-black uppercase tracking-wide text-[var(--muted,#94A3B8)] lg:grid lg:grid-cols-[minmax(200px,1.15fr)_150px_minmax(240px,1.5fr)_150px_130px_88px] lg:gap-3">
            <span>Ürün / Sipariş</span>
            <span>Adet / Teslimat</span>
            <span>Süreç İlerlemesi</span>
            <span>Durum</span>
            <span>Teslimat</span>
            <span className="text-right">İşlemler</span>
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
            <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-white/50 p-10 text-center">
              <Factory className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
              <p className="text-sm font-bold text-[var(--ink)]">Üretim kaydı bulunamadı.</p>
              <p className="mt-1 text-[13px] text-[var(--muted)]">
                Siparişler sayfasında &quot;Üretime Alındı&quot; seçildiğinde kayıtlar buraya
                kopyalanır.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </AppPageShell>
  )
}
