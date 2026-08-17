import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Trash2, X } from 'lucide-react'
import {
  DUZENLEME_KALEMI_BUTTON_CLASS,
  TEKLIFLER_COP_KUTUSU_BUTTON_CLASS,
} from '../../utils/buttonStyles'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

export const DELETE_TRASH_BUTTON_CLASS = `rounded-lg ${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS}`

export const EDIT_PENCIL_BUTTON_CLASS = DUZENLEME_KALEMI_BUTTON_CLASS

export const DELETE_TRASH_BUTTON_HIDDEN_CLASS = 'pointer-events-none invisible'

/** Teklif sipariş geri al kutusu ile aynı ölçü ve sınıflar. */
export const DELETE_CONFIRM_PANEL_CLASS =
  'delete-confirm-panel quote-order-undo-confirm quote-order-action inline-flex h-9 items-center justify-center'

/** Popover her zaman en üstte: portal + dropdown katmanının üstünde z-index. */
export const DELETE_CONFIRM_Z_INDEX = 12000

export const DELETE_CONFIRM_POPOVER_WIDTH = 92

/** Geriye dönük uyumluluk — tüm varyantlar tek standart tasarıma bağlandı. */
export const DELETE_CONFIRM_POPOVER_PANEL_CLASS = DELETE_CONFIRM_PANEL_CLASS
export const DELETE_CONFIRM_POPOVER_WARM_PANEL_CLASS = DELETE_CONFIRM_PANEL_CLASS
export const DELETE_CONFIRM_POPOVER_ANCHOR_CLASS = 'absolute right-0 top-full z-40 mt-1'

export const DELETE_CONFIRM_COMPACT_PANEL_CLASS = DELETE_CONFIRM_PANEL_CLASS

function resolveDeleteConfirmActionLabel(confirmLabel) {
  const label = String(confirmLabel || 'Sil').trim()
  if (!label || label === 'Evet, Sil' || label === 'Evet') return 'Sil'
  return label
}

function DeleteConfirmPanel({
  title,
  description,
  confirmLabel = 'Sil',
  cancelLabel: _cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
  className = '',
  compact: _compact = false,
}) {
  const actionLabel = resolveDeleteConfirmActionLabel(confirmLabel)
  const boxTitle = description || title

  return (
    <div
      className={`${DELETE_CONFIRM_PANEL_CLASS} ${className}`.trim()}
      title={boxTitle}
      role="alertdialog"
      aria-label={title}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="quote-order-undo-box flex h-9 w-full items-center justify-between rounded-xl border border-ds-border bg-transparent px-1">
        <button
          type="button"
          onClick={onConfirm}
          className="quote-order-undo-sil px-1.5 text-[11px] font-semibold leading-none"
        >
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="quote-order-undo-close inline-flex h-7 w-7 items-center justify-center rounded-lg"
          aria-label="Vazgeç"
          title="Vazgeç"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

/**
 * Sayfa / modal seviyesinde silme onayı: tetikleyicinin altında, portal ile en üstte.
 * ConfirmModal yerine bu kullanılır (kırmızı gradient, minimal ölçüler).
 * `anchorRef` veya `anchorRect` ile Sil butonunun altına hizalanır (ortalanmış tam ekran overlay değil).
 */
export function DeleteConfirmOverlay({
  open = true,
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
  anchorRef = null,
  anchorRect = null,
  align = 'right',
  placement = 'below',
}) {
  const frozenRectRef = useRef(null)

  useEffect(() => {
    if (!open) {
      frozenRectRef.current = null
      return
    }
    if (anchorRect) {
      frozenRectRef.current = anchorRect
      return
    }
    const live = anchorRef?.current
    if (live?.getBoundingClientRect) {
      frozenRectRef.current = live.getBoundingClientRect()
    }
  }, [open, anchorRef, anchorRect])

  const getAnchor = useCallback(() => {
    if (anchorRef?.current) return anchorRef.current
    return null
  }, [anchorRef])

  const { menuRef, style } = useAnchoredPortal(Boolean(open), {
    matchWidth: false,
    width: DELETE_CONFIRM_POPOVER_WIDTH,
    align,
    placement,
    offset: 6,
    getAnchor,
  })

  const fallbackStyle = (() => {
    if (!open || typeof window === 'undefined') return null
    if (anchorRef?.current) return null
    const rect = anchorRect || frozenRectRef.current
    if (!rect) return null
    const width = DELETE_CONFIRM_POPOVER_WIDTH
    const top = placement === 'above' ? Math.max(8, rect.top - 6) : rect.bottom + 6
    const left =
      align === 'right'
        ? Math.max(8, rect.right - width)
        : Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      visibility: 'visible',
      pointerEvents: 'auto',
      zIndex: DELETE_CONFIRM_Z_INDEX,
    }
  })()

  useEffect(() => {
    if (!open || typeof onCancel !== 'function') return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    const handlePointer = (event) => {
      if (menuRef.current?.contains(event.target)) return
      if (anchorRef?.current?.contains?.(event.target)) return
      onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointer)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointer)
    }
  }, [open, onCancel, anchorRef, menuRef])

  if (!open || typeof document === 'undefined') return null

  const positionedStyle = style?.visibility === 'visible' ? style : fallbackStyle || style

  return createPortal(
    <div
      ref={menuRef}
      className="delete-confirm-portal"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        visibility: 'hidden',
        pointerEvents: 'none',
        ...(positionedStyle || {}),
        zIndex: DELETE_CONFIRM_Z_INDEX,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <DeleteConfirmPanel
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>,
    document.body,
  )
}

