import { useState } from 'react'
import {
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Package,
  Trash2,
} from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessDotRail from './ProductionProcessDotRail'
import ProductionStageMiniCards from './ProductionStageMiniCards'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import ProductionPartialDeliveryCards from './ProductionPartialDeliveryCards'
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
  if (/iptal/i.test(status)) return { label: 'İPTAL', className: 'bg-red-500/12 text-red-600' }
  if (status === 'Bekliyor') return { label: 'BEKLİYOR', className: 'bg-slate-500/12 text-slate-600' }
  if (status === 'Tamamlandı') return { label: 'HAZIR', className: 'bg-emerald-500/12 text-emerald-600' }
  if ((metrics.linesWithPartialDelivery > 0) || /kısmi/i.test(status)) {
    return { label: 'KISMİ', className: 'bg-orange-500/12 text-orange-600' }
  }
  return { label: 'ÜRETİMDE', className: 'bg-blue-500/12 text-blue-600' }
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
  const productSummary = lineItems.map((line) => line.product).filter(Boolean).slice(0, 2).join(' · ')
    || job.title
    || 'Ürün yok'

  const activeLine = lineItems[Math.min(activeLineIndex, Math.max(0, lineItems.length - 1))] || lineItems[0]
  const activeRows = activeLine ? getLineQuantityRows(activeLine) : []
  const primaryRow = activeRows[0]
  const processSteps = primaryRow
    ? getQuantityRowMinimalSteps(primaryRow, productionStages)
    : productionStages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      isActive: false,
      isComplete: false,
    }))
  const producedLabel = activeLine
    ? `${formatQty(activeLine.producedQuantity)} / ${formatQty(activeLine.quantity)}`
    : ''

  return (
    <article
      className={`group rounded-[18px] border border-[var(--border)] bg-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.09)] ${
        expanded ? 'min-h-[350px]' : 'min-h-[110px]'
      } ${selected ? 'ring-2 ring-[var(--bach-sky,#79a6d2)]/45' : ''}`}
    >
      <div className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={() => onToggleSelect?.(job.id)}
            className="mt-1.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
            aria-label={`${job.id} seç`}
          />
          <button
            type="button"
            onClick={onToggleExpand}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-extrabold tabular-nums text-[var(--bach-navy,#203375)]">{job.id}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="mt-1 truncate text-[14px] font-bold text-[var(--ink)]">
              {customerDisplay.brandShortName || job.customer || 'Müşteri yok'}
            </p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--muted)]">{productSummary}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-[var(--muted)]">
              <span>Sipariş: <strong className="text-[var(--ink)]">{formatShortDate(timeline.orderDate)}</strong></span>
              <span>Teslim: <strong className="text-[var(--ink)]">{formatShortDate(timeline.completedDate || job.dueDate)}</strong></span>
              <span>Adet: <strong className="tabular-nums text-[var(--ink)]">{formatQty(metrics.ordered)}</strong></span>
              <span>Üretilen: <strong className="tabular-nums text-blue-600">{formatQty(metrics.produced)}</strong></span>
              <span>Teslim: <strong className="tabular-nums text-emerald-600">{formatQty(metrics.delivered)}</strong></span>
              <span>Kalan: <strong className="tabular-nums text-orange-600">{formatQty(metrics.remaining)}</strong></span>
            </div>
          </button>
        </div>

        <div className="min-w-0 flex-[1.2] px-1">
          <ProductionProcessDotRail
            steps={processSteps}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={(stageId) => {
              if (!activeLine || !primaryRow) return
              lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
            }}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleExpand}
            className={`rounded-xl border p-2 transition-colors ${
              expanded
                ? 'border-[var(--bach-sky,#79a6d2)]/40 bg-[rgba(121,166,210,0.12)] text-[var(--bach-navy,#203375)]'
                : 'border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
            aria-expanded={expanded}
            title={expanded ? 'Kapat' : 'Aç'}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <MoreMenu
            items={[
              {
                id: 'cancel',
                label: 'Vazgeç',
                icon: ArchiveRestore,
                onClick: onCancelProduction,
              },
              {
                id: 'depo',
                label: 'Depoya gönder',
                icon: Package,
                onClick: onSendToDepo,
              },
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

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {expanded ? (
            <div className="space-y-4 border-t border-[var(--border)] px-4 py-4">
              {lineItems.length > 1 ? (
                <div className="flex flex-wrap gap-1.5">
                  {lineItems.map((line, index) => (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => setActiveLineIndex(index)}
                      className={`rounded-full px-3 py-1 text-[12px] font-bold transition-colors ${
                        index === activeLineIndex
                          ? 'bg-[var(--bach-sky,#79a6d2)] text-white'
                          : 'bg-white text-[var(--muted)] ring-1 ring-[var(--border)]'
                      }`}
                    >
                      {line.product || `Kalem ${index + 1}`}
                    </button>
                  ))}
                </div>
              ) : null}

              <div>
                <h4 className="mb-2 text-[14px] font-bold text-[var(--ink)]">Süreç Detayları</h4>
                <ProductionStageMiniCards
                  steps={processSteps}
                  stagePhotos={activeLine?.stagePhotos || []}
                  producedLabel={producedLabel}
                  readOnly={activeLine?.productionClosed === true}
                  onStageClick={(stageId) => {
                    if (!activeLine || !primaryRow) return
                    lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
                  }}
                  onPhotosChange={(photos) => {
                    if (!activeLine) return
                    lineItemActions?.handleStagePhotosChange(activeLine, photos)
                  }}
                />
              </div>

              {activeLine ? (
                <ProductionPartialDeliveryCards
                  lineItem={activeLine}
                  productionJobId={job.id}
                  fulfillmentOptions={fulfillmentOptions}
                  fulfillmentOpenKey={`${job.id}-${activeLine.id}-fulfillment`}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  columnsLocked={activeLine.productionClosed === true}
                  orderLineQuantity={resolveLineItemOrderQuantity(activeLine, order)}
                  onQuantityRowChange={(rowId, patch) => (
                    lineItemActions?.handleLineQuantityRowChange(activeLine, rowId, patch)
                  )}
                  onAddQuantityRow={(rowId) => lineItemActions?.handleAddQuantityRow(activeLine, rowId)}
                  onRemoveQuantityRow={(rowId) => lineItemActions?.handleRemoveQuantityRow(activeLine, rowId)}
                  onSendToDepo={(rowId) => {
                    lineItemActions?.handleSendRowToDepo(
                      activeLine,
                      rowId,
                      resolveLineItemOrderQuantity(activeLine, order),
                    )
                  }}
                  onUndoSendToDepo={(rowId) => lineItemActions?.handleUndoSendRowToDepo(activeLine, rowId)}
                />
              ) : null}

              <div>
                <h4 className="mb-2 text-[14px] font-bold text-[var(--ink)]">Süreç Günlüğü</h4>
                <ProductionActivityTimeline activities={job.activities || []} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
