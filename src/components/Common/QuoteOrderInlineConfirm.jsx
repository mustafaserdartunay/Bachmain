import { X } from 'lucide-react'

export default function QuoteOrderInlineConfirm({
  label = 'Sil',
  labelClass = 'quote-order-undo-sil',
  ariaLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="quote-order-undo-confirm quote-order-action inline-flex h-9 items-center justify-center"
      onClick={(event) => event.stopPropagation()}
      role="alertdialog"
      aria-label={ariaLabel}
    >
      <div className="quote-order-undo-box flex h-9 w-full items-center justify-between rounded-xl border border-ds-border bg-transparent px-1">
        <button
          type="button"
          onClick={onConfirm}
          className={`${labelClass} px-1.5 text-[11px] font-semibold leading-none`}
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="quote-order-undo-close inline-flex h-7 w-7 items-center justify-center rounded-lg"
          aria-label="Vazgeç"
          title="Vazgeç"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}
