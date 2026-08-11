import { useState } from 'react'
import {
  ChevronDown,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { ListInlineActionConfirm } from '../Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../EditableDropdownPill'
import NumericInput from '../Products/NumericInput'
import { getLineQuantityRows } from '../../utils/productionLineItems'
import {
  formatQty,
  resolveDepoSendQuantity,
} from '../../utils/productionQuantityMetrics'
import { publishPartDeliverySituations } from '../../utils/productionFulfillmentOptions'
import { PAGE_TABLE_HEADER_CLASS } from '../../utils/dashboardDesign'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'

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
    // Always show every quantity row — + creates 20000-2, 20000-3, …
    const rows = getLineQuantityRows(line)
    const orderQty = Math.max(
      0,
      Number(resolveOrderQuantity?.(line) ?? line.quantity) || 0,
    )
    rows.forEach((row, rowIndex) => {
      flatRows.push({
        line,
        row,
        rowIndex,
        orderQty,
        isFirstOfLine: rowIndex === 0,
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

  function handleOptionsChange(next) {
    const saved = publishPartDeliverySituations(next)
    onFulfillmentOptionsChange?.(saved)
  }

  function buildRowActions(line, row, rowIndex, orderQty) {
    const depoQty = resolveDepoSendQuantity(row, rowIndex, line, orderQty)
    const locked = columnsLocked || line.productionClosed
    const items = []

    if (typeof onSendToDepo === 'function') {
      if (row.depoItemId) {
        items.push({
          id: 'undo-depo',
          label: 'Depo gönderimini geri al',
          icon: Package,
          tone: 'orange',
          onClick: () => setPendingUndoDepoRowId(row.id),
        })
      } else {
        items.push({
          id: 'depo',
          label: 'Ayarlarla depoya gönder',
          icon: Package,
          tone: 'success',
          onClick: () => {
            if (locked || !(depoQty > 0)) {
              window.alert('Depoya göndermek için teslimat adedi girin.')
              return
            }
            setPendingDepoRowId(row.id)
          },
        })
      }
    }

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
    // Append after the last row so codes continue 20000-1 → 20000-2 → …
    onAddQuantityRow?.(active, rows[rows.length - 1]?.id)
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-ds-lg border border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-transparent">
      <table className="w-full min-w-[58rem] border-collapse text-left">
        <thead className="bg-transparent">
          <tr>
            <th className={`${PAGE_TABLE_HEADER_CLASS} min-w-[12rem]`}>ÜRÜN AÇIKLAMASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SİPARİŞ ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SİPARİŞ NUMARASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>ÜRETİM ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>TESLİMAT ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>KALAN ADET</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>DURUM</th>
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
          {flatRows.map(({ line, row, rowIndex, orderQty, isFirstOfLine }) => {
            const productName = line.product || 'Ürün'
            const description = String(line.description || '').trim()
            const code = row.productionCode || `${productionJobId}-${rowIndex + 1}`
            // Keep the stored status even if options list drifted — never silently swap.
            const statusValue =
              row.fulfillmentStatus ||
              fulfillmentOptions[0]?.label ||
              ''
            const rowDetailExpanded = detailOpen && activeRowId === row.id
            const lineDeliveredTotal = getLineQuantityRows(line).reduce(
              (sum, entry) => sum + Math.max(0, Number(entry.deliveredQuantity) || 0),
              0,
            )
            const remainingQty = Math.max(0, orderQty - lineDeliveredTotal)

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

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap">
                  {isFirstOfLine ? (
                    <span className="customer-name-primary tabular-nums text-[14px] font-bold text-[var(--muted)]">
                      {formatQty(orderQty)}
                    </span>
                  ) : null}
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap">
                  <span className="text-[13px] font-bold tabular-nums text-[var(--muted)]">
                    {code}
                  </span>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap"
                  onClick={(event) => event.stopPropagation()}
                >
                  <NumericInput
                    value={row.producedQuantity}
                    onChange={(value) =>
                      onQuantityRowChange?.(line, row.id, {
                        producedQuantity: Math.round(Number(value) || 0),
                      })
                    }
                    readOnly={columnsLocked || line.productionClosed}
                    className="!h-8 !min-h-8 w-24 py-0 text-[12px] font-bold tabular-nums"
                  />
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap"
                  onClick={(event) => event.stopPropagation()}
                >
                  <NumericInput
                    value={row.deliveredQuantity}
                    onChange={(value) =>
                      onQuantityRowChange?.(line, row.id, {
                        deliveredQuantity: Math.round(Number(value) || 0),
                      })
                    }
                    readOnly={columnsLocked || line.productionClosed}
                    className="!h-8 !min-h-8 w-24 py-0 text-[12px] font-bold tabular-nums"
                  />
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap">
                  <span className="inline-flex h-8 min-h-8 w-24 items-center tabular-nums text-[12px] font-bold text-[var(--muted)]">
                    {formatQty(remainingQty)}
                  </span>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-2 align-middle whitespace-nowrap"
                  onClick={(event) => event.stopPropagation()}
                >
                  <EditableDropdownPill
                    value={statusValue}
                    options={fulfillmentOptions}
                    editable
                    onOptionsChange={handleOptionsChange}
                    disabled={columnsLocked || line.productionClosed}
                    includePlaceholderOption={false}
                    placeholder={fulfillmentOptions.length ? 'Seçiniz' : 'Durum ekle'}
                    buttonClassName="flex !h-8 !min-h-8 min-w-[7.5rem] items-center justify-between rounded-lg border border-ds-border bg-transparent px-2 text-[11px] font-semibold"
                    openKey={`${fulfillmentOpenKey}-${line.id}-${row.id}`}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) =>
                      onQuantityRowChange?.(line, row.id, {
                        fulfillmentStatus: value || fulfillmentOptions[0]?.label || 'Devam Ediyor',
                      })
                    }
                  />
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
                  {pendingDepoRowId === row.id ? (
                    <ListInlineActionConfirm
                      message="Emin misin?"
                      tone="orange"
                      onConfirm={() => {
                        onSendToDepo?.(line, row.id)
                        setPendingDepoRowId(null)
                      }}
                      onCancel={() => setPendingDepoRowId(null)}
                    />
                  ) : pendingUndoDepoRowId === row.id ? (
                    <ListInlineActionConfirm
                      message="Emin misin?"
                      tone="orange"
                      onConfirm={() => {
                        onUndoSendToDepo?.(line, row.id)
                        setPendingUndoDepoRowId(null)
                      }}
                      onCancel={() => setPendingUndoDepoRowId(null)}
                    />
                  ) : (
                    <div className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                      <MoreMenu items={buildRowActions(line, row, rowIndex, orderQty)} />
                    </div>
                  )}
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
