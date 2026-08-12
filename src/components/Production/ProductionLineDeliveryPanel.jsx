import { useState } from 'react'
import {
  ChevronDown,
  Package,
  Pencil,
  Plus,
  Trash2,
  Undo2,
} from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../EditableDropdownPill'
import NumericInput from '../Products/NumericInput'
import { getLineQuantityRows } from '../../utils/productionLineItems'
import {
  formatQty,
  getCascadingRowRemaining,
  resolveDepoSendQuantity,
} from '../../utils/productionQuantityMetrics'
import { publishPartDeliverySituations } from '../../utils/productionFulfillmentOptions'
import { PAGE_TABLE_HEADER_CLASS } from '../../utils/dashboardDesign'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'

const QTY_CELL_CLASS =
  'h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap text-center'
const QTY_INPUT_CLASS =
  '!h-8 !min-h-8 !w-[4rem] !min-w-[4rem] !max-w-[4rem] !px-1.5 py-0 text-center text-[12px] font-bold tabular-nums'
const QTY_BOX_CLASS =
  'form-input inline-flex !h-8 !min-h-8 !w-[4rem] !min-w-[4rem] !max-w-[4rem] !px-1.5 py-0 items-center justify-center text-center text-[12px] font-bold tabular-nums'

function isEmptyPartialRow(row) {
  if (!row) return true
  const produced = Math.max(0, Number(row.producedQuantity) || 0)
  const delivered = Math.max(0, Number(row.deliveredQuantity) || 0)
  return (
    produced === 0 &&
    delivered === 0 &&
    !row.waybillNo &&
    !row.invoiceNo &&
    !row.depoItemId &&
    !row.trackingToken &&
    !row.sevkiyatTripId
  )
}

/**
 * Unified product + partial-delivery table with row MoreMenu actions.
 */
