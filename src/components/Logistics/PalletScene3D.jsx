import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges } from '@react-three/drei'

function mm(v) {
  return Number(v || 0) / 1000
}

export default function PalletScene3D({ pallet, layers = [] }) {
  const L = mm(pallet?.lengthMm || 1200)
  const W = mm(pallet?.widthMm || 800)
  const H = mm(pallet?.heightMm || 144)

  const boxes = useMemo(
    () => layers.flatMap((layer, li) => (layer.boxes || []).map((b, bi) => ({
      key: `${li}-${bi}`,
      x: mm(b.xMm) + mm(b.lengthMm) / 2 - L / 2,
      y: mm(b.zMm) + mm(b.heightMm) / 2 + H,
      z: mm(b.yMm) + mm(b.widthMm) / 2 - W / 2,
      sx: mm(b.lengthMm),
      sy: mm(b.heightMm),
      sz: mm(b.widthMm),
    }))),
    [layers, L, W, H],
  )

  return (
    <div className="slp-canvas-wrap" style={{ minHeight: 280 }}>
      <Suspense fallback={<div className="slp-empty">3D…</div>}>
        <Canvas camera={{ position: [1.6, 1.4, 1.8], fov: 40 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 2]} intensity={1} />
          <mesh position={[0, H / 2, 0]}>
            <boxGeometry args={[L, H, W]} />
            <meshStandardMaterial color="#d6b48a" />
            <Edges color="#8b5e34" />
          </mesh>
          {boxes.map((b) => (
            <mesh key={b.key} position={[b.x, b.y, b.z]}>
              <boxGeometry args={[b.sx, b.sy, b.sz]} />
              <meshStandardMaterial color="#60a5fa" />
              <Edges color="#1d4ed8" />
            </mesh>
          ))}
          <OrbitControls makeDefault />
        </Canvas>
      </Suspense>
    </div>
  )
}
