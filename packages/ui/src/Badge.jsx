const TONES = {
  default: 'bg-[var(--ds-surface-muted)] text-ds-ink',
  primary: 'bg-[color-mix(in_srgb,var(--ds-primary)_14%,transparent)] text-ds-primary',
  success: 'bg-[color-mix(in_srgb,var(--ds-success)_14%,transparent)] text-ds-success',
  warning: 'bg-[color-mix(in_srgb,var(--ds-warning)_14%,transparent)] text-ds-warning',
  danger: 'bg-[color-mix(in_srgb,var(--ds-danger)_14%,transparent)] text-ds-danger',
  info: 'bg-[color-mix(in_srgb,var(--ds-info)_14%,transparent)] text-ds-info',
}

export function Badge({ tone = 'default', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-ds-caption font-semibold ${TONES[tone] || TONES.default} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
