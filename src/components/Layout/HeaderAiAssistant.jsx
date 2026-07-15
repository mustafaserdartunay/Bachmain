import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Mic, MicOff, Send, Sparkles } from 'lucide-react'
import useVoiceRecorder from '../../hooks/useVoiceRecorder'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { checkVoiceApiHealth, sendVoiceChat } from '../../utils/voiceApi'
import { buildRichVoiceContext, executeVoiceActions } from '../../utils/voiceActions'
import { readVoiceSettings, saveVoiceSettings } from '../../utils/voiceSettings'
import { HEADER_CONTROL_BUTTON_CLASS, HEADER_SEARCH_INPUT_CLASS } from '../../utils/themeMode'

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
          isUser
            ? 'bg-[rgba(37,99,235,0.12)] font-semibold text-[var(--ink)]'
            : 'border border-[rgba(140,145,165,0.12)] bg-white/45 font-semibold text-[var(--ink)]'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

export default function HeaderAiAssistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const { open, setOpen, toggle } = useHeaderPopover('ai-assistant')
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
  })

  const [textInput, setTextInput] = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState(() => readVoiceSettings().openAiApiKey || '')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Merhaba! Ne yapmamı istersiniz? Sayfa açabilir, müşteri/ürün/teklif oluşturabilir, görev ve randevu ekleyebilirim.',
    },
  ])
  const [actionLogs, setActionLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiReady, setApiReady] = useState(null)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const loadingRef = useRef(false)
  const messagesRef = useRef(messages)

  messagesRef.current = messages
  loadingRef.current = loading

  const processUserText = useCallback(async (text) => {
    const clean = String(text || '').trim()
    if (!clean || loadingRef.current) return

    setError('')
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', content: clean }])

    try {
      const context = await buildRichVoiceContext(location.pathname)
      const history = [...messagesRef.current, { role: 'user', content: clean }]
        .filter((item) => item.role === 'user' || item.role === 'assistant')
        .slice(-12)
        .map((item) => ({ role: item.role, content: item.content }))

      const result = await sendVoiceChat({ messages: history, context })
      const reply = result.message || 'Tamam.'
      setMessages((current) => [...current, { role: 'assistant', content: reply }])

      if (result.actions?.length) {
        const logs = await executeVoiceActions(result.actions, navigate)
        setActionLogs((current) => [...logs, ...current].slice(0, 8))
      }
    } catch (requestError) {
      setError(requestError.message || 'AI yanıt veremedi.')
    } finally {
      setLoading(false)
      setTextInput('')
    }
  }, [location.pathname, navigate])

  const {
    supported: micSupported,
    recording,
    processing,
    error: micError,
    toggle: toggleMic,
    stop: stopMic,
  } = useVoiceRecorder({ onResult: processUserText })

  useEffect(() => {
    if (!open) {
      stopMic()
      return
    }
    checkVoiceApiHealth()
      .then((health) => setApiReady(Boolean(health?.hasApiKey)))
      .catch(() => setApiReady(false))
  }, [open, stopMic])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, actionLogs, loading, recording, processing])

  function handleTextSubmit(event) {
    event.preventDefault()
    processUserText(textInput)
  }

  function handleSaveApiKey(event) {
    event.preventDefault()
    saveVoiceSettings({ openAiApiKey: apiKeyDraft.trim() })
    checkVoiceApiHealth()
      .then((health) => setApiReady(Boolean(health?.hasApiKey)))
      .catch(() => setApiReady(false))
  }

  const displayError = error || micError
  const statusText = recording
    ? 'Dinleniyor… bitirmek için mikrofona tekrar basın'
    : processing
      ? 'Ses yazıya dönüştürülüyor…'
      : loading
        ? 'Yanıt hazırlanıyor…'
        : apiReady === false
          ? 'OpenAI anahtarı gerekli'
          : 'Yazın veya mikrofonla konuşun'

  return (
    <div className="relative flex items-center" ref={anchorRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        data-header-popover-trigger="ai-assistant"
        onClick={toggle}
        className={`${HEADER_CONTROL_BUTTON_CLASS} !w-auto gap-1.5 px-3 relative ${open ? 'ring-2 ring-[rgba(139,92,246,0.28)]' : ''}`}
        aria-label="Asistan"
        title="Asistan"
      >
        <span className="icon-wrap text-[#7c3aed]">
          <Sparkles className="h-4 w-4 shrink-0" />
        </span>
        <span className="hidden text-xs font-extrabold text-[var(--ink)] sm:inline">Asistan</span>
        {(recording || loading) && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-[#7c3aed]" />
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle ?? { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', zIndex: 10000 }}
          className="app-header-dropdown header-popover-panel header-ai-assistant-dropdown overflow-hidden"
          data-header-popover="ai-assistant"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="header-popover-head">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[var(--ink)]">AI Asistan</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">{statusText}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.1)] text-[#7c3aed]">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <div className="header-ai-body">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.map((message, index) => (
                <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.content} />
              ))}

              {actionLogs.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <p className="mb-1 text-[11px] font-bold text-emerald-700">Yapılan işlemler</p>
                  <ul className="space-y-0.5 text-[11px] font-semibold text-[var(--muted)]">
                    {actionLogs.map((log) => (
                      <li key={log}>• {log}</li>
                    ))}
                  </ul>
                </div>
              )}

              {displayError && (
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-[11px] font-semibold text-rose-600">
                  {displayError}
                </div>
              )}

              {apiReady === false && (
                <form onSubmit={handleSaveApiKey} className="rounded-xl border border-[rgba(140,145,165,0.16)] bg-white/35 p-3">
                  <p className="text-[11px] font-bold text-[var(--ink)]">OpenAI API anahtarı</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                    Sunucuda `.env` içinde `OPENAI_API_KEY` yoksa buraya `sk-...` anahtarınızı girin.
                  </p>
                  <input
                    value={apiKeyDraft}
                    onChange={(event) => setApiKeyDraft(event.target.value)}
                    placeholder="sk-..."
                    className={`${HEADER_SEARCH_INPUT_CLASS} mt-2 !h-9 !text-xs`}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="mt-2 inline-flex h-8 items-center rounded-xl bg-gradient-to-br from-[#7cf2c6] via-[#34d399] to-[#10b981] px-3 text-[11px] font-bold text-white"
                  >
                    Anahtarı Kaydet
                  </button>
                </form>
              )}

              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleTextSubmit} className="shrink-0 border-t border-[rgba(140,145,165,0.14)] px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!micSupported || loading || processing || apiReady === false}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-40 ${
                    recording
                      ? 'border-rose-500/35 bg-rose-500/10 text-rose-600'
                      : 'border-[rgba(140,145,165,0.2)] bg-white/40 text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                  title={recording ? 'Kaydı bitir' : 'Sesle komut ver'}
                >
                  {recording || processing ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  placeholder="Örn: Teklifler sayfasını aç, yeni müşteri oluştur…"
                  className={`${HEADER_SEARCH_INPUT_CLASS} min-w-0 flex-1 !h-9 !text-xs`}
                  disabled={loading || processing || apiReady === false}
                />
                <button
                  type="submit"
                  disabled={loading || processing || !textInput.trim() || apiReady === false}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.12)] text-[#7c3aed] transition-colors hover:bg-[rgba(124,58,237,0.2)] disabled:opacity-40"
                >
                  {loading || processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
