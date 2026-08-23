'use client'

import { usePrefersReducedMotion } from '../useCinematicMotion'

/** Referans görseldeki perspektif grid zemini — sahne görselinin alt bandı. */
export default function HeroFloor() {
  const reduce = usePrefersReducedMotion()

  return (
    <div className={`cine-hero-floor ${reduce ? 'is-static' : ''}`} aria-hidden>
      <div className="cine-hero-floor-image" />
      <div className="cine-hero-floor-shine" />
    </div>
  )
}
