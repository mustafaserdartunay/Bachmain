import { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessCapsuleRail from './ProductionProcessCapsuleRail'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import ProductionLineDeliveryPanel from './ProductionLineDeliveryPanel'
import {
  ensureLineItems,
  getLineQuantityRows,
  isLineProductionStarted,
  resolveLineItemOrderQuantity,
  resolveOrderForProductionJob,
} from '../../utils/productionLineItems'
import ProductionStartPanel from './ProductionStartPanel'
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
import {
  purgeProductionActivityTrash,
  restoreProductionActivities,
  softDeleteProductionActivities,
} from '../../utils/productionLineItemActions'

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
  onFulfillmentOptionsChange,
  orders,
  pendingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  lineItemActions,
  activeMenu,
  setActiveMenu,
  onRefresh,
}) {
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [activeRowId, setActiveRowId] = useState(null)
  /** Firm expand shows product list first; process rail + journal open via row toggle. */
  const [detailOpen, setDetailOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [liveWorkflowStages, setLiveWorkflowStages] = useState(
    () => workflowStagesProp || loadWorkflowStages(),
  )

  useEffect(() => {
    setDetailOpen(false)
    setJournalOpen(false)
    setActiveLineIndex(0)
    setActiveRowId(null)
  }, [job?.id])

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
  const pendingLineItems = lineItems.filter(
    (line) => !isLineProductionStarted(line, liveWorkflowStages),
  )
  const startedLineItems = lineItems.filter((line) =>
    isLineProductionStarted(line, liveWorkflowStages),
  )

  const activeLine =
    startedLineItems[Math.min(activeLineIndex, Math.max(0, startedLineItems.length - 1))] ||
    startedLineItems[0]
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


  function handleToggleRowDetail(lineId, rowId) {
    const index = startedLineItems.findIndex((line) => line.id === lineId)
    if (index >= 0) setActiveLineIndex(index)
    if (rowId) setActiveRowId(rowId)

    const isSameRow = rowId && activeRowId === rowId
    if (detailOpen && isSameRow) {
      setDetailOpen(false)
      setJournalOpen(false)
      return
    }
    setDetailOpen(true)
    // Journal stays collapsed — user opens it explicitly.
    setJournalOpen(false)
  }

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

  return (
    <div className="mt-3 space-y-5 rounded-ds-lg border border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent p-5 sm:p-6">
      {pendingLineItems.length ? (
        <div className="space-y-4">
          {pendingLineItems.map((line) => (
            <ProductionStartPanel
              key={line.id}
              line={line}
              orderQuantity={resolveLineItemOrderQuantity(line, order)}
              onStartFull={() =>
                lineItemActions?.handleStartFullProduction(
                  line,
                  resolveLineItemOrderQuantity(line, order),
                )
              }
              onStartPartial={(splits) =>
                lineItemActions?.handleStartPartialProduction(
                  line,
                  splits,
                  resolveLineItemOrderQuantity(line, order),
                )
              }
            />
          ))}
        </div>
      ) : null}

      {startedLineItems.length ? (
      <div className="relative" onClick={(event) => event.stopPropagation()}>
          <ProductionLineDeliveryPanel
            lineItems={startedLineItems}
            activeLineId={activeLine?.id}
            activeRowId={activeRowId}
            detailOpen={detailOpen}
            onToggleDetail={handleToggleRowDetail}
            onSelectLine={(lineId) => {
              const index = lineItems.findIndex((line) => line.id === lineId)
              if (index >= 0) setActiveLineIndex(index)
            }}
            onSelectRow={(rowId) => setActiveRowId(rowId)}
            productionJobId={job.id}
            fulfillmentOptions={fulfillmentOptions}
            onFulfillmentOptionsChange={onFulfillmentOptionsChange}
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
            onEditRow={(line, rowId) => {
              setActiveRowId(rowId)
              const index = lineItems.findIndex((entry) => entry.id === line.id)
              if (index >= 0) setActiveLineIndex(index)
            }}
          />

        {pendingDelete ? (
          <div className="absolute right-2 top-2 z-20" onClick={(event) => event.stopPropagation()}>
            <DeleteTrashButton
              pending
              onClick={onRequestDelete}
              onConfirm={onConfirmDelete}
              onCancel={onCancelDelete}
              title="Üretim kaydı silinsin mi?"
              description="Bu işlem geri alınamaz."
              popoverClassName="absolute right-0 top-1/2 z-20 -translate-y-1/2"
            />
          </div>
        ) : null}
      </div>
      ) : null}

      {detailOpen && startedLineItems.length ? (
        <>
          {liveProductionStages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--border,#E2E8F0)] px-4 py-6 text-center text-[13px] font-semibold text-[var(--muted,#64748B)]">
              Henüz üretim süreci tanımlı değil. Ayarlar → Üretim Süreçleri panelinden ekleyin.
            </p>
          ) : (
            <div className="overflow-visible rounded-ds-lg border border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent px-3 py-3">
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

          <div className="overflow-hidden rounded-ds-lg border border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setJournalOpen((open) => !open)
              }}
              className="flex w-full items-center justify-between gap-2 bg-transparent px-3 py-2 text-left transition-colors hover:bg-[var(--ds-surface-muted)]/30"
              aria-expanded={journalOpen}
            >
              <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--muted,#64748B)]">
                Süreç Günlüğü
                {(job.activities || []).length > 0 ? (
                  <span className="ml-1.5 tabular-nums font-semibold text-[var(--muted)]/70">
                    ({(job.activities || []).length})
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${
                  journalOpen ? 'rotate-180' : ''
                }`}
                strokeWidth={2.25}
              />
            </button>
            {journalOpen ? (
              <div className="border-t border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent px-3 py-3">
                <ProductionActivityTimeline
                  activities={job.activities || []}
                  trash={job.activityTrash || []}
                  onDelete={(ids) => {
                    softDeleteProductionActivities(job.id, ids)
                    onRefresh?.()
                  }}
                  onRestore={(ids) => {
                    restoreProductionActivities(job.id, ids)
                    onRefresh?.()
                  }}
                  onPurgeTrash={(ids) => {
                    purgeProductionActivityTrash(job.id, ids)
                    onRefresh?.()
                  }}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}

export { formatShortDate, buildStepsForLine }
