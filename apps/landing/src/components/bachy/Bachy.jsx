import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import BachyCharacter from './BachyCharacter'
import { poseToCharacter, moodToCharacter } from './BachyAnimations'

/**
 * Core living Bachy — WebGL canvas. Drop-in; never covers interactive UI itself
 * (parent must keep pointer-events / layout safe).
 */
export default function Bachy({
  pose = 'idle',
  mood = 'curious',
  celebrating = false,
  hover = false,
  className = '',
  compact = false,
  onClick,
  'aria-label': ariaLabel = 'Bachy',
  interactive = false,
}) {
  const reduce = useReducedMotion()
  const fromPose = useMemo(() => poseToCharacter(pose, hover), [pose, hover])
  const fromMood = useMemo(() => moodToCharacter(mood, celebrating), [mood, celebrating])

  const cfg =
    celebrating || pose === 'celebrate'
      ? fromMood
      : pose === 'login' || pose === 'register'
        ? { ...fromPose, ...fromMood }
        : fromPose

  const shellClass = `bachy-stage relative ${className}`.trim()

  const canvas = (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.05, compact ? 2.55 : 2.75], fov: 30 }}
      style={{ width: '100%', height: '100%', touchAction: 'none', background: 'transparent' }}
      frameloop={reduce ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <ambientLight intensity={0.95} />
      <directionalLight position={[2.2, 3.5, 2.5]} intensity={1.15} />
      <directionalLight position={[-2, 1.2, -1.5]} intensity={0.4} />
      <hemisphereLight args={['#ffffff', '#c8d0dc', 0.45]} />
      <Suspense fallback={null}>
        <BachyCharacter
          emotion={cfg.emotion}
          activity={cfg.activity}
          lookAway={cfg.lookAway}
          point={cfg.point}
          hug={cfg.hug}
          lounge={cfg.lounge}
          sunglasses={cfg.sunglasses}
          lemonade={cfg.lemonade}
          hearts={cfg.hearts}
          celebrating={celebrating}
          intensity={reduce ? 0 : 1}
          reducedMotion={!!reduce}
        />
      </Suspense>
    </Canvas>
  )

  if (interactive || onClick) {
    return (
      <button
        type="button"
        className={`${shellClass} border-0 bg-transparent p-0`}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {canvas}
      </button>
    )
  }

  return (
    <div className={shellClass} aria-hidden={!ariaLabel} aria-label={ariaLabel}>
      {canvas}
    </div>
  )
}
