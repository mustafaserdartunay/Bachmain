import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  APP_ICON_SM_CLASS,
  APP_ICON_WRAP_CLASS,
  APP_PANEL_TITLE_CLASS,
} from '../../utils/dashboardDesign'

export const FORM_SECTION_PANEL_CLASS = 'glass-inset space-y-4 rounded-[20px] p-4'

export function FormSectionPanel({ icon: Icon, title, children, dotColor = 'blue' }) {
  return (
    <section className={FORM_SECTION_PANEL_CLASS}>
      <div className="flex items-center gap-2">
        <AppPanelDot color={dotColor} />
        {Icon ? (
          <span className={`${APP_ICON_WRAP_CLASS} text-blue-600`}>
            <Icon className={APP_ICON_SM_CLASS} />
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
export const FORM_FIELD_ROW_CLASS =
  `app-form-row ${FORM_FIELD_SURFACE_CLASS} flex min-h-[2.5625rem] w-full items-center gap-3 rounded-[16px] px-3 py-2`
export const FORM_FIELD_GRID_CLASS = 'grid gap-3'
export const FORM_FIELD_STACK_CLASS = 'space-y-3'
