/**
 * Arka / Yan zarf görünümleri — BachMain TLC dilinde SVG.
 * Üstten grid CustomerLoadShipmentCreatePage içinde kalır.
 */
import { SLOT_COLORS } from '../../utils/truckLoadCalc'

function ViewCard({ title, subtitle, children }) {
  return (
    <div className="tlc-card tlc-panel !p-3">
      <div className="mb-2">
        <h3 className="m-0 text-[13px] font-extrabold text-[var(--tlc-ink,#0f172a)]">{title}</h3>
        <p className="m-0 mt-0.5 text-[11px] font-semibold text-[var(--tlc-muted,#64748b)]">
          {subtitle}
        </p>
      </div>
      <div className="overflow-auto rounded-2xl border border-dashed border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-white p-2">
        {children}
      </div>
    </div>
  )
}

function HatchDefs({ id }) {
  return (
    <defs>
      <pattern
        id={id}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <line x1="0" y1="0" x2="0" y2="7" stroke="#fff" strokeWidth="2" opacity="0.45" />
      </pattern>
      <pattern
        id={`${id}-block`}
        width="8"
        height="8"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="8" stroke="#e11d48" strokeWidth="2.5" opacity="0.35" />
      </pattern>
    </defs>
  )
}

export default function VehicleLoadViews({ plan }) {
  if (!plan?.truck) return null
  const { truck, cellL, cellW, cols, rows, leftoverL, leftoverW, slotMeta, results } = plan
  const maxSide = 320
  const sideScale = Math.min(1, maxSide / Math.max(1, truck.L))
  const rearScale = Math.min(1, maxSide / Math.max(1, truck.W))

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ViewCard title="Arka Görünüm" subtitle="Genişlik ekseni · zarf yüksekliği">
        <svg
          width={truck.W * rearScale}
          height={truck.H * rearScale}
          viewBox={`0 0 ${truck.W} ${truck.H}`}
          className="max-w-full"
        >
          <HatchDefs id="bm-rear-hatch" />
          <rect width={truck.W} height={truck.H} fill="#f8fafc" />
          {Array.from({ length: rows }).map((_, row) => {
            let best = null
            for (let col = 0; col < cols; col += 1) {
              const slot = slotMeta?.[row * cols + col]
              if (!slot || slot.itemIdx == null) continue
              if (!best || slot.stackH > best.stackH) best = slot
            }
            if (!best) return null
            const item = results[best.itemIdx]
            const tone = SLOT_COLORS[(item?.colorIdx || 0) % SLOT_COLORS.length]
            const h = best.stackH
            const x = row * cellW
            const y = truck.H - h
            const pallet = item?.stackable === false
            return (
              <g key={`rear-${row}`}>
                <rect
                  x={x + 1}
                  y={y}
                  width={cellW - 2}
                  height={h}
                  fill={tone.bg}
                  stroke={tone.fg}
                  strokeWidth={1}
                />
                {pallet ? (
                  <rect x={x + 1} y={y} width={cellW - 2} height={h} fill="url(#bm-rear-hatch)" />
                ) : null}
              </g>
            )
          })}
          {leftoverW > 0 ? (
            <rect
              x={rows * cellW}
              y={0}
              width={leftoverW}
              height={truck.H}
              fill="url(#bm-rear-hatch-block)"
            />
          ) : null}
        </svg>
      </ViewCard>

      <ViewCard title="Yan Görünüm" subtitle="Uzunluk ekseni · zarf yüksekliği">
        <svg
          width={truck.L * sideScale}
          height={truck.H * sideScale}
          viewBox={`0 0 ${truck.L} ${truck.H}`}
          className="max-w-full"
        >
          <HatchDefs id="bm-side-hatch" />
          <rect width={truck.L} height={truck.H} fill="#f8fafc" />
          {Array.from({ length: cols }).map((_, col) => {
            let best = null
            for (let row = 0; row < rows; row += 1) {
              const slot = slotMeta?.[row * cols + col]
              if (!slot || slot.itemIdx == null) continue
              if (!best || slot.stackH > best.stackH) best = slot
            }
            if (!best) return null
            const item = results[best.itemIdx]
            const tone = SLOT_COLORS[(item?.colorIdx || 0) % SLOT_COLORS.length]
            const h = best.stackH
            const x = col * cellL
            const y = truck.H - h
            const pallet = item?.stackable === false
            return (
              <g key={`side-${col}`}>
                <rect
                  x={x + 1}
                  y={y}
                  width={cellL - 2}
                  height={h}
                  fill={tone.bg}
                  stroke={tone.fg}
                  strokeWidth={1}
                />
                {pallet ? (
                  <rect x={x + 1} y={y} width={cellL - 2} height={h} fill="url(#bm-side-hatch)" />
                ) : null}
              </g>
            )
          })}
          {leftoverL > 0 ? (
            <rect
              x={cols * cellL}
              y={0}
              width={leftoverL}
              height={truck.H}
              fill="url(#bm-side-hatch-block)"
            />
          ) : null}
        </svg>
      </ViewCard>
    </div>
  )
}
