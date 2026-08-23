'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import OptimizedImage from '../../seo/OptimizedImage'
import { useIsCoarsePointer, usePrefersReducedMotion } from '../useCinematicMotion'

export default function BachyCharacter() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 46, damping: 22, mass: 0.8 })
  const sy = useSpring(my, { stiffness: 46, damping: 22, mass: 0.8 })
  const rotateY = useTransform(sx, [-1, 1], [-3.4, 3.4])
  const rotateX = useTransform(sy, [-1, 1], [2.2, -2.2])
  const shiftX = useTransform(sx, [-1, 1], [-8, 8])
  const shiftY = useTransform(sy, [-1, 1], [-5, 5])

  useEffect(() => {
    if (reduce || coarse) return
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1)
      my.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [coarse, mx, my, reduce])

  return (
    <motion.div
      className="cine-bachy"
      style={{ rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 900 }}
    >
      <motion.div
        className="cine-bachy-idle"
        animate={
          reduce
            ? undefined
            : {
                y: [0, -7, 0],
                scale: [1, 1.008, 1],
              }
        }
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <OptimizedImage
          src="/bachy/bachy-from-scene.png"
          alt="Bachy — BACHMAIN yapay zeka asistanı"
          width={382}
          height={707}
          priority
          className="cine-bachy-img"
          sizes="(max-width: 768px) 72vw, 28rem"
        />
      </motion.div>
    </motion.div>
  )
}
