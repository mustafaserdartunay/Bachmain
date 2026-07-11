import { cn } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  gold: 'bg-bach-gold/15 text-bach-gold border border-bach-gold/25',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const statusBadgeMap: Record<string, BadgeVariant> = {
  active: 'success',
  aktif: 'success',
  trial: 'gold',
  deneme: 'gold',
  suspended: 'warning',
  askıda: 'warning',
  churned: 'danger',
  iptal: 'danger',
  open: 'warning',
  açık: 'warning',
  in_progress: 'gold',
  işlemde: 'gold',
  waiting: 'default',
  bekliyor: 'default',
  resolved: 'success',
  çözüldü: 'success',
  closed: 'default',
  kapalı: 'default',
  paid: 'success',
  ödendi: 'success',
  pending: 'warning',
  bekleyen: 'warning',
  overdue: 'danger',
  gecikmiş: 'danger',
  low: 'default',
  düşük: 'default',
  medium: 'gold',
  orta: 'gold',
  high: 'warning',
  yüksek: 'warning',
  critical: 'danger',
  kritik: 'danger',
}
