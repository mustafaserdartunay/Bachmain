import { forwardRef } from 'react'

const base =
  'w-full rounded-ds-md border border-ds-border bg-[var(--ds-surface-raised)] px-4 text-ds-body text-ds-ink shadow-ds-xs outline-none transition-[border-color,box-shadow] duration-hover placeholder:text-ds-muted focus:border-ds-secondary focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ds-secondary)_22%,transparent)] disabled:cursor-not-allowed disabled:opacity-60'

export const Input = forwardRef(function Input({ className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`${base} h-control min-h-control ${className}`}
      {...rest}
    />
  )
})

export const Textarea = forwardRef(function Textarea({ className = '', rows = 3, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${base} min-h-[6rem] resize-y py-3 ${className}`}
      {...rest}
    />
  )
})

export default Input
