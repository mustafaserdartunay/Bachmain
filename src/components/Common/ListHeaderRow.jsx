export default function ListHeaderRow({ columns, gridTemplate, className = '', variant = 'card' }) {
  const shellClass =
    variant === 'plain'
      ? `grid ${className}`
      : `grid items-center gap-2 rounded-2xl border border-dark-500/40 bg-dark-800/70 px-3 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 ${className}`

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
