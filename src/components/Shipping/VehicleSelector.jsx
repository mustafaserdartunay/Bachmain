import { CheckCircle2 } from 'lucide-react'
import { SHIPPING_VEHICLES } from '../../utils/shippingConstants'
import { t } from '../../utils/shippingI18n'

export default function VehicleSelector({
  lang,
  selectedId,
  selectedArea,
  onSelect,
  onAreaChange,
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {SHIPPING_VEHICLES.map((vehicle) => {
          const active = selectedId === vehicle.id
          const scale = active
            ? 0.92 + ((selectedArea - vehicle.minArea) / Math.max(vehicle.maxArea - vehicle.minArea, 1)) * 0.14
            : 0.92
          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onSelect(vehicle.id)}
              className={`group overflow-hidden rounded-2xl border text-left transition-all ${
                active
                  ? 'border-blue-400/60 bg-blue-500/10 shadow-lg shadow-blue-500/10 ring-2 ring-blue-400/30'
                  : 'border-dark-500/50 bg-dark-800/60 hover:border-blue-400/30 hover:bg-dark-700/50'
              }`}
            >
              <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${vehicle.accent}`}>
                <img
                  src={vehicle.image}
                  alt={t(vehicle.labelKey, lang)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ transform: active ? `scale(${scale})` : undefined }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/10 to-transparent" />
                {active && (
                  <span className="absolute right-3 top-3 rounded-full bg-blue-500 p-1 text-white shadow-lg">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-white">{t(vehicle.labelKey, lang)}</p>
                <p className="mt-1 text-[13px] text-gray-500">
                  {vehicle.minArea}–{vehicle.maxArea} m² · {vehicle.maxWeightKg.toLocaleString('tr-TR')} kg
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {selectedId && (() => {
        const vehicle = SHIPPING_VEHICLES.find((item) => item.id === selectedId)
        if (!vehicle) return null
        return (
          <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('field.area', lang)}</p>
                <p className="mt-1 text-2xl font-black text-blue-300">{selectedArea} m²</p>
              </div>
              <p className="text-xs text-gray-500">
                {vehicle.cargoLengthM}m × {vehicle.cargoWidthM}m kasa
              </p>
            </div>
            <input
              type="range"
              min={vehicle.minArea}
              max={vehicle.maxArea}
              step={0.5}
              value={selectedArea}
              onChange={(event) => onAreaChange(Number(event.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="mt-2 flex justify-between text-[12px] font-semibold text-gray-500">
              <span>{vehicle.minArea} m²</span>
              <span>{vehicle.maxArea} m²</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
