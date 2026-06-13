import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Standart uygulama sayfa düzeni — CRM Yönetimi sayfası referans alınır.
 * Yeni sayfalar bu bileşenleri kullanmalı.
 */

export function AppPageShell({ children, className = '' }) {
  return <div className={`space-y-5 ${className}`.trim()}>{children}</div>
}

const APP_PAGE_BACK_BUTTON_CLASS =
  'absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700 hover:text-white'

export function AppPageHeader({ title, actions, backTo, backLabel = 'Geri' }) {
  return (
    <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
      {backTo ? (
        <Link to={backTo} className={APP_PAGE_BACK_BUTTON_CLASS}>
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex justify-center">
        <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function AppPagePanel({ title, description, action, children, className = '', fill = false }) {
  return (
    <section className={`card ${className}`.trim()}>
      {title || description || action ? (
        <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-base font-bold text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}
