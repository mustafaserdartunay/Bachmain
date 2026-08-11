import { useState } from 'react'
import { ArchiveRestore, Package, Trash2, Truck } from 'lucide-react'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'
import ProductionProcessStageBar from './ProductionProcessStageBar'
import ProductionProcessCapsuleRail from './ProductionProcessCapsuleRail'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import ProductionPartialDeliveryTable from './ProductionPartialDeliveryTable'
import ProductionProgressRing from './ProductionProgressRing'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import {
  ensureLineItems,
  getLineQuantityRows,
  resolveLineItemOrderQuantity,
  resolveOrderForProductionJob,
} from '../../utils/productionLineItems'
import {
  formatQty,
  getJobQuantityMetrics,
  getQuantityRowMinimalSteps,
} from '../../utils/productionQuantityMetrics'
import { getProductionJobTimelineDates } from '../../utils/productionJobTimeline'

function formatShortDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) return raw.slice(0, 10)
  const [datePart] = raw.split(/[T ]/)
  const [year, month, day] = String(datePart).split('-')
  if (year && month && day) return `${day}.${month}.${year}`
  return raw.slice(0, 10) || '—'
}

function resolveStatusBadge(job, metrics) {
  const status = String(job.status || '')
  if (/iptal/i.test(status)) {
    return { label: 'İptal', gradient: HEADER_ACTION_GRADIENTS.danger }
  }
  if (status === 'Bekliyor') {
    return { label: 'Beklemede', gradient: 'from-slate-300 via-slate-400 to-slate-500' }
  }
  if (status === 'Tamamlandı') {
    return { label: 'Tamamlandı', gradient: HEADER_ACTION_GRADIENTS.success }
  }
  if (metrics.linesWithPartialDelivery > 0 || /kısmi/i.test(status)) {
    return { label: 'Üretim devam ediyor', gradient: HEADER_ACTION_GRADIENTS.primary }
  }
  return { label: 'Üretim devam ediyor', gradient: HEADER_ACTION_GRADIENTS.cash }
}

function buildStepsForLine(line, productionStages) {
  const rows = getLineQuantityRows(line)
  const primaryRow = rows[0]
  if (productionStages?.length && primaryRow) {
    return getQuantityRowMinimalSteps(primaryRow, productionStages)
  }
  if (productionStages?.length) {
    return productionStages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      isActive: false,
      isComplete: false,
    }))
  }
  return []
}

function MetricStat({ label, value }) {
  return (
    <div className="min-w-[4.5rem]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted,#94A3B8)]">
        {label}
      </p>
      <p className="text-[15px] font-black tabular-nums tracking-tight text-[var(--ink,#0F172A)]">
        {value}
      </p>
    </div>
  )
}

/**
 * Expanded production detail panel — process rail + metrics + stage bar.
 * Collapsed list rows live in ProductionPage DataTable.
 */
