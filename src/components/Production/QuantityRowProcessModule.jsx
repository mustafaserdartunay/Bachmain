import { Check, ChevronRight } from 'lucide-react'
import { getQuantityRowStageProgress } from '../../utils/productionLineItems'

const DEFAULT_PILL_CLASS =
  'flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 text-[11px] font-semibold text-[var(--text-strong)]'

export function QuantityRowProcessTrigger({
  row,
  rowIndex,
  productionStages,
  openKey,
  activeMenu,
  setActiveMenu,
  onStageChange,
  disabled,
  locked,
  buttonClassName = DEFAULT_PILL_CLASS,
}) {
  const stages = getQuantityRowStageProgress(row, productionStages)
  const activeStage = stages.find((stage) => stage.active)
  const isOpen = activeMenu === openKey
  const label = activeStage?.label || `Teslimat ${rowIndex + 1}`
  const dotColor = activeStage?.color || 'bg-gray-500'

  return (
    <div className="relative min-w-0" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setActiveMenu(isOpen ? null : openKey)
        }}
        className={`${buttonClassName} ${disabled ? 'cursor-default opacity-90' : ''}`}
        title="Üretim sürecini aç"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
          <span className="truncate text-[var(--text-strong)]">{label}</span>
        </span>
        {!disabled && (
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 text-[var(--text-soft)] transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        )}
      </button>

      {isOpen && !disabled && (
        <div className="relative z-30 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1.5 shadow-[var(--shadow)]">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              disabled={locked}
              onClick={() => {
                if (locked) return
                onStageChange?.(stage.id)
                setActiveMenu(null)
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors ${
                stage.active
                  ? 'bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-muted))] text-[var(--accent)]'
                  : 'text-[var(--text-strong)] hover:bg-[var(--surface-muted)]'
              } ${locked ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                <span className={`h-2.5 w-2.5 rounded-full ${stage.color || 'bg-gray-500'}`} />
                {stage.completed && (
                  <Check className="absolute h-2 w-2 text-white" strokeWidth={3} />
                )}
              </span>
              <span className="truncate">{stage.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
