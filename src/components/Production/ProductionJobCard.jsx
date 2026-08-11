import { useEffect, useMemo, useState } from 'react'
import { ArchiveRestore, Package, Trash2, Truck } from 'lucide-react'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessCapsuleRail from './ProductionProcessCapsuleRail'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import ProductionPartialDeliveryTable from './ProductionPartialDeliveryTable'
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
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
} from '../../utils/productionStagePhotos'
import {
  getProductionStageOptions,
  loadWorkflowStages,
} from '../../utils/workflowStages'
import { PAGE_TABLE_HEADER_CLASS } from '../../utils/dashboardDesign'

function formatShortDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) return raw.slice(0, 10)
  const [datePart] = raw.split(/[T ]/)
  const [year, month, day] = String(datePart).split('-')
  if (year && month && day) return `${day}.${month}.${year}`
  return raw.slice(0, 10) || '—'
}

function buildStepsForLine(line, productionStages) {
  if (!productionStages?.length) return []
  const rows = getLineQuantityRows(line)
  const primaryRow = rows[0]
  if (primaryRow) {
    return getQuantityRowMinimalSteps(primaryRow, productionStages)
  }
  return productionStages.map((stage) => ({
    id: stage.id,
    label: stage.label,
    isActive: false,
    isComplete: false,
  }))
}

/**
 * Expanded production detail — table-style product row + process rail with per-stage photos.
 */
