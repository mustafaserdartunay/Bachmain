'use client'

import { useEffect, type ReactNode } from 'react'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './useCinematicMotion'

type Props = { children: ReactNode }

export default function SmoothScrollProvider({ children }: Props) {
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    ScrollTrigger.config({ ignoreMobileResize: true })

    if (reduce) {
      ScrollTrigger.refresh()
      return
    }

    let lenis: { raf: (t: number) => void; destroy: () => void; on: Function } | null = null
    let onTick: ((time: number) => void) | null = null
    let cancelled = false

    const boot = async () => {
      const { default: Lenis } = await import('lenis')
      if (cancelled) return

      const instance = new Lenis({
        lerp: 0.075,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
      })
      lenis = instance
      instance.on('scroll', ScrollTrigger.update)

      onTick = (time: number) => {
        instance.raf(time * 1000)
      }
      gsap.ticker.add(onTick)
      gsap.ticker.lagSmoothing(0)
      ScrollTrigger.refresh()
    }

    void boot()

    return () => {
      cancelled = true
      if (onTick) gsap.ticker.remove(onTick)
      lenis?.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [reduce])

  return children
}
