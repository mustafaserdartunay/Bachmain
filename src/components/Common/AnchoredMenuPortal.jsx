import { createPortal } from 'react-dom'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

export default function AnchoredMenuPortal({
  isOpen,
  children,
  className = '',
  placement = 'below',
  matchWidth = true,
  align = 'left',
  width,
  anchorRef: externalAnchorRef,
  menuRef: externalMenuRef,
  style: externalStyle,
}) {
  const internal = useAnchoredPortal(isOpen, { placement, matchWidth, align, width })
  const anchorRef = externalAnchorRef ?? internal.anchorRef
  const menuRef = externalMenuRef ?? internal.menuRef
  const style = externalStyle ?? internal.style

  if (!isOpen || !style) return null

  return createPortal(
    <div
      ref={menuRef}
      style={style}
      className={className}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  )
}

export { useAnchoredPortal }
