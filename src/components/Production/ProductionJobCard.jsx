import { useState } from 'react'
import {
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  Plus,
  Trash2,
} from 'lucide-react'
import { MoreMenu } from '@bachmain/ui'
import { DeleteTrashButton, ListInlineActionConfirm } from '../Common/ListDeleteConfirmPanel'
import ProductionProcessDotRail from './ProductionProcessDotRail'
import ProductionStageMiniCards from './ProductionStageMiniCards'
import ProductionActivityTimeline from './ProductionActivityTimeline'
import { getListCustomerDisplay } from '../../data/customerProfiles'
import {
  ensureLineItems,
  getLineQuantityRows,
  resolveLineItemOrderQuantity,
  resolveOrderForProductionJob,
} from '../../utils/productionLineItems'
import {
  formatQty,
  getJobQuantityMetrics,
  getQuantityRowMinimalSteps,
  resolveDepoSendQuantity,
} from '../../utils/productionQuantityMetrics'
import { getProductionJobTimelineDates } from '../../utils/productionJobTimeline'
import EditableDropdownPill from '../EditableDropdownPill'
import NumericInput from '../Products/NumericInput'

function formatShortDate(value) {
  if (!value) return '—'
  const raw = String(value).trim()
  if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) return raw.slice(0, 10)
  const [datePart] = raw.split(/[T ]/)
  const [year, month, day] = String(datePart).split('-')
  if (year && month && day) return `${day}.${month}.${year}`
  return raw.slice(0, 10) || '—'
}

function resolveStatusBadge(job, metrics) {
  const status = String(job.status || '')
  if (/iptal/i.test(status)) return { label: 'İPTAL', className: 'bg-red-50 text-red-600' }
  if (status === 'Bekliyor') return { label: 'BEKLEMEDE', className: 'bg-slate-100 text-slate-600' }
  if (status === 'Tamamlandı') return { label: 'TAMAMLANDI', className: 'bg-emerald-50 text-emerald-600' }
  if ((metrics.linesWithPartialDelivery > 0) || /kısmi/i.test(status)) {
    return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
  }
  if (status === 'Devam Ediyor') return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
  return { label: 'ÜRETİM DEVAM EDİYOR', className: 'bg-blue-50 text-blue-600' }
}

function ProgressRing({ percent = 0 }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[13px] font-black tabular-nums text-[#1E3A8A]">%{value}</span>
    </div>
  )
}

