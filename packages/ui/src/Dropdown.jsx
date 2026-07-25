import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

const MENU_SHELL = 'app-dropdown-portal min-w-[210px] rounded-ds-dropdown p-2 shadow-ds-layer-2'
const MENU_ITEM =
  'flex w-full items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-extrabold tracking-wide text-gray-300 transition-colors hover:text-white'
const MENU_ITEM_DANGER =
  'flex w-full items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-extrabold tracking-wide text-[#e11d48] transition-colors'

export function Dropdown({
  trigger,
  children,
  align = 'start',
  className = '',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: align === 'end' ? rect.right : rect.left,
      width: rect.width,
    })
  }, [open, align])

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: pos.top,
                left: align === 'end' ? undefined : pos.left,
                right: align === 'end' ? window.innerWidth - pos.left : undefined,
                minWidth: Math.max(pos.width, 210),
                zIndex: 10000,
              }}
              className={`${MENU_SHELL} ${menuClassName}`.trim()}
              role="menu"
            >
              {typeof children === 'function'
                ? children({ close: () => setOpen(false) })
                : children}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export function DropdownItem({ icon: Icon, label, onClick, tone = 'default', close }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={tone === 'danger' ? MENU_ITEM_DANGER : MENU_ITEM}
      onClick={() => {
        onClick?.()
        close?.()
      }}
    >
      {Icon ? (
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center ${
            tone === 'danger' ? 'text-[#e11d48]' : 'text-gray-300'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  )
}

export function DropdownTriggerButton({ label = 'Menü', className = '' }) {
  return (
    <button
      type="button"
      className={`inline-flex h-control min-h-control items-center gap-2 rounded-ds-md border border-ds-border bg-ds-surface px-3 text-ds-small font-semibold text-ds-ink ${className}`}
    >
      {label}
      <ChevronDown className="h-4 w-4 text-ds-muted" />
    </button>
  )
}

export default Dropdown
