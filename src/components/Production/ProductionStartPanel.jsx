import { useMemo, useState } from 'react'
import { Factory, Layers3, Plus, Trash2 } from 'lucide-react'
import NumericInput from '../Products/NumericInput'
import { formatQty } from '../../utils/productionQuantityMetrics'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'

function buildDefaultSplits(orderQty) {
  const qty = Math.max(0, Math.round(Number(orderQty) || 0))
  if (qty <= 1) return [qty]
  const first = Math.floor(qty / 2)
  return [first, qty - first]
}

/**
 * Pre-production gate: choose full or partial production before the delivery table.
 */
export default function ProductionStartPanel({
  line,
  orderQuantity,
  onStartFull,
  onStartPartial,
}) {
  const [mode, setMode] = useState(null)
  const [splits, setSplits] = useState(() => buildDefaultSplits(orderQuantity))

  const productName = line?.product || 'Ürün'
  const description = String(line?.description || '').trim()
  const orderQty = Math.max(0, Number(orderQuantity) || 0)
  const splitTotal = useMemo(
    () => splits.reduce((sum, value) => sum + Math.max(0, Math.round(Number(value) || 0)), 0),
    [splits],
  )
  const splitValid = splitTotal === orderQty && splits.every((value) => (Number(value) || 0) > 0)

  function updateSplit(index, value) {
    setSplits((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    )
  }

  function addSplit() {
    setSplits((current) => [...current, Math.max(0, orderQty - splitTotal) || 1])
  }

  function removeSplit(index) {
    setSplits((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)))
  }

  return (
    <div className="rounded-ds-lg border border-dashed border-[var(--ds-border-strong,var(--ds-border,#CBD5E1))] bg-[var(--ds-surface-muted)]/20 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted,#64748B)]">
            Üretim henüz başlamadı
          </p>
          <p className="mt-1 text-[15px] font-bold text-[var(--muted)]">
            {description || productName}
          </p>
          {description ? (
            <p className="text-[13px] font-semibold text-[var(--muted)]/80">{productName}</p>
          ) : null}
          <p className="mt-1 text-[13px] font-semibold tabular-nums text-[var(--muted)]">
            Sipariş adedi: {formatQty(orderQty)}
          </p>
        </div>
      </div>

      {!mode ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onStartFull?.()}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br px-4 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 ${HEADER_ACTION_GRADIENTS.primary}`}
          >
            <Factory className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Üretime Başla — Tam Üretim
          </button>
          <button
            type="button"
            onClick={() => {
              setSplits(buildDefaultSplits(orderQty))
              setMode('partial')
            }}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br px-4 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 ${HEADER_ACTION_GRADIENTS.amber}`}
          >
            <Layers3 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Üretime Başla — Parçalı Üretim
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-[var(--muted)]">Parçalı üretim planı</p>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-[12px] font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
            >
              Geri
            </button>
          </div>

          <div className="space-y-2">
            {splits.map((value, index) => (
              <div key={`split-${index}`} className="flex flex-wrap items-center gap-2">
                <span className="w-16 shrink-0 text-[12px] font-bold text-[var(--muted)]">
                  Parça {index + 1}
                </span>
                <NumericInput
                  value={value}
                  onChange={(next) => updateSplit(index, next)}
                  className="!h-9 !min-h-9 w-28 py-0 text-[13px] font-bold tabular-nums"
                />
                <span className="text-[12px] font-semibold text-[var(--muted)]">adet</span>
                {splits.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => removeSplit(index)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ds-border text-[var(--muted)] transition-colors hover:border-rose-400 hover:text-rose-600"
                    aria-label={`Parça ${index + 1} sil`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addSplit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ds-border px-3 py-2 text-[12px] font-bold text-[var(--muted)] transition-colors hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-ink)]"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Parça ekle
            </button>
            <p
              className={`text-[12px] font-bold tabular-nums ${
                splitValid ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              Toplam: {formatQty(splitTotal)} / {formatQty(orderQty)}
            </p>
          </div>

          <button
            type="button"
            disabled={!splitValid}
            onClick={() => onStartPartial?.(splits)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br px-4 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${HEADER_ACTION_GRADIENTS.amber}`}
          >
            <Layers3 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            Parçalı üretimi başlat
          </button>
        </div>
      )}
    </div>
  )
}