export default function ProductionJobCard({
  job,
  workflowStages: workflowStagesProp,
  productionStages: productionStagesProp,
  fulfillmentOptions,
  orders,
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
  const [liveWorkflowStages, setLiveWorkflowStages] = useState(
    () => workflowStagesProp || loadWorkflowStages(),
  )

  useEffect(() => {
    setLiveWorkflowStages(workflowStagesProp || loadWorkflowStages())
  }, [workflowStagesProp])

  useEffect(() => {
    function refreshStages() {
      setLiveWorkflowStages(loadWorkflowStages())
    }
    window.addEventListener('bach:workflow-stages-updated', refreshStages)
    window.addEventListener('storage', refreshStages)
    return () => {
      window.removeEventListener('bach:workflow-stages-updated', refreshStages)
      window.removeEventListener('storage', refreshStages)
    }
  }, [])

  const liveProductionStages = useMemo(() => {
    const fromLive = getProductionStageOptions(liveWorkflowStages)
    if (fromLive.length) return fromLive
    return Array.isArray(productionStagesProp) ? productionStagesProp : []
  }, [liveWorkflowStages, productionStagesProp])

  const order = resolveOrderForProductionJob(job, orders)
  const lineItems = ensureLineItems(job, liveWorkflowStages, order)
  const metrics = getJobQuantityMetrics(lineItems)

  const activeLine =
    lineItems[Math.min(activeLineIndex, Math.max(0, lineItems.length - 1))] || lineItems[0]
  const activeRows = activeLine ? getLineQuantityRows(activeLine) : []
  const primaryRow = activeRows[0]
  const processSteps = buildStepsForLine(activeLine, liveProductionStages)
  const stagePhotos = normalizeStagePhotos(activeLine?.stagePhotos || [])
  const hasPartial =
    metrics.linesWithPartialDelivery > 0 ||
    (metrics.delivered > 0 && metrics.delivered < metrics.ordered)

  function handleStageClick(stageId) {
    if (!activeLine || activeLine.productionClosed) return
    if (!liveProductionStages.some((stage) => stage.id === stageId)) return
    const row = primaryRow || getLineQuantityRows(activeLine)[0]
    if (!row?.id) {
      lineItemActions?.handleAddQuantityRow?.(activeLine)
      return
    }
    lineItemActions?.handleQuantityRowStageChange(activeLine, row.id, stageId)
  }

  async function handleAddPhotos(step, fileList) {
    if (!activeLine || activeLine.productionClosed || !step?.id) return
    const files = Array.from(fileList || []).filter((file) => file.type?.startsWith('image/'))
    if (!files.length) return
    try {
      const existing = normalizeStagePhotos(activeLine.stagePhotos || [])
      const created = []
      for (const file of files) {
        const dataUrl = await readImageFileAsDataUrl(file)
        created.push(
          createStagePhoto({
            dataUrl,
            stageId: step.id,
            stageLabel: step.label,
          }),
        )
      }
      lineItemActions?.handleStagePhotosChange?.(activeLine, [...existing, ...created])
    } catch (error) {
      window.alert(error?.message || 'Görsel yüklenemedi.')
    }
  }

  return (
    <div className="mt-3 space-y-4 rounded-ds-lg border border-ds-border bg-[var(--ds-surface,#fff)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto rounded-ds-lg border border-ds-border">
          <table className="w-full min-w-[28rem] border-collapse text-left">
            <thead className="bg-[var(--ds-surface-muted)]">
              <tr>
                <th className={`${PAGE_TABLE_HEADER_CLASS} min-w-[18rem] w-[70%]`}>
                  ÜRÜN AÇIKLAMASI
                </th>
                <th className={`${PAGE_TABLE_HEADER_CLASS} w-[8rem] whitespace-nowrap`}>
                  SİPARİŞ ADETİ
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr className="border-t border-ds-border">
                  <td className="h-[var(--ds-row-h,2.75rem)] px-3 text-[14px] text-[var(--muted)]">
                    {job.title || 'Ürün bilgisi yok'}
                  </td>
                  <td className="h-[var(--ds-row-h,2.75rem)] px-3 text-[14px] text-[var(--muted)]">
                    —
                  </td>
                </tr>
              ) : (
                lineItems.map((line, index) => {
                  const qty = Math.max(
                    0,
                    Number(resolveLineItemOrderQuantity(line, order) ?? line.quantity) || 0,
                  )
                  const isActive = index === activeLineIndex
                  const productName = line.product || `Kalem ${index + 1}`
                  const description = String(line.description || '').trim()
                  return (
                    <tr
                      key={line.id}
                      className={`border-t border-ds-border transition-colors duration-hover hover:bg-[var(--ds-surface-muted)] cursor-pointer ${
                        isActive ? 'bg-[var(--ds-surface-muted)]' : ''
                      }`}
                      onClick={() => setActiveLineIndex(index)}
                    >
                      <td className="h-[var(--ds-row-h,2.75rem)] max-w-[16rem] px-3 py-1.5 text-ds-body text-ds-ink">
                        <span className="flex min-w-0 flex-col gap-0.5">
                          {description ? (
                            <>
                              <span className="customer-name-primary truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                                {description}
                              </span>
                              <span className="customer-name-secondary font-sans truncate text-[14px] font-normal leading-tight text-[var(--muted)]">
                                {productName}
                              </span>
                            </>
                          ) : (
                            <span className="customer-name-primary truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                              {productName}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1.5 whitespace-nowrap">
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="customer-name-primary tabular-nums text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                            {formatQty(qty)}
                          </span>
                          <span className="customer-name-secondary text-[14px] font-normal leading-tight text-[var(--muted)]">
                            adet
                          </span>
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-1" onClick={(event) => event.stopPropagation()}>
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

      {liveProductionStages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border,#E2E8F0)] px-4 py-6 text-center text-[13px] font-semibold text-[var(--muted,#64748B)]">
          Henüz üretim süreci tanımlı değil. Ayarlar → Üretim Süreçleri panelinden ekleyin.
        </p>
      ) : (
        <ProductionProcessCapsuleRail
          steps={processSteps}
          stagePhotos={stagePhotos}
          readOnly={activeLine?.productionClosed === true}
          onStageClick={handleStageClick}
          onAddPhotos={handleAddPhotos}
        />
      )}

      {partialOpen && activeLine ? (
        <div className="rounded-2xl border border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#FCFCFD)]/90 px-4 py-4 dark:bg-none">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
              Kısmi Teslimat
            </h4>
            {hasPartial ? (
              <span className="text-[12px] font-bold tabular-nums text-[var(--muted,#64748B)]">
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

export { formatShortDate, buildStepsForLine }
