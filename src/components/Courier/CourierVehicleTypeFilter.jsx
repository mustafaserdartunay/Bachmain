import { VEHICLE_TYPES } from '../../utils/courierStore'

export default function CourierVehicleTypeFilter({ value = 'all', onChange, counts = {} }) {
  const options = [
    { id: 'all', label: 'Tümü', emoji: '📦', color: '#64748b' },
    ...VEHICLE_TYPES,
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.id
        const count = counts[option.id] ?? 0
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange?.(option.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
              active
                ? 'border-white/20 bg-dark-700 text-white shadow-card'
                : 'border-dark-500/50 bg-dark-800/60 text-gray-400 hover:border-dark-400/60 hover:text-gray-200'
            }`}
          >
            <span>{option.emoji}</span>
            <span>{option.label}</span>
            {option.id !== 'all' && (
              <span
                className="rounded-md px-1.5 py-0.5 text-[12px] font-black"
                style={{ background: `${option.color}22`, color: option.color }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
