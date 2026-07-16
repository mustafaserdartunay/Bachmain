const TONES = {
  info: 'border-ds-info/30 bg-[color-mix(in_srgb,var(--ds-info)_10%,transparent)] text-ds-info',
  success: 'border-ds-success/30 bg-[color-mix(in_srgb,var(--ds-success)_10%,transparent)] text-ds-success',
  warning: 'border-ds-warning/30 bg-[color-mix(in_srgb,var(--ds-warning)_10%,transparent)] text-ds-warning',
  danger: 'border-ds-danger/30 bg-[color-mix(in_srgb,var(--ds-danger)_10%,transparent)] text-ds-danger',
}

export function Alert({ tone = 'info', title, children, className = '' }) {
  return (
    <div className={`rounded-ds-lg border px-4 py-3 ${TONES[tone] || TONES.info} ${className}`} role="alert">
      {title ? <p className="text-ds-small font-semibold">{title}</p> : null}
      {children ? <div className={`text-ds-small ${title ? 'mt-1 opacity-90' : ''}`}>{children}</div> : null}
    </div>
  )
}

export default Alert
