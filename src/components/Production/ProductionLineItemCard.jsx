import { useEffect, useState } from 'react'
import { CheckCircle2, Plus, Trash2, Undo2 } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../EditableDropdownPill'
import NumericInput from '../Products/NumericInput'
import { ProductionLineItemTopStageStrip } from './ProductionStageFlow'
import { QuantityRowProcessTrigger } from './QuantityRowProcessModule'
import { formatQuantityRowDateTime, getLineFulfillmentOptions, getLineQuantityRows } from '../../utils/productionLineItems'
import {
  formatQty,
  getLineQuantityMetrics,
  getLineVarianceLabel,
} from '../../utils/productionQuantityMetrics'

const productionClosedBannerToneClass = 'border-red-500/45 bg-red-500/15 text-red-700'
const productionClosedActionToneClass = 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'

const pillClass =
  'flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 text-[13px] font-semibold text-[var(--text-strong)]'

const headerMetricPillClass =
  'inline-flex h-8 flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/70 px-3 text-xs font-semibold text-[var(--text-muted)]'

const statusText = {
  'Devam Ediyor': 'text-[var(--accent)]',
  Bekliyor: 'text-[var(--text-muted)]',
  'Kısmi Üretim Bitti': 'text-amber-700',
  'Kısmi Teslimat': 'text-orange-700',
  Tamamlandı: 'text-emerald-700',
}

function ColumnTimestamp({ value, visible }) {
  if (!visible && !value) return null
  if (!value) return null
  return (
    <p className="mt-1 truncate text-[11px] font-medium tabular-nums text-[var(--text-soft)]">
      {formatQuantityRowDateTime(value)}
    </p>
  )
}

function buildGridTemplate(showKalan, showFazla, readOnly = false) {
  const cols = [
    'minmax(128px,1.1fr)',
    'minmax(140px,1.2fr)',
    'minmax(96px,1fr)',
    'minmax(96px,1fr)',
  ]
  if (showKalan) cols.push('minmax(80px,0.8fr)')
  if (showFazla) cols.push('minmax(80px,0.8fr)')
  if (!readOnly) cols.push('76px')
  return cols.join(' ')
}