export default function ProductionJobCard({
  job,
  workflowStages,
  productionStages,
  fulfillmentOptions,
  orders,
  quotes,
  pendingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelProduction,
  onSendToDepo,
  lineItemActions,
  activeMenu,
  setActiveMenu,
  initialPartialOpen = false,
}) {
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [partialOpen, setPartialOpen] = useState(initialPartialOpen)
  const customerDisplay = getListCustomerDisplay(job.customer)
  const order = resolveOrderForProductionJob(job, orders)
  const lineItems = ensureLineItems(job, workflowStages, order)
  const metrics = getJobQuantityMetrics(lineItems)
  const timeline = getProductionJobTimelineDates(job, lineItems, { orders, quotes })
  const badge = resolveStatusBadge(job, metrics)
  const productSummary =
    lineItems
      .map((line) => line.product)
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ') ||
    job.title ||
    'Ürün yok'

  const activeLine =
    lineItems[Math.min(activeLineIndex, Math.max(0, lineItems.length - 1))] || lineItems[0]
  const activeRows = activeLine ? getLineQuantityRows(activeLine) : []
  const primaryRow = activeRows[0]
  const processSteps = buildStepsForLine(activeLine, productionStages)
  const progressPct = metrics.ordered
    ? Math.min(100, Math.round((metrics.produced / metrics.ordered) * 100))
    : metrics.produced > 0
      ? 100
      : 0
  const hasPartial =
    metrics.linesWithPartialDelivery > 0 ||
    (metrics.delivered > 0 && metrics.delivered < metrics.ordered)

  const companyTitle =
    customerDisplay.companyTitle || job.customer || productSummary || 'Müşteri yok'

  function handleStageClick(stageId) {
    if (!activeLine) return
    const row = primaryRow || getLineQuantityRows(activeLine)[0]
    if (!row?.id) {
      lineItemActions?.handleAddQuantityRow?.(activeLine)
      return
    }
    lineItemActions?.handleQuantityRowStageChange(activeLine, row.id, stageId)
  }

  return (
    <div className="mt-3 space-y-4 rounded-ds-lg border border-ds-border bg-[var(--ds-surface,#fff)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="customer-name-primary truncate text-[14px] font-bold leading-tight text-[var(--muted)]">
            {customerDisplay.brandShortName || companyTitle}
          </p>
          <p className="customer-name-secondary mt-0.5 truncate text-[14px] font-normal leading-tight text-[var(--muted)]">
            {companyTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[var(--surface-raised,#F1F5F9)] px-2 py-0.5 text-[12px] font-black tabular-nums text-[var(--bach-navy,#1E3A8A)]">
              {job.id}
            </span>
            <span
              className={`inline-flex rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white ${badge.gradient}`}
            >
              {badge.label}
            </span>
            <span className="text-[12px] font-semibold text-[var(--muted,#64748B)]">
              {productSummary}
              <span className="mx-1.5 text-[var(--border,#CBD5E1)]">·</span>
              Sipariş {formatShortDate(timeline.orderDate)}
              <span className="mx-1.5 text-[var(--border,#CBD5E1)]">·</span>
              Üretim {formatShortDate(timeline.productionStartDate)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => setPartialOpen((value) => !value)}
            className={`glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl ${
              partialOpen || hasPartial ? 'text-[var(--accent,#2563EB)]' : ''
            }`}
            aria-expanded={partialOpen}
            aria-label={partialOpen ? 'Kısmi teslimatı kapat' : 'Kısmi teslimat'}
            title={
              hasPartial
                ? `Kısmi teslimat · ${formatQty(metrics.delivered)}/${formatQty(metrics.ordered)}`
                : 'Kısmi teslimat'
            }
          >
            <Truck className="h-4 w-4" />
          </button>
          {pendingDelete ? (
            <DeleteTrashButton
              pending
              onClick={onRequestDelete}
              onConfirm={onConfirmDelete}
              onCancel={onCancelDelete}
              title="Üretim kaydı silinsin mi?"
              description="Bu işlem geri alınamaz."
              popoverClassName="absolute right-0 top-1/2 z-20 -translate-y-1/2"
            />
          ) : null}
        </div>
      </div>

      <ProductionProcessCapsuleRail
        steps={processSteps}
        readOnly={activeLine?.productionClosed === true}
        onStageClick={handleStageClick}
      />

      {partialOpen && activeLine ? (
        <div className="rounded-2xl border border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#FCFCFD)]/90 px-4 py-4 dark:bg-none">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
              Kısmi Teslimat
            </h4>
            {hasPartial ? (
              <span
                className={`inline-flex rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[10px] font-black text-white ${HEADER_ACTION_GRADIENTS.success}`}
              >
                {formatQty(metrics.delivered)}/{formatQty(metrics.ordered)} teslim
              </span>
            ) : null}
          </div>
          <ProductionPartialDeliveryTable
            lineItem={activeLine}
            productionJobId={job.id}
            fulfillmentOptions={fulfillmentOptions}
            fulfillmentOpenKey={`${job.id}-${activeLine.id}-fulfillment`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            columnsLocked={activeLine.productionClosed === true}
            orderLineQuantity={resolveLineItemOrderQuantity(activeLine, order)}
            onQuantityRowChange={(rowId, patch) =>
              lineItemActions?.handleLineQuantityRowChange(activeLine, rowId, patch)
            }
            onAddQuantityRow={(rowId) => lineItemActions?.handleAddQuantityRow(activeLine, rowId)}
            onRemoveQuantityRow={(rowId) =>
              lineItemActions?.handleRemoveQuantityRow(activeLine, rowId)
            }
            onSendToDepo={(rowId) => {
              lineItemActions?.handleSendRowToDepo(
                activeLine,
                rowId,
                resolveLineItemOrderQuantity(activeLine, order),
              )
            }}
            onUndoSendToDepo={(rowId) =>
              lineItemActions?.handleUndoSendRowToDepo(activeLine, rowId)
            }
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ProductionProgressRing percent={progressPct} />
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
          <MetricStat label="Üretilecek" value={formatQty(metrics.ordered)} />
          <MetricStat label="Üretilen" value={formatQty(metrics.produced)} />
          <MetricStat label="Teslim" value={formatQty(metrics.delivered)} />
          <MetricStat label="Kalan" value={formatQty(metrics.remaining)} />
        </div>
      </div>

      {lineItems.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {lineItems.map((line, index) => (
            <button
              key={line.id}
              type="button"
              onClick={() => setActiveLineIndex(index)}
              className={`rounded-full px-3 py-1 text-[12px] font-bold transition ${
                index === activeLineIndex
                  ? 'bg-[var(--accent,#2563EB)] text-white'
                  : 'bg-white text-[var(--muted,#64748B)] ring-1 ring-[var(--border,#E2E8F0)]'
              }`}
            >
              {line.product || `Kalem ${index + 1}`}
            </button>
          ))}
        </div>
      ) : null}

      <ProductionProcessStageBar
        steps={processSteps}
        stagePhotos={activeLine?.stagePhotos || []}
        readOnly={activeLine?.productionClosed === true}
        onStageClick={handleStageClick}
        showEditLink
        showPhotoStrip={false}
        showActiveGallery={false}
      />

      {(job.activities || []).length > 0 ? (
        <div>
          <h4 className="mb-2 text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
            Süreç Günlüğü
          </h4>
          <ProductionActivityTimeline activities={job.activities || []} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-ds-border pt-3">
        <button
          type="button"
          onClick={onCancelProduction}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ds-border px-3 py-2 text-[12px] font-bold text-[var(--muted)] hover:bg-[var(--ds-surface-muted)]"
        >
          <ArchiveRestore className="h-3.5 w-3.5" />
          Vazgeç
        </button>
        <button
          type="button"
          onClick={onSendToDepo}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ds-border px-3 py-2 text-[12px] font-bold text-[var(--muted)] hover:bg-[var(--ds-surface-muted)]"
        >
          <Package className="h-3.5 w-3.5" />
          Depoya gönder
        </button>
        <button
          type="button"
          onClick={onRequestDelete}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#fda4af]/50 px-3 py-2 text-[12px] font-bold text-[#e11d48] hover:bg-[#fff1f2]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>
      </div>
    </div>
  )
}

export { formatShortDate, resolveStatusBadge, buildStepsForLine }
