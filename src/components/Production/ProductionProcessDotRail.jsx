import { Check } from 'lucide-react'

/**
 * Horizontal process timeline.
 * Complete = green · Active = blue pulse · Pending = gray · Error = red
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
      className={`flex min-w-0 items-center justify-start gap-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`.trim()}
      role="list"
      aria-label="Üretim süreçleri"
    >
      {steps.map((step, index) => {
        const isComplete = Boolean(step.isComplete)
        const isActive = Boolean(step.isActive)
        const isError = Boolean(step.isError)
        const isCancelled = Boolean(step.isCancelled)
        const clickable = !readOnly && typeof onStageClick === 'function'
        const lineDone = isComplete || steps[index - 1]?.isComplete

        let node
        if (isCancelled) {
          node = (
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-700 text-[11px] font-black text-white">
              ×
            </span>
          )
        } else if (isError) {
          node = (
            <span className="h-[22px] w-[22px] rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />
          )
        } else if (isComplete) {
          node = (
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.22)] transition-transform duration-300">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )
        } else if (isActive) {
          node = (
            <span className="relative flex h-[22px] w-[22px] items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
              <span className="relative h-[22px] w-[22px] rounded-full bg-[var(--accent,#3B82F6)] shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
            </span>
          )
        } else {
          node = (
            <span className="h-[22px] w-[22px] rounded-full border-2 border-[var(--border,#CBD5E1)] bg-white dark:bg-transparent" />
          )
        }

        return (
          <div
            key={step.id || `${step.label}-${index}`}
            className="flex min-w-0 items-center"
            role="listitem"
          >
            {index > 0 ? (
              <span
                className="mx-0.5 h-[2px] w-3 shrink-0 transition-colors duration-500 sm:w-5"
                style={{
                  background: lineDone
                    ? 'rgba(16,185,129,0.75)'
                    : 'color-mix(in srgb, var(--border, #CBD5E1) 90%, transparent)',
                }}
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
              <span className="transition-transform duration-200 group-hover:scale-110">
                {node}
              </span>
              {showLabels ? (
                <span
                  className={`max-w-[3.6rem] truncate text-[9px] font-bold leading-tight sm:max-w-[4.4rem] sm:text-[10px] ${
                    isActive
                      ? 'text-[var(--accent,#2563EB)]'
                      : isComplete
                        ? 'text-emerald-600'
                        : 'text-[var(--muted,#94A3B8)]'
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
