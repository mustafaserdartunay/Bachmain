export function Card({ className = '', children, padded = true, ...rest }) {
  return (
    <div
      className={`rounded-ds-lg border border-ds-border bg-ds-surface text-ds-ink shadow-ds-sm ${padded ? 'p-4' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>{children}</div>
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`ds-h3 truncate ${className}`}>{children}</h3>
}

export default Card