export default function ProductionLineDeliveryPanel({
  lineItems = [],
  activeLineId,
  activeRowId,
  detailOpen = false,
  onToggleDetail,
  onSelectLine,
  onSelectRow,
  productionJobId,
  fulfillmentOptions,
  onFulfillmentOptionsChange,
  fulfillmentOpenKey,
  activeMenu,
  setActiveMenu,
  columnsLocked,
  resolveOrderQuantity,
  onQuantityRowChange,
  onAddQuantityRow,
  onRemoveQuantityRow,
  onSendToDepo,
  onUndoSendToDepo,
  onEditRow,
}) {
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)

  const flatRows = []
  lineItems.forEach((line) => {
    const allRows = getLineQuantityRows(line)
    const rows = allRows.filter(
      (row, index) => index === 0 || !isEmptyPartialRow(row) || row.explicitPartial === true,
    )
    const orderQty = Math.max(
      0,
      Number(resolveOrderQuantity?.(line) ?? line.quantity) || 0,
    )
    rows.forEach((row, rowIndex) => {
      const sourceIndex = allRows.findIndex((entry) => entry.id === row.id)
      flatRows.push({
        line,
        row,
        rowIndex: sourceIndex >= 0 ? sourceIndex : rowIndex,
        orderQty,
        isFirstOfLine: rowIndex === 0,
        allRows,
      })
    })
  })

  if (!flatRows.length) {
    return (
      <div className="rounded-ds-lg border border-dashed border-ds-border px-4 py-8 text-center text-[13px] font-semibold text-[var(--muted)]">
        Ürün / teslimat satırı yok
      </div>
    )
  }

  const statusLabels = [
    ...(fulfillmentOptions || []).map((option) => option.label || ''),
    ...flatRows.map(({ row }) =>
      row.fulfillmentStatus === 'Kısmi Teslimat'
        ? 'Kısmi Üretim'
        : row.fulfillmentStatus || '',
    ),
  ]
  const statusMinWidth = `${Math.max(10, ...statusLabels.map((label) => String(label).length)) + 2}ch`

  function handleOptionsChange(next) {
    const saved = publishPartDeliverySituations(next)
    onFulfillmentOptionsChange?.(saved)
  }

  function buildRowActions(line, row, rowIndex, orderQty) {
    const items = []

    items.push({
      id: 'edit',
      label: 'Düzenle',
      icon: Pencil,
      tone: 'primary',
      onClick: () => {
        onSelectLine?.(line.id)
        onSelectRow?.(row.id)
        onEditRow?.(line, row.id)
      },
    })

    if (typeof onRemoveQuantityRow === 'function') {
      items.push({
        id: 'remove',
        label: 'Sil',
        icon: Trash2,
        tone: 'danger',
        onClick: () => onRemoveQuantityRow(line, row.id),
      })
    }

    return items
  }

  function handleHeaderAdd() {
    const active =
      lineItems.find((line) => line.id === activeLineId) || lineItems[0]
    if (!active || columnsLocked || active.productionClosed) return
    const rows = getLineQuantityRows(active)
    onAddQuantityRow?.(active, rows[rows.length - 1]?.id)
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-ds-lg border border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent">
      <table className="w-full min-w-[58rem] border-collapse text-left">
        <thead className="bg-transparent">
          <tr>
            <th className={`${PAGE_TABLE_HEADER_CLASS} min-w-[12rem]`}>ÜRÜN AÇIKLAMASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>SİPARİŞ ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>SİPARİŞ NUMARASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>ÜRETİM ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>DEPOYA GÖNDERİLEN</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>KALAN ADET</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>DURUM</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap text-center`}>DEPO</th>
            <th
              className={`${PAGE_TABLE_HEADER_CLASS} w-10 whitespace-nowrap text-center`}
              aria-label="Süreç detayını aç"
            />
            <th
              className={`${PAGE_TABLE_HEADER_CLASS} w-14 whitespace-nowrap text-center`}
              aria-label="Kısmi teslimat ekle"
            >
              <div className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                <button
                  type="button"
                  disabled={columnsLocked}
                  onClick={handleHeaderAdd}
                  className={`glass-sidebar-toggle flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${HEADER_ACTION_GRADIENTS.primary} text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 disabled:opacity-50`}
                  title="Kısmi teslimat ekle"
                  aria-label="Kısmi teslimat ekle"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {flatRows.map(({ line, row, rowIndex, orderQty, isFirstOfLine, allRows }, flatIndex) => {
            const productName = line.product || 'Ürün'
            const description = String(line.description || '').trim()
            const code = row.productionCode || `${productionJobId}-${rowIndex + 1}`
            const statusValue =
              row.fulfillmentStatus ||
              fulfillmentOptions[0]?.label ||
              ''
            const rowDetailExpanded = detailOpen && activeRowId === row.id
            const isLastOfLine =
              flatIndex === flatRows.length - 1 ||
              flatRows[flatIndex + 1]?.line?.id !== line.id
            const lineRows = allRows || getLineQuantityRows(line)
            const remainingQty = getCascadingRowRemaining(lineRows, orderQty, rowIndex)
            const totalProduced = lineRows.reduce(
              (sum, entry) => sum + Math.max(0, Number(entry.producedQuantity) || 0),
              0,
            )
            const producedVariance = totalProduced - orderQty

            return (
              <tr
                key={`${line.id}-${row.id}`}
                className="border-t border-ds-border transition-colors hover:bg-[var(--ds-surface-muted)]/50"
                onClick={() => {
                  onSelectLine?.(line.id)
                  onSelectRow?.(row.id)
                }}
              >
                <td className="h-[var(--ds-row-h,2.75rem)] max-w-[14rem] px-3 py-2 align-middle">
                  {isFirstOfLine ? (
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {description ? (
                        <>
                          <span className="customer-name-primary truncate text-[14px] font-bold leading-tight text-[var(--muted)]">
                            {description}
                          </span>
                          <span className="customer-name-secondary truncate text-[14px] font-normal leading-tight text-[var(--muted)]">
                            {productName}
                          </span>
                        </>
                      ) : (
                        <span className="customer-name-primary truncate text-[14px] font-bold leading-tight text-[var(--muted)]">
                          {productName}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[13px] text-[var(--muted)]/50">↳</span>
                  )}
                </td>

                <td className={QTY_CELL_CLASS}>
                  {isFirstOfLine ? (
                    <span className={`${QTY_BOX_CLASS} text-[var(--muted)]`}>
                      {formatQty(orderQty)}
                    </span>
                  ) : null}
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap text-center">
                  <span className="text-[13px] font-bold tabular-nums text-[var(--muted)]">
                    {code}
                  </span>
                </td>

                <td
                  className={QTY_CELL_CLASS}
                  onClick={(event) => event.stopPropagation()}
                >
                  <NumericInput
                    value={row.producedQuantity}
                    onChange={(value) => {
                      const nextProduced = Math.round(Number(value) || 0)
                      onQuantityRowChange?.(line, row.id, {
                        producedQuantity: nextProduced,
                      })
                    }}
                    readOnly={columnsLocked || line.productionClosed}
                    maxLength={5}
                    className={QTY_INPUT_CLASS}
                  />
                </td>

                <td
                  className={QTY_CELL_CLASS}
                  onClick={(event) => event.stopPropagation()}
                >
                  <NumericInput
                    value={row.deliveredQuantityManual ? row.deliveredQuantity : ''}
                    allowEmpty
                    onChange={(value) => {
                      const nextDelivered = Math.round(Number(value) || 0)
                      onQuantityRowChange?.(line, row.id, {
                        deliveredQuantity: nextDelivered,
                        deliveredQuantityManual: true,
                      })
                    }}
                    readOnly={columnsLocked || line.productionClosed}
                    maxLength={5}
                    className={QTY_INPUT_CLASS}
                  />
                </td>

                <td className={QTY_CELL_CLASS}>
                  {isLastOfLine && producedVariance !== 0 ? (
                    <span
                      className={`${QTY_BOX_CLASS} customer-balance-amount ${
                        producedVariance > 0
                          ? 'customer-balance-positive'
                          : 'customer-balance-negative'
                      }`}
                    >
                      {producedVariance > 0
                        ? `+${formatQty(producedVariance)}`
                        : `-${formatQty(Math.abs(producedVariance))}`}
                    </span>
                  ) : (
                    <span className={`${QTY_BOX_CLASS} text-[var(--muted)]`}>
                      {formatQty(remainingQty)}
                    </span>
                  )}
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap text-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mx-auto shrink-0" style={{ minWidth: statusMinWidth, maxWidth: statusMinWidth }}>
                    <EditableDropdownPill
                      value={statusValue === 'Kısmi Teslimat' ? 'Kısmi Üretim' : statusValue}
                      options={fulfillmentOptions}
                      editable
                      onOptionsChange={handleOptionsChange}
                      disabled={columnsLocked || line.productionClosed}
                      includePlaceholderOption={false}
                      placeholder={fulfillmentOptions.length ? 'Seçiniz' : 'Durum ekle'}
                      buttonClassName="flex !h-8 !min-h-8 w-full items-center justify-between rounded-lg border border-ds-border bg-transparent px-2 text-[11px] font-semibold"
                      openKey={`${fulfillmentOpenKey}-${line.id}-${row.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) =>
                        onQuantityRowChange?.(line, row.id, {
                          fulfillmentStatus: value || fulfillmentOptions[0]?.label || 'Devam Ediyor',
                        })
                      }
                    />
                  </div>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-2 py-2 align-middle whitespace-nowrap text-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  {typeof onSendToDepo === 'function' ? (
                    pendingDepoRowId === row.id ? (
                      <DeleteConfirmPopover
                        title="Depoya gönderilsin mi?"
                        description="Girilen adet depoya aktarılacak."
                        confirmLabel="Evet"
                        cancelLabel="Vazgeç"
                        inline
                        onConfirm={() => {
                          onSendToDepo?.(line, row.id)
                          setPendingDepoRowId(null)
                        }}
                        onCancel={() => setPendingDepoRowId(null)}
                      />
                    ) : row.depoItemId ? (
                      pendingUndoDepoRowId === row.id ? (
                        <DeleteConfirmPopover
                          title="Depo gönderimi geri alınsın mı?"
                          description="Depo kaydı kaldırılır; satır yeniden düzenlenebilir."
                          confirmLabel="Geri al"
                          cancelLabel="Vazgeç"
                          inline
                          onConfirm={() => {
                            onUndoSendToDepo?.(line, row.id)
                            setPendingUndoDepoRowId(null)
                          }}
                          onCancel={() => setPendingUndoDepoRowId(null)}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 text-[11px] font-bold text-emerald-700">
                            <Package className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                            Depoya Gönderildi
                          </span>
                          {typeof onUndoSendToDepo === 'function' ? (
                            <button
                              type="button"
                              disabled={columnsLocked}
                              onClick={() => setPendingUndoDepoRowId(row.id)}
                              className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-50"
                              title="Depo gönderimini geri al"
                              aria-label="Depo gönderimini geri al"
                            >
                              <Undo2 className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                          ) : null}
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={columnsLocked || line.productionClosed}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-ds-border bg-transparent px-2 text-[11px] font-semibold text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700 disabled:opacity-50"
                        title="Depoya gönder"
                        aria-label="Depoya gönder"
                        onClick={() => {
                          const depoQty = resolveDepoSendQuantity(row, rowIndex, line, orderQty)
                          if (columnsLocked || line.productionClosed || !(depoQty > 0)) {
                            window.alert('Depoya göndermek için depoya gönderilen adedi girin.')
                            return
                          }
                          setPendingDepoRowId(row.id)
                        }}
                      >
                        <Package className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                        Depoya gönder
                      </button>
                    )
                  ) : null}
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] w-10 px-1 text-center align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="inline-flex h-[var(--ds-control-h,3rem)] w-8 items-center justify-center">
                    <button
                      type="button"
                      className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl"
                      aria-label={
                        rowDetailExpanded ? 'Süreç detayını kapat' : 'Süreç detayını aç'
                      }
                      aria-expanded={rowDetailExpanded}
                      title={rowDetailExpanded ? 'Süreç detayını kapat' : 'Süreç detayını aç'}
                      onClick={() => onToggleDetail?.(line.id, row.id)}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          rowDetailExpanded ? 'rotate-180' : ''
                        }`}
                        strokeWidth={2.25}
                      />
                    </button>
                  </div>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] w-14 px-2 text-center align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                    <MoreMenu items={buildRowActions(line, row, rowIndex, orderQty)} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { isEmptyPartialRow }
