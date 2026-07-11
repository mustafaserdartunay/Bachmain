import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
}

const variants = {
  primary: 'bg-bach-navy text-white hover:bg-bach-navy-soft shadow-sm',
  secondary: 'bg-surface-elevated border border-border text-text hover:bg-surface hover:border-border-strong',
  ghost: 'text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5',
  gold: 'bg-bach-gold text-bach-navy hover:bg-bach-gold-hover font-semibold shadow-sm',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-9 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-sm rounded-xl',
  icon: 'h-9 w-9 rounded-lg p-0',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bach-blue focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
