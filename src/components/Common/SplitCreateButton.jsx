import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

/**
 * Açılır yeni oluştur butonu — tek gövde, beyaz dikey ayırıcı, hover lift.
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
      <div className="btn-split">
        <button
          type="button"
          onClick={onPrimaryClick}
          className={`${BTN_PRIMARY} gap-2.5 px-3 tracking-wide`}
        >
          <Plus className="h-4 w-4" />
          {label}
        </button>
        <span className="btn-split-divider" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`${BTN_PRIMARY} w-14 px-0`}
          aria-label={menuAriaLabel}
          aria-expanded={open}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open ? (
        <div className="absolute right-0 top-full z-[120] mt-2 min-w-[220px] overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800 shadow-xl">
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
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition-colors hover:bg-dark-700"
              >
                {Icon ? <Icon className={`h-4 w-4 ${item.iconClassName || 'text-blue-300'}`} /> : null}
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
