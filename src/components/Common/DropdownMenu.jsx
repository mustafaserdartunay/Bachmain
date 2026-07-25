/**
 * Standart glass açılır menü — FormSectionPanel / glass-inset ile aynı görsel dil.
 * Menü satırları: metric etiketleri gibi gray-300, zeminsiz (beyaz sütun yok).
 */

export const DROPDOWN_Z_INDEX = 10000

export const DROPDOWN_MENU_SHELL_BASE_CLASS = 'min-w-[7.5rem] rounded-[26px] p-1.5'

export const DROPDOWN_MENU_PANEL_CLASS = `z-50 ${DROPDOWN_MENU_SHELL_BASE_CLASS}`

export const DROPDOWN_MENU_PORTAL_CLASS = `app-dropdown-portal ${DROPDOWN_MENU_SHELL_BASE_CLASS}`

export const DROPDOWN_MENU_SHELL_CLASS = `absolute left-0 top-11 ${DROPDOWN_MENU_PANEL_CLASS}`

/** Metric label ile aynı: text-xs font-extrabold tracking-wide text-gray-300 */
export const DROPDOWN_MENU_ITEM_CLASS =
  'flex w-full items-center gap-1.5 rounded-xl bg-transparent px-2 py-1.5 text-left text-xs font-extrabold tracking-wide text-gray-300 transition-colors hover:text-gray-200'

export const DROPDOWN_MENU_ITEM_MUTED_CLASS = `${DROPDOWN_MENU_ITEM_CLASS}`

export const DROPDOWN_MENU_DIVIDER_CLASS = 'my-1.5 border-t border-white/15'

export function dropdownMenuShellClass({
  matchWidth = true,
  inline = false,
  portaled = false,
  positionClass = 'absolute left-0 top-11',
} = {}) {
  const panelClass = portaled ? DROPDOWN_MENU_PORTAL_CLASS : DROPDOWN_MENU_PANEL_CLASS
  const growMin = matchWidth === 'min'
  if (inline) {
    return `relative z-30 mt-1 w-full ${panelClass}`
  }
  if (portaled) {
    if (growMin) return `app-dropdown-portal rounded-[26px] p-1.5 w-max max-w-[11rem]`
    return `${panelClass}${matchWidth ? '' : ' w-max max-w-[11rem]'}`
  }
  if (growMin) return `${positionClass} rounded-[26px] p-1.5 w-max min-w-full max-w-[11rem]`
  return `${positionClass} ${panelClass}${matchWidth ? ' w-full' : ' w-max max-w-[11rem]'}`
}

export function DropdownMenuShell({ children, className = '', matchWidth = true, inline = false }) {
  return (
    <div className={`${dropdownMenuShellClass({ matchWidth, inline })} ${className}`.trim()}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  label,
  onClick,
  icon: Icon,
  dotColor,
  iconTone,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${DROPDOWN_MENU_ITEM_CLASS} ${className}`.trim()}
    >
      {Icon ? (
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center ${iconTone || 'text-gray-300'}`}
        >
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
