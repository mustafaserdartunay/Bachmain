import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  APP_PAGE_TITLE_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_DOT_COLORS,
} from '../../utils/dashboardDesign'

/**
 * Standart uygulama sayfa düzeni — Güncel Durum / glass dashboard referans alınır.
 */

export function AppPageShell({ children, className = '' }) {
  return <div className={`space-y-5 ${className}`.trim()}>{children}</div>
}

const APP_PAGE_BACK_BUTTON_CLASS =
  'glass-sidebar-toggle glass-sidebar-collapse app-page-back flex h-8 w-8 shrink-0 items-center justify-center rounded-xl'

function AppPageBackButton({ backTo, backLabel, onBack }) {
  const navigate = useNavigate()

  function handleBack() {
    if (onBack) {
      onBack()
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  if (backTo) {
    return (
      <Link
        to={backTo}
        className={APP_PAGE_BACK_BUTTON_CLASS}
        aria-label={backLabel}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={APP_PAGE_BACK_BUTTON_CLASS}
      aria-label={backLabel}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}

export function AppPanelDot({ color = 'blue' }) {
  const palette = APP_DOT_COLORS[color] || APP_DOT_COLORS.blue
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${palette.ping}`} />
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${palette.dot}`} />
    </span>
  )
}

export function AppPanelHeader({ title, action, dotColor = 'blue', className = '' }) {
  return (
    <div className={`mb-2.5 flex shrink-0 items-center justify-between gap-3 ${className}`.trim()}>
      <div className="flex min-w-0 items-center gap-2">
        <AppPanelDot color={dotColor} />
        <h2 className={APP_PANEL_TITLE_CLASS}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function AppPageHeader({
  title,
  actions,
  backTo,
  backLabel = 'Geri',
  onBack,
  showBack = true,
}) {
  return (
    <div className="app-page-header relative z-30 flex min-h-[4.75rem] shrink-0 items-center justify-between gap-3 overflow-visible px-4 py-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showBack ? (
          <AppPageBackButton backTo={backTo} backLabel={backLabel} onBack={onBack} />
        ) : null}
        <h1 className={`${APP_PAGE_TITLE_CLASS} truncate`}>{title}</h1>
      </div>
      {actions ? (
        <div className="relative z-40 flex shrink-0 flex-wrap items-center justify-end gap-2 overflow-visible">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function AppPagePanel({
  title,
  description,
  action,
  children,
  className = '',
  fill = false,
  dotColor = 'blue',
}) {
  return (
    <section className={`card px-4 py-3 ${className}`.trim()}>
      {title || description || action ? (
        <AppPanelHeader
          title={title}
          action={action}
          dotColor={dotColor}
          className={description ? 'mb-2' : ''}
        />
      ) : null}
      {description ? (
        <p className="app-titlecase-words mb-2.5 text-[12px] font-semibold leading-tight text-[var(--muted)]">{description}</p>
      ) : null}
      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}
