'use client'

import { usePrefersReducedMotion } from '../useCinematicMotion'

export default function AnimatedGrid() {
  const reduce = usePrefersReducedMotion()

  return (
    <div className="cine-grid" aria-hidden>
      <div className={`cine-grid-floor ${reduce ? 'is-static' : ''}`} />
      <div className="cine-grid-fade" />
      <div className="cine-grid-glow" />
    </div>
  )
}
