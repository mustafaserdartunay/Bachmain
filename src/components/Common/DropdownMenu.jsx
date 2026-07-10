/**
 * Standart glass açılır menü — FormSectionPanel / glass-inset ile aynı görsel dil.
 */

export const DROPDOWN_Z_INDEX = 10000

export const DROPDOWN_MENU_SHELL_BASE_CLASS = 'glass-inset min-w-[210px] rounded-[16px] p-2'

export const DROPDOWN_MENU_PANEL_CLASS =
  `z-50 ${DROPDOWN_MENU_SHELL_BASE_CLASS}`

export const DROPDOWN_MENU_PORTAL_CLASS =
  `app-dropdown-portal ${DROPDOWN_MENU_SHELL_BASE_CLASS}`

export const DROPDOWN_MENU_SHELL_CLASS = `absolute left-0 top-11 ${DROPDOWN_MENU_PANEL_CLASS}`

export const DROPDOWN_MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-[var(--ink)] transition-colors hover:bg-white/45'

export const DROPDOWN_MENU_ITEM_MUTED_CLASS =
  `${DROPDOWN_MENU_ITEM_CLASS} text-[var(--muted)]`

export const DROPDOWN_MENU_DIVIDER_CLASS = 'my-1.5 border-t border-white/50'

export function dropdownMenuShellClass({
  matchWidth = true,
  inline = false,
  portaled = false,
  positionClass = 'absolute left-0 top-11',
} = {}) {
  const panelClass = portaled ? DROPDOWN_MENU_PORTAL_CLASS : DROPDOWN_MENU_PANEL_CLASS
  if (inline) {
    return `relative z-30 mt-1 w-full ${panelClass}`
  }
  if (portaled) {
    return `${panelClass}${matchWidth ? '' : ' w-max max-w-[260px]'}`
  }
  return `${positionClass} ${panelClass}${matchWidth ? ' w-full' : ' w-max max-w-[260px]'}`
}

export function DropdownMenuShell({ children, className = '', matchWidth = true, inline = false }) {
  return (
    <div className={`${dropdownMenuShellClass({ matchWidth, inline })} ${className}`.trim()}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ label, onClick, icon: Icon, dotColor, iconTone, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${DROPDOWN_MENU_ITEM_CLASS} ${className}`.trim()}
    >
      {Icon ? (
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/40 ${iconTone || 'text-[var(--muted)]'}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      {!Icon && dotColor ? (
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
      ) : null}
      <span>{label}</span>
    </button>
  )
}

export function DropdownMenuDivider() {
  return <div className={DROPDOWN_MENU_DIVIDER_CLASS} />
}
