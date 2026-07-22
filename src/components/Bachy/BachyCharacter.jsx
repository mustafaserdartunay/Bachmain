import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const FUR = '#f7f7f7'
const FUR_SHADOW = '#e8e8ea'
const HAIR = '#2f6fd4'
const HAIR_DARK = '#1e4fa8'
const EYE = '#3d7ad9'
const GLOVE = '#ffe14a'
const SHOE = '#3a78d4'
const NEON = '#5cf0ff'
const SKIN = '#f0c9b0'
const TOOTH = '#ffffff'

function HairSpike({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow>
      <coneGeometry args={[0.12, 0.42, 7]} />
      <meshStandardMaterial color={HAIR} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

function Glove({ side = 1 }) {
  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[0.1, 0.1, 6, 10]} />
        <meshStandardMaterial color={GLOVE} roughness={0.4} />
      </mesh>
      {[0.07, 0, -0.07].map((z, i) => (
        <mesh key={i} position={[0.08 * side, -0.07, z]} castShadow>
          <capsuleGeometry args={[0.03, 0.05, 4, 6]} />
          <meshStandardMaterial color={GLOVE} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.02 * side, -0.01, 0.1]} castShadow>
        <capsuleGeometry args={[0.035, 0.045, 4, 6]} />
        <meshStandardMaterial color={GLOVE} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Shoe({ side = 1 }) {
  const x = 0.16 * side
  return (
    <group position={[x, -0.92, 0.06]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.14, 0.32]} />
        <meshStandardMaterial color={SHOE} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.05, 0.02]}>
        <boxGeometry args={[0.21, 0.03, 0.34]} />
        <meshStandardMaterial color={NEON} emissive={NEON} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0, 0.02, -0.14]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#f5f7fa" roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Single living 3D Bachy — proportions from official turnaround sheet.
 * Not a flat sprite of the sheet; a real mesh character.
 */
export default function BachyCharacter({
  emotion = 'idle',
  activity = 'wait_user',
  hover = false,
  pointer = { x: 0, y: 0 },
  followPointer = true,
  intensity = 1,
  celebrating = false,
}) {
  const root = useRef()
  const head = useRef()
  const body = useRef()
  const leftArm = useRef()
  const rightArm = useRef()

  const smileOpen = useMemo(() => {
    if (emotion === 'celebrating' || hover || emotion === 'happy') return 0.04
    if (emotion === 'surprised') return 0.07
    return 0.02
  }, [emotion, hover])

  useFrame((state) => {
    if (!root.current) return
    const t = state.clock.elapsedTime
    const breath = 1 + Math.sin(t * 1.6) * 0.018 * intensity
    const bob = Math.sin(t * 1.15) * 0.02 * intensity

    let dance = 0
    let armWave = 0
    if (activity === 'mini_dance' || celebrating) {
      dance = Math.sin(t * 9) * 0.12
      armWave = Math.sin(t * 10) * 0.55
    } else if (activity === 'swing_leg') {
      dance = Math.sin(t * 3.2) * 0.05
    } else if (hover) {
      armWave = Math.sin(t * 6) * 0.35
    }

    root.current.position.y = bob
    root.current.rotation.y = dance * 0.35
    if (body.current) body.current.scale.set(breath, 1 + (breath - 1) * 0.6, breath)

    const lookX = followPointer ? THREE.MathUtils.clamp(pointer.x, -1, 1) * 0.45 : 0
    const lookY = followPointer ? THREE.MathUtils.clamp(pointer.y, -1, 1) * 0.25 : 0
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, lookX, 0.12)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -lookY, 0.12)
    }
    if (leftArm.current) leftArm.current.rotation.z = 0.35 + armWave
    if (rightArm.current) rightArm.current.rotation.z = -0.35 - armWave * 0.85
  })

  return (
    <group ref={root} position={[0, -0.05, 0]} scale={0.95}>
      {/* Body — pear / egg silhouette */}
      <group ref={body}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial color={FUR} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={FUR} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.45, 0]} castShadow>
          <sphereGeometry args={[0.36, 28, 28]} />
          <meshStandardMaterial color={FUR_SHADOW} roughness={0.9} />
        </mesh>
        {/* Back B mark */}
        <mesh position={[0, -0.35, -0.34]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color="#c5c5c8" roughness={0.7} />
        </mesh>
      </group>

      {/* Head features */}
      <group ref={head} position={[0, 0.28, 0]}>
        {/* Blue mane */}
        <group position={[0, 0.28, 0]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <sphereGeometry args={[0.28, 20, 20]} />
            <meshStandardMaterial color={HAIR_DARK} roughness={0.5} />
          </mesh>
          <HairSpike position={[0, 0.38, 0.05]} scale={1.15} />
          <HairSpike position={[-0.16, 0.32, 0.08]} rotation={[0, 0, 0.35]} scale={0.95} />
          <HairSpike position={[0.16, 0.32, 0.08]} rotation={[0, 0, -0.35]} scale={0.95} />
          <HairSpike position={[-0.22, 0.22, -0.05]} rotation={[0.2, 0, 0.55]} scale={0.85} />
          <HairSpike position={[0.22, 0.22, -0.05]} rotation={[0.2, 0, -0.55]} scale={0.85} />
          <HairSpike position={[0, 0.28, -0.16]} rotation={[0.45, 0, 0]} scale={0.9} />
          <HairSpike position={[-0.1, 0.34, 0.18]} rotation={[-0.2, 0, 0.2]} scale={0.75} />
          <HairSpike position={[0.1, 0.34, 0.18]} rotation={[-0.2, 0, -0.2]} scale={0.75} />
        </group>

        {/* Brows */}
        <mesh position={[-0.12, 0.16, 0.32]} rotation={[0.2, 0, 0.15]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh position={[0.12, 0.16, 0.32]} rotation={[0.2, 0, -0.15]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>

        {/* Eyes */}
        <group position={[-0.11, 0.06, 0.34]}>
          <mesh>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial color={EYE} roughness={0.25} />
          </mesh>
          <mesh position={[0.02, -0.01, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#152033" />
          </mesh>
          <mesh position={[0.04, 0.03, 0.07]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        <group position={[0.11, 0.06, 0.34]}>
          <mesh>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial color={EYE} roughness={0.25} />
          </mesh>
          <mesh position={[-0.02, -0.01, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#152033" />
          </mesh>
          <mesh position={[0.03, 0.03, 0.07]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* Smile */}
        <mesh position={[0, -0.08, 0.35]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.14, 0.035 + smileOpen, 10, 24, Math.PI]} />
          <meshStandardMaterial color="#2a2430" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.1, 0.36]}>
          <boxGeometry args={[0.18, 0.04, 0.04]} />
          <meshStandardMaterial color={TOOTH} roughness={0.35} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.34, 0.05, 0]} rotation={[0, 0, 0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0.34, 0.05, 0]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={leftArm} position={[-0.38, -0.05, 0]} rotation={[0, 0, 0.4]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.18, 6, 10]} />
          <meshStandardMaterial color={FUR} roughness={0.85} />
        </mesh>
        <group position={[0, -0.26, 0.04]}>
          <Glove side={-1} />
        </group>
      </group>
      <group ref={rightArm} position={[0.38, -0.05, 0]} rotation={[0, 0, -0.4]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.18, 6, 10]} />
          <meshStandardMaterial color={FUR} roughness={0.85} />
        </mesh>
        <group position={[0, -0.26, 0.04]}>
          <Glove side={1} />
        </group>
      </group>

      {/* Legs */}
      <mesh position={[-0.14, -0.72, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.16, 6, 8]} />
        <meshStandardMaterial color={FUR} roughness={0.85} />
      </mesh>
      <mesh position={[0.14, -0.72, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.16, 6, 8]} />
        <meshStandardMaterial color={FUR} roughness={0.85} />
      </mesh>
      <Shoe side={-1} />
      <Shoe side={1} />
    </group>
  )
}
