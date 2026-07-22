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
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 3.2], fov: 35 }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      frameloop="always"
    >
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
