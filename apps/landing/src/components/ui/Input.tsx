import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  error?: string
}

/**
 * Design-system input — pricing tokens: 58px / 18px / icon left
 */
export default function Input({
  leftIcon,
  rightSlot,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute top-1/2 left-4 z-[1] -translate-y-1/2 text-[#94A3B8]">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={[
            'h-[58px] w-full rounded-[18px] border border-[#E2E8F0] bg-white',
            'text-[16px] font-medium tracking-tight text-[#0F172A] tabular-nums',
            'placeholder:font-normal placeholder:text-[#94A3B8]',
            'transition-all duration-200 ease-out',
            'focus:border-[#2563EB] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/15',
            leftIcon ? 'pl-[52px]' : 'pl-5',
            rightSlot ? 'pr-12' : 'pr-5',
            error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/15' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightSlot ? (
          <span className="absolute top-1/2 right-3 -translate-y-1/2">{rightSlot}</span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#EF4444]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
