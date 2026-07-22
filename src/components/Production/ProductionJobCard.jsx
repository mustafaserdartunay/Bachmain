import { useState } from 'react'
import { ArchiveRestore, ChevronDown, ChevronRight, Package, Trash2 } from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessDotRail from './ProductionProcessDotRail'
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
  if (/iptal/i.test(status)) return { label: 'İPTAL', className: 'bg-red-50 text-red-600' }
  if (status === 'Bekliyor') return { label: 'BEKLEMEDE', className: 'bg-slate-100 text-slate-600' }
  if (status === 'Tamamlandı') {
    return { label: 'TAMAMLANDI', className: 'bg-emerald-50 text-emerald-600' }
  }
  if (metrics.linesWithPartialDelivery > 0 || /kısmi/i.test(status)) {
    return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
  }
  if (status === 'Devam Ediyor') {
    return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
  }
  return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
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

  return (
    <article className="overflow-hidden rounded-[18px] border border-[var(--border,#E2E8F0)] bg-white/90 shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] dark:bg-white/5">
      <div className="grid grid-cols-1 items-center gap-3 px-4 py-3.5 lg:grid-cols-[minmax(200px,1.15fr)_150px_minmax(240px,1.5fr)_150px_130px_88px]">
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
            <p className="truncate text-[13px] font-bold text-[var(--ink,#0F172A)]">
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
          className="flex items-center gap-2 text-left"
        >
          <ProductionProgressRing percent={progressPct} />
          <div className="text-[11px] font-semibold leading-relaxed text-[var(--muted,#64748B)]">
            <p>
              Üretilecek:{' '}
              <span className="font-bold text-[var(--ink,#0F172A)]">
                {formatQty(metrics.ordered)}
              </span>
            </p>
            <p>
              Üretilen:{' '}
              <span className="font-bold text-[var(--ink,#0F172A)]">
                {formatQty(metrics.produced)}
              </span>
            </p>
            <p>
              Teslim:{' '}
              <span className="font-bold text-[var(--ink,#0F172A)]">
                {formatQty(metrics.delivered)}
              </span>
            </p>
            <p>
              Kalan:{' '}
              <span className="font-bold text-[var(--ink,#0F172A)]">
                {formatQty(metrics.remaining)}
              </span>
            </p>
          </div>
        </button>

        <div className="min-w-0">
          <ProductionProcessDotRail
            steps={processSteps}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={(stageId) => {
              if (!activeLine || !primaryRow) return
              lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
            }}
          />
        </div>

        <div>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div>
          {hasPartial ? (
            <div className="space-y-0.5">
              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600">
                Kısmi Teslimat
              </span>
              <p className="text-[12px] font-bold tabular-nums text-[var(--ink,#0F172A)]">
                {formatQty(metrics.delivered)} / {formatQty(metrics.ordered)}
              </p>
            </div>
          ) : (
            <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500">
              Teslimat Yok
            </span>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onToggleExpand}
            className={`rounded-lg border p-2 transition hover:scale-105 ${
              expanded
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)]'
            }`}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <MoreMenu
            items={[
              { id: 'cancel', label: 'Vazgeç', icon: ArchiveRestore, onClick: onCancelProduction },
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
            onStageClick={(stageId) => {
              if (!activeLine || !primaryRow) return
              lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
            }}
            onPhotosChange={(photos) => {
              if (!activeLine) return
              lineItemActions?.handleStagePhotosChange(activeLine, photos)
            }}
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