export default function ProductionLineItemCard({
  lineItem,
  index,
  productionStages,
  activeMenu,
  setActiveMenu,
  menuKeyPrefix,
  onQuantityRowStageChange,
  onQuantityRowChange,
  onAddQuantityRow,
  onRemoveQuantityRow,
  onCloseProduction,
  onReopenProduction,
  onStagePhotosChange,
  readOnly = false,
}) {
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState(null)
  const [fulfillmentOptions, setFulfillmentOptions] = useState(() => getLineFulfillmentOptions())

  useEffect(() => {
    function refreshFulfillmentOptions() {
      setFulfillmentOptions(getLineFulfillmentOptions())
    }
    window.addEventListener('bach:production-fulfillment-updated', refreshFulfillmentOptions)
    return () => window.removeEventListener('bach:production-fulfillment-updated', refreshFulfillmentOptions)
  }, [])

  const metrics = getLineQuantityMetrics(lineItem)
  const quantityRows = getLineQuantityRows(lineItem)
  const varianceLabel = getLineVarianceLabel(metrics)
  const statusTextClass = statusText[lineItem.fulfillmentStatus] || statusText['Devam Ediyor']
  const kalanAmount = metrics.remaining > 0 ? metrics.remaining : metrics.undelivered
  const showKalan = kalanAmount > 0
  const showFazla = metrics.excess > 0
  const gridTemplate = buildGridTemplate(showKalan, showFazla, readOnly)
  const columnsLocked = metrics.productionClosed
  const interactionLocked = readOnly || metrics.productionClosed
  const lockedPillClass = `${pillClass} cursor-default bg-[var(--surface-muted)] text-[var(--text-muted)]`
  const lockedInputClass = 'form-input-readonly h-8 text-xs font-bold'
  const processPillClass = interactionLocked ? lockedPillClass : pillClass
  const fulfillmentPillClass = interactionLocked ? lockedPillClass : pillClass

  const metricCellClass =
    'flex h-8 items-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 text-xs font-bold tabular-nums'

  function handleAddRow() {
    const lastRow = quantityRows[quantityRows.length - 1]
    const newRowId = onAddQuantityRow?.(lastRow?.id)
    if (newRowId) setActiveMenu(`${menuKeyPrefix}-process-${newRowId}`)
  }

  return (
    <article
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] ${
        pendingDeleteRowId ? 'relative z-[100] overflow-visible' : 'overflow-hidden'
      }`}
    >
      <div className="overflow-visible px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className={`min-w-0 ${headerMetricPillClass}`}>
            <span>
              Kalem{' '}
              <strong className="text-sm font-black tabular-nums text-[var(--text-strong)]">#{index + 1}</strong>
            </span>
            <span className="text-[var(--text-soft)]">·</span>
            <span className="min-w-0 truncate">
              Boyut{' '}
              <strong className="text-sm font-black text-[var(--text-strong)]">
                {lineItem.product || 'Ürün adı yok'}
              </strong>
            </span>
            <span className="text-[var(--text-soft)]">·</span>
            <span className={`shrink-0 text-sm font-bold uppercase ${statusTextClass}`}>
              {lineItem.fulfillmentStatus || 'Devam Ediyor'}
            </span>
          </div>

          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <div className={`min-w-0 justify-end ${headerMetricPillClass}`}>
              <span>
                Sipariş{' '}
                <strong className="text-sm font-black tabular-nums text-[var(--text-strong)]">{formatQty(metrics.ordered)}</strong>
              </span>
              <span className="text-[var(--text-soft)]">·</span>
              <span>
                Üretim{' '}
                <strong className="text-sm font-black tabular-nums text-[var(--accent)]">{formatQty(metrics.produced)}</strong>
              </span>
              <span className="text-[var(--text-soft)]">·</span>
              <span>
                Teslim{' '}
                <strong className="text-sm font-black tabular-nums text-emerald-600">{formatQty(metrics.delivered)}</strong>
              </span>
              {varianceLabel && (
                <>
                  <span className="text-[var(--text-soft)]">·</span>
                  <span className="text-sm font-bold text-amber-600">{varianceLabel}</span>
                </>
              )}
            </div>

            {!readOnly && !metrics.productionClosed && metrics.produced > 0 && (
              <>
                <span className="inline-flex h-8 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 text-[12px] font-black uppercase tracking-wide text-[var(--text-soft)]">
                  Merkez Depo → Depo
                </span>
                <button
                  type="button"
                  onClick={() => onCloseProduction?.('order')}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-xl bg-red-600 px-3 text-xs font-bold text-[var(--surface-raised)] hover:bg-red-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Üretim tamamlandı kapat
                </button>
              </>
            )}
            {!readOnly && metrics.productionClosed && lineItem.depoWarehouseKind && (
              <span className="inline-flex h-8 items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700">
                Merkez Depo → Depo
              </span>
            )}
            {!readOnly && metrics.productionClosed && (
              <button
                type="button"
                onClick={onReopenProduction}
                className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-colors hover:bg-emerald-500/15 ${productionClosedActionToneClass}`}
                title="Üretim kapatmayı geri al"
              >
                <Undo2 className="h-3.5 w-3.5 shrink-0" />
                Üretim kapalı · Geri al
              </button>
            )}
          </div>
        </div>
      </div>

      <ProductionLineItemTopStageStrip
        lineItem={lineItem}
        productionStages={productionStages}
        rowCount={quantityRows.length}
        readOnly={readOnly}
        onStagePhotosChange={readOnly ? undefined : (photos) => onStagePhotosChange?.(photos)}
      />

      <div className="border-t border-[var(--border)] p-3 sm:p-4">
        <div className={columnsLocked ? 'overflow-hidden rounded-xl border border-red-500/45' : ''}>
          {columnsLocked && (
            <div
              className={`flex h-8 w-full items-center justify-center px-3 text-xs font-bold ${productionClosedBannerToneClass}`}
            >
              Üretim kapatıldı · satırlar kilitli
            </div>
          )}
          <div className={`space-y-3 ${columnsLocked ? 'bg-[var(--surface-muted)]/35 p-2.5' : ''}`}>
          <div className="grid gap-2" style={{ gridTemplateColumns: gridTemplate }}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Süreç</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Durum</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Üretilen</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Teslim</p>
            {showKalan && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Kalan</p>
            )}
            {showFazla && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">Fazla</p>
            )}
            {!readOnly && <span />}
          </div>

          {quantityRows.map((row, rowIndex) => {
            const isLastRow = rowIndex === quantityRows.length - 1
            const showLineMetricsOnRow = isLastRow

            return (
              <div key={row.id} className="space-y-2">
                <div
                  className="grid items-start gap-2 overflow-visible"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <div className="min-w-0">
                    <QuantityRowProcessTrigger
                      row={row}
                      rowIndex={rowIndex}
                      productionStages={productionStages}
                      openKey={`${menuKeyPrefix}-process-${row.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onStageChange={(stageId) => onQuantityRowStageChange(row.id, stageId)}
                      disabled={interactionLocked}
                      locked={columnsLocked}
                      buttonClassName={processPillClass}
                    />
                    <ColumnTimestamp value={row.stageUpdatedAt} visible={Boolean(row.stageUpdatedAt)} />
                  </div>
                  <div className="relative min-w-0">
                    <EditableDropdownPill
                      value={row.fulfillmentStatus || fulfillmentOptions[0]?.label || ''}
                      options={fulfillmentOptions}
                      editable={false}
                      disabled={interactionLocked}
                      includePlaceholderOption={false}
                      buttonClassName={fulfillmentPillClass}
                      menuVariant="light"
                      menuMatchWidth={false}
                      menuInline
                      openKey={`${menuKeyPrefix}-fulfillment-${row.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => onQuantityRowChange(row.id, { fulfillmentStatus: value || 'Devam Ediyor' })}
                    />
                    <ColumnTimestamp
                      value={row.statusUpdatedAt}
                      visible={Boolean(row.statusUpdatedAt) || !['Devam Ediyor', 'Bekliyor'].includes(row.fulfillmentStatus)}
                    />
                  </div>
                  <div className="min-w-0">
                    {readOnly ? (
                      <div className={`${metricCellClass} text-[var(--text-strong)]`}>
                        {formatQty(row.producedQuantity)}
                      </div>
                    ) : (
                      <NumericInput
                        value={row.producedQuantity}
                        onChange={(value) => onQuantityRowChange(row.id, { producedQuantity: Math.round(Number(value) || 0) })}
                        readOnly={columnsLocked}
                        className={columnsLocked ? lockedInputClass : 'form-input h-8 text-xs font-bold'}
                        placeholder="Üretilen"
                      />
                    )}
                    <ColumnTimestamp value={row.producedUpdatedAt} visible={row.producedQuantity > 0} />
                  </div>
                  <div className="min-w-0">
                    {readOnly ? (
                      <div className={`${metricCellClass} text-emerald-600`}>
                        {formatQty(row.deliveredQuantity)}
                      </div>
                    ) : (
                      <NumericInput
                        value={row.deliveredQuantity}
                        onChange={(value) => onQuantityRowChange(row.id, { deliveredQuantity: Math.round(Number(value) || 0) })}
                        readOnly={columnsLocked}
                        className={columnsLocked ? lockedInputClass : 'form-input h-8 text-xs font-bold'}
                        placeholder="Teslim"
                      />
                    )}
                    <ColumnTimestamp value={row.deliveredUpdatedAt} visible={row.deliveredQuantity > 0} />
                  </div>
                  {showKalan && (
                    <div className="min-w-0">
                      <div className={`${metricCellClass} text-amber-700`}>
                        {showLineMetricsOnRow ? formatQty(kalanAmount) : '—'}
                      </div>
                    </div>
                  )}
                  {showFazla && (
                    <div className="min-w-0">
                      <div className={`${metricCellClass} text-sky-700`}>
                        {showLineMetricsOnRow ? `+${formatQty(metrics.excess)}` : '—'}
                      </div>
                    </div>
                  )}
                  {!readOnly && (
                  <div className="relative flex items-start justify-end gap-1.5 pt-0.5">
                    {isLastRow && !columnsLocked && (
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-500 transition-colors hover:bg-blue-500/20"
                        title="Teslimat ve süreç satırı ekle"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    {quantityRows.length > 1 && !columnsLocked && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteRowId(row.id)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
                        title="Satırı sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {pendingDeleteRowId === row.id && (
                      <DeleteConfirmPopover
                        title="Satır silinsin mi?"
                        description="Bu teslimat satırı ve üretim süreci kaldırılacak."
                        onConfirm={() => {
                          onRemoveQuantityRow(row.id)
                          setPendingDeleteRowId(null)
                          setActiveMenu(null)
                        }}
                        onCancel={() => setPendingDeleteRowId(null)}
                        className="absolute right-0 top-full z-[110] mt-2"
                      />
                    )}
                  </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </article>
  )
}
