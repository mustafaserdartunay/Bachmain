import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { APP_PANEL_TITLE_CLASS, APP_DOT_COLORS } from '../../utils/dashboardDesign'

/**
 * Standart uygulama sayfa düzeni — müşteri listesi / create header referansı.
 * Sol: zeminsiz geri · Orta: mavi başlık · Sağ: sayfa aksiyonları
 */

export function AppPageShell({ children, className = '' }) {
  return <div className={`space-y-5 ${className}`.trim()}>{children}</div>
}

/** Zeminsiz geri kontrolü — CustomerCreatePage “Müşteriler” ile aynı */
export const APP_PAGE_BACK_PLAIN_CLASS =
  'inline-flex h-control min-h-control items-center justify-center gap-2.5 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide text-gray-300 transition-colors hover:text-white'

/** Ortalanmış sayfa başlığı (renk ayrı — theme remap `text-blue-300` sınıf adını ezer) */
export const APP_PAGE_TITLE_BASE_CLASS = 'truncate text-2xl font-black uppercase tracking-wide'
export const APP_PAGE_TITLE_CLASS = `${APP_PAGE_TITLE_BASE_CLASS} text-blue-300`

/** Alt açıklama (opsiyonel) */
export const APP_PAGE_SUBTITLE_CLASS =
  'mt-1 text-xs font-semibold tracking-wide text-[var(--muted)]'

function AppPageBackButton({ backTo = '/', backLabel = 'Güncel Durum', onBack }) {
  const navigate = useNavigate()
  const content = (
    <>
      <ArrowLeft className="h-4 w-4" />
      {backLabel}
    </>
  )

  if (onBack) {
    return (
      <button
        type="button"
        onClick={onBack}
        className={APP_PAGE_BACK_PLAIN_CLASS}
        aria-label={backLabel}
        title={backLabel}
      >
        {content}
      </button>
    )
  }

  if (backTo) {
    return (
      <Link
        to={backTo}
        className={APP_PAGE_BACK_PLAIN_CLASS}
        aria-label={backLabel}
        title={backLabel}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate('/')
      }}
      className={APP_PAGE_BACK_PLAIN_CLASS}
      aria-label={backLabel}
      title={backLabel}
    >
      {content}
    </button>
  )
}

export function AppPanelDot({ color = 'blue' }) {
  const palette = APP_DOT_COLORS[color] || APP_DOT_COLORS.blue
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${palette.ping}`}
      />
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

/**
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   actions?: import('react').ReactNode,
 *   backTo?: string,
 *   backLabel?: string,
 *   onBack?: () => void,
 *   showBack?: boolean,
 *   titleClassName?: string,
 *   className?: string,
 * }} props
 */
export function AppPageHeader({
  title,
  subtitle,
  actions,
  backTo = '/',
  backLabel = 'Güncel Durum',
  onBack,
  showBack = true,
  titleClassName = '',
  className = '',
}) {
  return (
    <div
      className={`app-page-header relative z-30 flex min-h-[4.75rem] shrink-0 items-center justify-center overflow-visible px-4 py-3 text-center sm:px-6 ${className}`.trim()}
    >
      {showBack ? (
        <div className="absolute left-4 top-1/2 z-40 -translate-y-1/2 sm:left-6">
          <AppPageBackButton backTo={backTo} backLabel={backLabel} onBack={onBack} />
        </div>
      ) : null}
      <div className="mx-auto max-w-2xl px-28 sm:px-40">
        <h1 className={`${APP_PAGE_TITLE_BASE_CLASS} ${titleClassName || 'text-blue-300'}`.trim()}>
          {title}
        </h1>
        {subtitle ? <p className={APP_PAGE_SUBTITLE_CLASS}>{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="absolute right-4 top-1/2 z-40 flex max-w-[42%] -translate-y-1/2 flex-wrap items-center justify-end gap-1 sm:right-6">
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
        <p className="app-titlecase-words mb-2.5 text-[12px] font-semibold leading-tight text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </section>
  )
}
