import { formatTreasuryCurrency } from '../../utils/treasuryStore'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

const FIELD_SHELL = '[&_.form-input]:h-10 [&_.form-input]:rounded-xl [&_.form-input]:border-dark-500/40 [&_.form-input]:bg-dark-800/70 [&_.form-input]:text-sm [&_.form-input]:text-gray-100 [&_.form-input]:shadow-none [&_.form-input]:transition-colors [&_.form-input:focus]:border-blue-500/35 [&_.form-input:focus]:ring-1 [&_.form-input:focus]:ring-blue-500/15'

export function FormRow({ label, required = false, children }) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-2 border-b border-dark-500/35 py-2.5 last:border-b-0">
      <label className="text-[12px] font-black uppercase tracking-wide text-gray-500">
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
      <label className="block text-[12px] font-bold uppercase tracking-[0.16em] text-gray-500">
        {label}
        {required ? <span className="text-blue-400/90"> *</span> : null}
      </label>
      <div className={`min-w-0 ${FIELD_SHELL}`}>{children}</div>
    </div>
  )
}

export function SidebarFormCard({ children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dark-500/30 bg-gradient-to-b from-dark-800/55 to-dark-900/25 px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="divide-y divide-dark-500/20">{children}</div>
    </div>
  )
}

export function SidebarPanelHeader({ icon: Icon, title, subtitle, accent = 'blue' }) {
  const accentClass = accent === 'blue'
    ? 'bg-blue-500/10 text-blue-300 ring-blue-500/20'
    : accent === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20'
      : accent === 'purple'
        ? 'bg-purple-500/10 text-purple-300 ring-purple-500/20'
        : 'bg-dark-700/60 text-gray-400 ring-dark-500/30'

  return (
    <div className="border-b border-dark-500/35 bg-gradient-to-r from-blue-500/[0.06] via-transparent to-transparent px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className={`rounded-xl p-2.5 ring-1 ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black tracking-tight text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] font-semibold text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function SidebarInfoNote({ children }) {
  return (
    <p className="mb-4 rounded-xl border border-dark-500/25 bg-dark-900/20 px-3 py-2.5 text-[13px] leading-relaxed text-gray-400">
      {children}
    </p>
  )
}

export function SidebarPanelActions({ onCancel, submitLabel, submitDisabled = false, disabled }) {
  const isDisabled = submitDisabled || disabled

  return (
    <div className="grid grid-cols-2 gap-2.5 border-t border-dark-500/35 bg-dark-900/15 p-3.5">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-800/50 text-[13px] font-bold uppercase tracking-[0.12em] text-gray-400 transition-colors hover:border-dark-500/70 hover:bg-dark-700/60 hover:text-gray-200"
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
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">₺</span>
    </div>
  )
}

export function BalanceFooter({ rawBalance }) {
  const formatted = formatTreasuryCurrency(rawBalance)
  const isNegative = Number(rawBalance) < 0
  const [liraPart, kurusPart = '00'] = formatted.replace('₺', '').split(',')

  return (
    <div className="border-t border-dark-500/35 bg-dark-700/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-gray-500">Bakiye</span>
        <span className={`font-black tabular-nums ${isNegative ? 'text-red-300' : 'text-emerald-300'}`}>
          <span className="text-base">{liraPart},</span>
          <span className="text-sm">{kurusPart}₺</span>
        </span>
      </div>
    </div>
  )
}

export const sidebarDropdownClass = 'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-dark-500/40 bg-dark-800/70 px-3 text-xs font-semibold text-gray-100 shadow-none transition-colors hover:border-blue-500/25 hover:bg-dark-700/70 [&_span]:truncate'

export const sidebarInputClass = 'form-input h-10 rounded-xl border-dark-500/40 bg-dark-800/70 text-sm text-gray-100 shadow-none transition-colors focus:border-blue-500/35 focus:ring-1 focus:ring-blue-500/15'
