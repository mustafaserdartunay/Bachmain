import { forwardRef } from 'react'

const SIZE = {
  sm: 'h-9 min-h-9 px-3 text-ds-small gap-1.5',
  md: 'h-control min-h-control px-4 text-ds-small gap-2',
  lg: 'h-14 min-h-14 px-5 text-ds-body gap-2',
  icon: 'h-control w-control min-h-control min-w-[var(--ds-control-h)] p-0',
  iconOnly: 'h-control w-control min-h-control min-w-[var(--ds-control-h)] p-0',
}

const VARIANT = {
  primary:
    'bg-[linear-gradient(135deg,var(--bach-sky,#79a6d2),var(--bach-navy,#203375))] !text-[#ffffff] hover:brightness-105 shadow-ds-sm border border-transparent',
  secondary:
    'bg-ds-secondary !text-[#ffffff] hover:bg-[var(--ds-secondary-hover)] shadow-ds-sm border border-transparent',
  ghost: 'bg-transparent text-ds-ink hover:bg-ds-surface border border-transparent',
  outline: 'bg-ds-surface text-ds-ink border border-ds-border hover:bg-[var(--ds-surface-muted)]',
  danger: 'bg-ds-danger !text-[#ffffff] hover:opacity-90 border border-transparent',
  success: 'bg-ds-success !text-[#ffffff] hover:opacity-90 border border-transparent',
}

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    disabled = false,
    children,
    ...rest
  },
  ref,
) {
  const sizeClass = SIZE[size] || SIZE.md
  const variantClass = VARIANT[variant] || VARIANT.primary
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-ds-md font-semibold transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
