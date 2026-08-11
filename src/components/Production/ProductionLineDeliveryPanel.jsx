import { useState } from 'react'
import {
  FileText,
  MapPin,
  Package,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react'
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
 * Single panel: product + partial delivery rows with per-row sevk fişi / harita / fatura.
 */
export default function ProductionLineDeliveryPanel({
  lineItems = [],
  activeLineId,
  onSelectLine,
  order,
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

  return (
    <div className="min-w-0 overflow-x-auto rounded-ds-lg border border-ds-border">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <thead className="bg-[var(--ds-surface-muted)]">
          <tr>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>ÜRÜN AÇIKLAMASI</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SİPARİŞ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>NO</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>KISMİ ADET</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>DURUM</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>SEVK FİŞİ</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>HARİTA</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>FATURA</th>
            <th className={`${PAGE_TABLE_HEADER_CLASS} w-[1%] whitespace-nowrap text-right`}>
              <span className="inline-flex items-center gap-1">
                İŞLEM
                {!columnsLocked && typeof onAddQuantityRow === 'function' && activeLineId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const active = lineItems.find((line) => line.id === activeLineId)
                      if (active) onAddQuantityRow(active, getLineQuantityRows(active)[0]?.id)
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[var(--accent,#2563EB)] hover:bg-white"
                    title="Kısmi teslimat ekle"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {flatRows.map(({ line, row, rowIndex, orderQty, isFirstOfLine, rowSpan }) => {
            const isActive = line.id === activeLineId
            const productName = line.product || 'Ürün'
            const description = String(line.description || '').trim()
            const code = row.productionCode || `${productionJobId}-${rowIndex + 1}`
            const depoQty = resolveDepoSendQuantity(row, rowIndex, line, orderQty)

            return (
              <tr
                key={`${line.id}-${row.id}`}
                className={`border-t border-ds-border transition-colors hover:bg-[var(--ds-surface-muted)] ${
                  isActive ? 'bg-[var(--ds-surface-muted)]' : ''
                }`}
                onClick={() => onSelectLine?.(line.id)}
              >
                {isFirstOfLine ? (
                  <td
                    rowSpan={rowSpan}
                    className="h-[var(--ds-row-h,2.75rem)] max-w-[14rem] px-3 py-1.5 align-top"
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
                    className="h-[var(--ds-row-h,2.75rem)] px-3 py-1.5 align-top whitespace-nowrap"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="customer-name-primary tabular-nums text-[14px] font-bold text-[var(--muted)]">
                        {formatQty(orderQty)}
                      </span>
                      <span className="customer-name-secondary text-[14px] font-normal text-[var(--muted)]">
                        adet
                      </span>
                    </span>
                  </td>
                ) : null}

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap">
                  <span className="text-[13px] font-bold tabular-nums text-[var(--muted)]">
                    {code}
                  </span>
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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

                <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <EditableDropdownPill
                    value={row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'}
                    options={fulfillmentOptions}
                    editable={false}
                    disabled={columnsLocked || line.productionClosed}
                    includePlaceholderOption={false}
                    buttonClassName="flex h-7 min-w-[7rem] items-center justify-between rounded-lg border border-ds-border bg-white px-2 text-[11px] font-semibold"
                    openKey={`${fulfillmentOpenKey}-${line.id}-${row.id}`}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) =>
                      onQuantityRowChange?.(line, row.id, {
                        fulfillmentStatus: value || 'Devam Ediyor',
                      })
                    }
                  />
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-2 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={line.productionClosed}
                    onClick={() => onIssueWaybill?.(line, row.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                      row.waybillNo
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-orange-600 hover:bg-orange-50'
                    } disabled:opacity-40`}
                    title={row.waybillNo ? `Sevk fişi ${row.waybillNo}` : 'Sevk fişi kes'}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {row.waybillNo || 'Kes'}
                  </button>
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-2 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={line.productionClosed}
                    onClick={() => onOpenMapLink?.(line, row.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                      row.trackingToken
                        ? 'text-blue-700 hover:bg-blue-50'
                        : 'text-[var(--muted)] hover:bg-[var(--ds-surface-muted)]'
                    } disabled:opacity-40`}
                    title={row.trackingToken ? 'Sevk harita linkini aç' : 'Sevk harita linki oluştur'}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {row.trackingToken ? 'Aç' : 'Link'}
                  </button>
                </td>

                <td className="h-[var(--ds-row-h,2.75rem)] px-2 py-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={line.productionClosed}
                    onClick={() => onIssueInvoice?.(line, row.id)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                      row.invoiceNo
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-[var(--bach-navy,#1E3A8A)] hover:bg-blue-50'
                    } disabled:opacity-40`}
                    title={row.invoiceNo ? `Fatura ${row.invoiceNo}` : 'Fatura kes'}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    {row.invoiceNo || 'Kes'}
                  </button>
                </td>

                <td
                  className="h-[var(--ds-row-h,2.75rem)] px-2 py-1 whitespace-nowrap text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    {typeof onSendToDepo === 'function' ? (
                      pendingDepoRowId === row.id ? (
                        <ListInlineActionConfirm
                          message="Emin misin?"
                          tone="orange"
                          onConfirm={() => {
                            onSendToDepo(line, row.id)
                            setPendingDepoRowId(null)
                          }}
                          onCancel={() => setPendingDepoRowId(null)}
                        />
                      ) : row.depoItemId ? (
                        <button
                          type="button"
                          onClick={() => setPendingUndoDepoRowId(row.id)}
                          className="rounded-lg px-1.5 py-1 text-[11px] font-bold text-orange-600"
                        >
                          Geri Al
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={columnsLocked || line.productionClosed || !(depoQty > 0)}
                          onClick={() => setPendingDepoRowId(row.id)}
                          className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[11px] font-bold text-orange-600 disabled:opacity-40"
                          title="Teslim Et"
                        >
                          <Package className="h-3 w-3" />
                          Teslim
                        </button>
                      )
                    ) : null}
                    {pendingUndoDepoRowId === row.id ? (
                      <ListInlineActionConfirm
                        message="Emin misin?"
                        tone="orange"
                        onConfirm={() => {
                          onUndoSendToDepo?.(line, row.id)
                          setPendingUndoDepoRowId(null)
                        }}
                        onCancel={() => setPendingUndoDepoRowId(null)}
                      />
                    ) : null}
                    {getLineQuantityRows(line).length > 1 && typeof onRemoveQuantityRow === 'function' ? (
                      <button
                        type="button"
                        onClick={() => onRemoveQuantityRow(line, row.id)}
                        className="rounded p-1 text-red-500"
                        title="Kısmi teslimatı sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    ) : null}
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
