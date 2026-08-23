'use client'

import { useEffect, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return reduce
}

export function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const apply = () => setCoarse(mq.matches || window.innerWidth < 900)
    apply()
    mq.addEventListener('change', apply)
    window.addEventListener('resize', apply, { passive: true })
    return () => {
      mq.removeEventListener('change', apply)
      window.removeEventListener('resize', apply)
    }
  }, [])

  return coarse
}
