import { forwardRef } from 'react'

const SIZE = {
  sm: 'h-10 min-h-10 px-3 text-[length:var(--ds-font-button)] gap-1.5',
  md: 'h-control min-h-control px-4 text-[length:var(--ds-font-button)] gap-2',
  lg: 'h-control min-h-control px-5 text-[length:var(--ds-font-button)] gap-2',
  icon: 'h-control w-control min-h-control min-w-[var(--ds-control-h)] p-0',
  iconOnly: 'h-control w-control min-h-control min-w-[var(--ds-control-h)] p-0',
}

const VARIANT = {
  primary:
    'bg-[linear-gradient(to_bottom_right,var(--bach-btn-create-from,#8ad9ff),var(--bach-btn-create-via,#60a5fa),var(--bach-btn-create-to,#3b82f6))] !text-[#ffffff] hover:brightness-105 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] border border-transparent',
  secondary:
    'bg-ds-secondary !text-[#ffffff] hover:bg-[var(--ds-secondary-hover)] shadow-ds-sm border border-transparent',
  ghost: 'bg-transparent text-ds-ink hover:bg-[var(--ds-surface-muted)] border border-transparent',
  outline: 'bg-ds-surface text-ds-ink border border-ds-border hover:bg-[var(--ds-surface-muted)]',
  danger:
    'bg-[linear-gradient(to_bottom_right,var(--bach-btn-cancel-from,#fda4af),var(--bach-btn-cancel-via,#f43f5e),var(--bach-btn-cancel-to,#e11d48))] !text-[#ffffff] hover:brightness-105 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] border border-transparent',
  cancel:
    'bg-[linear-gradient(to_bottom_right,var(--bach-btn-cancel-from,#fda4af),var(--bach-btn-cancel-via,#f43f5e),var(--bach-btn-cancel-to,#e11d48))] !text-[#ffffff] hover:brightness-105 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] border border-transparent',
  success: 'bg-ds-success !text-[#ffffff] hover:opacity-90 border border-transparent',
  warning: 'bg-ds-warning !text-[#ffffff] hover:opacity-90 border border-transparent',
  info: 'bg-ds-info !text-[#ffffff] hover:opacity-90 border border-transparent',
  ai: 'bg-[linear-gradient(to_bottom_right,var(--bach-btn-ai-from),var(--bach-btn-ai-via),var(--bach-btn-ai-to))] !text-[#ffffff] hover:brightness-105 shadow-ds-sm border border-transparent',
  bachy:
    'bg-[linear-gradient(to_bottom_right,var(--bach-btn-bachy-from),var(--bach-btn-bachy-via),var(--bach-btn-bachy-to))] !text-[#ffffff] hover:brightness-105 shadow-ds-sm border border-transparent',
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
      className={`inline-flex items-center justify-center rounded-ds-button font-semibold transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
