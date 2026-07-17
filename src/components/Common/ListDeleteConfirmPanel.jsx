import { Check, Trash2 } from 'lucide-react'
import { DUZENLEME_KALEMI_BUTTON_CLASS, TEKLIFLER_COP_KUTUSU_BUTTON_CLASS } from '../../utils/buttonStyles'

export const DELETE_TRASH_BUTTON_CLASS = `rounded-lg ${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS}`

export const EDIT_PENCIL_BUTTON_CLASS = DUZENLEME_KALEMI_BUTTON_CLASS

export const DELETE_TRASH_BUTTON_HIDDEN_CLASS = 'pointer-events-none invisible'

export const DELETE_CONFIRM_POPOVER_PANEL_CLASS =
  'flex flex-wrap items-center gap-2 rounded-2xl border border-red-500/35 bg-dark-900 p-2 shadow-2xl ring-1 ring-red-500/15'

export const DELETE_CONFIRM_POPOVER_WARM_PANEL_CLASS =
  'flex flex-wrap items-center gap-2 rounded-2xl border border-white/35 bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-2xl ring-1 ring-amber-300/25'

export const DELETE_CONFIRM_POPOVER_ANCHOR_CLASS = 'absolute right-0 top-12 z-40'

const DELETE_CONFIRM_VARIANTS = {
  dark: {
    panel: DELETE_CONFIRM_POPOVER_PANEL_CLASS,
    icon: 'bg-red-500/15 text-red-300',
    title: 'text-white',
    description: 'text-gray-500',
    confirm: 'bg-red-500 text-white hover:bg-red-400',
    cancel: 'border-dark-500/60 bg-dark-700 text-gray-200 hover:bg-dark-600',
  },
  warm: {
    panel: DELETE_CONFIRM_POPOVER_WARM_PANEL_CLASS,
    icon: 'bg-white/25 text-white',
    title: 'text-white',
    description: 'text-white/85',
    confirm: 'bg-white text-orange-600 hover:bg-white/90',
    cancel: 'border-white/40 bg-white/15 text-white hover:bg-white/25',
  },
}

export function DeleteConfirmPopover({
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
  variant = 'dark',
  className = '',
}) {
  const styles = DELETE_CONFIRM_VARIANTS[variant] || DELETE_CONFIRM_VARIANTS.dark

  return (
    <div
      className={`${styles.panel} ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
        <Trash2 className="h-4 w-4" />
      </div>
      <div className="min-w-[8rem] flex-1">
        <p className={`break-words text-xs font-black leading-tight ${styles.title}`}>{title}</p>
        <p className={`mt-0.5 break-words text-[12px] font-medium leading-tight ${styles.description}`}>{description}</p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-2.5 py-1.5 text-[12px] font-black transition-colors ${styles.confirm}`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition-colors ${styles.cancel}`}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  )
}

export function DeleteTrashButton({
  pending = false,
  onClick,
  onConfirm,
  onCancel,
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  buttonClassName = DELETE_TRASH_BUTTON_CLASS,
  iconClassName = 'h-3.5 w-3.5',
  popoverClassName = DELETE_CONFIRM_POPOVER_ANCHOR_CLASS,
  wrapperClassName = 'relative',
  buttonTitle = 'Sil',
  children,
}) {
  return (
    <div className={wrapperClassName} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onClick}
        className={`${buttonClassName} ${pending ? DELETE_TRASH_BUTTON_HIDDEN_CLASS : ''}`}
        title={buttonTitle}
      >
        {children || <Trash2 className={iconClassName} />}
      </button>
      {pending && (
        <DeleteConfirmPopover
          title={title}
          description={description}
          onConfirm={onConfirm}
          onCancel={onCancel}
          className={popoverClassName}
        />
      )}
    </div>
  )
}

const ACTION_CONFIRM_TONES = {
  red: {
    panel: 'border-red-500/25 bg-red-500/10 ring-red-500/10',
    message: 'text-red-200',
    confirm: 'bg-red-500/20 text-red-200 hover:bg-red-500/30',
  },
  emerald: {
    panel: 'border-emerald-500/25 bg-emerald-500/10 ring-emerald-500/10',
    message: 'text-emerald-200',
    confirm: 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30',
  },
  blue: {
    panel: 'border-blue-500/25 bg-blue-500/10 ring-blue-500/10',
    message: 'text-blue-200',
    confirm: 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30',
  },
  orange: {
    panel: 'border-orange-500/50 bg-dark-800 ring-orange-500/20',
    message: 'text-orange-300',
    confirm: 'bg-orange-500 text-white hover:bg-orange-400',
  },
}

export function ListInlineActionConfirm({
  message = 'Emin misin?',
  onConfirm,
  onCancel,
  tone = 'red',
  className = '',
}) {
  const styles = ACTION_CONFIRM_TONES[tone] || ACTION_CONFIRM_TONES.red

  return (
    <div
      className={`min-w-[118px] rounded-xl border p-1 shadow-lg shadow-black/30 ring-1 ${styles.panel} ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <p className={`mb-1 px-0.5 text-center text-[11px] font-black leading-tight ${styles.message}`}>{message}</p>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={onConfirm}
          className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-black ${styles.confirm}`}
        >
          <Check className="h-3 w-3 shrink-0" /> Evet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel px-3 text-[11px] font-bold"
        >
          Vazgeç
        </button>
      </div>
    </div>
  )
}

export function ListInlineDeleteConfirm({
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  onConfirm,
  onCancel,
  className = '',
}) {
  return (
    <DeleteConfirmPopover
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      className={className}
    />
  )
}

export function ListInlineDeleteConfirmPopover({
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  onConfirm,
  onCancel,
  className = DELETE_CONFIRM_POPOVER_ANCHOR_CLASS,
}) {
  return (
    <DeleteConfirmPopover
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      className={className}
    />
  )
}

export function ListInlineActionConfirmPopover({ message, onConfirm, onCancel, tone = 'red', className = '' }) {
  return (
    <div className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 ${className}`}>
      <ListInlineActionConfirm message={message} onConfirm={onConfirm} onCancel={onCancel} tone={tone} />
    </div>
  )
}

export default function ListDeleteConfirmPanel({
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  onConfirm,
  onCancel,
  className = '',
}) {
  return (
    <DeleteConfirmPopover
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      className={className}
    />
  )
}

export const LIST_PILL_CLASS = 'glass-pill'
