import { Check } from 'lucide-react'

const BACH_YELLOW = '#FDB515'

/**
 * Mockup process stepper:
 * Complete = Bachmain yellow check · Active = blue · Pending = empty gray
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
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-white">
              ×
            </span>
          )
        } else if (isError) {
          node = <span className="h-[22px] w-[22px] rounded-full bg-red-500 ring-[3px] ring-red-500/20" />
        } else if (isComplete) {
          node = (
            <span
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-white shadow-[0_0_0_3px_rgba(253,181,21,0.22)]"
              style={{ background: BACH_YELLOW }}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )
        } else if (isActive) {
          node = (
            <span className="relative flex h-[22px] w-[22px] items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
              <span className="relative h-[22px] w-[22px] rounded-full bg-[#3B82F6] shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
            </span>
          )
        } else {
          node = <span className="h-[22px] w-[22px] rounded-full border-2 border-[#CBD5E1] bg-white" />
        }

        return (
          <div key={step.id || `${step.label}-${index}`} className="flex min-w-0 items-center" role="listitem">
            {index > 0 ? (
              <span
                className="mx-0.5 h-[2px] w-3 shrink-0 sm:w-4"
                style={{ background: lineDone ? 'rgba(253,181,21,0.75)' : 'rgba(203,213,225,0.9)' }}
                aria-hidden
              />
            ) : null}
            <button
              type="button"
              disabled={!clickable}
              title={step.label}
              onClick={() => onStageClick?.(step.id)}
              className={`group flex shrink-0 flex-col items-center gap-1 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {node}
              {showLabels ? (
                <span
                  className={`max-w-[3.6rem] truncate text-[9px] font-bold leading-tight sm:max-w-[4.2rem] sm:text-[10px] ${
                    isActive ? 'text-[#2563EB]' : isComplete ? 'text-[#B45309]' : 'text-[#94A3B8]'
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
