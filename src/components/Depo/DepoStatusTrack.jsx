import { DEPO_ITEM_STATUSES, DEPO_STATUS_STEPS } from '../../data/depoSeed'

export default function DepoStatusTrack({ status, compact = false, showLabels = true }) {
  const currentIndex = DEPO_ITEM_STATUSES.indexOf(status)

  return (
    <div className="min-w-0">
      <div className="flex gap-0.5 overflow-hidden rounded-lg border border-dark-500/40 bg-dark-900/40 p-0.5">
        {DEPO_STATUS_STEPS.map((step, index) => {
          const isPast = index < currentIndex
          const isActive = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <div
              key={step.key}
              className={`relative min-w-0 flex-1 overflow-hidden rounded-md transition-all ${
                isActive
                  ? `${step.color} shadow-sm`
                  : isPast
                    ? 'bg-emerald-500/25'
                    : 'bg-dark-800/70'
              }`}
              title={step.key}
            >
              <div className={`${compact ? 'h-2' : 'h-5'} w-full`} />
              {!compact && showLabels && (
                <p
                  className={`absolute inset-0 flex items-center justify-center truncate px-0.5 text-[8px] font-black uppercase tracking-wide ${
                    isActive ? 'text-white' : isPast ? 'text-emerald-200/90' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </p>
              )}
              {isFuture && !compact && (
                <div className="pointer-events-none absolute inset-0 bg-dark-900/20" />
              )}
            </div>
          )
        })}
      </div>
      {!compact && (
        <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">
          {status}
        </p>
      )}
    </div>
  )
}
