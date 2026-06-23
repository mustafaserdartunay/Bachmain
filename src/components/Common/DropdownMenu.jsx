/**
 * Standart koyu tema açılır menü — EditableDropdownPill ile aynı görsel dil.
 */

export const DROPDOWN_MENU_PANEL_CLASS =
  'z-50 min-w-[210px] rounded-2xl border border-dark-500 bg-dark-800 p-2 shadow-2xl shadow-black/40'

export const DROPDOWN_MENU_SHELL_CLASS = `absolute left-0 top-11 ${DROPDOWN_MENU_PANEL_CLASS}`

export const DROPDOWN_MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-200 transition-colors hover:bg-blue-500/10 hover:text-white'

export function dropdownMenuShellClass({
  matchWidth = true,
  inline = false,
  positionClass = 'absolute left-0 top-11',
} = {}) {
  if (inline) {
    return `relative z-30 mt-1 w-full ${DROPDOWN_MENU_PANEL_CLASS}`
  }
  return `${positionClass} ${DROPDOWN_MENU_PANEL_CLASS}${matchWidth ? ' w-full' : ' w-max max-w-[260px]'}`
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
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-dark-700/70 ${iconTone || 'text-gray-400'}`}>
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
  return <div className="my-1.5 border-t border-dark-500/60" />
}
