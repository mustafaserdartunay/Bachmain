import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const maxW = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="Kapat" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxW} overflow-hidden rounded-ds-xl border border-ds-border bg-ds-surface shadow-ds-xl ${className}`}>
        <div className="flex items-center justify-between gap-3 border-b border-ds-border px-5 py-4">
          <h2 className="ds-h3 truncate">{title}</h2>
          <Button variant="ghost" size="iconOnly" onClick={onClose} aria-label="Kapat">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="max-h-[min(70vh,32rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ds-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Modal
