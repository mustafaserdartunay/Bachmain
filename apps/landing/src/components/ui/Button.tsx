import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  fullWidth?: boolean
}

/**
 * Design-system primary button — pricing tokens: 58px / 18px / #2563EB
 */
export default function Button({
  children,
  className = '',
  fullWidth = false,
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex h-[58px] items-center justify-center rounded-[18px] bg-[#2563EB] px-6',
        'text-[16px] font-bold tracking-tight text-white tabular-nums',
        'shadow-[0_12px_30px_rgba(37,99,235,0.35)]',
        'transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:bg-[#1D4ED8]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-60',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
