'use client'

import { useEffect, useRef } from 'react'
import { useIsCoarsePointer, usePrefersReducedMotion } from '../useCinematicMotion'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  tw: number
}

export default function ParticleField() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || reduce) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let running = true
    const mouse = { x: 0.5, y: 0.5 }
    const density = coarse ? 18 : 42
    let particles: Particle[] = []

    const spawn = (): Particle => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00018,
      vy: (Math.random() * -0.00022 - 0.00004) * (Math.random() > 0.45 ? 1 : -0.35),
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.45 + 0.18,
      tw: Math.random() * Math.PI * 2,
    })

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = Array.from({ length: density }, spawn)
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth
      mouse.y = e.clientY / window.innerHeight
    }

    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx + (mouse.x - 0.5) * 0.00012
        p.y += p.vy + (mouse.y - 0.5) * 0.00008
        p.tw += 0.012
        if (p.y < -0.02) p.y = 1.02
        if (p.y > 1.04) p.y = -0.01
        if (p.x < -0.02) p.x = 1.02
        if (p.x > 1.04) p.x = -0.01
        const glow = p.a * (0.72 + Math.sin(p.tw) * 0.28)
        ctx.beginPath()
        ctx.fillStyle = `rgba(186, 230, 255, ${glow})`
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    const onVis = () => {
      running = document.visibilityState === 'visible'
      if (running) raf = requestAnimationFrame(tick)
      else cancelAnimationFrame(raf)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [reduce, coarse])

  if (reduce) return null

  return <canvas ref={canvasRef} className="cine-particles" aria-hidden />
}
