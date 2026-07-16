import { useId, useState } from 'react'

export function Tooltip({ content, children, side = 'top', className = '' }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const pos =
    side === 'bottom'
      ? 'top-full left-1/2 mt-2 -translate-x-1/2'
      : side === 'left'
        ? 'right-full top-1/2 mr-2 -translate-y-1/2'
        : side === 'right'
          ? 'left-full top-1/2 ml-2 -translate-y-1/2'
          : 'bottom-full left-1/2 mb-2 -translate-x-1/2'

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && content ? (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-dropdown whitespace-nowrap rounded-ds-sm bg-ds-ink px-2 py-1 text-ds-caption text-white shadow-ds-md ${pos}`}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}

export default Tooltip
