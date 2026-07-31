import { useEffect, useState } from 'react'
import { DROPDOWN_Z_INDEX } from './useAnchoredPortal'

let handoff = null
const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener(handoff))
}

/** Capture Hızlı Araçlar panel rect before closing it for a nested header tool. */
export function publishMobileToolsHandoff(forId, rect) {
  if (!forId || !rect) {
    handoff = null
    notify()
    return
  }
  handoff = {
    for: forId,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
  notify()
}

export function clearMobileToolsHandoff(forId) {
  if (!handoff) return
  if (forId && handoff.for !== forId) return
  handoff = null
  notify()
}

export function useMobileToolsHandoff(forId) {
  const [value, setValue] = useState(() => (handoff?.for === forId ? handoff : null))

  useEffect(() => {
    const listener = (next) => {
      setValue(next?.for === forId ? next : null)
    }
    listeners.add(listener)
    listener(handoff)
    return () => listeners.delete(listener)
  }, [forId])

  return value
}

/** Align nested popover to the top edge of the closed Hızlı Araçlar panel. */
export function styleFromMobileToolsHandoff(rect, { maxBottomInset = 8 } = {}) {
  if (!rect || typeof window === 'undefined') return null
  const bottomLimit = window.innerHeight - maxBottomInset
  const maxHeight = Math.max(120, bottomLimit - rect.top)
  const width = Math.min(rect.width, window.innerWidth - 16)
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
  return {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
    visibility: 'visible',
    pointerEvents: 'auto',
    zIndex: DROPDOWN_Z_INDEX,
    ['--bach-handoff-top']: `${rect.top}px`,
    ['--bach-handoff-left']: `${left}px`,
    ['--bach-handoff-width']: `${width}px`,
    ['--bach-handoff-max-height']: `${maxHeight}px`,
  }
}
