import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import {
  APP_PAGE_TITLE_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_DOT_COLORS,
  PAGE_HEADER_BACK_LABEL_CLASS,
  PAGE_HEADER_BACK_LINK_CLASS,
  PAGE_HEADER_CENTER_SLOT_CLASS,
  PAGE_HEADER_CENTER_TITLE_CLASS,
  PAGE_HEADER_SHELL_CLASS,
} from '../../utils/dashboardDesign'

/**
 * Standart uygulama sayfa düzeni — Güncel Durum / glass dashboard referans alınır.
 */

export function AppPageShell({ children, className = '' }) {
  return (
    <div className={`page-type-shell customers-page-type space-y-5 ${className}`.trim()}>
      {children}
    </div>
  )
}

const APP_PAGE_BACK_BUTTON_CLASS =
  'glass-sidebar-toggle glass-sidebar-collapse app-page-back flex h-8 w-8 shrink-0 items-center justify-center rounded-xl'

function AppPageBackButton({ backTo = '/', backLabel = 'Başa dön', onBack }) {
  const navigate = useNavigate()

  if (onBack) {
    return (
      <button
        type="button"
        onClick={onBack}
        className={APP_PAGE_BACK_BUTTON_CLASS}
        aria-label={backLabel}
        title={backLabel}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    )
  }

  if (backTo) {
    return (
      <Link
        to={backTo}
        className={APP_PAGE_BACK_BUTTON_CLASS}
        aria-label={backLabel}
        title={backLabel}
      >
        <ChevronLeft className="h-4 w-4" />
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
      className={APP_PAGE_BACK_BUTTON_CLASS}
      aria-label={backLabel}
      title={backLabel}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}

/**
 * başlık panel sol slotu — kanonik "Güncel Durum" geri linki.
 * AppPageHeader'a `title` olarak verilir (`showBack={false}` ile birlikte).
 */
export function AppPageBackLink({ to = '/', label = 'Güncel Durum', onClick }) {
  const content = (
    <>
      <ChevronLeft
        className="customer-page-back-link-icon h-4 w-4 shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <span className={PAGE_HEADER_BACK_LABEL_CLASS}>{label}</span>
    </>
  )

  if (typeof onClick === 'function' && (to === null || to === undefined || to === false)) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={PAGE_HEADER_BACK_LINK_CLASS}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      to={to || '/'}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={PAGE_HEADER_BACK_LINK_CLASS}
    >
      {content}
    </Link>
  )
}

export function AppPanelDot({ color = 'blue' }) {
  const palette = APP_DOT_COLORS[color] || APP_DOT_COLORS.blue
  return (
    <span className="app-panel-dot relative flex h-1.5 w-1.5 shrink-0">
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

export function AppPageHeader({
  title,
  centerTitle,
  actions,
  backTo = '/',
  backLabel = 'Başa dön',
  onBack,
  showBack = true,
  titleClassName = '',
  centerTitleClassName = '',
  shellClassName = PAGE_HEADER_SHELL_CLASS,
}) {
  const hasExplicitCenter =
    centerTitle != null && centerTitle !== false && String(centerTitle).trim() !== ''
  const resolvedCenterTitle = hasExplicitCenter
    ? centerTitle
    : typeof title === 'string' && title.trim()
      ? String(title).toLocaleUpperCase('tr-TR')
      : null
  const hasCenterTitle = Boolean(resolvedCenterTitle)
  const leftTitleNode = typeof title === 'string' ? null : title
  const leftSlotClass =
    hasCenterTitle || leftTitleNode
      ? 'relative z-10 flex w-auto shrink-0 items-center gap-3'
      : 'relative z-10 flex min-w-0 flex-1 items-center gap-3'

  return (
    <div className={shellClassName}>
      <div className={leftSlotClass}>
        {showBack ? (
          <AppPageBackButton backTo={backTo} backLabel={backLabel} onBack={onBack} />
        ) : null}
        {leftTitleNode ? (
          <div className={`flex w-auto shrink-0 items-center ${titleClassName}`.trim()}>
            {leftTitleNode}
          </div>
        ) : null}
        {!hasCenterTitle && typeof title === 'string' ? (
          <h1 className={`${APP_PAGE_TITLE_CLASS} truncate text-left ${titleClassName}`.trim()}>
            {title}
          </h1>
        ) : null}
      </div>
      {hasCenterTitle ? (
        <div className={PAGE_HEADER_CENTER_SLOT_CLASS}>
          <span
            className={`${PAGE_HEADER_CENTER_TITLE_CLASS} ${centerTitleClassName}`.trim()}
            data-page-center-title
          >
            {resolvedCenterTitle}
          </span>
        </div>
      ) : null}
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
        <p className="app-titlecase-words mb-2.5 text-[12px] font-semibold leading-tight text-[var(--muted)]">
          {description}
        </p>
      ) : null}
      {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </section>
  )
}
