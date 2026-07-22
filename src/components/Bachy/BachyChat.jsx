import { useEffect, useRef, useState } from 'react'
import { Send, X, Paperclip } from 'lucide-react'
import { askBachy } from '../../bachy/speech'
import { executeVoiceActions } from '../../utils/voiceActions'
import { useNavigate } from 'react-router-dom'

export default function BachyChat({ open, onClose, engineState, pathname, dock = 'sidebar' }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba, ben Bachy. Bugün hangi konuda yardımcı olayım?' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [fileNote, setFileNote] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (open) listRef.current?.scrollTo?.(0, listRef.current.scrollHeight)
  }, [messages, open])

  if (!open) return null

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    const withFile = fileNote ? `${text}\n\n[Ek: ${fileNote}]` : text
    setInput('')
    setFileNote('')
    setMessages((m) => [...m, { role: 'user', content: withFile }])
    setBusy(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const result = await askBachy({
        userText: withFile,
        pathname,
        engineState,
        history,
      })
      setMessages((m) => [...m, { role: 'assistant', content: result.reply }])
      if (result.actions?.length) {
        await executeVoiceActions(result.actions, navigate)
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err.message || 'Yanıt alınamadı. OpenAI bağlantısını kontrol edin.',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function onFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileNote(`${file.name} (${Math.round(file.size / 1024)} KB)`)
    event.target.value = ''
  }

  return (
    <div
      className={`pointer-events-auto fixed z-[90] flex h-[min(28rem,70vh)] w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-ds-border bg-ds-surface shadow-ds-xl ${
        dock === 'sidebar'
          ? 'bottom-4 left-[max(0.75rem,calc(var(--shell-gap)+0.5rem))] lg:left-[calc(var(--shell-gap)+var(--ds-sidebar-expanded,17.5rem)+0.5rem)]'
          : 'bottom-24 right-4 sm:right-6'
      }`}
    >
      <div className="flex items-center justify-between border-b border-ds-border px-3 py-2">
        <div>
          <p className="text-ds-small font-bold text-ds-ink">Bachy AI Chat</p>
          <p className="text-ds-caption text-ds-muted">ERP bağlamlı · OpenAI</p>
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 hover:bg-[var(--ds-surface-muted)]"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`max-w-[90%] rounded-xl px-3 py-2 text-ds-small ${
              m.role === 'user'
                ? 'ml-auto bg-[color-mix(in_srgb,var(--ds-primary)_12%,transparent)] text-ds-ink'
                : 'bg-[var(--ds-surface-muted)] text-ds-ink'
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy ? <p className="text-ds-caption text-ds-muted">Bachy düşünüyor…</p> : null}
      </div>
      <div className="border-t border-ds-border p-2">
        {fileNote ? (
          <p className="mb-1 truncate px-1 text-ds-caption text-ds-muted">{fileNote}</p>
        ) : null}
        <div className="flex items-center gap-1.5">
          <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-ds-border hover:bg-[var(--ds-surface-muted)]">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.txt,.doc,.docx,image/*"
              onChange={onFile}
            />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Bachy’ye sor…"
            className="h-10 min-w-0 flex-1 rounded-xl border border-ds-border bg-[var(--ds-surface-raised)] px-3 text-ds-small outline-none focus:border-ds-secondary"
          />
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ds-primary text-white disabled:opacity-50"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
