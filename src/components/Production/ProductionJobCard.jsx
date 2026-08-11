import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArchiveRestore, Package, Trash2 } from 'lucide-react'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessCapsuleRail from './ProductionProcessCapsuleRail'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import ProductionLineDeliveryPanel from './ProductionLineDeliveryPanel'
import {
  ensureLineItems,
  getLineQuantityRows,
  resolveLineItemOrderQuantity,
  resolveOrderForProductionJob,
} from '../../utils/productionLineItems'
import { getQuantityRowMinimalSteps } from '../../utils/productionQuantityMetrics'
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
 * Expanded production detail — unified product/partial panel + process rail.
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
}) {
  const navigate = useNavigate()
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [activeRowId, setActiveRowId] = useState(null)
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

  const activeLine =
    lineItems[Math.min(activeLineIndex, Math.max(0, lineItems.length - 1))] || lineItems[0]
  const activeRows = activeLine ? getLineQuantityRows(activeLine) : []
  const primaryRow =
    (activeRowId && activeRows.find((row) => row.id === activeRowId)) || activeRows[0] || null
  const processSteps = primaryRow
    ? getQuantityRowMinimalSteps(primaryRow, liveProductionStages)
    : buildStepsForLine(activeLine, liveProductionStages)
  const stagePhotos = normalizeStagePhotos(activeLine?.stagePhotos || [])

  useEffect(() => {
    if (!activeLine) {
      setActiveRowId(null)
      return
    }
    const rows = getLineQuantityRows(activeLine)
    if (!rows.length) {
      setActiveRowId(null)
      return
    }
    if (!activeRowId || !rows.some((row) => row.id === activeRowId)) {
      setActiveRowId(rows[0].id)
    }
  }, [activeLine?.id, activeLine?.quantityRows, activeRowId])

  function handleStageClick(stageId) {
    if (!activeLine || activeLine.productionClosed) return
    if (!liveProductionStages.some((stage) => stage.id === stageId)) return
    const row = primaryRow || getLineQuantityRows(activeLine)[0]
    // Never auto-create a partial row from stage clicks — only advance an existing row.
    if (!row?.id) return
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

  async function handleReplacePhoto(photo, file) {
    if (!activeLine || activeLine.productionClosed || !photo?.id || !file) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      const existing = normalizeStagePhotos(activeLine.stagePhotos || [])
      const next = existing.map((item) =>
        item.id === photo.id
          ? {
              ...item,
              dataUrl,
              createdAt: new Date().toLocaleString('tr-TR'),
            }
          : item,
      )
      lineItemActions?.handleStagePhotosChange?.(activeLine, next)
    } catch (error) {
      window.alert(error?.message || 'Görsel güncellenemedi.')
    }
  }

  function handleDeletePhoto(photo) {
    if (!activeLine || activeLine.productionClosed || !photo?.id) return
    const existing = normalizeStagePhotos(activeLine.stagePhotos || [])
    lineItemActions?.handleStagePhotosChange?.(
      activeLine,
      existing.filter((item) => item.id !== photo.id),
    )
  }

  function handleIssueWaybill(line, rowId) {
    const result = lineItemActions?.handleIssueRowWaybill?.(line, rowId)
    if (result?.path) navigate(result.path)
  }

  function handleOpenMapLink(line, rowId) {
    const result = lineItemActions?.handleCreateRowSevkiyatLink?.(line, rowId)
    if (result?.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (result?.mapsUrl) {
      window.open(result.mapsUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function handleIssueInvoice(line, rowId) {
    const result = lineItemActions?.handleIssueRowInvoice?.(line, rowId)
    if (result?.path) navigate(result.path)
  }

  return (
    <div className="mt-3 space-y-4 rounded-ds-lg border border-ds-border bg-[var(--ds-surface,#fff)] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1" onClick={(event) => event.stopPropagation()}>
          <ProductionLineDeliveryPanel
            lineItems={lineItems}
            activeLineId={activeLine?.id}
            activeRowId={activeRowId}
            onSelectLine={(lineId) => {
              const index = lineItems.findIndex((line) => line.id === lineId)
              if (index >= 0) setActiveLineIndex(index)
            }}
            onSelectRow={(rowId) => setActiveRowId(rowId)}
            productionJobId={job.id}
            fulfillmentOptions={fulfillmentOptions}
            fulfillmentOpenKey={`${job.id}-fulfillment`}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            columnsLocked={false}
            resolveOrderQuantity={(line) => resolveLineItemOrderQuantity(line, order)}
            onQuantityRowChange={(line, rowId, patch) =>
              lineItemActions?.handleLineQuantityRowChange(line, rowId, patch)
            }
            onAddQuantityRow={(line, rowId) => {
              const newId = lineItemActions?.handleAddQuantityRow(line, rowId)
              if (newId) setActiveRowId(newId)
            }}
            onRemoveQuantityRow={(line, rowId) => {
              lineItemActions?.handleRemoveQuantityRow(line, rowId)
              if (activeRowId === rowId) setActiveRowId(null)
            }}
            onSendToDepo={(line, rowId) => {
              lineItemActions?.handleSendRowToDepo(
                line,
                rowId,
                resolveLineItemOrderQuantity(line, order),
              )
            }}
            onUndoSendToDepo={(line, rowId) =>
              lineItemActions?.handleUndoSendRowToDepo(line, rowId)
            }
            onIssueWaybill={handleIssueWaybill}
            onOpenMapLink={handleOpenMapLink}
            onIssueInvoice={handleIssueInvoice}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-1" onClick={(event) => event.stopPropagation()}>
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
        <div className="overflow-visible rounded-ds-lg border border-ds-border bg-[var(--ds-surface-muted,#F8FAFC)]/60 px-2 py-2">
          <ProductionProcessCapsuleRail
            steps={processSteps}
            stagePhotos={stagePhotos}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={handleStageClick}
            onAddPhotos={handleAddPhotos}
            onReplacePhoto={handleReplacePhoto}
            onDeletePhoto={handleDeletePhoto}
          />
        </div>
      )}

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
