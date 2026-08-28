import { useCallback, useEffect, useState } from 'react'

let activeHeaderPopoverId = null
const subscribers = new Set()

function notifyHeaderPopoverSubscribers() {
  subscribers.forEach((listener) => listener(activeHeaderPopoverId))
}

function setActiveHeaderPopoverId(nextId) {
  activeHeaderPopoverId = nextId
  notifyHeaderPopoverSubscribers()
}

export function closeAllHeaderPopovers() {
  if (!activeHeaderPopoverId) return
  setActiveHeaderPopoverId(null)
}

export function openHeaderPopover(popoverId) {
  setActiveHeaderPopoverId(popoverId)
}

export function toggleHeaderPopover(popoverId) {
  setActiveHeaderPopoverId(activeHeaderPopoverId === popoverId ? null : popoverId)
}

export function HeaderPopoverProvider({ children }) {
  useEffect(() => {
    let pointerDownInsidePopover = false

    function handleDocumentPointerDown(event) {
      pointerDownInsidePopover = Boolean(
        event.target.closest('[data-header-popover]') ||
        event.target.closest('[data-header-popover-trigger]'),
      )
    }

    function handleDocumentClick(event) {
      const startedInside = pointerDownInsidePopover
      pointerDownInsidePopover = false

      if (!activeHeaderPopoverId) return
      if (event.target.closest('[data-header-popover]')) return
      if (event.target.closest('[data-header-popover-trigger]')) return
      if (startedInside) return
      setActiveHeaderPopoverId(null)
    }

    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  return children
}

export function useHeaderPopover(popoverId) {
  const [activeId, setActiveId] = useState(activeHeaderPopoverId)

  useEffect(() => {
    const listener = (nextId) => setActiveId(nextId)
    subscribers.add(listener)
    return () => subscribers.delete(listener)
  }, [])

  const open = activeId === popoverId

  const setOpen = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(activeHeaderPopoverId === popoverId) : next
      if (resolved) {
        setActiveHeaderPopoverId(popoverId)
      } else if (activeHeaderPopoverId === popoverId) {
        setActiveHeaderPopoverId(null)
      }
    },
    [popoverId],
  )

  const toggle = useCallback(() => {
    toggleHeaderPopover(popoverId)
  }, [popoverId])

  return { open, setOpen, toggle }
}
