import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Trash2 } from 'lucide-react'
import {
  DUZENLEME_KALEMI_BUTTON_CLASS,
  TEKLIFLER_COP_KUTUSU_BUTTON_CLASS,
} from '../../utils/buttonStyles'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

export const DELETE_TRASH_BUTTON_CLASS = `rounded-lg ${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS}`

export const EDIT_PENCIL_BUTTON_CLASS = DUZENLEME_KALEMI_BUTTON_CLASS

export const DELETE_TRASH_BUTTON_HIDDEN_CLASS = 'pointer-events-none invisible'

/**
 * Standart silme onayı: kırmızı gradient (Gelen E-Faturalar CTA tonu), minimal ölçüler.
 * Metin üstte, aksiyonlar altta: dar kabuklarda da satırlar birbirine girmez.
 */
export const DELETE_CONFIRM_PANEL_CLASS =
  'delete-confirm-panel flex w-full flex-col gap-2 rounded-xl border border-white/35 bg-gradient-to-br from-[#fda4af] via-[#f43f5e] to-[#e11d48] px-2.5 py-2 shadow-[0_10px_24px_-14px_rgba(30,35,60,0.65)] ring-1 ring-white/20'

/** Popover her zaman en üstte: portal + dropdown katmanının üstünde z-index. */
export const DELETE_CONFIRM_Z_INDEX = 12000

export const DELETE_CONFIRM_POPOVER_WIDTH = 288

/** Geriye dönük uyumluluk — tüm varyantlar tek standart tasarıma bağlandı. */
export const DELETE_CONFIRM_POPOVER_PANEL_CLASS = DELETE_CONFIRM_PANEL_CLASS
export const DELETE_CONFIRM_POPOVER_WARM_PANEL_CLASS = DELETE_CONFIRM_PANEL_CLASS
export const DELETE_CONFIRM_POPOVER_ANCHOR_CLASS = 'absolute right-0 top-12 z-40'

const CONFIRM_BUTTON_CLASS =
  'delete-confirm-yes inline-flex h-6 shrink-0 items-center gap-1 rounded-lg bg-white px-2 text-[12px] font-bold leading-none text-[#e11d48] transition-transform hover:scale-105'

const CANCEL_BUTTON_CLASS =
  'delete-confirm-no inline-flex h-6 shrink-0 items-center rounded-lg border border-white/45 bg-white/15 px-2 text-[12px] font-semibold leading-none text-white transition-transform hover:scale-105'

function DeleteConfirmPanel({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  className = '',
}) {
  return (
    <div
      className={`${DELETE_CONFIRM_PANEL_CLASS} ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <Trash2 className="mt-px h-3.5 w-3.5 shrink-0 text-white" />
        <div className="min-w-0 flex-1">
          <p className="delete-confirm-title break-words text-[13px] font-bold leading-tight text-white">
            {title}
          </p>
          {description ? (
            <p className="delete-confirm-desc break-words text-[11px] font-normal leading-tight text-white/85">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" onClick={onConfirm} className={CONFIRM_BUTTON_CLASS}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className={CANCEL_BUTTON_CLASS}>
          {cancelLabel}
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
    />
  )

  if (isInline) {
    return (
      <div className={`w-full ${className}`.trim()} onClick={(event) => event.stopPropagation()}>
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
