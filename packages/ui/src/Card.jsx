export function Card({ className = '', children, padded = true, ...rest }) {
  return (
    <div
      className={`rounded-ds-card border border-ds-border bg-ds-surface text-ds-ink shadow-ds-layer-2 transition-shadow duration-hover hover:shadow-ds-md ${padded ? 'p-ds-4' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return (
    <div className={`mb-ds-3 flex items-center justify-between gap-ds-3 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`ds-card-title truncate ${className}`}>{children}</h3>
}

export default Card
