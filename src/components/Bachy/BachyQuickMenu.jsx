import { Link } from 'react-router-dom'

const ITEMS = [
  { id: 'chat', label: 'AI Chat aç' },
  { id: 'mail', label: 'Mail yaz' },
  { id: 'whatsapp', label: 'WhatsApp yaz' },
  { id: 'offer', label: 'Teklif öner' },
  { id: 'report', label: 'Rapor analiz et' },
  { id: 'settings', label: 'Bachy ayarları', to: '/aios/bachy' },
]

export default function BachyQuickMenu({ open, x, y, onClose, onAction }) {
  if (!open) return null
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[115]"
        aria-label="Menüyü kapat"
        onClick={onClose}
      />
      <div
        className="fixed z-[116] min-w-[11rem] overflow-hidden rounded-xl border border-ds-border bg-ds-surface shadow-ds-lg"
        style={{
          left: Math.min(x, window.innerWidth - 200),
          top: Math.min(y, window.innerHeight - 280),
        }}
        role="menu"
      >
        {ITEMS.map((item) =>
          item.to ? (
            <Link
              key={item.id}
              to={item.to}
              role="menuitem"
              className="block px-3 py-2 text-left text-ds-small font-semibold text-ds-ink hover:bg-[var(--ds-surface-muted)]"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-ds-small font-semibold text-ds-ink hover:bg-[var(--ds-surface-muted)]"
              onClick={() => {
                onAction?.(item.id)
                onClose()
              }}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </>
  )
}
