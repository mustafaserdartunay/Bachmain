import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  APP_ICON_SM_CLASS,
  APP_ICON_WRAP_CLASS,
  APP_PANEL_TITLE_CLASS,
} from '../../utils/dashboardDesign'

export const FORM_SECTION_PANEL_CLASS = 'glass-inset space-y-4 rounded-[20px] p-4'
export const FORM_SECTION_PANEL_COMPACT_CLASS = 'glass-inset space-y-2 rounded-2xl p-3'

export function FormSectionPanel({ icon: Icon, title, children, dotColor = 'blue', compact = false }) {
  return (
    <section className={compact ? FORM_SECTION_PANEL_COMPACT_CLASS : FORM_SECTION_PANEL_CLASS}>
      <div className={`flex items-center gap-2 ${compact ? 'min-h-0' : ''}`}>
        <AppPanelDot color={dotColor} />
        {Icon ? (
          <span className={`${compact ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[rgba(140,145,165,0.14)] text-[var(--muted)]' : APP_ICON_WRAP_CLASS} text-blue-600`}>
            <Icon className={compact ? 'h-3 w-3 shrink-0' : APP_ICON_SM_CLASS} />
          </span>
        ) : null}
        <h3 className={`${APP_PANEL_TITLE_CLASS} uppercase tracking-wide`}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

export default FormSectionPanel

/** Stacked label (legacy) */
export const FORM_FIELD_LABEL_CLASS = 'mb-0 text-[11px] font-black capitalize tracking-wider text-[var(--muted)]'

/** Inline label — always sits left of the control, with optional leading icon */
export const FORM_FIELD_INLINE_LABEL_CLASS =
  'inline-flex shrink-0 items-center gap-1.5 text-[11px] font-black capitalize tracking-wider text-[var(--muted)] whitespace-nowrap'

export const FORM_FIELD_SURFACE_CLASS = 'app-form-field-surface'
export const FORM_FIELD_CELL_CLASS = `${FORM_FIELD_SURFACE_CLASS} rounded-[16px] p-3`
export const FORM_FIELD_CELL_COMPACT_CLASS = `${FORM_FIELD_SURFACE_CLASS} rounded-xl px-2.5 py-1.5`
export const FORM_FIELD_ROW_CLASS =
  `app-form-row ${FORM_FIELD_SURFACE_CLASS} flex min-h-[2.5625rem] w-full items-center gap-3 rounded-[16px] px-3 py-2`
export const FORM_FIELD_ROW_COMPACT_CLASS =
  `app-form-row ${FORM_FIELD_SURFACE_CLASS} flex min-h-[2.25rem] w-full items-center gap-2 rounded-xl px-2.5 py-1`
export const FORM_FIELD_GRID_CLASS = 'grid w-full gap-2'
export const FORM_FIELD_STACK_CLASS = 'space-y-2'
/** Stacked rows with equal-width input columns and fixed label rail */
export const FORM_FIELD_STACK_ALIGNED_CLASS = 'form-field-stack-aligned space-y-2'

/**
 * Compact form field: [icon + label] left, control right — fills parent panel width.
 */
export function FormFieldCompact({
  icon: Icon,
  label,
  children,
  as: Tag = 'div',
  className = '',
  labelClassName = '',
  controlClassName = '',
}) {
  return (
    <Tag className={`${FORM_FIELD_ROW_COMPACT_CLASS} ${className}`.trim()}>
      <span className={`${FORM_FIELD_INLINE_LABEL_CLASS} ${labelClassName}`.trim()}>
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
        {label}
      </span>
      <div className={`min-w-0 flex-1 ${controlClassName}`.trim()}>{children}</div>
    </Tag>
  )
}

/** iOS Settings–style section: caption outside, rounded group inside */
export const FORM_IOS_SECTION_CLASS = 'ios-form-section'
export const FORM_IOS_LIST_CLASS = 'ios-group'

/**
 * Section chrome: small caption + optional gold underline (sidebar accent).
 */
export function FormIosSection({ title, children, className = '', tinted = true }) {
  return (
    <section className={`${FORM_IOS_SECTION_CLASS} ${className}`.trim()}>
      {title ? (
        <header className={`ios-form-section-header ${tinted ? 'is-tinted' : ''}`.trim()}>
          <h3 className="ios-form-section-title">{title}</h3>
        </header>
      ) : null}
      {children}
    </section>
  )
}

/**
 * iOS settings cell: title left, value/input right; system hairline (except last).
 */
export function FormIosRow({
  label,
  children,
  as: Tag = 'label',
  className = '',
  last = false,
}) {
  return (
    <Tag className={`ios-cell ${last ? 'is-last' : ''} ${className}`.trim()}>
      <span className="ios-cell-title">{label}</span>
      <div className="ios-cell-value">{children}</div>
    </Tag>
  )
}
