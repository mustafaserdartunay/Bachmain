import { productionSteps } from '../../data/mockData'
import { Check } from 'lucide-react'

export default function ProductionSteps() {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">Üretim Aşamaları</h3>
      <div className="flex items-center justify-between">
        {productionSteps.map((step, index) => (
          <div key={step.name} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                  step.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step.active
                      ? 'bg-accent-blue border-accent-blue text-white'
                      : 'bg-dark-700 border-dark-500 text-gray-500'
                }`}
              >
                {step.completed ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <span className={`text-[10px] mt-1.5 text-center leading-tight ${
                step.active || step.completed ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.name}
              </span>
            </div>
            {index < productionSteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 ${
                step.completed ? 'bg-emerald-500' : 'bg-dark-500'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