function PartialDeliveryTable({
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
}) {
  const [pendingDepoRowId, setPendingDepoRowId] = useState(null)
  const [pendingUndoDepoRowId, setPendingUndoDepoRowId] = useState(null)
  const quantityRows = getLineQuantityRows(lineItem)

  if (!quantityRows.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[13px] font-black uppercase tracking-wide text-[#64748B]">Kısmi Teslimatlar</h4>
        {typeof onAddQuantityRow === 'function' && !columnsLocked ? (
          <button
            type="button"
            onClick={() => onAddQuantityRow(quantityRows[0]?.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-[12px] font-bold text-[#1D4ED8]"
          >
            <Plus className="h-3.5 w-3.5" />
            Kısmi Teslimat Ekle
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-[#E2E8F0]">
        <table className="min-w-full text-left text-[12px]">
          <thead className="bg-[#F8FAFC] text-[11px] font-black uppercase tracking-wide text-[#94A3B8]">
            <tr>
              <th className="px-3 py-2.5">Teslimat No</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5">Üretilen</th>
              <th className="px-3 py-2.5">Adet</th>
              <th className="px-3 py-2.5">Belgeler</th>
              <th className="px-3 py-2.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] bg-white">
            {quantityRows.map((row, rowIndex) => {
              const code = row.productionCode || `${productionJobId}-T${rowIndex + 1}`
              const depoQty = resolveDepoSendQuantity(row, rowIndex, lineItem, orderLineQuantity)
              return (
                <tr key={row.id}>
                  <td className="px-3 py-2.5 font-bold tabular-nums text-[#1E3A8A]">{code}</td>
                  <td className="px-3 py-2.5">
                    <EditableDropdownPill
                      value={row.fulfillmentStatus || fulfillmentOptions[0]?.label || 'Devam Ediyor'}
                      options={fulfillmentOptions}
                      editable={false}
                      disabled={columnsLocked}
                      includePlaceholderOption={false}
                      buttonClassName="flex h-8 min-w-[120px] items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-2 text-[12px] font-semibold"
                      openKey={`${fulfillmentOpenKey}-${row.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => onQuantityRowChange?.(row.id, { fulfillmentStatus: value || 'Devam Ediyor' })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <NumericInput
                      value={row.producedQuantity}
                      onChange={(value) => onQuantityRowChange?.(row.id, { producedQuantity: Math.round(Number(value) || 0) })}
                      readOnly={columnsLocked}
                      className="form-input h-8 w-20 text-[12px] font-bold tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <NumericInput
                      value={row.deliveredQuantity}
                      onChange={(value) => onQuantityRowChange?.(row.id, { deliveredQuantity: Math.round(Number(value) || 0) })}
                      readOnly={columnsLocked}
                      className="form-input h-8 w-20 text-[12px] font-bold tabular-nums"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#2563EB] hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      İrsaliye-{code}.pdf
                    </button>
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

export default function ProductionJobCard({
  job,
  workflowStages,
  productionStages,
  fulfillmentOptions,
  orders,
  quotes,
  expanded,
  onToggleExpand,
  pendingDelete,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onCancelProduction,
  onSendToDepo,
  lineItemActions,
  activeMenu,
  setActiveMenu,
  selected,
  onToggleSelect,
}) {
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const customerDisplay = getListCustomerDisplay(job.customer)
  const order = resolveOrderForProductionJob(job, orders)
  const lineItems = ensureLineItems(job, workflowStages, order)
  const metrics = getJobQuantityMetrics(lineItems)
  const timeline = getProductionJobTimelineDates(job, lineItems, { orders, quotes })
  const badge = resolveStatusBadge(job, metrics)
  const productSummary = lineItems.map((line) => line.product).filter(Boolean).slice(0, 2).join(' · ')
    || job.title
    || 'Ürün yok'

  const activeLine = lineItems[Math.min(activeLineIndex, Math.max(0, lineItems.length - 1))] || lineItems[0]
  const activeRows = activeLine ? getLineQuantityRows(activeLine) : []
  const primaryRow = activeRows[0]
  const processSteps = (productionStages?.length
    ? (primaryRow
      ? getQuantityRowMinimalSteps(primaryRow, productionStages)
      : productionStages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        isActive: false,
        isComplete: false,
      })))
    : [])
  const producedLabel = activeLine
    ? `${formatQty(activeLine.producedQuantity)} / ${formatQty(activeLine.quantity)}`
    : `${formatQty(metrics.produced)} / ${formatQty(metrics.ordered)}`
  const progressPct = metrics.ordered
    ? Math.min(100, Math.round((metrics.produced / metrics.ordered) * 100))
    : (metrics.produced > 0 ? 100 : 0)
  const hasPartial = metrics.linesWithPartialDelivery > 0 || metrics.delivered > 0 && metrics.delivered < metrics.ordered

  return (
    <article className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
      {/* Mockup table-like header row */}
      <div className="grid grid-cols-1 items-center gap-3 px-4 py-3 lg:grid-cols-[minmax(180px,1.1fr)_140px_minmax(220px,1.4fr)_150px_130px_88px]">
        <div className="flex min-w-0 items-start gap-2.5">
          <input
            type="checkbox"
            checked={Boolean(selected)}
            onChange={() => onToggleSelect?.(job.id)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[#CBD5E1]"
            aria-label={`${job.id} seç`}
          />
          <button type="button" onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
            <p className="text-[13px] font-black tabular-nums text-[#1E3A8A]">{job.id}</p>
            <p className="truncate text-[13px] font-bold text-[#0F172A]">
              {customerDisplay.brandShortName || job.customer || 'Müşteri yok'}
            </p>
            <p className="truncate text-[12px] font-medium text-[#64748B]">{productSummary}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#94A3B8]">
              {formatShortDate(timeline.orderDate || timeline.productionStartDate)}
            </p>
          </button>
        </div>

        <button type="button" onClick={onToggleExpand} className="flex items-center gap-2 text-left">
          <ProgressRing percent={progressPct} />
          <div className="text-[11px] font-semibold leading-relaxed text-[#64748B]">
            <p>Üretilen: <span className="font-bold text-[#0F172A]">{formatQty(metrics.produced)}</span></p>
            <p>Teslim Edilen: <span className="font-bold text-[#0F172A]">{formatQty(metrics.delivered)}</span></p>
            <p>Kalan: <span className="font-bold text-[#0F172A]">{formatQty(metrics.remaining)}</span></p>
          </div>
        </button>

        <div className="min-w-0">
          <ProductionProcessDotRail
            steps={processSteps}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={(stageId) => {
              if (!activeLine || !primaryRow) return
              lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
            }}
          />
        </div>

        <div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        <div>
          {hasPartial ? (
            <div className="space-y-0.5">
              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600">
                Kısmi Teslimat
              </span>
              <p className="text-[12px] font-bold tabular-nums text-[#0F172A]">
                {formatQty(metrics.delivered)} / {formatQty(metrics.ordered)}
              </p>
            </div>
          ) : (
            <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500">
              Teslimat Yok
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onToggleExpand}
            className={`rounded-lg border p-2 ${
              expanded
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-[#E2E8F0] bg-white text-[#64748B]'
            }`}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <MoreMenu
            items={[
              { id: 'cancel', label: 'Vazgeç', icon: ArchiveRestore, onClick: onCancelProduction },
              { id: 'depo', label: 'Depoya gönder', icon: Package, onClick: onSendToDepo },
              { id: 'delete', label: 'Sil', icon: Trash2, tone: 'danger', onClick: onRequestDelete },
            ]}
          />
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

      {expanded ? (
        <div className="space-y-5 border-t border-[#E2E8F0] bg-[#FCFCFD] px-4 py-4">
          {lineItems.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {lineItems.map((line, index) => (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setActiveLineIndex(index)}
                  className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                    index === activeLineIndex
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-[#64748B] ring-1 ring-[#E2E8F0]'
                  }`}
                >
                  {line.product || `Kalem ${index + 1}`}
                </button>
              ))}
            </div>
          ) : null}

          {/* Süreç + fotoğraf — zorunlu blok */}
          <ProductionStageMiniCards
            steps={processSteps}
            stagePhotos={activeLine?.stagePhotos || []}
            producedLabel={producedLabel}
            readOnly={activeLine?.productionClosed === true}
            onStageClick={(stageId) => {
              if (!activeLine || !primaryRow) return
              lineItemActions?.handleQuantityRowStageChange(activeLine, primaryRow.id, stageId)
            }}
            onPhotosChange={(photos) => {
              if (!activeLine) return
              lineItemActions?.handleStagePhotosChange(activeLine, photos)
            }}
          />

          {activeLine ? (
            <PartialDeliveryTable
              lineItem={activeLine}
              productionJobId={job.id}
              fulfillmentOptions={fulfillmentOptions}
              fulfillmentOpenKey={`${job.id}-${activeLine.id}-fulfillment`}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              columnsLocked={activeLine.productionClosed === true}
              orderLineQuantity={resolveLineItemOrderQuantity(activeLine, order)}
              onQuantityRowChange={(rowId, patch) => (
                lineItemActions?.handleLineQuantityRowChange(activeLine, rowId, patch)
              )}
              onAddQuantityRow={(rowId) => lineItemActions?.handleAddQuantityRow(activeLine, rowId)}
              onRemoveQuantityRow={(rowId) => lineItemActions?.handleRemoveQuantityRow(activeLine, rowId)}
              onSendToDepo={(rowId) => {
                lineItemActions?.handleSendRowToDepo(
                  activeLine,
                  rowId,
                  resolveLineItemOrderQuantity(activeLine, order),
                )
              }}
              onUndoSendToDepo={(rowId) => lineItemActions?.handleUndoSendRowToDepo(activeLine, rowId)}
            />
          ) : null}

          {(job.activities || []).length > 0 ? (
            <div>
              <h4 className="mb-2 text-[13px] font-black uppercase tracking-wide text-[#64748B]">Süreç Günlüğü</h4>
              <ProductionActivityTimeline activities={job.activities || []} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
