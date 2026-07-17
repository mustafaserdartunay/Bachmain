import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Edges, Html } from '@react-three/drei'

function mmToScene(mm) {
  return Number(mm || 0) / 1000
}

function TruckShell({ vehicle }) {
  const L = mmToScene(vehicle.innerLengthMm || 13600)
  const W = mmToScene(vehicle.innerWidthMm || 2450)
  const H = mmToScene(vehicle.innerHeightMm || 2700)
  return (
    <group position={[0, H / 2, 0]}>
      <mesh>
        <boxGeometry args={[L, H, W]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.18} />
        <Edges color="#2563eb" threshold={15} />
      </mesh>
      {/* floor */}
      <mesh position={[0, -H / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[L, W]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
    </group>
  )
}

function PalletMesh({ placement, color = '#f59e0b', index = 0 }) {
  const L = mmToScene(placement.lengthMm)
  const W = mmToScene(placement.widthMm)
  const H = mmToScene(Math.max(placement.heightMm || 1000, 400))
  const vehL = mmToScene(placement._vehL || 13600)
  const vehW = mmToScene(placement._vehW || 2450)
  // origin: rear-left of floor → center-based scene
  const x = mmToScene(placement.xMm) + L / 2 - vehL / 2
  const z = mmToScene(placement.yMm) + W / 2 - vehW / 2
  const y = H / 2 + 0.02
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[L, H, W]} />
      <meshStandardMaterial color={color} />
      <Edges color="#92400e" />
      <Html distanceFactor={8} position={[0, H / 2 + 0.1, 0]} center>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 8,
          padding: '2px 6px',
          fontSize: 10,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
        >
          P{index + 1}
        </div>
      </Html>
    </mesh>
  )
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#06b6d4', '#f97316']

export default function TruckScene3D({ vehicle, placements = [], className = '' }) {
  const enriched = useMemo(
    () => placements.map((p) => ({
      ...p,
      _vehL: vehicle?.innerLengthMm,
      _vehW: vehicle?.innerWidthMm,
    })),
    [placements, vehicle],
  )

  if (!vehicle) {
    return <div className={`slp-empty ${className}`}>Araç seçin</div>
  }

  const L = mmToScene(vehicle.innerLengthMm || 13600)

  return (
    <div className={`slp-canvas-wrap ${className}`.trim()}>
      <Suspense fallback={<div className="slp-empty">3D yükleniyor…</div>}>
        <Canvas camera={{ position: [L * 0.9, L * 0.45, L * 0.7], fov: 42 }} shadows>
          <color attach="background" args={['#eef2f7']} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />
          <TruckShell vehicle={vehicle} />
          {enriched.map((p, i) => (
            <PalletMesh key={p.palletId || i} placement={p} color={COLORS[i % COLORS.length]} index={i} />
          ))}
          <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
          <gridHelper args={[Math.max(L * 1.4, 20), 20, '#94a3b8', '#e2e8f0']} position={[0, 0, 0]} />
        </Canvas>
      </Suspense>
    </div>
  )
}
