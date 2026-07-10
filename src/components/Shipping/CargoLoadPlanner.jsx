import { t } from '../../utils/shippingI18n'

export default function CargoLoadPlanner({ lang, placements = [], lengthM, widthM, capacityStatus }) {
  const statusLabel = t(`capacity.${capacityStatus}`, lang)

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">{t('step.layout', lang)}</p>
          <p className="text-xs text-gray-500">{lengthM.toFixed(1)}m × {widthM.toFixed(1)}m</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${
          capacityStatus === 'over'
            ? 'bg-red-500/15 text-red-300'
            : capacityStatus === 'warn'
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-emerald-500/15 text-emerald-300'
        }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-dark-500/60 bg-[#0b1220]">
        <div className="absolute inset-4 rounded-lg border border-dashed border-blue-400/25 bg-blue-500/5" />
        {placements.filter((item) => !item.overflow).map((placement) => (
          <div
            key={placement.id}
            className="absolute rounded-md border border-white/20 shadow-md"
            style={{
              left: `${4 + placement.x * 92}%`,
              top: `${4 + placement.y * 92}%`,
              width: `${placement.w * 92}%`,
              height: `${placement.h * 92}%`,
              backgroundColor: placement.color,
              opacity: 0.88,
            }}
            title={placement.name}
          />
        ))}
        {placements.filter((item) => item.overflow).length > 0 && (
          <div className="absolute bottom-3 left-3 rounded-lg bg-red-500/20 px-3 py-1 text-[12px] font-bold text-red-300">
            +{placements.filter((item) => item.overflow).length} taşma
          </div>
        )}
      </div>
    </div>
  )
}
