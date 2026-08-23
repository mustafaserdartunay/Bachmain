'use client'

import { usePrefersReducedMotion } from '../useCinematicMotion'

export default function NeonPortal() {
  const reduce = usePrefersReducedMotion()

  return (
    <div className="cine-portal" aria-hidden>
      <div className={`cine-portal-ring ${reduce ? 'is-static' : ''}`} />
      <div className={`cine-portal-core ${reduce ? 'is-static' : ''}`} />
      <div className="cine-portal-bloom" />
    </div>
  )
}
