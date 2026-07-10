import { Check } from 'lucide-react'

const STEPS = [
  { id: 'route', label: 'Sefer' },
  { id: 'vehicle', label: 'Araç' },
  { id: 'cargo', label: 'Yük Planı' },
  { id: 'confirm', label: 'Onay' },
]

export default function LoadingWizardStepper({ currentStep, onStepClick, maxReached }) {
  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const done = index < currentStep
          const active = index === currentStep
          const reachable = index <= maxReached
          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepClick?.(index)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 transition-opacity ${
                  reachable ? 'cursor-pointer' : 'cursor-default opacity-50'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                    active
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : done
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-dark-700 text-gray-500'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={`truncate text-[13px] font-bold ${active ? 'text-blue-200' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`mx-1 hidden h-0.5 flex-1 sm:block ${done ? 'bg-emerald-500/40' : 'bg-dark-600'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { STEPS }
