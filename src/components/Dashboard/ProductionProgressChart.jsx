import { productionSteps } from '../../data/mockData'

export default function ProductionProgressChart() {
  const completed = productionSteps.filter((step) => step.completed).length
  const total = productionSteps.length
  const percent = Math.round((completed / total) * 100)
  const activeIndex = productionSteps.findIndex((step) => step.active && !step.completed)

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">Üretim İlerlemesi</h3>
          <p className="text-xs text-gray-500">Aktif iş emri · 10016</p>
        </div>
        <span className="shrink-0 text-lg font-black text-blue-300">{percent}%</span>
      </div>

      <div className="relative mb-4 h-2 overflow-hidden rounded-full bg-dark-700">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {productionSteps.map((step, index) => {
          const isDone = step.completed
          const isActive = index === activeIndex
          return (
            <div key={step.name} className="flex items-center gap-2 min-w-0">
              <span className={`h-1.5 w-6 shrink-0 rounded-full ${isDone ? 'bg-emerald-500' : isActive ? 'bg-blue-500' : 'bg-dark-600'}`} />
              <span className={`truncate text-[12px] ${isDone || isActive ? 'font-semibold text-gray-300' : 'text-gray-600'}`}>
                {step.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