/** Sil tıklamasından onay paneli için konum snapshot'ı alır. */
export function captureDeleteConfirmAnchor(eventOrElement) {
  const el = eventOrElement?.currentTarget || eventOrElement?.target || eventOrElement
  if (!el?.getBoundingClientRect) return null
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export function DeleteConfirmPopover({
  title = 'Silinsin mi?',
  description = 'Bu satır kaldırılacak.',
  confirmLabel = 'Evet',
  cancelLabel = 'Vazgeç',
  onConfirm,
  onCancel,
  className = '',
  align = 'right',
  placement = 'below',
  inline,
  compact = false,
}) {
  const holderRef = useRef(null)
  // Konumlandırma sınıfı verilmişse popover, verilmemişse akış içi (inline) render edilir.
  const isInline = inline ?? !/\b(absolute|fixed)\b/.test(className)

  // Tetikleyicinin bulunduğu kapsayıcıya hizalanır; ölçülemeyen kapsayıcıda üst seviyeye çıkar.
  const getAnchor = useCallback(() => {
    let node = holderRef.current?.parentElement || null
    while (node?.parentElement && node.getBoundingClientRect().width === 0) {
      node = node.parentElement
    }
    return node
  }, [])

  const { menuRef, style } = useAnchoredPortal(!isInline, {
    matchWidth: false,
    width: DELETE_CONFIRM_POPOVER_WIDTH,
    align,
    placement,
    offset: 6,
    getAnchor,
  })

  useEffect(() => {
    if (isInline || typeof onCancel !== 'function') return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInline, onCancel])

  const panel = (
    <DeleteConfirmPanel
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      compact={compact}
    />
  )

  if (isInline) {
    return (
      <div
        className={`relative inline-flex h-9 w-[5.75rem] min-w-[5.75rem] items-center justify-center ${className}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        {panel}
      </div>
    )
  }

  return (
    <>
      <span ref={holderRef} className="hidden" aria-hidden />
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <div
              ref={menuRef}
              className="delete-confirm-portal"
              style={{
                position: 'fixed',
                top: '0px',
                left: '0px',
                visibility: 'hidden',
                pointerEvents: 'none',
                ...(style || {}),
                zIndex: DELETE_CONFIRM_Z_INDEX,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {panel}
            </div>,
            document.body,
          )}
    </>
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
      <p
        className={`mb-1 px-0.5 text-center text-[11px] font-black leading-tight ${styles.message}`}
      >
        {message}
      </p>
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={onConfirm}
          className={`flex items-center justify-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-black ${styles.confirm}`}
        >
          <Check className="h-3 w-3 shrink-0" /> Evet
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel px-3 text-[11px] font-bold">
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

export function ListInlineActionConfirmPopover({
  message,
  onConfirm,
  onCancel,
  tone = 'red',
  className = '',
}) {
  return (
    <div className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 ${className}`}>
      <ListInlineActionConfirm
        message={message}
        onConfirm={onConfirm}
        onCancel={onCancel}
        tone={tone}
      />
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
