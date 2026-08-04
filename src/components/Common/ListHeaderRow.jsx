export default function ListHeaderRow({ columns, gridTemplate, className = '', variant = 'card' }) {
  const shellClass =
    variant === 'plain'
      ? `grid ${className}`
      : `glass-inset grid items-center gap-2 rounded-2xl px-3 py-3 text-[14px] font-normal uppercase leading-tight tracking-normal text-[var(--muted)] ${className}`

  return (
    <div
      className={shellClass}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {columns.map((column, index) => {
        const config = typeof column === 'string' ? { label: column } : column
        const alignClass = config.align === 'right'
          ? 'block w-full text-right'
          : config.align === 'center'
            ? 'block w-full text-center'
            : 'block w-full text-left'
        const className = [alignClass, config.className].filter(Boolean).join(' ')
        return (
          <span key={`${config.label || 'empty'}-${index}`} className={className || undefined}>
            {config.content ?? config.label}
          </span>
        )
      })}
    </div>
  )
}
