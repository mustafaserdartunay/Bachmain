'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import OptimizedImage from '../../seo/OptimizedImage'
import { useIsCoarsePointer, usePrefersReducedMotion } from '../useCinematicMotion'

/** Kullanıcı referans görseli — grid zemin + neon halka + Bachy (tek sahne). */
const HERO_SCENE = '/bachy/bachy-hero-scene.jpg'

export default function HeroSceneVisual() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const wrapRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 42, damping: 20, mass: 0.85 })
  const sy = useSpring(my, { stiffness: 42, damping: 20, mass: 0.85 })
  const x = useTransform(sx, [-1, 1], [-14, 14])
  const y = useTransform(sy, [-1, 1], [-8, 8])
  const rotateY = useTransform(sx, [-1, 1], [-2.5, 2.5])

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
    <div ref={wrapRef} className="cine-hero-visual">
      <motion.div
        className="cine-hero-visual-motion"
        style={{ x, y, rotateY, transformPerspective: 1200 }}
        animate={
          reduce
            ? undefined
            : {
                y: [0, -6, 0],
                scale: [1, 1.006, 1],
              }
        }
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <OptimizedImage
          src={HERO_SCENE}
          alt="Bachy — futuristik grid zemin ve neon portal"
          width={1024}
          height={571}
          priority
          className="cine-hero-scene-img"
          sizes="(max-width: 768px) 100vw, 58vw"
        />
      </motion.div>
      <div className="cine-hero-visual-glow" aria-hidden />
    </div>
  )
}
