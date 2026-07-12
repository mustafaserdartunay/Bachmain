import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Factory,
  Flag,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import DocumentActivityPanel from '../components/DocumentEditor/DocumentActivityPanel'
import WorkflowStagePanel from '../components/DocumentEditor/WorkflowStagePanel'
import ProductionLineItemCard from '../components/Production/ProductionLineItemCard'
import { ProductionGlobalStageRail, ProgressRing, QuantityProgressBar } from '../components/Production/ProductionStageFlow'
import { stageColors } from '../components/DocumentEditor/stageColors'
import { isReservedPlaceholderLabel } from '../components/DocumentEditor/processPanelUtils'
import { getListCustomerDisplay } from '../data/customerProfiles'
import { publishWorkflowStages } from '../utils/workflowStagePublish'
import { ensureLineItems } from '../utils/productionLineItems'
import {
  formatQty,
  getJobQuantityMetrics,
  getJobStageStatsByQuantity,
} from '../utils/productionQuantityMetrics'
import {
  appendProductionJobActivity,
  createProductionLineItemActions,
} from '../utils/productionLineItemActions'
import {
  getProductionJobById,
  loadProductionJobs,
  updateProductionJob,
} from '../utils/productionStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import {
  getProductionStageOptions,
  loadWorkflowStages,
  mergeProductionStagesIntoWorkflow,
  resolveProductionActiveStage,
  resolveProductionPanelCurrentStageId,
} from '../utils/workflowStages'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatListDate(value) {
  if (!value) return '—'
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value
  const [datePart] = String(value).split(' ')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

const statusStyle = {
  'Devam Ediyor': 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-[var(--accent)]',
  Bekliyor: 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
  'Kısmi Üretim Bitti': 'bg-amber-500/10 text-amber-700',
  'Kısmi Teslimat': 'bg-orange-500/10 text-orange-700',
  Tamamlandı: 'bg-emerald-500/10 text-emerald-700',
}

function SectionHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-raised))] text-[var(--accent)]">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2 className="text-sm font-black tracking-tight text-[var(--text-strong)]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export default function ProductionDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(loadProductionJobs)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [activeMenu, setActiveMenu] = useState(null)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isStagePanelOpen, setIsStagePanelOpen] = useState(false)
  const [isActivityOpen, setIsActivityOpen] = useState(false)

  const job = useMemo(
    () => jobs.find((item) => item.id === jobId) || getProductionJobById(jobId),
    [jobs, jobId],
  )

  const productionStageOptions = getProductionStageOptions(workflowStages)
  const lineItems = job ? ensureLineItems(job, workflowStages) : []
  const activeStage = job ? resolveProductionActiveStage(job, workflowStages) : null
  const stageStats = getJobStageStatsByQuantity(lineItems, productionStageOptions)
  const jobMetrics = getJobQuantityMetrics(lineItems)
  const completedLines = lineItems.filter((line) => line.fulfillmentStatus === 'Tamamlandı').length
  const productionPct = jobMetrics.ordered
    ? Math.min(100, Math.round((jobMetrics.produced / jobMetrics.ordered) * 100))
    : 0
  const deliveryPct = jobMetrics.ordered
    ? Math.min(100, Math.round((jobMetrics.delivered / jobMetrics.ordered) * 100))
    : 0
  const lineCompletionPct = lineItems.length ? Math.round((completedLines / lineItems.length) * 100) : 0

  useEffect(() => {
    function refresh() { setJobs(loadProductionJobs()) }
    function refreshWorkflowStages() {
      setWorkflowStages(loadWorkflowStages())
      setJobs(loadProductionJobs())
    }
    window.addEventListener('bach:production-updated', refresh)
    window.addEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
    window.addEventListener('bach:production-fulfillment-updated', refresh)
    return () => {
      window.removeEventListener('bach:production-updated', refresh)
      window.removeEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
      window.removeEventListener('bach:production-fulfillment-updated', refresh)
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeActiveMenu() { setActiveMenu(null) }
    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  function refreshJobs() { setJobs(loadProductionJobs()) }

  function patchJob(patch) {
    if (!job) return
    updateProductionJob(job.id, patch)
    refreshJobs()
  }

  function addJobActivity(text, extraPatch = {}) {
    if (!job) return
    patchJob(appendProductionJobActivity(job.id, text, extraPatch) || extraPatch)
  }

  const lineItemActions = createProductionLineItemActions({
    job,
    productionStageOptions,
    refreshJobs,
    addJobActivity,
    setActiveMenu,
  })

  function addProductionStage(chosenColor, inputLabel) {
    if (!job) return
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return
    const currentStages = loadWorkflowStages()
    const productionStages = getProductionStageOptions(currentStages)
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[productionStages.length % stageColors.length],
      note: 'Yeni üretim süreci eklendi.',
    }
    publishWorkflowStages(mergeProductionStagesIntoWorkflow(currentStages, [...productionStages, nextStage]))
    setWorkflowStages(loadWorkflowStages())
    addJobActivity(`Yeni üretim süreci eklendi: "${label}".`)
    setStageInput('')
    refreshJobs()
  }

  function updateProductionStageColor(stage, color) {
    const productionStages = getProductionStageOptions(workflowStages).map((item) => (
      item.id === stage.id ? { ...item, color } : item
    ))
    publishWorkflowStages(mergeProductionStagesIntoWorkflow(workflowStages, productionStages))
    setWorkflowStages(loadWorkflowStages())
    refreshJobs()
  }

  function updateProductionStageLabel(stage, label) {
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel || isReservedPlaceholderLabel(cleanLabel)) return
    const productionStages = getProductionStageOptions(workflowStages).map((item) => (
      item.id === stage.id ? { ...item, label: cleanLabel } : item
    ))
    publishWorkflowStages(mergeProductionStagesIntoWorkflow(workflowStages, productionStages))
    setWorkflowStages(loadWorkflowStages())
    refreshJobs()
  }

  function reorderProductionStages(nextProductionStages) {
    publishWorkflowStages(mergeProductionStagesIntoWorkflow(workflowStages, nextProductionStages))
    setWorkflowStages(loadWorkflowStages())
    refreshJobs()
  }

  function saveProductionRecord() {
    if (!job) return
    updateProductionJob(job.id, {
      lastSavedAt: new Date().toISOString(),
    })
    addJobActivity('Üretim kaydı kaydedildi.')
    flushWorkspaceNow().finally(() => navigate('/uretim'))
  }

  function removeProductionStage(stage) {
    if (!job) return
    const ok = window.confirm(`Son onay: "${stage.label}" süreci kaldırılacak. Devam edilsin mi?`)
    if (!ok) return
    const nextProductionStages = getProductionStageOptions(workflowStages).filter((item) => item.id !== stage.id)
    publishWorkflowStages(mergeProductionStagesIntoWorkflow(workflowStages, nextProductionStages))
    setWorkflowStages(loadWorkflowStages())
    addJobActivity(`Üretim süreci silindi: "${stage.label}".`)
    setPendingStageDeleteId(null)
    refreshJobs()
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Factory className="mx-auto mb-4 h-12 w-12 text-[var(--text-soft)]" />
        <h1 className="text-lg font-black text-[var(--text-strong)]">Kayıt bulunamadı</h1>
        <Link to="/uretim" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]">
          <ArrowLeft className="h-4 w-4" /> Listeye dön
        </Link>
      </div>
    )
  }

  const customerDisplay = getListCustomerDisplay(job.customer)
  const productionStageRecord = {
    stages: productionStageOptions,
    currentStageId: resolveProductionPanelCurrentStageId(job, workflowStages),
  }

  return (
    <div className="space-y-5">
      {/* top bar */}
      <div className="relative mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-4 shadow-[var(--shadow)]">
        <button
          type="button"
          onClick={() => navigate('/uretim')}
          className="absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Üretim listesi
        </button>

        <div className="flex justify-center px-28">
          <p className="text-sm font-black uppercase tracking-wide text-[var(--text-strong)]">
            Üretim Detayı · {job.id}
          </p>
        </div>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[12px] font-black uppercase tracking-wide ${statusStyle[job.status] || statusStyle['Devam Ediyor']}`}>
            {job.status || 'Devam Ediyor'}
          </span>
          <button
            type="button"
            onClick={saveProductionRecord}
            className="btn-success inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-black transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* hero */}
      <header className="card mb-6 overflow-hidden p-0">
        <div
          className="relative px-6 pb-6 pt-6"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, var(--surface)) 0%, var(--surface-raised) 55%, var(--surface) 100%)',
          }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                <Sparkles className="h-3 w-3" />
                Üretim Takip
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-[var(--text-strong)]">{job.id}</h1>
              <p className="mt-2 text-base font-bold text-[var(--text-strong)]">
                {customerDisplay.brandShortName || job.customer || 'Müşteri girilmedi'}
                {customerDisplay.companyTitle && (
                  <span className="ml-2 text-sm font-semibold text-[var(--text-muted)]">· {customerDisplay.companyTitle}</span>
                )}
              </p>
              {job.title && (
                <p className="mt-3 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/80 px-4 py-2.5 text-xs leading-relaxed text-[var(--text-muted)]">
                  {job.title}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-end gap-5">
              <ProgressRing value={productionPct} label="Üretim" sublabel={formatQty(jobMetrics.produced)} />
              <ProgressRing value={deliveryPct} label="Teslim" sublabel={formatQty(jobMetrics.delivered)} tone="emerald" />
              <ProgressRing value={lineCompletionPct} label="Kalem" sublabel={`${completedLines}/${lineItems.length}`} />
            </div>
          </div>

          {/* meta chips */}
          <div className="relative mt-6 flex flex-wrap gap-2">
            {[
              { icon: Layers, label: `${lineItems.length} kalem` },
              { icon: Flag, label: job.priority || 'Normal öncelik' },
              { icon: Calendar, label: `Teslim ${formatListDate(job.deliveryDate || job.endDate)}` },
              { icon: TrendingUp, label: activeStage?.label || 'Süreç seçilmedi' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-raised)]/90 px-3 py-1.5 text-[13px] font-semibold text-[var(--text-muted)] backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
                {label}
              </span>
            ))}
            {jobMetrics.remaining > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1.5 text-[13px] font-bold text-amber-700">
                {formatQty(jobMetrics.remaining)} kalan adet
              </span>
            )}
            {jobMetrics.excess > 0 && (
              <span className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1.5 text-[13px] font-bold text-sky-700">
                +{formatQty(jobMetrics.excess)} fazla
              </span>
            )}
          </div>
        </div>

        {/* order-level progress strip */}
        <div className="border-t border-[var(--border)] px-6 py-4">
          <QuantityProgressBar
            ordered={jobMetrics.ordered}
            produced={jobMetrics.produced}
            delivered={jobMetrics.delivered}
            productionClosed={lineItems.some((l) => l.productionClosed)}
          />
        </div>
      </header>

      {/* global pipeline */}
      {productionStageOptions.length > 0 && (
        <section className="card mb-6 px-5 py-4 sm:px-6">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-[var(--text-strong)]">
              Genel Süreç İlerlemesi
              <span className="ml-2 text-xs font-semibold text-[var(--text-muted)]">
                {formatQty(jobMetrics.produced)}/{formatQty(jobMetrics.ordered)} adet
              </span>
            </p>
            <div className="flex gap-1.5">
              {jobMetrics.remaining > 0 && (
                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-[12px] font-bold text-amber-700">
                  {formatQty(jobMetrics.remaining)} kalan
                </span>
              )}
              {jobMetrics.excess > 0 && (
                <span className="rounded-md bg-sky-500/10 px-2.5 py-1 text-[12px] font-bold text-sky-700">
                  +{formatQty(jobMetrics.excess)} fazla
                </span>
              )}
            </div>
          </div>
          <ProductionGlobalStageRail stageStats={stageStats} />
        </section>
      )}

      {/* line items */}
      <section className="card mb-6">
        <SectionHeader
          icon={Layers}
          title={`Ürün Kalemleri · ${lineItems.length}`}
          description="Her kalem kendi sürecini ve adet takibini içerir"
          action={(
            <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
              Sipariş {job.orderId || job.id}
            </span>
          )}
        />

        <div className="space-y-4">
          {lineItems.map((lineItem, index) => (
            <ProductionLineItemCard
              key={lineItem.id}
              lineItem={lineItem}
              index={index}
              productionStages={productionStageOptions}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              menuKeyPrefix={`${job.id}-${lineItem.id}`}
              onQuantityRowStageChange={(rowId, stageId) => lineItemActions.handleQuantityRowStageChange(lineItem, rowId, stageId)}
              onQuantityRowChange={(rowId, patch) => lineItemActions.handleLineQuantityRowChange(lineItem, rowId, patch)}
              onAddQuantityRow={(rowId) => lineItemActions.handleAddQuantityRow(lineItem, rowId)}
              onRemoveQuantityRow={(rowId) => lineItemActions.handleRemoveQuantityRow(lineItem, rowId)}
              onCloseProduction={(depoWarehouseKind) => lineItemActions.handleCloseProduction(lineItem, depoWarehouseKind)}
              onReopenProduction={() => lineItemActions.handleReopenProduction(lineItem)}
              onStagePhotosChange={(photos) => lineItemActions.handleStagePhotosChange(lineItem, photos)}
            />
          ))}
          {lineItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] py-14 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-[var(--text-soft)]" />
              <p className="text-sm font-semibold text-[var(--text-muted)]">Bu kayıtta ürün kalemi yok.</p>
            </div>
          )}
        </div>
      </section>

      {/* bottom panels */}
      <section className="card mb-6">
        <WorkflowStagePanel
          title="Süreç Tanımları"
          record={productionStageRecord}
          isOpen={isStagePanelOpen}
          onToggle={() => {
            setIsStagePanelOpen((c) => !c)
            setPendingStageDeleteId(null)
          }}
          stageInput={stageInput}
          setStageInput={setStageInput}
          onAddStage={addProductionStage}
          onSelectStage={() => {}}
          onUpdateStageColor={updateProductionStageColor}
          onUpdateStageLabel={updateProductionStageLabel}
          onReorderStages={reorderProductionStages}
          pendingStageDeleteId={pendingStageDeleteId}
          setPendingStageDeleteId={setPendingStageDeleteId}
          onRemoveStage={removeProductionStage}
        />
      </section>

      <DocumentActivityPanel
        activities={job.activities || []}
        isOpen={isActivityOpen}
        onToggle={() => setIsActivityOpen((c) => !c)}
      />
    </div>
  )
}
