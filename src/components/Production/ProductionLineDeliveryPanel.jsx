import { useState } from 'react'
import {
  FileText,
  MapPin,
  Package,
  Plus,
  Receipt,
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
import { PAGE_TABLE_HEADER_CLASS } from '../../utils/dashboardDesign'

/**
 * Unified product + partial-delivery table with row MoreMenu actions.
 */
export default function ProductionLineDeliveryPanel({
  lineItems = [],
  activeLineId,
  activeRowId,
  onSelectLine,
  onSelectRow,
  productionJobId,
  fulfillmentOptions,
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
  onIssueWaybill,
  onOpenMapLink,
  onIssueInvoice,
}) {
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)

  const flatRows = []
  lineItems.forEach((line) => {
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
        rowSpan: rows.length,
      })
    })
  })

  if (!flatRows.length) {
    return (
      <div className="rounded-ds-lg border border-dashed border-ds-border px-4 py-6 text-center text-[13px] font-semibold text-[var(--muted)]">
        Ürün / teslimat satırı yok
      </div>
    )
  }

  function buildRowActions(line, row, rowIndex, orderQty) {
    const depoQty = resolveDepoSendQuantity(row, rowIndex, line, orderQty)
    const locked = columnsLocked || line.productionClosed
    const items = [
      {
        id: 'waybill',
        label: row.waybillNo ? `Sevk fişi (${row.waybillNo})` : 'Sevk fişi kes',
        icon: FileText,
        onClick: () => onIssueWaybill?.(line, row.id),
      },
      {
        id: 'map',
        label: row.trackingToken ? 'Sevk harita linkini aç' : 'Sevk harita linki oluştur',
        icon: MapPin,
        onClick: () => onOpenMapLink?.(line, row.id),
      },
      {
        id: 'invoice',
        label: row.invoiceNo ? `Fatura (${row.invoiceNo})` : 'Fatura kes',
        icon: Receipt,
        onClick: () => onIssueInvoice?.(line, row.id),
      },
      { type: 'separator', id: 'sep-1' },
    ]

    if (typeof onSendToDepo === 'function') {
      if (row.depoItemId) {
        items.push({
          id: 'undo-depo',
          label: 'Teslimatı geri al',
          icon: Package,
          onClick: () => setPendingUndoDepoRowId(row.id),
        })
      } else {
        items.push({
          id: 'depo',
          label: 'Teslim et',
          icon: Package,
          onClick: () => {
            if (locked || !(depoQty > 0)) {
              window.alert('Teslim etmek için teslimat adedi girin.')
              return
            }
            setPendingDepoRowId(row.id)
          },
        })
      }
    }

    if (typeof onAddQuantityRow === 'function' && !locked) {
      items.push({
        id: 'add-partial',
        label: 'Kısmi teslimat ekle',
        icon: Plus,
        onClick: () => onAddQuantityRow(line, row.id),
      })
    }

    if (getLineQuantityRows(line).length > 1 && typeof onRemoveQuantityRow === 'function') {
      items.push({
        id: 'remove',
        label: 'Satırı sil',
        icon: Trash2,
        tone: 'danger',
        onClick: () => onRemoveQuantityRow(line, row.id),
      })
    }

    return items
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-ds-lg border border-ds-border">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead className="bg-[var(--ds-surface-muted)]">
          <tr>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>ÜRÜN AÇIKLAMASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SİPARİŞ ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SİPARİŞ NUMARASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>ÜRETİM ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>TESLİMAT ADEDİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>DURUM</th>
            <th
              className={`${PAGE_TABLE_HEADER_CLASS} w-14 whitespace-nowrap text-center`}
              aria-label="İşlemler"
            >
              <span className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                ···
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {flatRows.map(({ line, row, rowIndex, orderQty, isFirstOfLine, rowSpan }) => {
            const isActiveRow = row.id === activeRowId || (!activeRowId && line.id === activeLineId && isFirstOfLine)
            const productName = line.product || 'Ürün'
            const description = String(line.description || '').trim()
            const code = row.productionCode || `${productionJobId}-${rowIndex + 1}`
            const statusValue =
              row.fulfillmentStatus &&
              fulfillmentOptions.some((option) => option.label === row.fulfillmentStatus)
                ? row.fulfillmentStatus
                : fulfillmentOptions[0]?.label || ''

            return (
              <tr
                key={`${line.id}-${row.id}`}
                className={`border-t border-ds-border transition-colors hover:bg-[var(--ds-surface-muted)] ${
                  isActiveRow ? 'bg-[var(--ds-surface-muted)]' : ''
                }`}
                onClick={() => {
                  onSelectLine?.(line.id)
                  onSelectRow?.(row.id)
                }}
              >
                {isFirstOfLine ? (
                  <td
                    rowSpan={rowSpan}
                    className="h-[var(--ds-row-h,2.75rem)] max-w-[14rem] px-3 py-1.5 align-middle"
                  >
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
                  </td>
                ) : null}

                {isFirstOfLine ? (
                  <td
                    rowSpan={rowSpan}
                    className="h-[var(--ds-row-h,2.75rem)] px-3 py-1.5 align-middle whitespace-nowrap"
                  >
                    <span className="customer-name-primary tabular-nums text-[14px] font-bold text-[var(--muted)]">
                      {formatQty(orderQty)}
                    </span>
                  </td>
                ) : null}

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap">
                  <span className="text-[13px] font-bold tabular-nums text-[var(--muted)]">
                    {code}
                  </span>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap"
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
                    className="form-input h-7 w-14 text-[12px] font-bold tabular-nums"
                  />
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap"
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
                    className="form-input h-7 w-14 text-[12px] font-bold tabular-nums"
                  />
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap"
                  onClick={(event) => event.stopPropagation()}
                >
                  <EditableDropdownPill
                    value={statusValue}
                    options={fulfillmentOptions}
                    editable={false}
                    disabled={columnsLocked || line.productionClosed || !fulfillmentOptions.length}
                    includePlaceholderOption={false}
                    placeholder={fulfillmentOptions.length ? 'Seçiniz' : 'Durum yok'}
                    buttonClassName="flex h-7 min-w-[7rem] items-center justify-between rounded-lg border border-ds-border bg-white px-2 text-[11px] font-semibold"
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
