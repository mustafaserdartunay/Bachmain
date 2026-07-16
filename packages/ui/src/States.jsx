import { Inbox, AlertTriangle } from 'lucide-react'

export function EmptyState({ title = 'Kayıt bulunamadı', description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[var(--ds-surface-muted)] text-ds-muted">
        <Inbox className="h-6 w-6" />
      </span>
      <div>
        <p className="ds-h3">{title}</p>
        {description ? <p className="mt-1 text-ds-small text-ds-muted">{description}</p> : null}
      </div>
      {action || null}
    </div>
  )
}

export function ErrorState({ title = 'Bir hata oluştu', description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-ds-lg bg-[color-mix(in_srgb,var(--ds-danger)_12%,transparent)] text-ds-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <p className="ds-h3">{title}</p>
        {description ? <p className="mt-1 text-ds-small text-ds-muted">{description}</p> : null}
      </div>
      {action || null}
    </div>
  )
}

export function LoadingState({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 p-4 ${className}`} aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-ds-md bg-[var(--ds-surface-muted)]" />
      ))}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-ds-md bg-[var(--ds-surface-muted)] ${className}`} />
}

export default EmptyState
