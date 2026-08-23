'use client'

import { useEffect, useState } from 'react'

function isIdeWebview() {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('ide') === '1') {
      sessionStorage.setItem('bach-ide-webview', '1')
      return true
    }
    if (sessionStorage.getItem('bach-ide-webview') === '1') return true
  } catch {
    // ignore
  }
  const ua = navigator.userAgent || ''
  return /Electron/i.test(ua) && /Cursor|VSCode|Code\//i.test(ua)
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && isIdeWebview())

  useEffect(() => {
    if (isIdeWebview()) {
      setReduce(true)
      return
    }
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
