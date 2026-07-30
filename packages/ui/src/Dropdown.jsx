import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

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
                minWidth: Math.max(pos.width, 180),
                zIndex: 1000,
              }}
              className={`rounded-ds-lg border border-ds-border bg-ds-surface p-1.5 shadow-ds-lg ${menuClassName}`}
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
  const toneClass =
    tone === 'danger'
      ? 'text-ds-danger'
      : tone === 'primary'
        ? 'text-blue-600'
        : tone === 'success'
          ? 'text-emerald-600'
          : 'text-ds-ink'
  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full items-center gap-2 rounded-ds-md px-3 py-2 text-left text-ds-small font-semibold transition-colors duration-hover hover:bg-[var(--ds-surface-muted)] ${toneClass}`}
      onClick={() => {
        onClick?.()
        close?.()
      }}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
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
