import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  icon?: ReactNode
}

export function MetricCard({ label, value, change, trend, className, icon }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-card)]',
        'transition-shadow hover:shadow-[var(--shadow-card-hover)]',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        {icon && <div className="text-bach-blue">{icon}</div>}
      </div>
      <p className="mt-1 text-2xl font-bold tracking-tight text-text">{value}</p>
      {change && (
        <p
          className={cn(
            'mt-1 text-xs font-semibold',
            trend === 'up' && 'text-emerald-600',
            trend === 'down' && 'text-rose-600',
            trend === 'neutral' && 'text-text-subtle',
          )}
        >
          {change}
        </p>
      )}
    </motion.div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-text-subtle">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <Link to={b.href} className="hover:text-bach-blue">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-text-muted">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
