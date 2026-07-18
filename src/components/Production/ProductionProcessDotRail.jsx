import { Check } from 'lucide-react'

/**
 * Mockup-style process stepper:
 * Complete = green check · Active = blue filled · Pending = empty gray ring
 */
export default function ProductionProcessDotRail({
  steps = [],
  onStageClick,
  readOnly = false,
  className = '',
  showLabels = true,
}) {
  if (!steps.length) {
    return (
      <p className={`text-[12px] font-semibold text-[var(--muted)] ${className}`.trim()}>
        Süreç tanımlanmadı
      </p>
    )
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`.trim()}
      role="list"
      aria-label="Üretim süreçleri"
    >
      {steps.map((step, index) => {
        const isComplete = Boolean(step.isComplete)
        const isActive = Boolean(step.isActive)
        const isError = Boolean(step.isError)
        const isCancelled = Boolean(step.isCancelled)
        const clickable = !readOnly && typeof onStageClick === 'function'
        const reached = isComplete || isActive

        let node
        if (isCancelled) {
          node = (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-black text-white">
              ×
            </span>
          )
        } else if (isError) {
          node = <span className="h-5 w-5 rounded-full bg-red-500 ring-4 ring-red-500/15" />
        } else if (isComplete) {
          node = (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.18)]">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )
        } else if (isActive) {
          node = (
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/35" />
              <span className="relative h-5 w-5 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.22)]" />
            </span>
          )
        } else {
          node = <span className="h-5 w-5 rounded-full border-2 border-[rgba(140,145,165,0.35)] bg-white" />
        }

        return (
          <div key={step.id || `${step.label}-${index}`} className="flex min-w-0 items-center" role="listitem">
            {index > 0 ? (
              <span
                className={`mx-1 h-0.5 w-4 shrink-0 sm:w-5 ${
                  reached || steps[index - 1]?.isComplete ? 'bg-emerald-400/70' : 'bg-[rgba(140,145,165,0.28)]'
                }`}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              title={step.label}
              onClick={() => onStageClick?.(step.id)}
              className={`group flex shrink-0 flex-col items-center gap-1 ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {node}
              {showLabels ? (
                <span
                  className={`max-w-[4.75rem] truncate text-[10px] font-semibold leading-tight ${
                    isActive
                      ? 'text-blue-600'
                      : isComplete
                        ? 'text-emerald-700'
                        : 'text-[var(--muted)]'
                  }`}
                >
                  {step.label}
                </span>
              ) : null}
            </button>
          </div>
        )
      })}
    </div>
  )
}
