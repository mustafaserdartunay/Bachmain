import { useState } from 'react'
import { ArchiveRestore, ChevronDown, ChevronRight, Package, Trash2 } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'
import ProductionProcessDotRail from './ProductionProcessDotRail'
import ProductionProcessStageBar from './ProductionProcessStageBar'
import ProductionStageMiniCards from './ProductionStageMiniCards'
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
  getLineQuantityMetrics,
  getQuantityRowMinimalSteps,
} from '../../utils/productionQuantityMetrics'
import { getProductionJobTimelineDates } from '../../utils/productionJobTimeline'
import { appendProductionJobActivity } from '../../utils/productionLineItemActions'
import { updateProductionJob } from '../../utils/productionStore'

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
    return {
      label: 'İPTAL',
      gradient: HEADER_ACTION_GRADIENTS.danger,
    }
  }
  if (status === 'Bekliyor') {
    return {
      label: 'BEKLEMEDE',
      gradient: 'from-slate-300 via-slate-400 to-slate-500',
    }
  }
  if (status === 'Tamamlandı') {
    return {
      label: 'TAMAMLANDI',
      gradient: HEADER_ACTION_GRADIENTS.success,
    }
  }
  if (metrics.linesWithPartialDelivery > 0 || /kısmi/i.test(status)) {
    return {
      label: 'ÜRETİM DEVAM EDİYOR',
      gradient: HEADER_ACTION_GRADIENTS.primary,
    }
  }
  if (status === 'Devam Ediyor') {
    return {
      label: 'ÜRETİM DEVAM EDİYOR',
      gradient: HEADER_ACTION_GRADIENTS.cash,
    }
  }
  return {
    label: 'ÜRETİM DEVAM EDİYOR',
    gradient: HEADER_ACTION_GRADIENTS.cash,
  }
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

