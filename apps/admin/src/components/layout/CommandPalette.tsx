import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, X } from 'lucide-react'
import { navItems } from '@/data/navigation'

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = navItems.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const go = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-surface-elevated shadow-2xl outline-none"
          aria-label="Komut paleti"
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 text-text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Modül ara veya komut yaz..."
              className="flex-1 bg-transparent py-4 text-sm text-text outline-none placeholder:text-text-subtle"
              autoFocus
            />
            <button type="button" onClick={() => onOpenChange(false)} aria-label="Kapat">
              <X className="h-4 w-4 text-text-subtle" />
            </button>
          </div>
          <ul className="max-h-72 overflow-y-auto p-2" role="listbox">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-muted transition hover:bg-bach-blue/10 hover:text-bach-blue"
                  onClick={() => go(item.path)}
                  role="option"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto text-xs text-text-subtle">{item.group}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-text-subtle">Sonuç bulunamadı</li>
            )}
          </ul>
          <div className="border-t border-border px-4 py-2 text-[10px] text-text-subtle">
            ↑↓ gezin · Enter seç · Esc kapat · ⌘K aç
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open, setOpen }
}
