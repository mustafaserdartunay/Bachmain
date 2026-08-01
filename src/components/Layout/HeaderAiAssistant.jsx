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
import { HEADER_SEARCH_INPUT_CLASS } from '../../utils/themeMode'

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
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
  })

  const [textInput, setTextInput] = useState('')
  const [apiKeyDraft, setApiKeyDraft] = useState(() => readVoiceSettings().openAiApiKey || '')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Merhaba! Ne yapmamı istersiniz? Sayfa açabilir, müşteri/ürün/teklif oluşturabilir, görev ve randevu ekleyebilirim.',
    },
  ])
  const [actionLogs, setActionLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiReady, setApiReady] = useState(null)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const loadingRef = useRef(false)
  const messagesRef = useRef(messages)

  messagesRef.current = messages
  loadingRef.current = loading

  const processUserText = useCallback(
    async (text) => {
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
        window.requestAnimationFrame(() => {
          inputRef.current?.focus({ preventScroll: true })
        })
      }
    },
    [location.pathname, navigate],
  )

  const {
    supported: micSupported,
    recording,
    processing,
    error: micError,
    start: startMic,
    toggle: toggleMic,
    stop: stopMic,
    clearError: clearMicError,
  } = useVoiceRecorder({ onResult: processUserText })

  useEffect(() => {
    if (!open) {
      stopMic()
      return undefined
    }

    let cancelled = false
    checkVoiceApiHealth()
      .then((health) => {
        if (!cancelled) setApiReady(Boolean(health?.hasApiKey))
      })
      .catch(() => {
        if (!cancelled) setApiReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, stopMic])

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    const focusInput = () => {
      if (cancelled) return
      const el = inputRef.current
      if (!el || el.disabled) return
      el.focus({ preventScroll: true })
    }
    const raf = window.requestAnimationFrame(focusInput)
    const t1 = window.setTimeout(focusInput, 0)
    const t2 = window.setTimeout(focusInput, 80)
    const t3 = window.setTimeout(focusInput, 180)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [open, apiReady])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, actionLogs, loading, recording, processing])

  function handleTextSubmit(event) {
    event.preventDefault()
    if (loading || processing || apiReady === false) return
    processUserText(textInput)
  }

  function handleInputKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (loading || processing || apiReady === false) return
    processUserText(textInput)
  }

  function handleSaveApiKey(event) {
    event.preventDefault()
    saveVoiceSettings({ openAiApiKey: apiKeyDraft.trim() })
    checkVoiceApiHealth()
      .then((health) => setApiReady(Boolean(health?.hasApiKey)))
      .catch(() => setApiReady(false))
  }

  function handleHeaderMicClick() {
    clearMicError()
    setError('')
    if (!open) {
      setOpen(true)
      if (micSupported) {
        window.setTimeout(() => {
          void startMic()
        }, 120)
      }
      return
    }
    if (!micSupported || loading || processing || apiReady === false) return
    toggleMic()
  }

  const inputDisabled = loading || processing || apiReady === false
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
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`header-ai-switch shrink-0 ${open ? 'is-open' : ''} ${recording ? 'is-recording' : ''} ${processing || loading ? 'is-busy' : ''}`}
        data-state={
          recording ? 'recording' : processing || loading ? 'busy' : open ? 'open' : 'idle'
        }
      >
        <span className="header-ai-switch-track">
          <span
            className={`header-ai-switch-thumb ${recording || processing ? 'is-mic' : open ? 'is-chat' : ''}`}
            aria-hidden="true"
          />
          <button
            type="button"
            data-header-popover-trigger="ai-assistant"
            onClick={toggle}
            className="header-ai-switch-btn header-ai-switch-btn--chat"
            aria-label="Asistan"
            title="Asistan"
            aria-pressed={open}
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={handleHeaderMicClick}
            disabled={!micSupported || processing || loading}
            className="header-ai-switch-btn header-ai-switch-btn--mic"
            aria-label={recording ? 'Kaydı bitir' : 'Mikrofonla komut ver'}
            title={
              recording ? 'Kaydı bitir ve OpenAI’ye gönder' : 'Mikrofonu aç — OpenAI işlem yapsın'
            }
            aria-pressed={recording}
          >
            {recording || processing ? (
              <MicOff className="h-3.5 w-3.5" strokeWidth={2.25} />
            ) : (
              <Mic className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
          </button>
        </span>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={
              menuStyle ?? {
                position: 'fixed',
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: 10000,
              }
            }
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
                  <ChatBubble
                    key={`${message.role}-${index}`}
                    role={message.role}
                    text={message.content}
                  />
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
                  <form
                    onSubmit={handleSaveApiKey}
                    className="rounded-xl border border-[rgba(140,145,165,0.16)] bg-white/35 p-3"
                  >
                    <p className="text-[11px] font-bold text-[var(--ink)]">OpenAI API anahtarı</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      Sunucuda `OPENAI_API_KEY` yoksa buraya `sk-...` anahtarınızı girin.
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

              <form
                onSubmit={handleTextSubmit}
                className="shrink-0 border-t border-[rgba(140,145,165,0.14)] px-4 py-3"
              >
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
                    {recording || processing ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={inputRef}
                    value={textInput}
                    onChange={(event) => setTextInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Örn: Teklifler sayfasını aç, yeni müşteri oluştur…"
                    className={`${HEADER_SEARCH_INPUT_CLASS} min-w-0 flex-1 !h-9 !text-xs`}
                    disabled={inputDisabled}
                    autoFocus={open && apiReady !== false}
                  />
                  <button
                    type="submit"
                    disabled={inputDisabled || !textInput.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.12)] text-[#7c3aed] transition-colors hover:bg-[rgba(124,58,237,0.2)] disabled:opacity-40"
                  >
                    {loading || processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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
