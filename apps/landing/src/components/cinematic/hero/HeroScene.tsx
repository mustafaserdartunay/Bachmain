'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import HeroCopy from './HeroCopy'
import HeroLiveBackdrop from './HeroLiveBackdrop'
import ParticleField from './ParticleField'
import { usePrefersReducedMotion } from '../useCinematicMotion'

export default function HeroScene() {
  const reduce = usePrefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduce) return
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)

    const copy = root.querySelector('.cine-copy')
    const scrollLayer = root.querySelector('.cine-live-backdrop__scroll')
    const hint = root.querySelector('.cine-scroll-hint')

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: '+=110%',
            pin: true,
            pinSpacing: true,
            scrub: 0.65,
            anticipatePin: 1,
          },
        })
        .to(copy, { y: -48, opacity: 0, ease: 'none' }, 0)
        .to(
          scrollLayer,
          {
            scale: 1.08,
            transformOrigin: '50% 0%',
            ease: 'none',
          },
          0,
        )
        .to(hint, { opacity: 0, ease: 'none' }, 0.1)
    }, root)

    return () => ctx.revert()
  }, [reduce])

  return (
    <section
      ref={rootRef}
      className="cine-hero cine-hero--live"
      aria-labelledby="home-hero-heading"
    >
      <HeroLiveBackdrop />
      {reduce ? null : <ParticleField />}
      <div className="cine-hero-veil" aria-hidden />
      <div className="cine-hero-layout cine-hero-layout--live">
        <HeroCopy />
      </div>
      <div className="cine-scroll-hint" aria-hidden>
        <span />
      </div>
    </section>
  )
}
