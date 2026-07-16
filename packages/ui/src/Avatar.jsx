export function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'h-8 w-8 text-ds-caption',
    md: 'h-10 w-10 text-ds-small',
    lg: 'h-12 w-12 text-ds-body',
  }[size] || 'h-10 w-10 text-ds-small'

  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--ds-surface-muted)] font-semibold text-ds-ink ${sizeClass} ${className}`}
      aria-hidden={!name}
    >
      {initials}
    </span>
  )
}

export default Avatar
