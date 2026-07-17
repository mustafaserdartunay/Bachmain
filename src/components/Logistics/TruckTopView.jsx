import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Top-view SVG truck floor with drag-drop pallet placement (mm space).
 */
export default function TruckTopView({
  vehicle,
  placements = [],
  pallets = [],
  onChangePlacements,
  onDropPallet,
}) {
  const svgRef = useRef(null)
  const [dragId, setDragId] = useState(null)

  const L = Number(vehicle?.innerLengthMm || 13600)
  const W = Number(vehicle?.innerWidthMm || 2450)
  const pad = 24
  const viewW = 900
  const viewH = Math.max(280, Math.round((W / L) * viewW) + pad * 2)
  const scale = (viewW - pad * 2) / L

  const toSvg = useCallback((xMm, yMm) => ({
    x: pad + xMm * scale,
    y: pad + yMm * scale,
  }), [scale])

  const fromSvg = useCallback((sx, sy) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const x = (sx - rect.left) * (viewW / rect.width)
    const y = (sy - rect.top) * (viewH / rect.height)
    return {
      xMm: Math.max(0, Math.min(L, (x - pad) / scale)),
      yMm: Math.max(0, Math.min(W, (y - pad) / scale)),
    }
  }, [L, W, scale, viewW, viewH])

  function onPointerDown(palletId, e) {
    e.preventDefault()
    setDragId(palletId)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragId) return
    const { xMm, yMm } = fromSvg(e.clientX, e.clientY)
    const next = placements.map((p) => {
      if (p.palletId !== dragId) return p
      const maxX = L - p.lengthMm
      const maxY = W - p.widthMm
      return {
        ...p,
        xMm: Math.round(Math.max(0, Math.min(maxX, xMm))),
        yMm: Math.round(Math.max(0, Math.min(maxY, yMm))),
      }
    })
    onChangePlacements?.(next)
  }

  function onPointerUp() {
    setDragId(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    const { xMm, yMm } = fromSvg(e.clientX, e.clientY)
    onDropPallet?.(id, xMm, yMm)
  }

  const palletMap = useMemo(() => Object.fromEntries(pallets.map((p) => [p.id, p])), [pallets])

  useEffect(() => {
    function up() {
      setDragId(null)
    }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

  if (!vehicle) return <div className="slp-empty">Araç seçin</div>

  return (
    <div className="slp-canvas-wrap">
      <svg
        ref={svgRef}
        className="slp-topview"
        viewBox={`0 0 ${viewW} ${viewH}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <rect
          x={pad}
          y={pad}
          width={L * scale}
          height={W * scale}
          rx={10}
          fill="rgba(255,255,255,0.85)"
          stroke="#2563eb"
          strokeWidth={2}
        />
        {/* door mark */}
        <rect
          x={pad + L * scale - 8}
          y={pad + W * scale * 0.25}
          width={8}
          height={W * scale * 0.5}
          fill="#2563eb"
          opacity={0.45}
        />
        <text x={pad + 8} y={pad - 6} fontSize={11} fontWeight={800} fill="#64748b">
          ÜST GÖRÜNÜM · {L}×{W} mm · Kapı →
        </text>
        {placements.map((p, i) => {
          const pos = toSvg(p.xMm, p.yMm)
          const meta = palletMap[p.palletId]
          return (
            <g
              key={p.palletId}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: 'grab' }}
              onPointerDown={(e) => onPointerDown(p.palletId, e)}
            >
              <rect
                width={p.lengthMm * scale}
                height={p.widthMm * scale}
                rx={6}
                fill={dragId === p.palletId ? '#93c5fd' : '#fbbf24'}
                stroke="#b45309"
                strokeWidth={1.5}
                opacity={0.92}
              />
              <text
                x={4}
                y={14}
                fontSize={10}
                fontWeight={800}
                fill="#78350f"
              >
                P{i + 1} {meta?.code || ''}
              </text>
              <text x={4} y={26} fontSize={9} fill="#92400e">
                {(meta?.customer || p.customer || '').slice(0, 18)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
