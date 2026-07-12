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

export const FORM_FIELD_LABEL_CLASS = 'mb-0 text-[12px] font-black capitalize tracking-wider text-[var(--muted)]'
export const FORM_FIELD_SURFACE_CLASS = 'app-form-field-surface'
export const FORM_FIELD_CELL_CLASS = `${FORM_FIELD_SURFACE_CLASS} rounded-[16px] p-3`
export const FORM_FIELD_CELL_COMPACT_CLASS = `${FORM_FIELD_SURFACE_CLASS} rounded-xl px-2.5 py-1.5`
export const FORM_FIELD_ROW_CLASS =
  `app-form-row ${FORM_FIELD_SURFACE_CLASS} flex min-h-[2.5625rem] w-full items-center gap-3 rounded-[16px] px-3 py-2`
export const FORM_FIELD_ROW_COMPACT_CLASS =
  `app-form-row ${FORM_FIELD_SURFACE_CLASS} flex min-h-[2.25rem] w-full items-center gap-2 rounded-xl px-2.5 py-1`
export const FORM_FIELD_GRID_CLASS = 'grid gap-3'
export const FORM_FIELD_STACK_CLASS = 'space-y-3'
