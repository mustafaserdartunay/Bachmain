import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import BachyCharacter from './BachyCharacter'

export default function BachyCanvas({
  emotion,
  activity,
  hover,
  pointer,
  followPointer,
  intensity,
  celebrating,
  compact = false,
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.05, compact ? 2.45 : 2.7], fov: 30 }}
      style={{ width: '100%', height: '100%', touchAction: 'none', background: 'transparent' }}
      frameloop="always"
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[2.2, 3.5, 2.5]} intensity={1.2} />
      <directionalLight position={[-2, 1.2, -1.5]} intensity={0.4} />
      <hemisphereLight args={['#ffffff', '#c8d0dc', 0.45]} />
      <Suspense fallback={null}>
        <BachyCharacter
          emotion={emotion}
          activity={activity}
          hover={hover}
          pointer={pointer}
          followPointer={followPointer}
          intensity={intensity}
          celebrating={celebrating}
        />
      </Suspense>
    </Canvas>
  )
}
