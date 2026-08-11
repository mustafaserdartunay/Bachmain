const STAGE_FILLS = [
  '#3b82f6',
  '#10b981',
  '#ff5e62',
  '#2563eb',
  '#ea580c',
  '#8b5cf6',
  '#e11d48',
  '#60a5fa',
]

function resolveKind(step) {
  if (step.isCancelled) return 'cancel'
  if (step.isError) return 'error'
  if (step.isActive) return 'active'
  if (step.isComplete) return 'done'
  return 'pending'
}

function statusLabel(kind) {
  if (kind === 'cancel') return 'İptal'
  if (kind === 'error') return 'Problem'
  if (kind === 'active') return 'Devam Ediyor'
  if (kind === 'done') return 'Tamamlandı'
  return 'Beklemede'
}

/**
 * Compact circular process rail — number in circle, label below, animated connectors.
 */
export default function ProductionProcessCapsuleRail({
  steps = [],
  readOnly = false,
  onStageClick,
}) {
  if (!steps.length) {
    return (
      <p className="text-[12px] font-semibold text-[var(--muted,#94A3B8)]">Süreç tanımlı değil</p>
    )
  }

  return (
    <div
      className="min-w-0 flex-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Üretim süreç adımları"
    >
      <div
        className="mx-auto grid min-w-max gap-0 px-1"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(4.75rem, 1fr))` }}
      >
        {steps.map((step, index) => {
          const kind = resolveKind(step)
          const fill = STAGE_FILLS[index % STAGE_FILLS.length]
          const nextFill = STAGE_FILLS[(index + 1) % STAGE_FILLS.length]
          const isActive = kind === 'active'
          const isDone = kind === 'done'
          const isPending = kind === 'pending'
          const prevDone = index > 0 && Boolean(steps[index - 1]?.isComplete)
          const clickable = !readOnly && typeof onStageClick === 'function'
          const nextLit =
            steps[index + 1]?.isComplete || steps[index + 1]?.isActive || isActive

          return (
            <div
              key={step.id || `${step.label}-${index}`}
              className="relative flex min-w-0 flex-col items-center px-0.5"
              role="listitem"
            >
              {index < steps.length - 1 ? (
                <span
                  className={`prod-process-connector absolute left-1/2 top-[14px] z-0 h-[2px] w-full ${
                    isDone || (isActive && prevDone) ? 'prod-process-connector-live' : ''
                  }`}
                  style={{
                    background:
                      isDone || (isActive && prevDone)
                        ? `linear-gradient(90deg, ${fill}, ${nextFill}${nextLit ? '' : '88'})`
                        : 'var(--border, #E2E8F0)',
                  }}
                  aria-hidden
                />
              ) : null}
              {index > 0 ? (
                <span
                  className="absolute right-1/2 top-[14px] z-0 h-[2px] w-1/2"
                  style={{
                    background: prevDone || isDone || isActive ? fill : 'var(--border, #E2E8F0)',
                    opacity: prevDone || isDone || isActive ? 1 : 0.75,
                  }}
                  aria-hidden
                />
              ) : null}

              <button
                type="button"
                disabled={!clickable}
                title={`${step.label} — ${statusLabel(kind)}`}
                onClick={() => onStageClick?.(step.id)}
                className={`group relative z-[1] flex w-full flex-col items-center gap-1 ${
                  clickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`prod-process-dot relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 ${
                    clickable ? 'group-hover:scale-110' : ''
                  } ${
                    isPending
                      ? 'border-2 border-[var(--border,#CBD5E1)] bg-white text-[var(--muted,#94A3B8)]'
                      : 'text-white shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
                  } ${isActive ? 'prod-process-dot-active ring-[3px] ring-blue-100/90' : ''} ${
                    isDone ? 'prod-process-dot-done' : ''
                  }`}
                  style={isPending ? undefined : { background: isActive ? undefined : fill }}
                >
                  {index + 1}
                  {isActive ? (
                    <span
                      className="prod-process-dot-pulse pointer-events-none absolute inset-0 rounded-full"
                      aria-hidden
                    />
                  ) : null}
                </span>

                <span
                  className={`w-full truncate text-center text-[10px] font-bold leading-tight ${
                    isActive
                      ? 'text-[#2563eb]'
                      : isDone
                        ? 'text-[var(--ink,#0F172A)]'
                        : 'text-[var(--muted,#64748B)]'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { STAGE_FILLS }