function MetricChip({ label, value }) {
  return (
    <div className="rounded-lg bg-black/[0.04] px-2 py-1 dark:bg-white/10">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted,#94A3B8)]">
        {label}
      </p>
      <p className="text-[13px] font-black tabular-nums text-[var(--ink,#0F172A)]">{value}</p>
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
  const producedLabel = activeLine
    ? `${formatQty(activeLine.producedQuantity)} / ${formatQty(activeLine.quantity)}`
    : `${formatQty(metrics.produced)} / ${formatQty(metrics.ordered)}`
  const progressPct = metrics.ordered
    ? Math.min(100, Math.round((metrics.produced / metrics.ordered) * 100))
    : metrics.produced > 0
      ? 100
      : 0
  const hasPartial =
    metrics.linesWithPartialDelivery > 0 ||
    (metrics.delivered > 0 && metrics.delivered < metrics.ordered)

  function handleStageNote(stageId, text) {
    if (!text?.trim()) return
    const stageLabel = productionStages?.find((stage) => stage.id === stageId)?.label || stageId
    updateProductionJob(
      job.id,
      appendProductionJobActivity(job.id, `${stageLabel}: ${text.trim()}`),
    )
    window.dispatchEvent(new CustomEvent('bach:production-updated'))
  }

  function handleStageClick(stageId) {
    if (!activeLine || !primaryRow) return
    lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
  }

  function handlePhotosChange(photos) {
    if (!activeLine) return
    lineItemActions?.handleStagePhotosChange(activeLine, photos)
  }

  return (
    <article className="overflow-hidden rounded-[20px] border border-[var(--border,#E2E8F0)] bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)] dark:bg-white/5">
      {/* Top meta row */}
      <div className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={() => onToggleSelect?.(job.id)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border,#CBD5E1)]"
            aria-label={`${job.id} seç`}
          />
          <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
            <p className="text-[13px] font-black tabular-nums text-[var(--bach-navy,#1E3A8A)]">
              {job.id}
            </p>
            <p className="truncate text-[14px] font-bold text-[var(--ink,#0F172A)]">
              {customerDisplay.brandShortName || job.customer || 'Müşteri yok'}
            </p>
            <p className="truncate text-[12px] font-medium text-[var(--muted,#64748B)]">
              {productSummary}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted,#94A3B8)]">
              {formatShortDate(timeline.orderDate || timeline.productionStartDate)}
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-3 text-left"
        >
          <ProductionProgressRing percent={progressPct} />
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <MetricChip label="Üretilecek" value={formatQty(metrics.ordered)} />
            <MetricChip label="Üretilen" value={formatQty(metrics.produced)} />
            <MetricChip label="Teslim" value={formatQty(metrics.delivered)} />
            <MetricChip label="Kalan" value={formatQty(metrics.remaining)} />
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span
            className={`inline-flex rounded-xl bg-gradient-to-br px-3 py-1.5 text-[10px] font-black tracking-wide text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] ${badge.gradient}`}
          >
            {badge.label}
          </span>
          {hasPartial ? (
            <span
              className={`inline-flex rounded-xl bg-gradient-to-br px-3 py-1.5 text-[10px] font-black text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] ${HEADER_ACTION_GRADIENTS.success}`}
            >
              Kısmi · {formatQty(metrics.delivered)}/{formatQty(metrics.ordered)}
            </span>
          ) : (
            <span
              className={`inline-flex rounded-xl bg-gradient-to-br px-3 py-1.5 text-[10px] font-black text-white/95 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] ${HEADER_ACTION_GRADIENTS.amber}`}
            >
              Teslimat Yok
            </span>
          )}

          <div
            className="ml-auto flex items-center gap-1.5 lg:ml-0"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleExpand}
              className={`rounded-xl border p-2 transition hover:scale-105 ${
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

      {/* Full-width process + photo strip */}
      <div className="border-t border-[var(--border,#E2E8F0)] bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.4))] px-3 py-3 dark:bg-none">
        <ProductionProcessStageBar
          steps={processSteps}
          stagePhotos={activeLine?.stagePhotos || []}
          readOnly={activeLine?.productionClosed === true}
          onStageClick={handleStageClick}
          onPhotosChange={handlePhotosChange}
        />
      </div>

      {lineItems.length > 1 ? (
        <div className="space-y-2 border-t border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#F8FAFC)]/70 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-[var(--muted,#94A3B8)]">
            Ürün satırları
          </p>
          {lineItems.map((line, index) => {
            const lineMetrics = getLineQuantityMetrics(line)
            const lineSteps = buildStepsForLine(line, productionStages)
            const linePct = lineMetrics.ordered
              ? Math.min(100, Math.round((lineMetrics.produced / lineMetrics.ordered) * 100))
              : 0
            const isActive = index === activeLineIndex
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => {
                  setActiveLineIndex(index)
                  if (!expanded) onToggleExpand?.()
                }}
                className={`grid w-full grid-cols-1 items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition hover:scale-[1.005] sm:grid-cols-[minmax(140px,1fr)_88px_minmax(180px,1.4fr)] ${
                  isActive
                    ? 'border-blue-200 bg-white shadow-sm'
                    : 'border-[var(--border,#E2E8F0)] bg-white/60'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[var(--ink,#0F172A)]">
                    <span className="mr-1 text-[11px] font-black text-[var(--muted)]">
                      #{index + 1}
                    </span>
                    {line.product || 'Ürün'}
                  </p>
                  <p className="text-[11px] font-semibold text-[var(--muted)]">
                    {formatQty(lineMetrics.produced)} / {formatQty(lineMetrics.ordered)} adet
                  </p>
                </div>
                <ProductionProgressRing percent={linePct} size={48} stroke={5} />
                <ProductionProcessDotRail
                  steps={lineSteps}
                  readOnly
                  showLabels={lineSteps.length <= 8}
                />
              </button>
            )
          })}
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-5 border-t border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#FCFCFD)]/90 px-4 py-4 transition-opacity duration-300">
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

          <ProductionStageMiniCards
            steps={processSteps}
            stagePhotos={activeLine?.stagePhotos || []}
            producedLabel={producedLabel}
            readOnly={activeLine?.productionClosed === true}
            jobId={job.id}
            lineItemId={activeLine?.id || ''}
            onStageClick={handleStageClick}
            onPhotosChange={handlePhotosChange}
            onStageNote={handleStageNote}
          />

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
