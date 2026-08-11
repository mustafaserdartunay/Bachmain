import { useState } from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'
import { ListInlineActionConfirm } from '../Common/ListDeleteConfirmPanel'
import EditableDropdownPill from '../EditableDropdownPill'
import NumericInput from '../Products/NumericInput'
import { getLineQuantityRows } from '../../utils/productionLineItems'
import { formatQty, resolveDepoSendQuantity } from '../../utils/productionQuantityMetrics'
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

/**
 * Compact partial-delivery panel for the expanded production job header.
 */
export default function ProductionPartialDeliveryTable({
  lineItem,
  productionJobId,
  fulfillmentOptions,
  fulfillmentOpenKey,
  activeMenu,
  setActiveMenu,
  columnsLocked,
  orderLineQuantity,
  onQuantityRowChange,
  onAddQuantityRow,
  onRemoveQuantityRow,
  onSendToDepo,
  onUndoSendToDepo,
  compact = false,
}) {
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)
  const quantityRows = getLineQuantityRows(lineItem)

  if (!quantityRows.length) return null

  if (compact) {
    return (
      <div className="min-w-0 overflow-x-auto rounded-ds-lg border border-ds-border">
        <table className="w-max max-w-full border-collapse text-left">
          <thead className="bg-[var(--ds-surface-muted)]">
            <tr>
              <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>NO</th>
              <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>ADET</th>
              <th className={`${PAGE_TABLE_HEADER_CLASS} whitespace-nowrap`}>DURUM</th>
              <th className={`${PAGE_TABLE_HEADER_CLASS} w-[1%] whitespace-nowrap text-right`}>
                <span className="inline-flex items-center gap-1">
                  İŞLEM
                  {typeof onAddQuantityRow === 'function' && !columnsLocked ? (
                    <button
                      type="button"
                      onClick={() => onAddQuantityRow(quantityRows[0]?.id)}
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
            {quantityRows.map((row, rowIndex) => {
              const code = row.productionCode || `${productionJobId}-${rowIndex + 1}`
              const depoQty = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
              return (
                <tr key={row.id} className="border-t border-ds-border">
                  <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap">
                    <span className="customer-name-primary text-[13px] font-bold tabular-nums text-[var(--muted)]">
                      {code}
                    </span>
                  </td>
                  <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap">
                    <NumericInput
                      value={row.deliveredQuantity}
                      onChange={(value) =>
                        onQuantityRowChange?.(row.id, {
                          deliveredQuantity: Math.round(Number(value) || 0),
                        })
                      }
                      readOnly={columnsLocked}
                      className="form-input h-7 w-14 text-[12px] font-bold tabular-nums"
                    />
                  </td>
                  <td className="h-[var(--ds-row-h,2.75rem)] px-3 py-1 whitespace-nowrap">
                    <EditableDropdownPill
                      value={
                        row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'
                      }
                      options={fulfillmentOptions}
                      editable={false}
                      disabled={columnsLocked}
                      includePlaceholderOption={false}
                      buttonClassName="flex h-7 min-w-[6.5rem] items-center justify-between rounded-lg border border-ds-border bg-white px-2 text-[11px] font-semibold"
                      openKey={`${fulfillmentOpenKey}-${row.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) =>
                        onQuantityRowChange?.(row.id, {
                          fulfillmentStatus: value || 'Devam Ediyor',
                        })
                      }
                    />
                  </td>
                  <td className="h-[var(--ds-row-h,2.75rem)] px-2 py-1 whitespace-nowrap text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      {typeof onSendToDepo === 'function' ? (
                        pendingDepoRowId === row.id ? (
                          <ListInlineActionConfirm
                            message="Emin misin?"
                            tone="orange"
                            onConfirm={() => {
                              onSendToDepo(row.id)
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
                            disabled={columnsLocked || !(depoQty > 0)}
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
                            onUndoSendToDepo?.(row.id)
                            setPendingUndoDepoRowId(null)
                          }}
                          onCancel={() => setPendingUndoDepoRowId(null)}
                        />
                      ) : null}
                      {quantityRows.length > 1 && typeof onRemoveQuantityRow === 'function' ? (
                        <button
                          type="button"
                          onClick={() => onRemoveQuantityRow(row.id)}
                          className="rounded p-1 text-red-500"
                          title="Sil"
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[13px] font-black uppercase tracking-wide text-[var(--muted,#64748B)]">
          Kısmi Teslimatlar
        </h4>
        {typeof onAddQuantityRow === 'function' && !columnsLocked ? (
          <button
            type="button"
            onClick={() => onAddQuantityRow(quantityRows[0]?.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5" />
            Kısmi Teslimat Ekle
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-[18px] border border-[var(--border,#E2E8F0)] bg-white/70 shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
        <table className="min-w-full text-left text-[12px]">
          <thead className="bg-[var(--surface-raised,#F8FAFC)] text-[11px] font-black uppercase tracking-wide text-[var(--muted,#94A3B8)]">
            <tr>
              <th className="px-3 py-2.5">Teslimat No</th>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5">Adet</th>
              <th className="px-3 py-2.5">Açıklama</th>
              <th className="px-3 py-2.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border,#E2E8F0)] bg-white/80">
            {quantityRows.map((row, rowIndex) => {
              const code = row.productionCode || `${productionJobId}-T${rowIndex + 1}`
              const depoQty = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
              const dateValue = row.deliveredAt || row.updatedAt || row.createdAt || row.depoSentAt
              const note = row.note || row.description || row.invoiceNo || '—'
              return (
                <tr key={row.id} className="transition hover:bg-blue-50/40">
                  <td className="px-3 py-2.5">
                    <span className="font-bold tabular-nums text-[var(--bach-navy,#1E3A8A)]">
                      {code}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[var(--ink,#0F172A)]">
                    {formatShortDate(dateValue)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <NumericInput
                        value={row.deliveredQuantity}
                        onChange={(value) =>
                          onQuantityRowChange?.(row.id, {
                            deliveredQuantity: Math.round(Number(value) || 0),
                          })
                        }
                        readOnly={columnsLocked}
                        className="form-input h-8 w-20 text-[12px] font-bold tabular-nums"
                      />
                      <span className="text-[11px] font-semibold text-[var(--muted)]">
                        / {formatQty(row.producedQuantity)} üretilen
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="min-w-[140px]">
                      <EditableDropdownPill
                        value={
                          row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'
                        }
                        options={fulfillmentOptions}
                        editable={false}
                        disabled={columnsLocked}
                        includePlaceholderOption={false}
                        buttonClassName="flex h-8 min-w-[120px] items-center justify-between rounded-lg border border-[var(--border)] bg-white px-2 text-[12px] font-semibold"
                        openKey={`${fulfillmentOpenKey}-${row.id}`}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onChange={(value) =>
                          onQuantityRowChange?.(row.id, {
                            fulfillmentStatus: value || 'Devam Ediyor',
                          })
                        }
                      />
                      <p
                        className="mt-1 truncate text-[11px] font-medium text-[var(--muted)]"
                        title={note}
                      >
                        {note}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {typeof onSendToDepo === 'function' ? (
                        pendingDepoRowId === row.id ? (
                          <ListInlineActionConfirm
                            message="Emin misin?"
                            tone="orange"
                            onConfirm={() => {
                              onSendToDepo(row.id)
                              setPendingDepoRowId(null)
                            }}
                            onCancel={() => setPendingDepoRowId(null)}
                          />
                        ) : row.depoItemId ? (
                          <button
                            type="button"
                            onClick={() => setPendingUndoDepoRowId(row.id)}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600"
                          >
                            Geri Al
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={columnsLocked || !(depoQty > 0)}
                            onClick={() => setPendingDepoRowId(row.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-600 disabled:opacity-40"
                          >
                            <Package className="h-3 w-3" />
                            Teslim Et
                          </button>
                        )
                      ) : null}
                      {pendingUndoDepoRowId === row.id ? (
                        <ListInlineActionConfirm
                          message="Emin misin?"
                          tone="orange"
                          onConfirm={() => {
                            onUndoSendToDepo?.(row.id)
                            setPendingUndoDepoRowId(null)
                          }}
                          onCancel={() => setPendingUndoDepoRowId(null)}
                        />
                      ) : null}
                      {quantityRows.length > 1 && typeof onRemoveQuantityRow === 'function' ? (
                        <button
                          type="button"
                          onClick={() => onRemoveQuantityRow(row.id)}
                          className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500"
                          title="Sil"
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
    </div>
  )
}
