import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { DROPDOWN_MENU_PORTAL_CLASS, DropdownMenuItem } from './DropdownMenu'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

const ACTION_BTN_BASE =
  'inline-flex h-control min-h-control items-center justify-center gap-2.5 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide transition-colors'
const BTN_CREATE_PLAIN = `${ACTION_BTN_BASE} text-[#3b82f6] hover:text-[#60a5fa]`
const BTN_CREATE_MENU = `${ACTION_BTN_BASE} w-10 gap-0 px-0 text-[#3b82f6] hover:text-[#60a5fa]`

/**
 * Açılır yeni oluştur butonu — zeminsiz, primary mavi yazı/ikon.
 * menuItems varsa chevron + portal menü; yoksa yalnızca ana buton.
 */
export default function SplitCreateButton({
  label,
  onPrimaryClick,
  menuItems = [],
  menuAriaLabel = 'Oluşturma seçenekleri',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const hasMenu = menuItems.length > 0
  const { anchorRef, menuRef, style, isPositioned } = useAnchoredPortal(open && hasMenu, {
    placement: 'below',
    matchWidth: false,
    align: 'right',
    offset: 8,
  })

  useEffect(() => {
    if (!open || !hasMenu) return undefined
    function handleClick(event) {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return
      }
      setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, hasMenu, anchorRef, menuRef])

  return (
    <div ref={anchorRef} className={`relative z-50 inline-flex ${className}`.trim()}>
      <div className="flex items-center">
        <button type="button" onClick={onPrimaryClick} className={BTN_CREATE_PLAIN}>
          <Plus className="h-4 w-4" />
          {label}
        </button>
        {hasMenu ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={BTN_CREATE_MENU}
            aria-label={menuAriaLabel}
            aria-expanded={open}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        ) : null}
      </div>
      {hasMenu && open
        ? createPortal(
            <div
              ref={menuRef}
              style={style || undefined}
              className={`${DROPDOWN_MENU_PORTAL_CLASS}${isPositioned ? '' : ' invisible'}`}
            >
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  iconTone="text-gray-300"
                  onClick={() => {
                    setOpen(false)
                    item.onClick?.()
                  }}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
