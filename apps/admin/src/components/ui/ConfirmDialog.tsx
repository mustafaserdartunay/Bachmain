import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Design-system confirm — Evet / Hayır (replaces window.confirm).
 */
export function ConfirmDialog({
  open,
  title = 'Onay',
  description,
  confirmLabel = 'Evet',
  cancelLabel = 'Hayır',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={onCancel}
      />
      <div
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl',
          tone === 'danger' ? 'border-rose-200' : 'border-border',
        )}
      >
        <div
          className={cn(
            'flex items-start gap-3 border-b px-5 py-4',
            tone === 'danger' ? 'border-rose-100 bg-rose-50/80' : 'border-border bg-surface',
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              tone === 'danger' ? 'bg-rose-500/15 text-rose-600' : 'bg-bach-blue/10 text-bach-blue',
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 id="confirm-dialog-title" className="text-base font-bold text-text">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4">
          <Button variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? '…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmDialog
