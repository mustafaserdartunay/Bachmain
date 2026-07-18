/**
 * iOS-style process dot rail — stages from workflow settings.
 * Complete: Bachmain yellow · Active: blue + pulse · Pending: empty gray · Error/cancel tones supported.
 */
export default function ProductionProcessDotRail({
  steps = [],
  onStageClick,
  readOnly = false,
  className = '',
}) {
  if (!steps.length) {
    return (
      <p className={`text-[12px] font-semibold text-[var(--muted)] ${className}`.trim()}>
        Süreç tanımlanmadı
      </p>
    )
  }

  let lastCompleteIndex = -1
  steps.forEach((step, index) => {
    if (step.isComplete) lastCompleteIndex = index
  })

  return (
    <div
      className={`flex min-w-0 items-center gap-0 overflow-x-auto pb-0.5 ${className}`.trim()}
      role="list"
      aria-label="Üretim süreçleri"
    >
      {steps.map((step, index) => {
        const isComplete = Boolean(step.isComplete)
        const isActive = Boolean(step.isActive)
        const isError = Boolean(step.isError)
        const isCancelled = Boolean(step.isCancelled)
        const clickable = !readOnly && typeof onStageClick === 'function'
        const showPulse = isComplete && !isActive && index === lastCompleteIndex

        let dotClass = 'border-2 border-[rgba(140,145,165,0.35)] bg-transparent'
        if (isCancelled) dotClass = 'border-2 border-[var(--ink)] bg-[var(--ink)]'
        else if (isError) dotClass = 'border-2 border-red-500 bg-red-500'
        else if (isActive) dotClass = 'border-2 border-[var(--bach-sky,#79a6d2)] bg-[var(--bach-sky,#79a6d2)] shadow-[0_0_0_3px_rgba(121,166,210,0.25)]'
        else if (isComplete) {
          dotClass = `border-2 border-[#FDB515] bg-[#FDB515] ${showPulse ? 'animate-pulse' : ''}`
        }

        return (
          <div key={step.id || `${step.label}-${index}`} className="flex min-w-0 items-center" role="listitem">
            {index > 0 ? (
              <span
                className={`mx-0.5 h-px w-3 shrink-0 sm:w-4 ${
                  isComplete || isActive ? 'bg-[#FDB515]/70' : 'bg-[rgba(140,145,165,0.28)]'
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
              <span className={`h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-110 sm:h-3 sm:w-3 ${dotClass}`} />
              <span
                className={`max-w-[4.5rem] truncate text-[10px] font-semibold leading-tight ${
                  isActive
                    ? 'text-[var(--bach-navy,#203375)]'
                    : isComplete
                      ? 'text-[var(--ink)]'
                      : 'text-[var(--muted)]'
                }`}
              >
                {step.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
