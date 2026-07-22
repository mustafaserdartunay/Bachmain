import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BachyFigure from './BachyFigure'

/**
 * Compact header Bachy (official render) — opens lightweight AI chat dock.
 */
export default function BachyAI({ className = '' }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Merhaba! Ben Bachy. BachMain hakkında sorabilirsin.' },
  ])
  const [busy, setBusy] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const send = async (e) => {
    e.preventDefault()
    const q = input.trim()
    if (!q || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    try {
      const reply =
        q.toLowerCase().includes('fiyat') || q.toLowerCase().includes('paket')
          ? 'Paketler sayfasında Starter, Professional ve Enterprise var. 7 gün ücretsiz deneyebilirsin.'
          : q.toLowerCase().includes('giriş') || q.toLowerCase().includes('login')
            ? 'Giriş için sağ üstteki Giriş Yap butonunu kullan — yanındayım!'
            : 'BachMain; tekliften teslime tüm süreçleri tek panelde toplar. Daha fazlası için Özellikler veya Demo sayfasına bakabilirsin.'
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <div className="h-11 w-11 shrink-0 sm:h-12 sm:w-12">
        <BachyFigure
          pose="idle"
          float={!reduce}
          className="h-full w-full"
          alt="Bachy AI asistanı"
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-label="Bachy sohbet"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <p className="text-sm font-bold text-slate-800">Bachy</p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Kapat
              </button>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto px-3 py-3">
              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={`rounded-xl px-2.5 py-2 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'ml-6 bg-blue-600 text-white'
                      : 'mr-4 bg-slate-100 text-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-2.5">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Bir şey sor…"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                Gönder
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
