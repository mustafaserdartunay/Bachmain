import { formatTreasuryCurrency } from '../../utils/treasuryStore'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import {
  FORM_FIELD_LABEL_CLASS,
  FORM_FIELD_SURFACE_CLASS,
  FORM_SECTION_PANEL_COMPACT_CLASS,
} from '../Common/FormSectionPanel'
import { APP_PANEL_TITLE_CLASS } from '../../utils/dashboardDesign'

const FIELD_SHELL = '[&_.form-input]:min-h-[2.5rem]'

/** Beyaz / glass form kabuğu — var(--surface) kullanma (:root koyu). */
export const CASH_SIDEBAR_FORM_SHELL =
  `cash-sidebar-form ${FORM_FIELD_SURFACE_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl`

export const CASH_SIDEBAR_BODY_CLASS = 'flex-1 overflow-y-auto bg-white px-4 py-4'

export const CASH_SIDEBAR_INNER_FORM_CLASS = `${FORM_SECTION_PANEL_COMPACT_CLASS} space-y-3`

export function FormRow({ label, required = false, children }) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2 border-b border-[rgba(140,145,165,0.18)] py-2.5 last:border-b-0">
      <label className={FORM_FIELD_LABEL_CLASS}>
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function FormRowStacked({ label, required = false, children, className = '' }) {
  return (
    <div className={`space-y-2 py-3.5 ${className}`}>
      <label className={`block ${FORM_FIELD_LABEL_CLASS}`}>
        {label}
        {required ? <span className="text-[var(--accent)]"> *</span> : null}
      </label>
      <div className={`min-w-0 ${FIELD_SHELL}`}>{children}</div>
    </div>
  )
}

export function SidebarFormCard({ children }) {
  return (
    <div className={`${FORM_SECTION_PANEL_COMPACT_CLASS} overflow-hidden !bg-white !p-0`}>
      <div className="divide-y divide-[rgba(140,145,165,0.18)] px-3.5">{children}</div>
    </div>
  )
}

export function SidebarPanelHeader({ icon: Icon, title, subtitle, accent = 'blue' }) {
  const accentClass = accent === 'blue'
    ? 'bg-blue-500/10 text-blue-600 ring-blue-500/20'
    : accent === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'
      : accent === 'purple'
        ? 'bg-purple-500/10 text-purple-600 ring-purple-500/20'
        : 'bg-[rgba(140,145,165,0.14)] text-[var(--muted)] ring-[rgba(140,145,165,0.2)]'

  return (
    <div className="border-b border-[rgba(140,145,165,0.18)] bg-white px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2.5 ring-1 ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className={`truncate text-sm font-black tracking-tight ${APP_PANEL_TITLE_CLASS}`}>{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] font-semibold text-[var(--muted)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function SidebarInfoNote({ children }) {
  return (
    <p className="mb-4 rounded-xl border border-[rgba(140,145,165,0.18)] bg-[rgba(248,250,252,0.95)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--muted)]">
      {children}
    </p>
  )
}

export function SidebarPanelActions({ onCancel, submitLabel, submitDisabled = false, disabled }) {
  const isDisabled = submitDisabled || disabled

  return (
    <div className="grid grid-cols-2 gap-2.5 border-t border-[rgba(140,145,165,0.18)] bg-white p-3.5">
      <button
        type="button"
        onClick={onCancel}
        className="btn-cancel inline-flex items-center justify-center text-[13px] font-bold uppercase tracking-[0.12em]"
      >
        Vazgeç
      </button>
      <button
        type="submit"
        disabled={isDisabled}
        className={`${BTN_PRIMARY} h-10 w-full text-[13px] uppercase tracking-[0.12em] shadow-[0_4px_14px_color-mix(in_srgb,var(--accent)_35%,transparent)] ${
          isDisabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        {submitLabel}
      </button>
    </div>
  )
}

export function CurrencyField({ value, onChange, CurrencyTextInput }) {
  return (
    <div className="relative">
      <div className="[&_input]:pr-9">
        <CurrencyTextInput value={value} onChange={onChange} />
      </div>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--muted)]">₺</span>
    </div>
  )
}

export function BalanceFooter({ rawBalance }) {
  const formatted = formatTreasuryCurrency(rawBalance)
  const isNegative = Number(rawBalance) < 0
  const [liraPart, kurusPart = '00'] = formatted.replace('₺', '').split(',')

  return (
    <div className="border-t border-[rgba(140,145,165,0.18)] bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Bakiye</span>
        <span className={`font-black tabular-nums ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
          <span className="text-base">{liraPart},</span>
          <span className="text-sm">{kurusPart}₺</span>
        </span>
      </div>
    </div>
  )
}

export const sidebarDropdownClass =
  `flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] ${FORM_FIELD_SURFACE_CLASS} !rounded-xl px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-white [&_span]:truncate`

export const sidebarInputClass = 'form-input text-sm'
