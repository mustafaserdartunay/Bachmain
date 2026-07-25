import type { InputHTMLAttributes, ReactNode } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  error?: string
}

/**
 * Design-system checkbox — reference register terms row
 */
export default function Checkbox({ label, error, id, className = '', ...props }: CheckboxProps) {
  const inputId = id || 'ds-checkbox'
  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          className={[
            'mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[5px] border border-[#E5E7EB]',
            'accent-[#2563EB] transition duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30',
          ].join(' ')}
          {...props}
        />
        <span className="text-[13px] leading-relaxed font-medium tracking-tight text-[#64748B]">
          {label}
        </span>
      </label>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#EF4444]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
