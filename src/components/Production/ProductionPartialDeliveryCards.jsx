import { useState } from 'react'
import {
  FileText,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Printer,
  Undo2,
} from 'lucide-react'
import EditableDropdownPill from '../EditableDropdownPill'
import { ListInlineActionConfirm, DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import NumericInput from '../Products/NumericInput'
import {
  formatQty,
  getFirstRowSplitBaseRemaining,
  getQuantityRowOrdered,
  getSplitRowKalanVariance,
  resolveDepoSendQuantity,
} from '../../utils/productionQuantityMetrics'
import { getLineQuantityRows } from '../../utils/productionLineItems'

const pillClass =
  'flex h-9 w-full min-w-0 items-center justify-between gap-1 rounded-xl border border-[var(--border)] bg-white px-3 text-[13px] font-semibold text-[var(--ink)]'

export default function ProductionPartialDeliveryCards({
  lineItem,
  productionJobId = '',
  fulfillmentOptions = [],
  fulfillmentOpenKey,
  activeMenu,
  setActiveMenu,
  onQuantityRowChange,
  onAddQuantityRow,
  onRemoveQuantityRow,
  onSendToDepo,
  onUndoSendToDepo,
  orderLineQuantity = null,
  columnsLocked = false,
}) {
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState(null)

  const quantityRows = getLineQuantityRows(lineItem)
  const splitBaseRemaining = getFirstRowSplitBaseRemaining(lineItem, orderLineQuantity)

  if (!quantityRows.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[14px] font-bold text-[var(--ink)]">Kısmi Teslimatlar</h4>
        {typeof onAddQuantityRow === 'function' && !columnsLocked ? (
          <button
            type="button"
            onClick={() => onAddQuantityRow(quantityRows[0]?.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--bach-sky,#79a6d2)]/30 bg-[rgba(121,166,210,0.12)] px-3 py-1.5 text-[12px] font-bold text-[var(--bach-navy,#203375)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Kısmi Teslimat Ekle
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {quantityRows.map((row, rowIndex) => {
          const productionCode = row.productionCode || (productionJobId ? `${productionJobId}-T${rowIndex + 1}` : `T${rowIndex + 1}`)
          const ordered = getQuantityRowOrdered(row, lineItem, rowIndex)
          const delivered = Math.max(0, Number(row.deliveredQuantity) || 0)
          const produced = Math.max(0, Number(row.producedQuantity) || 0)
          const isSplit = rowIndex > 0
          const splitKalan = isSplit
            ? getSplitRowKalanVariance(splitBaseRemaining, row.deliveredQuantity)
            : null
          const depoQty = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
          const pallet = Math.max(0, Number(row.palletCount ?? row.palet ?? lineItem.palletCount) || 0)
          const carton = Math.max(0, Number(row.cartonCount ?? row.koli ?? lineItem.cartonCount) || 0)

          return (
            <article
              key={row.id}
              className="rounded-2xl border border-[var(--border)] bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-wide text-[var(--muted)]">Teslim No</p>
                  <p className="text-[15px] font-bold tabular-nums text-[var(--bach-navy,#203375)]">{productionCode}</p>
                </div>
                <span className="rounded-full bg-orange-500/12 px-2.5 py-1 text-[10px] font-black text-orange-600">
                  {row.fulfillmentStatus || 'Devam Ediyor'}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase text-[var(--muted)]">Durum</p>
                  <EditableDropdownPill
                    value={row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'}
                    options={fulfillmentOptions}
                    editable={false}
                    disabled={columnsLocked}
                    includePlaceholderOption={false}
                    buttonClassName={pillClass}
                    openKey={`${fulfillmentOpenKey}-${row.id}`}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => onQuantityRowChange?.(row.id, { fulfillmentStatus: value || 'Devam Ediyor' })}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase text-[var(--muted)]">Adet</p>
                  <NumericInput
                    value={row.deliveredQuantity}
                    onChange={(value) => onQuantityRowChange?.(row.id, { deliveredQuantity: Math.round(Number(value) || 0) })}
                    readOnly={columnsLocked}
                    className="form-input h-9 text-[13px] font-bold tabular-nums"
                    placeholder="0"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase text-[var(--muted)]">Üretilen</p>
                  <NumericInput
                    value={row.producedQuantity}
                    onChange={(value) => onQuantityRowChange?.(row.id, { producedQuantity: Math.round(Number(value) || 0) })}
                    readOnly={columnsLocked}
                    className="form-input h-9 text-[13px] font-bold tabular-nums"
                    placeholder="0"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase text-[var(--muted)]">
                    {isSplit ? (splitKalan?.isExcess ? 'Fazla' : 'Kalan') : 'Sipariş'}
                  </p>
                  <div className="flex h-9 items-center rounded-xl border border-[var(--border)] bg-[rgba(248,250,252,0.9)] px-3 text-[13px] font-bold tabular-nums text-[var(--ink)]">
                    {isSplit
                      ? formatQty(splitKalan?.value || 0)
                      : formatQty(Math.max(0, Number(orderLineQuantity) || ordered))}
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-3 text-[12px] font-semibold text-[var(--muted)]">
                <span>Palet: <strong className="text-[var(--ink)]">{formatQty(pallet)}</strong></span>
                <span>Koli: <strong className="text-[var(--ink)]">{formatQty(carton)}</strong></span>
                <span>Teslim: <strong className="text-emerald-600">{formatQty(delivered)}</strong></span>
                <span>Üretim: <strong className="text-blue-600">{formatQty(produced)}</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
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
                    pendingUndoDepoRowId === row.id ? (
                      <ListInlineActionConfirm
                        message="Emin misin?"
                        tone="orange"
                        onConfirm={() => {
                          onUndoSendToDepo?.(row.id)
                          setPendingUndoDepoRowId(null)
                        }}
                        onCancel={() => setPendingUndoDepoRowId(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingUndoDepoRowId(row.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 px-2.5 text-[12px] font-bold text-orange-600"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Geri Al
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={columnsLocked || !(depoQty > 0)}
                      onClick={() => setPendingDepoRowId(row.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 px-2.5 text-[12px] font-bold text-orange-600 disabled:opacity-40"
                    >
                      <Package className="h-3.5 w-3.5" />
                      Teslim Et
                    </button>
                  )
                ) : null}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                  title="Yazdır"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
                  title="PDF"
                  onClick={() => window.print()}
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${productionCode} teslimat`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--muted)] hover:text-emerald-600"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(productionCode)}&body=${encodeURIComponent(`${productionCode} teslimat detayı`)}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--muted)] hover:text-blue-600"
                  title="Mail"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>

                {quantityRows.length > 1 && typeof onRemoveQuantityRow === 'function' ? (
                  <DeleteTrashButton
                    pending={pendingDeleteRowId === row.id}
                    onClick={() => setPendingDeleteRowId(row.id)}
                    onConfirm={() => {
                      onRemoveQuantityRow(row.id)
                      setPendingDeleteRowId(null)
                    }}
                    onCancel={() => setPendingDeleteRowId(null)}
                    title="Teslimat silinsin mi?"
                    description="Bu kısmi teslimat satırı kaldırılacak."
                    buttonClassName="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-500"
                    popoverClassName="absolute right-0 top-10 z-40"
                  />
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
