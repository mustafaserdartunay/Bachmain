import { getVehicleTypeMeta } from '../../utils/courierStore'

function FleetRow({ vehicle, selected, onSelect }) {
  const meta = getVehicleTypeMeta(vehicle.vehicleType)
  const busy = vehicle.status === 'busy'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(vehicle)}
      className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
        selected
          ? 'border-white/20 bg-dark-700/90 shadow-card'
          : 'border-dark-500/40 bg-dark-800/50 hover:border-dark-400/50 hover:bg-dark-700/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
            style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}44` }}
          >
            {meta.emoji}
          </span>
          <div>
            <p className="text-sm font-bold text-white">{vehicle.name}</p>
            <p className="text-[11px] text-gray-500">{meta.label} · {vehicle.plate}</p>
            <p className="mt-0.5 text-xs font-semibold text-gray-300">{vehicle.courierName}</p>
          </div>
        </div>
        <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
          busy ? 'bg-orange-500/15 text-orange-300' : 'bg-emerald-500/15 text-emerald-300'
        }`}>
          {busy ? 'Görevde' : 'Müsait'}
        </span>
      </div>
    </button>
  )
}

export default function CourierFleetPanel({ fleet = [], selectedVehicleId, onSelectVehicle, vehicleTypeFilter = 'all' }) {
  const filtered = vehicleTypeFilter === 'all'
    ? fleet
    : fleet.filter((item) => item.vehicleType === vehicleTypeFilter)

  return (
    <div className="space-y-2">
      {filtered.length ? filtered.map((vehicle) => (
        <FleetRow
          key={vehicle.id}
          vehicle={vehicle}
          selected={vehicle.id === selectedVehicleId}
          onSelect={onSelectVehicle}
        />
      )) : (
        <div className="rounded-xl border border-dashed border-dark-500/50 px-4 py-8 text-center">
          <p className="text-xs font-semibold text-gray-500">Bu araç tipinde filo kaydı yok</p>
        </div>
      )}
    </div>
  )
}
