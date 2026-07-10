import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'
import { CARGO_TEXTURES } from '../../utils/shippingConstants'

function CargoPieces({ placements, loadMode }) {
  const isPalet = loadMode === 'palet'
  const boxMap = useTexture(CARGO_TEXTURES.box)
  const palletMap = useTexture(CARGO_TEXTURES.pallet)

  boxMap.wrapS = boxMap.wrapT = THREE.RepeatWrapping
  boxMap.repeat.set(2, 2)
  palletMap.wrapS = palletMap.wrapT = THREE.RepeatWrapping
  palletMap.repeat.set(1, 1)

  return placements.map((placement) => {
    const palet = (placement.loadMode || loadMode) === 'palet'
    return (
      <mesh
        key={placement.id}
        position={[placement.xM, placement.yM, placement.zM]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[placement.lengthM, placement.heightM, placement.widthM]} />
        <meshStandardMaterial
          map={palet ? palletMap : boxMap}
          color={palet ? '#a67c52' : '#d4b896'}
          roughness={palet ? 0.92 : 0.88}
          metalness={0.04}
        />
      </mesh>
    )
  })
}

function TrailerShell({ lengthM, widthM, heightM }) {
  const floorMap = useTexture(CARGO_TEXTURES.trailerFloor)
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping
  floorMap.repeat.set(lengthM / 2, widthM / 2)

  const edgeGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(lengthM, heightM, widthM)),
    [lengthM, widthM, heightM],
  )

  return (
    <group position={[0, heightM / 2, 0]}>
      <mesh position={[0, -heightM / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[lengthM, widthM]} />
        <meshStandardMaterial map={floorMap} roughness={0.95} metalness={0.05} color="#8a7355" />
      </mesh>

      {[
        [0, 0, -widthM / 2, lengthM, heightM, 0.04],
        [0, 0, widthM / 2, lengthM, heightM, 0.04],
        [-lengthM / 2, 0, 0, 0.04, heightM, widthM],
        [lengthM / 2, 0, 0, 0.04, heightM, widthM],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#1e293b" transparent opacity={0.35} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.85} />
      </lineSegments>
    </group>
  )
}

function SceneContent({ vehicle, placements, loadMode }) {
  const lengthM = vehicle?.lengthM || 13.6
  const widthM = vehicle?.widthM || 2.45
  const heightM = vehicle?.heightM || 2.7
  const camPos = [lengthM * 0.35, heightM * 1.8, widthM * 2.4]

  return (
    <>
      <color attach="background" args={['#0b1220']} />
      <fog attach="fog" args={['#0b1220', lengthM * 2, lengthM * 4]} />
      <PerspectiveCamera makeDefault position={camPos} fov={42} near={0.1} far={200} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[lengthM, heightM * 3, widthM]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-lengthM * 0.5, heightM, -widthM]} intensity={0.35} />
      <Environment preset="warehouse" />

      <TrailerShell lengthM={lengthM} widthM={widthM} heightM={heightM} />
      <CargoPieces placements={placements} loadMode={loadMode} />

      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={lengthM * 1.2} blur={2} far={heightM * 2} />
      <OrbitControls
        enablePan
        enableZoom
        minDistance={widthM * 0.8}
        maxDistance={lengthM * 2.5}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, heightM * 0.35, 0]}
      />
    </>
  )
}

export default function CargoLoadScene({ vehicle, placements = [], loadMode = 'koli', className = '' }) {
  if (!vehicle) {
    return (
      <div className={`flex h-[min(520px,60vh)] items-center justify-center rounded-xl border border-dark-500/50 bg-dark-900/80 ${className}`}>
        <p className="text-sm text-gray-500">Araç seçildiğinde 3D önizleme açılır</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-dark-500/50 bg-dark-900 ${className}`}>
      <div className="absolute left-4 top-4 z-10 rounded-lg border border-dark-500/50 bg-dark-900/80 px-3 py-2 backdrop-blur-sm">
        <p className="text-xs font-bold text-white">{vehicle.name}</p>
        <p className="text-[12px] text-gray-500">
          {vehicle.lengthM}×{vehicle.widthM}×{vehicle.heightM} m · {placements.length} parça
        </p>
      </div>
      <p className="absolute bottom-4 right-4 z-10 text-[12px] text-gray-500">
        Sürükle · Yakınlaştır · Döndür
      </p>
      <Canvas shadows dpr={[1, 2]} style={{ height: 'min(520px, 60vh)', width: '100%' }}>
        <Suspense fallback={null}>
          <SceneContent vehicle={vehicle} placements={placements} loadMode={loadMode} />
        </Suspense>
      </Canvas>
    </div>
  )
}
