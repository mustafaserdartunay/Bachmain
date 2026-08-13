import { cn } from '@/lib/utils'

export function CountBadge({
  count,
  className,
  size = 'md',
}: {
  count: number
  className?: string
  size?: 'sm' | 'md'
}) {
  if (!count) return null
  const label = count > 99 ? '99+' : String(count)
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-[#ff3b30] font-black leading-none text-white shadow-[0_0_10px_rgba(255,59,48,0.55)]',
        size === 'sm'
          ? 'h-[14px] min-w-[14px] px-0.5 text-[10px] ring-1 ring-white'
          : 'h-4 min-w-4 px-1 text-[11px] ring-2 ring-white dark:ring-surface-elevated',
        className,
      )}
      aria-label={`${count} açık destek talebi`}
    >
      {label}
    </span>
  )
}
