import { useCallback, useLayoutEffect, useRef, useState } from 'react'

export const DROPDOWN_Z_INDEX = 10000

function resolveInsetPx(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || !value.trim()) return 0
  const raw = value.trim()
  if (raw.endsWith('rem')) {
    const rem = Number.parseFloat(raw)
    const root =
      typeof document !== 'undefined'
        ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
        : 16
    return rem * root
  }
  if (raw.endsWith('px')) return Number.parseFloat(raw) || 0
  if (raw.startsWith('var(') && typeof document !== 'undefined') {
    const match = raw.match(/^var\(\s*(--[\w-]+)/)
    if (match) {
      return resolveInsetPx(getComputedStyle(document.documentElement).getPropertyValue(match[1]))
    }
  }
  return Number.parseFloat(raw) || 0
}

export function useAnchoredPortal(
  isOpen,
  {
    placement = 'below',
    matchWidth = true,
    align = 'left',
    width,
    offset = 4,
    /** Distance from viewport bottom the menu must not cross (px, rem, or CSS var). */
    maxBottomInset = 8,
    /** When false, keep opening below even if content is tall (clips via maxHeight). */
    flip = true,
    /** Optional external anchor resolver (used when trigger is hidden). */
    getAnchor = null,
  } = {},
) {
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const [style, setStyle] = useState(null)
  const [isPositioned, setIsPositioned] = useState(false)

  const updatePosition = useCallback(() => {
    const anchor = (typeof getAnchor === 'function' ? getAnchor() : null) || anchorRef.current
    if (!anchor) return

    const rect = anchor.getBoundingClientRect()
    const menuEl = menuRef.current
    const measuredWidth = menuEl?.offsetWidth ?? 0
    const measuredHeight = menuEl?.offsetHeight ?? 0
    const menuWidth = width ?? (matchWidth ? rect.width : measuredWidth)
    const menuHeight = measuredHeight
    const bottomInset = resolveInsetPx(maxBottomInset)
    const bottomLimit = window.innerHeight - bottomInset

    const needsMeasure = !matchWidth && !width
    if (needsMeasure && (!menuEl || measuredWidth === 0)) {
      // Keep clickable if we already showed the menu; only hide on first measure.
      setStyle((prev) =>
        prev?.visibility === 'visible'
          ? prev
          : {
              position: 'fixed',
              top: '0px',
              left: '0px',
              visibility: 'hidden',
              pointerEvents: 'none',
              zIndex: DROPDOWN_Z_INDEX,
            },
      )
      setIsPositioned(false)
      return
    }

    let top = placement === 'above' ? rect.top - menuHeight - offset : rect.bottom + offset

    if (
      flip &&
      placement === 'below' &&
      menuHeight > 0 &&
      top + menuHeight > bottomLimit &&
      rect.top - menuHeight - offset > 8
    ) {
      top = rect.top - menuHeight - offset
    }

    const maxHeight = Math.max(120, bottomLimit - top)

    let left =
      align === 'right'
        ? rect.right - menuWidth
        : align === 'center'
          ? rect.left + rect.width / 2 - menuWidth / 2
          : rect.left

    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8)
    }
    if (left < 8) left = 8

    setStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: matchWidth ? `${rect.width}px` : width ? `${width}px` : undefined,
      minWidth: !matchWidth && !width ? '210px' : undefined,
      maxHeight: `${maxHeight}px`,
      visibility: 'visible',
      pointerEvents: 'auto',
      zIndex: DROPDOWN_Z_INDEX,
    })
    setIsPositioned(true)
  }, [align, flip, getAnchor, matchWidth, maxBottomInset, offset, placement, width])

  useLayoutEffect(() => {
    if (!isOpen) {
      setStyle(null)
      setIsPositioned(false)
      return undefined
    }

    updatePosition()
    const raf = requestAnimationFrame(updatePosition)

    const menuEl = menuRef.current
    let resizeObserver
    if (menuEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updatePosition())
      resizeObserver.observe(menuEl)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  return { anchorRef, menuRef, style, updatePosition, isPositioned }
}
