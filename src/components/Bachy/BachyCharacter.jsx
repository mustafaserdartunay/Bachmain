import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BACHY_ASSET } from '../../bachy/constants'

/**
 * Bachy living card — exact reference texture + procedural micro-motion.
 * Face/hair/fur/shoes stay as in the official sheet (no mesh redesign).
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
  const group = useRef()
  const mesh = useRef()
  const texture = useLoader(THREE.TextureLoader, BACHY_ASSET)
  const { viewport } = useThree()

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }, [texture])

  const aspect = texture.image ? texture.image.width / texture.image.height : 1
  const h = Math.min(2.35, viewport.height * 0.85)
  const w = h * (aspect > 0 ? Math.min(aspect, 1.15) : 0.85)

  useFrame((state) => {
    if (!group.current || !mesh.current) return
    const t = state.clock.elapsedTime
    const breath = 1 + Math.sin(t * 1.55) * 0.012 * intensity
    const sway = Math.sin(t * 0.7) * 0.03 * intensity
    const bob = Math.sin(t * 1.1) * 0.02 * intensity

    let activityBoost = 0
    if (activity === 'mini_dance') activityBoost = Math.sin(t * 8) * 0.08
    if (activity === 'swing_leg') activityBoost = Math.sin(t * 3) * 0.04
    if (activity === 'yawn') activityBoost = Math.sin(t * 0.8) * 0.05
    if (activity === 'sip_coffee') activityBoost = Math.sin(t * 2) * 0.025

    const lookX = followPointer ? THREE.MathUtils.clamp(pointer.x, -0.35, 0.35) * 0.25 : 0
    const lookY = followPointer ? THREE.MathUtils.clamp(pointer.y, -0.35, 0.35) * 0.15 : 0

    const hoverLift = hover ? 0.06 : 0
    const celeb = celebrating ? Math.abs(Math.sin(t * 10)) * 0.1 : 0

    group.current.scale.setScalar(breath + celeb * 0.05)
    group.current.position.y = bob + hoverLift + activityBoost * 0.5
    group.current.rotation.z = sway + activityBoost * 0.4
    mesh.current.rotation.y = lookX
    mesh.current.rotation.x = -lookY

    // Subtle emotion tint via emissive-like opacity pulse
    const mat = mesh.current.material
    if (mat) {
      const pulse =
        emotion === 'celebrating'
          ? 0.08 + Math.sin(t * 6) * 0.04
          : emotion === 'curious'
            ? 0.04
            : hover
              ? 0.05
              : 0.02
      mat.opacity = 0.98
      mat.color.setRGB(1, 1 - pulse * 0.15, 1 - pulse * 0.05)
    }
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[0, 0, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
