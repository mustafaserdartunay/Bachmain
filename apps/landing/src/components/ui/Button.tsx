import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  fullWidth?: boolean
}

/**
 * Design-system primary button — reference: 56px / 16px radius / #2563EB
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
        'inline-flex h-14 items-center justify-center rounded-2xl bg-[#2563EB] px-6',
        'text-[15px] font-bold tracking-tight text-white tabular-nums',
        'shadow-[0_8px_30px_rgba(37,99,235,0.22)]',
        'transition-all duration-300 ease-in-out',
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
