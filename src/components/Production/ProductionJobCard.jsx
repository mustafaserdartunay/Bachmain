import { useState } from 'react'
import { ArchiveRestore, ChevronDown, ChevronRight, Package, Trash2 } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'
import ProductionProcessStageBar from './ProductionProcessStageBar'
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

export default function ProductionJobCard({
  job,
  workflowStages,
  productionStages,
  fulfillmentOptions,
  orders,
  quotes,
  expanded,
  onToggleExpand,
  pendingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelProduction,
  onSendToDepo,
  lineItemActions,
  activeMenu,
  setActiveMenu,
  selected,
  onToggleSelect,
}) {
  const [activeLineIndex, setActiveLineIndex] = useState(0)
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

  function handleStageClick(stageId) {
    if (!activeLine) return
    const row = primaryRow || getLineQuantityRows(activeLine)[0]
    if (!row?.id) {
      lineItemActions?.handleAddQuantityRow?.(activeLine)
      return
    }
    lineItemActions?.handleQuantityRowStageChange(activeLine, row.id, stageId)
  }

  function handlePhotosChange(photos) {
    if (!activeLine) return
    lineItemActions?.handleStagePhotosChange(activeLine, photos)
  }

  return (
    <article className="overflow-hidden rounded-[22px] border border-[var(--border,#E2E8F0)] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:bg-white/5">
      <div className="relative px-4 py-4 sm:px-5">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${badge.gradient}`}
          aria-hidden
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={() => onToggleSelect?.(job.id)}
              className="mt-1.5 h-4 w-4 shrink-0 rounded border-[var(--border,#CBD5E1)]"
              aria-label={`${job.id} seç`}
            />
            <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[var(--surface-raised,#F1F5F9)] px-2 py-0.5 text-[12px] font-black tabular-nums text-[var(--bach-navy,#1E3A8A)]">
                  {job.id}
                </span>
                <span
                  className={`inline-flex rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white ${badge.gradient}`}
                >
                  {badge.label}
                </span>
                <span
                  className={`inline-flex rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[10px] font-black text-white ${
                    hasPartial ? HEADER_ACTION_GRADIENTS.success : HEADER_ACTION_GRADIENTS.amber
                  }`}
                >
                  {hasPartial
                    ? `Kısmi · ${formatQty(metrics.delivered)}/${formatQty(metrics.ordered)}`
                    : 'Teslimat yok'}
                </span>
              </div>
              <p className="truncate text-[16px] font-black tracking-tight text-[var(--ink,#0F172A)]">
                {customerDisplay.brandShortName || job.customer || 'Müşteri yok'}
              </p>
              <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--muted,#64748B)]">
                {productSummary}
                <span className="mx-1.5 text-[var(--border,#CBD5E1)]">·</span>
                {formatShortDate(timeline.orderDate || timeline.productionStartDate)}
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-4 rounded-2xl border border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#F8FAFC)]/80 px-3 py-2.5 text-left transition hover:border-blue-200 dark:bg-white/5"
          >
            <ProductionProgressRing percent={progressPct} />
            <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
              <MetricStat label="Üretilecek" value={formatQty(metrics.ordered)} />
              <MetricStat label="Üretilen" value={formatQty(metrics.produced)} />
              <MetricStat label="Teslim" value={formatQty(metrics.delivered)} />
              <MetricStat label="Kalan" value={formatQty(metrics.remaining)} />
            </div>
          </button>

          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleExpand}
              className={`rounded-xl border p-2.5 transition hover:scale-105 ${
                expanded
                  ? 'border-blue-200 bg-blue-50 text-blue-600'
                  : 'border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)]'
              }`}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <MoreMenu
              items={[
                {
                  id: 'cancel',
                  label: 'Vazgeç',
                  icon: ArchiveRestore,
                  onClick: onCancelProduction,
                },
                { id: 'depo', label: 'Depoya gönder', icon: Package, onClick: onSendToDepo },
                {
                  id: 'delete',
                  label: 'Sil',
                  icon: Trash2,
                  tone: 'danger',
                  onClick: onRequestDelete,
                },
              ]}
            />
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
      </div>

      {/* Stepper always visible — no need to expand */}
      <div className="border-t border-[var(--border,#E2E8F0)] bg-[linear-gradient(180deg,#fbfcfe_0%,#ffffff_100%)] px-3 py-4 dark:bg-none sm:px-5">
        {lineItems.length > 1 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
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
          onPhotosChange={handlePhotosChange}
          showEditLink
          showPhotoStrip
          showActiveGallery={expanded}
        />
      </div>

      {expanded ? (
        <div className="space-y-5 border-t border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#FCFCFD)]/90 px-4 py-4 dark:bg-none">
          {activeLine ? (
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
          ) : null}

          {(job.activities || []).length > 0 ? (
            <div>
              <h4 className="mb-2 text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
                Süreç Günlüğü
              </h4>
              <ProductionActivityTimeline activities={job.activities || []} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
