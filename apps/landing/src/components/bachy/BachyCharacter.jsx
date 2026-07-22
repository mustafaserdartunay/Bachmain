import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { idleMotion } from './BachyAnimations'

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

function Shoe({ side = 1, neonMat }) {
  const x = 0.16 * side
  return (
    <group position={[x, -0.92, 0.06]}>
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.14, 0.32]} />
        <meshStandardMaterial color={SHOE} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.05, 0.02]} ref={neonMat}>
        <boxGeometry args={[0.21, 0.03, 0.34]} />
        <meshStandardMaterial color={NEON} emissive={NEON} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0.08 * side, 0.02, 0.02]} rotation={[0, 0, side * 0.2]}>
        <boxGeometry args={[0.02, 0.06, 0.28]} />
        <meshStandardMaterial color={NEON} emissive={NEON} emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.02, -0.14]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#f5f7fa" roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Living 3D Bachy — palette/proportions from official character reference.
 * Procedural mesh (not static PNG).
 */
export default function BachyCharacter({
  emotion = 'idle',
  activity = 'wait_user',
  lookAway = false,
  point = false,
  hug = false,
  lounge = false,
  sunglasses = false,
  lemonade = false,
  hearts = false,
  celebrating = false,
  intensity = 1,
  reducedMotion = false,
}) {
  const root = useRef()
  const head = useRef()
  const body = useRef()
  const hair = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftEar = useRef()
  const rightEar = useRef()
  const leftBrow = useRef()
  const rightBrow = useRef()
  const leftLid = useRef()
  const rightLid = useRef()
  const leftShoeNeon = useRef()
  const rightShoeNeon = useRef()
  const leftLeg = useRef()
  const heartGroup = useRef()

  const smileOpen = useMemo(() => {
    if (emotion === 'celebrating' || emotion === 'happy' || celebrating) return 0.045
    if (emotion === 'surprised') return 0.07
    if (emotion === 'shy') return 0.01
    return 0.02
  }, [emotion, celebrating])

  useFrame((state) => {
    if (!root.current || reducedMotion) return
    const t = state.clock.elapsedTime
    const m = idleMotion(t, intensity)

    let dance = 0
    let armL = point || activity === 'point' ? 0.95 : 0.35
    let armR = point || activity === 'point' ? -1.15 : -0.35
    let armWave = 0
    let lean = 0

    if (activity === 'mini_dance' || celebrating) {
      dance = Math.sin(t * 9) * 0.12
      armWave = Math.sin(t * 10) * 0.55
      armL = 0.55 + armWave
      armR = -0.55 - armWave * 0.85
    } else if (activity === 'hop') {
      dance = Math.abs(Math.sin(t * 6)) * 0.08
      armL = 0.7
      armR = -0.7
    } else if (activity === 'hug' || activity === 'hug_tight') {
      lean = activity === 'hug_tight' ? 0.22 : 0.12
      armL = 1.35
      armR = -1.35
    } else if (activity === 'lounge') {
      lean = -0.08
      armL = 0.15
      armR = -0.9
      if (leftLeg.current) leftLeg.current.rotation.x = 0.35 + Math.sin(t * 2.2) * 0.12
    } else if (activity === 'vip_salute') {
      armR = -2.1
      armL = 0.25
      dance = Math.sin(t * 4) * 0.04
    } else if (activity === 'point') {
      armR = -1.35 + Math.sin(t * 2) * 0.05
      armL = 0.55
      lean = 0.08
    } else if (activity === 'swing_leg') {
      if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(t * 2.4) * 0.2
    }

    root.current.position.y = m.bob + (activity === 'hop' ? dance : 0)
    root.current.rotation.y = dance * 0.35
    root.current.rotation.z = lean * 0.15

    if (body.current) {
      body.current.scale.set(m.breath, 1 + (m.breath - 1) * 0.55, m.breath)
    }

    const lookX = lookAway ? -0.55 : 0.08
    const lookY = lookAway ? 0.12 : emotion === 'shy' ? -0.05 : 0
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, lookX, 0.1)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, -lookY, 0.1)
    }

    if (hair.current) hair.current.rotation.z = m.hair
    if (leftEar.current) leftEar.current.rotation.z = 0.4 + m.ear
    if (rightEar.current) rightEar.current.rotation.z = -0.4 - m.ear
    if (leftBrow.current) leftBrow.current.position.y = 0.16 + m.brow
    if (rightBrow.current) rightBrow.current.position.y = 0.16 + m.brow * 0.8

    const lid = m.blink ? 0.085 : 0.001
    if (leftLid.current)
      leftLid.current.scale.y = THREE.MathUtils.lerp(leftLid.current.scale.y, lid / 0.04, 0.35)
    if (rightLid.current)
      rightLid.current.scale.y = THREE.MathUtils.lerp(rightLid.current.scale.y, lid / 0.04, 0.35)

    if (leftArm.current)
      leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, armL, 0.12)
    if (rightArm.current)
      rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, armR, 0.12)

    ;[leftShoeNeon, rightShoeNeon].forEach((ref) => {
      if (ref.current?.material) {
        ref.current.material.emissiveIntensity = m.neon
      }
    })

    if (heartGroup.current && hearts) {
      heartGroup.current.visible = true
      heartGroup.current.position.y = 0.55 + Math.sin(t * 3) * 0.06
      heartGroup.current.rotation.y = t * 0.8
    } else if (heartGroup.current) {
      heartGroup.current.visible = false
    }
  })

  return (
    <group ref={root} position={[0, -0.05, 0]} scale={0.95}>
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
        <mesh position={[0, -0.35, -0.34]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.07, 16]} />
          <meshStandardMaterial color="#c5c5c8" roughness={0.7} />
        </mesh>
      </group>

      <group ref={head} position={[0, 0.28, 0]}>
        <group ref={hair} position={[0, 0.28, 0]}>
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
        </group>

        <mesh ref={leftBrow} position={[-0.12, 0.16, 0.32]} rotation={[0.2, 0, 0.15]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>
        <mesh ref={rightBrow} position={[0.12, 0.16, 0.32]} rotation={[0.2, 0, -0.15]}>
          <capsuleGeometry args={[0.025, 0.08, 4, 8]} />
          <meshStandardMaterial color={HAIR} />
        </mesh>

        <group position={[-0.11, 0.06, 0.34]}>
          <mesh>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshStandardMaterial color={EYE} roughness={0.25} />
          </mesh>
          <mesh position={[0.02, -0.01, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#152033" />
          </mesh>
          <mesh ref={leftLid} position={[0, 0.06, 0.05]} scale={[1, 0.05, 1]}>
            <boxGeometry args={[0.16, 0.04, 0.06]} />
            <meshStandardMaterial color={FUR} />
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
          <mesh ref={rightLid} position={[0, 0.06, 0.05]} scale={[1, 0.05, 1]}>
            <boxGeometry args={[0.16, 0.04, 0.06]} />
            <meshStandardMaterial color={FUR} />
          </mesh>
        </group>

        <mesh position={[0, -0.08, 0.35]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.14, 0.035 + smileOpen, 10, 24, Math.PI]} />
          <meshStandardMaterial color="#2a2430" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.1, 0.36]}>
          <boxGeometry args={[0.18, 0.04, 0.04]} />
          <meshStandardMaterial color={TOOTH} roughness={0.35} />
        </mesh>

        <mesh ref={leftEar} position={[-0.34, 0.05, 0]} rotation={[0, 0, 0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh ref={rightEar} position={[0.34, 0.05, 0]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>

        {sunglasses ? (
          <group position={[0, 0.07, 0.38]}>
            <mesh position={[-0.11, 0, 0]}>
              <boxGeometry args={[0.14, 0.08, 0.04]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.25} />
            </mesh>
            <mesh position={[0.11, 0, 0]}>
              <boxGeometry args={[0.14, 0.08, 0.04]} />
              <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.03]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </group>
        ) : null}
      </group>

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
        {lemonade ? (
          <group position={[0.02, -0.38, 0.08]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.045, 0.12, 12]} />
              <meshStandardMaterial color="#fde68a" transparent opacity={0.85} />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.02, 0.12, 0]} rotation={[0.2, 0, 0.3]}>
              <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
        ) : null}
      </group>

      <mesh ref={leftLeg} position={[-0.14, -0.72, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.16, 6, 8]} />
        <meshStandardMaterial color={FUR} roughness={0.85} />
      </mesh>
      <mesh position={[0.14, -0.72, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.16, 6, 8]} />
        <meshStandardMaterial color={FUR} roughness={0.85} />
      </mesh>
      <Shoe side={-1} neonMat={leftShoeNeon} />
      <Shoe side={1} neonMat={rightShoeNeon} />

      <group ref={heartGroup} position={[0.35, 0.55, 0.2]} visible={false}>
        <mesh scale={0.08}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.12, 0.08, 0]} scale={0.055}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#fda4af" emissive="#fda4af" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  )
}
