import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { DROPDOWN_MENU_PORTAL_CLASS, DROPDOWN_MENU_ITEM_CLASS } from './DropdownMenu'

const ACTION_BTN_BASE =
  'inline-flex h-control min-h-control items-center justify-center gap-2.5 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide transition-colors'
const BTN_CREATE_PLAIN = `${ACTION_BTN_BASE} text-[#3b82f6] hover:text-[#60a5fa]`
const BTN_CREATE_MENU = `${ACTION_BTN_BASE} w-10 gap-0 px-0 text-[#3b82f6] hover:text-[#60a5fa]`

/**
 * Açılır yeni oluştur butonu — zeminsiz, primary mavi yazı/ikon (Kaydet düz stili).
 * Primary click runs onPrimaryClick; chevron opens menuItems.
 *
 * @param {{
 *   label: string,
 *   onPrimaryClick: () => void,
 *   menuItems: Array<{ id: string, label: string, icon?: import('react').ComponentType<{ className?: string }>, iconClassName?: string, onClick: () => void }>,
 *   menuAriaLabel?: string,
 *   className?: string,
 * }} props
 */
export default function SplitCreateButton({
  label,
  onPrimaryClick,
  menuItems = [],
  menuAriaLabel = 'Oluşturma seçenekleri',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(event) {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative z-50 inline-flex ${className}`.trim()}>
      <div className="flex items-center">
        <button type="button" onClick={onPrimaryClick} className={BTN_CREATE_PLAIN}>
          <Plus className="h-4 w-4" />
          {label}
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={BTN_CREATE_MENU}
          aria-label={menuAriaLabel}
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open ? (
        <div
          className={`absolute right-0 top-full z-[120] mt-2 w-56 ${DROPDOWN_MENU_PORTAL_CLASS}`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick?.()
                }}
                className={`${DROPDOWN_MENU_ITEM_CLASS} text-[#3b82f6]`}
              >
                {Icon ? (
                  <Icon className={`h-4 w-4 ${item.iconClassName || 'text-[#3b82f6]'}`} />
                ) : null}
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
