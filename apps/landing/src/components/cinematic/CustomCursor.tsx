'use client'

import { useEffect, useRef } from 'react'
import { useIsCoarsePointer, usePrefersReducedMotion } from './useCinematicMotion'

/** Extra glow that follows the pointer. Native cursor stays visible. */
export default function CustomCursor() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduce || coarse) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let hover = false
    let raf = 0

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
    }

    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      hover = Boolean(el?.closest('a, button, [role="button"], summary'))
    }

    const tick = () => {
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${hover ? 1.55 : 1})`
      ring.style.opacity = hover ? '0.85' : '0.45'
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
    }
  }, [reduce, coarse])

  if (reduce || coarse) return null

  return (
    <div className="cine-cursor" aria-hidden>
      <div ref={dotRef} className="cine-cursor-dot" />
      <div ref={ringRef} className="cine-cursor-ring" />
    </div>
  )
}
