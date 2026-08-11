import { useEffect, useMemo, useRef, useState } from 'react'
import { ArchiveRestore, ImagePlus, Package, Trash2, Truck } from 'lucide-react'
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
 * Expanded production detail — full product info, process rail, photo add.
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
  const photoInputRef = useRef(null)
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
  const hasPartial =
    metrics.linesWithPartialDelivery > 0 ||
    (metrics.delivered > 0 && metrics.delivered < metrics.ordered)

  const activeStep =
    processSteps.find((step) => step.isActive) ||
    processSteps.find((step) => !step.isComplete) ||
    processSteps[processSteps.length - 1] ||
    null
  const photoCount = normalizeStagePhotos(activeLine?.stagePhotos || []).filter(
    (photo) => !activeStep?.id || photo.stageId === activeStep.id,
  ).length

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

  async function handlePhotoFiles(fileList) {
    if (!activeLine || activeLine.productionClosed || !activeStep?.id) return
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
            stageId: activeStep.id,
            stageLabel: activeStep.label,
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {lineItems.length === 0 ? (
            <p className="text-[14px] font-semibold text-[var(--muted,#64748B)]">
              {job.title || 'Ürün bilgisi yok'}
            </p>
          ) : (
            lineItems.map((line, index) => {
              const qty = Math.max(0, Number(line.quantity) || 0)
              const isActive = index === activeLineIndex
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setActiveLineIndex(index)}
                  className={`block w-full rounded-xl px-3 py-2 text-left transition ${
                    isActive
                      ? 'bg-[var(--ds-surface-muted,#F8FAFC)] ring-1 ring-[var(--border,#E2E8F0)]'
                      : 'hover:bg-[var(--ds-surface-muted,#F8FAFC)]/70'
                  }`}
                >
                  <p className="text-[15px] font-bold leading-snug text-[var(--ink,#0F172A)]">
                    {line.product || `Kalem ${index + 1}`}
                    {qty > 0 ? (
                      <span className="ml-2 text-[13px] font-semibold tabular-nums text-[var(--muted,#64748B)]">
                        × {formatQty(qty)}
                      </span>
                    ) : null}
                  </p>
                  {line.description ? (
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-[var(--muted,#64748B)]">
                      {line.description}
                    </p>
                  ) : null}
                </button>
              )
            })
          )}
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

      {liveProductionStages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border,#E2E8F0)] px-4 py-6 text-center text-[13px] font-semibold text-[var(--muted,#64748B)]">
          Henüz üretim süreci tanımlı değil. Ayarlar → Üretim Süreçleri panelinden ekleyin.
        </p>
      ) : (
        <div className="space-y-3">
          <ProductionProcessCapsuleRail
            steps={processSteps}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={handleStageClick}
          />

          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={activeLine?.productionClosed === true || !activeStep?.id}
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ds-border bg-white px-3 py-2 text-[12px] font-bold text-[var(--muted,#64748B)] transition hover:border-blue-300 hover:text-[var(--accent,#2563EB)] disabled:opacity-50"
              title={
                activeStep
                  ? `${activeStep.label} için fotoğraf ekle`
                  : 'Fotoğraf ekle'
              }
            >
              <ImagePlus className="h-4 w-4" />
              Fotoğraf ekle
              {photoCount > 0 ? (
                <span className="tabular-nums text-[var(--accent,#2563EB)]">({photoCount})</span>
              ) : null}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={activeLine?.productionClosed === true}
              onChange={(event) => {
                handlePhotoFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>
        </div>
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
