const CAPSULE_GRADIENTS = [
  'linear-gradient(135deg, #93c5fd 0%, #3b82f6 50%, #2563eb 100%)',
  'linear-gradient(135deg, #7cf2c6 0%, #34d399 50%, #10b981 100%)',
  'linear-gradient(135deg, #ffb25e 0%, #ff8a65 50%, #ff5e62 100%)',
  'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #7c3aed 100%)',
  'linear-gradient(135deg, #ffd27f 0%, #f59e0b 50%, #ea580c 100%)',
  'linear-gradient(135deg, #8ad9ff 0%, #60a5fa 50%, #3b82f6 100%)',
]

function resolveKind(step) {
  if (step.isCancelled) return 'cancel'
  if (step.isError) return 'error'
  if (step.isActive) return 'active'
  if (step.isComplete) return 'done'
  return 'pending'
}

/**
 * Compact animated capsule process rail for production job card header.
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
      className="min-w-0 flex-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Üretim süreç kapsülleri"
    >
      <div className="flex min-w-max items-center gap-1.5 pr-1">
        {steps.map((step, index) => {
          const kind = resolveKind(step)
          const gradient = CAPSULE_GRADIENTS[index % CAPSULE_GRADIENTS.length]
          const clickable = !readOnly && typeof onStageClick === 'function'
          const isActive = kind === 'active'
          const isDone = kind === 'done'
          const isPending = kind === 'pending'

          return (
            <button
              key={step.id || `${step.label}-${index}`}
              type="button"
              role="listitem"
              disabled={!clickable}
              title={`${step.label}${isActive ? ' · Devam ediyor' : isDone ? ' · Tamamlandı' : ''}`}
              onClick={() => onStageClick?.(step.id)}
              className={`prod-process-capsule shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black tracking-tight transition-transform duration-200 ${
                clickable ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default'
              } ${
                isPending
                  ? 'border border-[var(--border,#CBD5E1)] bg-white text-[var(--muted,#64748B)]'
                  : 'border border-transparent text-white shadow-[0_4px_14px_rgba(15,23,42,0.12)]'
              } ${isActive ? 'prod-process-capsule-active ring-2 ring-blue-200/80' : ''}`}
              style={
                isPending
                  ? undefined
                  : {
                      background: isActive ? undefined : gradient,
                    }
              }
            >
              <span className="whitespace-nowrap">{step.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { CAPSULE_GRADIENTS }
