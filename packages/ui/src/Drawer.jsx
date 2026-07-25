import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

export function Drawer({ open, onClose, title, children, side = 'right', className = '' }) {
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sideClass = side === 'left' ? 'left-0' : 'right-0'

  return (
    <div className="fixed inset-0 z-drawer" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <aside
        className={`absolute top-0 ${sideClass} flex h-full w-[min(100vw,24rem)] flex-col rounded-ds-drawer border-ds-border bg-ds-surface shadow-ds-layer-3 transition-transform duration-drawer ${side === 'left' ? 'border-r' : 'border-l'} ${className}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ds-border px-4 py-4">
          <h2 className="ds-h5 truncate">{title}</h2>
          <Button variant="ghost" size="iconOnly" onClick={onClose} aria-label="Kapat">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  )
}

export default Drawer
