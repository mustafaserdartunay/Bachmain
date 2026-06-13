import { useState } from 'react'
import { Package, Plus, Undo2 } from 'lucide-react'
import EditableDropdownPill from '../EditableDropdownPill'
import { ListInlineActionConfirm, DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import NumericInput from '../Products/NumericInput'
import ProductionJobFlowBadge from './ProductionJobFlowBadge'
import ProductionListJobStageRail from './ProductionListJobStageRail'
import { PhotoLightbox } from './ProductionLineItemStagePhotos'
import { getLineQuantityRows } from '../../utils/productionLineItems'
import {
  formatQty,
  getFirstRowSplitBaseRemaining,
  getLineQuantityMetrics,
  getQuantityRowOrdered,
  getQuantityRowMinimalSteps,
  getSplitRowKalanVariance,
  resolveDepoSendQuantity,
} from '../../utils/productionQuantityMetrics'

const listRowPillClass =
  'flex h-7 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-dark-500/50 bg-dark-700/70 px-2 text-[10px] font-bold transition-colors hover:bg-dark-700/80'

const metricBoxClass =
  'flex h-7 items-center justify-center rounded-lg border border-dark-500/50 bg-dark-800/40 px-2 text-[11px] font-bold tabular-nums'

const depoSendBtnClass =
  'flex h-7 items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 text-[10px] font-bold text-orange-300 transition-colors hover:border-orange-500/45 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-35'

const depoSentIconClass =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300'

const depoUndoBtnClass =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2 text-[10px] font-bold text-orange-300 transition-colors hover:border-orange-500/45 hover:bg-orange-500/15'

function getRowPieceMetrics(row, rowOrdered) {
  const produced = Math.max(0, Number(row.producedQuantity) || 0)
  const delivered = Math.max(0, Number(row.deliveredQuantity) || 0)
  const undelivered = Math.max(0, produced - delivered)
  const remaining = Math.max(0, rowOrdered - produced)

  return { produced, delivered, undelivered, remaining }
}

function buildRowLineItemSnapshot(lineItem, row) {
  return {
    ...lineItem,
    producedQuantity: row.producedQuantity,
    deliveredQuantity: row.deliveredQuantity,
    fulfillmentStatus: row.fulfillmentStatus,
    quantityRows: [row],
  }
}

function ProcessMetricsRow({
  row,
  lineItem,
  lineMetrics,
  fulfillmentOptions,
  fulfillmentOpenKey,
  activeMenu,
  setActiveMenu,
  onQuantityRowChange,
  columnsLocked,
  lockedInputClass,
  jobStatus,
  totalsMode = false,
  rowIndex = 0,
  onSendToDepo,
  pendingDepoRowId,
  setPendingDepoRowId,
  onUndoSendToDepo,
  pendingUndoDepoRowId,
  setPendingUndoDepoRowId,
  splitBaseRemaining = null,
  orderLineQuantity = null,
}) {
  const rowOrdered = getQuantityRowOrdered(row, lineItem, rowIndex)
  const isSplitRow = rowIndex > 0
  const resolvedOrderQty = Math.max(0, Number(orderLineQuantity) || 0)
  const displayOrdered = !isSplitRow && resolvedOrderQty > 0 ? resolvedOrderQty : rowOrdered
  const pieceMetrics = getRowPieceMetrics(row, displayOrdered)
  const firstRowOrderQty = resolvedOrderQty > 0 ? resolvedOrderQty : rowOrdered
  const orderColumnLabel = isSplitRow ? 'Kalan' : 'Sipariş'
  const orderColumnValue = isSplitRow
    ? formatQty(Math.max(0, Number(splitBaseRemaining) || 0))
    : formatQty(firstRowOrderQty)
  const orderColumnTone = isSplitRow ? 'text-amber-300' : 'text-white'
  const splitKalan = isSplitRow
    ? getSplitRowKalanVariance(splitBaseRemaining, row.deliveredQuantity)
    : null
  const kalanLabel = totalsMode
    ? (lineMetrics.excess > 0 ? 'Fazla' : 'Kalan')
    : (splitKalan?.isExcess ? 'Fazla' : 'Kalan')
  const kalanValue = totalsMode
    ? (lineMetrics.excess > 0 ? `+${formatQty(lineMetrics.excess)}` : formatQty(lineMetrics.remaining > 0 ? lineMetrics.remaining : lineMetrics.undelivered))
    : splitKalan
      ? (splitKalan.isExcess ? `+${formatQty(splitKalan.value)}` : formatQty(splitKalan.value))
      : formatQty(pieceMetrics.remaining > 0 ? pieceMetrics.remaining : pieceMetrics.undelivered)
  const kalanTone = totalsMode && lineMetrics.excess > 0
    ? 'text-sky-300'
    : (splitKalan?.isExcess ? 'text-sky-300' : 'text-amber-300')
  const depoSendQuantity = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
  const rowSnapshot = buildRowLineItemSnapshot(lineItem, row)

  return (
    <div className="flex shrink-0 items-end gap-1.5">
      <div className="w-[138px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">Durum</p>
        {totalsMode ? (
          <div className={`${metricBoxClass} truncate px-1 text-[10px] text-white`}>
            {row.fulfillmentStatus || 'Devam Ediyor'}
          </div>
        ) : (
          <EditableDropdownPill
            value={row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'}
            options={fulfillmentOptions}
            editable={false}
            disabled={columnsLocked}
            includePlaceholderOption={false}
            buttonClassName={listRowPillClass}
            openKey={fulfillmentOpenKey}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => onQuantityRowChange(row.id, { fulfillmentStatus: value || 'Devam Ediyor' })}
          />
        )}
      </div>
      <div className="w-[74px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">{orderColumnLabel}</p>
        <div className={`${metricBoxClass} ${orderColumnTone}`}>
          {orderColumnValue}
        </div>
      </div>
      <div className="w-[74px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">Üretilen</p>
        {totalsMode ? (
          <div className={`${metricBoxClass} text-blue-300`}>
            {formatQty(lineMetrics.produced)}
          </div>
        ) : (
          <NumericInput
            value={row.producedQuantity}
            onChange={(value) => onQuantityRowChange(row.id, { producedQuantity: Math.round(Number(value) || 0) })}
            readOnly={columnsLocked}
            className={columnsLocked ? lockedInputClass : 'form-input h-7 text-[11px] font-bold tabular-nums px-2'}
            placeholder="0"
          />
        )}
      </div>
      <div className="w-[74px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">Teslim</p>
        {totalsMode ? (
          <div className={`${metricBoxClass} text-emerald-300`}>
            {formatQty(lineMetrics.delivered)}
          </div>
        ) : (
          <NumericInput
            value={row.deliveredQuantity}
            onChange={(value) => onQuantityRowChange(row.id, { deliveredQuantity: Math.round(Number(value) || 0) })}
            readOnly={columnsLocked}
            className={columnsLocked ? lockedInputClass : 'form-input h-7 text-[11px] font-bold tabular-nums px-2'}
            placeholder="0"
          />
        )}
      </div>
      <div className="w-[74px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">{kalanLabel}</p>
        <div className={`${metricBoxClass} ${kalanTone}`}>
          {kalanValue}
        </div>
      </div>
      {!totalsMode && typeof onSendToDepo === 'function' && (
        <div
          className="relative flex shrink-0 flex-col self-end"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent select-none">.</p>
          {pendingDepoRowId === row.id ? (
            <ListInlineActionConfirm
              message="Emin misin?"
              tone="orange"
              onConfirm={() => {
                onSendToDepo(row.id)
                setPendingDepoRowId?.(null)
              }}
              onCancel={() => setPendingDepoRowId?.(null)}
            />
          ) : row.depoItemId ? (
            pendingUndoDepoRowId === row.id ? (
              <ListInlineActionConfirm
                message="Emin misin?"
                tone="orange"
                onConfirm={() => {
                  onUndoSendToDepo?.(row.id)
                  setPendingUndoDepoRowId?.(null)
                }}
                onCancel={() => setPendingUndoDepoRowId?.(null)}
              />
            ) : (
              <div className="flex max-w-[220px] flex-wrap items-center gap-1.5">
                <div
                  className={depoSentIconClass}
                  title={row.depoSentAt ? `Gönderim: ${row.depoSentAt}` : 'Depoya gönderildi'}
                >
                  <Package className="h-3 w-3" />
                </div>
                <span className="whitespace-nowrap text-[10px] font-bold text-orange-300">Depoya gönderildi</span>
                {typeof onUndoSendToDepo === 'function' && (
                  <button
                    type="button"
                    onClick={() => setPendingUndoDepoRowId?.(row.id)}
                    className={depoUndoBtnClass}
                    title="Depo gönderimini geri al"
                  >
                    <Undo2 className="h-3 w-3" />
                    Geri al
                  </button>
                )}
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => setPendingDepoRowId?.(row.id)}
              disabled={columnsLocked || !(depoSendQuantity > 0)}
              className={depoSendBtnClass}
              title={splitKalan?.isExcess ? 'Fazla adedi depoya gönder' : 'Depoya gönder'}
            >
              <Package className="h-3 w-3 shrink-0" />
              <span className="whitespace-nowrap">Depoya gönder</span>
            </button>
          )}
        </div>
      )}
      <div className="w-[132px]">
        <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-gray-600">Akış</p>
        <ProductionJobFlowBadge
          lineItems={[totalsMode ? lineItem : rowSnapshot]}
          jobStatus={row.fulfillmentStatus || lineItem.fulfillmentStatus || jobStatus}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default function ProductionListLineItemRow({
  lineItem,
  lineIndex,
  lineCount,
  productionStages,
  fulfillmentOptions = [],
  fulfillmentOpenKey,
  activeMenu,
  setActiveMenu,
  onQuantityRowStageChange,
  onQuantityRowChange,
  onAddQuantityRow,
  onRemoveQuantityRow,
  onStagePhotosChange,
  onRemoveLineItem,
  onSendToDepo,
  onUndoSendToDepo,
  jobStatus,
  orderLineQuantity = null,
}) {
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState(null)
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)

  const lineMetrics = getLineQuantityMetrics(lineItem)
  const quantityRows = getLineQuantityRows(lineItem)
  const columnsLocked = lineItem.productionClosed === true
  const lockedInputClass = 'form-input-readonly h-7 text-[11px] font-bold tabular-nums px-2'
  const stagePhotos = lineItem.stagePhotos || []

  if (!quantityRows.length) return null

  const splitBaseRemaining = getFirstRowSplitBaseRemaining(lineItem, orderLineQuantity)

  return (
    <>
      <div className="space-y-2">
        {quantityRows.map((row, rowIndex) => {
          const rowSteps = getQuantityRowMinimalSteps(row, productionStages)
          const isFirstRow = rowIndex === 0

          return (
            <div
              key={row.id}
              className={rowIndex > 0 ? 'border-t border-dark-500/25 pt-2' : ''}
            >
              <div className="flex items-end gap-2.5">
                {isFirstRow ? (
                  <p
                    className="flex h-7 min-w-0 flex-1 items-center truncate text-sm font-black text-white"
                    title={lineItem.product || 'Ürün'}
                  >
                    {lineCount > 1 && (
                      <span className="mr-1 text-[10px] font-black tabular-nums text-gray-500">
                        #{lineIndex + 1}
                      </span>
                    )}
                    {lineItem.product || 'Ürün adı yok'}
                  </p>
                ) : (
                  <div className="min-w-0 flex-1" />
                )}

                <ProcessMetricsRow
                  row={row}
                  rowIndex={rowIndex}
                  lineItem={lineItem}
                  lineMetrics={lineMetrics}
                  fulfillmentOptions={fulfillmentOptions}
                  fulfillmentOpenKey={isFirstRow ? fulfillmentOpenKey : `${fulfillmentOpenKey}-${row.id}`}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onQuantityRowChange={onQuantityRowChange}
                  columnsLocked={columnsLocked}
                  lockedInputClass={lockedInputClass}
                  jobStatus={jobStatus}
                  onSendToDepo={onSendToDepo}
                  onUndoSendToDepo={onUndoSendToDepo}
                  pendingDepoRowId={pendingDepoRowId}
                  setPendingDepoRowId={setPendingDepoRowId}
                  pendingUndoDepoRowId={pendingUndoDepoRowId}
                  setPendingUndoDepoRowId={setPendingUndoDepoRowId}
                  splitBaseRemaining={splitBaseRemaining}
                  orderLineQuantity={orderLineQuantity}
                />

                {(typeof onAddQuantityRow === 'function' || typeof onRemoveLineItem === 'function' || typeof onRemoveQuantityRow === 'function') && (
                  <div className="flex shrink-0 items-end gap-1">
                    <p className="mb-0.5 text-[8px] font-black uppercase tracking-wide text-transparent select-none">.</p>
                    <div className="flex items-center gap-1">
                      {typeof onAddQuantityRow === 'function' && (
                        <button
                          type="button"
                          onClick={() => onAddQuantityRow(row.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400 transition-colors hover:border-blue-500/35 hover:bg-blue-500/15 hover:text-blue-300"
                          title="Yeni süreç ekle"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {quantityRows.length === 1 && typeof onRemoveLineItem === 'function' && (
                        <DeleteTrashButton
                          pending={pendingDelete}
                          onClick={() => setPendingDelete(true)}
                          onConfirm={() => {
                            onRemoveLineItem()
                            setPendingDelete(false)
                            setActiveMenu?.(null)
                          }}
                          onCancel={() => setPendingDelete(false)}
                          title="Kalemi silinsin mi?"
                          description="Bu kalem listeden kaldırılacak."
                          iconClassName="h-3 w-3"
                          buttonClassName="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition-colors hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-300"
                          popoverClassName="absolute right-0 top-12 z-40"
                        />
                      )}
                      {quantityRows.length > 1 && typeof onRemoveQuantityRow === 'function' && (
                        <DeleteTrashButton
                          pending={pendingDeleteRowId === row.id}
                          onClick={() => setPendingDeleteRowId(row.id)}
                          onConfirm={() => {
                            onRemoveQuantityRow(row.id)
                            setPendingDeleteRowId(null)
                            setActiveMenu?.(null)
                          }}
                          onCancel={() => setPendingDeleteRowId(null)}
                          title="Süreci silinsin mi?"
                          description="Bu süreç satırı kaldırılacak."
                          iconClassName="h-3 w-3"
                          buttonClassName="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition-colors hover:border-red-500/35 hover:bg-red-500/15 hover:text-red-300"
                          popoverClassName="absolute right-0 top-12 z-40"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-1 flex items-center gap-1">
                <ProductionListJobStageRail
                  steps={rowSteps}
                  className="min-w-0 flex-1"
                  stagePhotos={stagePhotos}
                  readOnly={columnsLocked}
                  onPhotosChange={onStagePhotosChange}
                  onPreview={setPreviewPhoto}
                  onStageClick={(stageId) => onQuantityRowStageChange?.(row.id, stageId)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <PhotoLightbox photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </>
  )
}
