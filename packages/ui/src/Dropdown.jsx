import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

/** System-wide az glass shell — EditableDropdownPill / filter menus ile aynı kabuk */
export const DROPDOWN_PORTAL_SHELL_CLASS =
  'app-dropdown-portal glass-inset az min-w-[210px] rounded-[16px] p-2'

const TONE_CLASS = {
  danger: 'text-[#ef4444] hover:bg-transparent hover:text-[#dc2626]',
  primary: 'text-[#2563eb] hover:bg-transparent hover:text-[#1d4ed8]',
  success: 'text-[#10b981] hover:bg-transparent hover:text-[#047857]',
  orange: 'text-[#ea580c] hover:bg-transparent hover:text-[#c2410c]',
  default: 'text-[var(--muted)] hover:bg-transparent',
}

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
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: undefined })

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

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return undefined

    function place() {
      const triggerEl = rootRef.current
      const menuEl = menuRef.current
      if (!triggerEl || !menuEl) return

      const rect = triggerEl.getBoundingClientRect()
      const gap = 6
      const viewportPad = 8
      const bottomLimit = window.innerHeight - viewportPad
      const menuHeight = menuEl.offsetHeight || 280

      let top = rect.bottom + gap
      const opensUp =
        top + menuHeight > bottomLimit && rect.top - menuHeight - gap > viewportPad
      if (opensUp) {
        top = Math.max(viewportPad, rect.top - menuHeight - gap)
      }

      const maxHeight = Math.max(120, bottomLimit - top)
      setPos({
        top,
        left: align === 'end' ? rect.right : rect.left,
        width: rect.width,
        maxHeight,
      })
    }

    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align, children])

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
                maxHeight: pos.maxHeight,
                overflowY: 'auto',
                zIndex: 10000,
              }}
              className={`${DROPDOWN_PORTAL_SHELL_CLASS} ${menuClassName}`.trim()}
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
  const toneClass = TONE_CLASS[tone] || TONE_CLASS.default
  return (
    <button
      type="button"
      role="menuitem"
      title={label}
      data-tone={tone}
      className={`flex w-full origin-left items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-normal leading-[14px] tracking-normal transition-[transform,background-color,color] hover:scale-110 ${toneClass}`}
      onClick={() => {
        onClick?.()
        close?.()
      }}
    >
      {Icon ? (
        <Icon className="h-[14px] w-[14px] shrink-0" strokeWidth={2.25} aria-hidden />
      ) : null}
      <span className="min-w-0 truncate leading-[14px]">{label}</span>
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
