import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Mic, MicOff, Send, Sparkles, X } from 'lucide-react'
import useVoiceRecorder from '../../hooks/useVoiceRecorder'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import { checkVoiceApiHealth, sendVoiceChat } from '../../utils/voiceApi'
import { buildRichVoiceContext, executeVoiceActions } from '../../utils/voiceActions'
import { readVoiceSettings } from '../../utils/voiceSettings'

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-blue-500/20 text-blue-100' : 'bg-dark-700/80 text-gray-200'}`}>
        {text}
      </div>
    </div>
  )
}

export default function VoiceAssistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba! Mikrofona basıp konuşun, bitince tekrar basın. Müşteri, ürün veya teklif oluşturabilirim.' },
  ])
  const [actionLogs, setActionLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiReady, setApiReady] = useState(null)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const loadingRef = useRef(false)
  const messagesRef = useRef(messages)
  const speakRepliesRef = useRef(readVoiceSettings().speakReplies)
  const panelOpenRef = useRef(false)
  const micSupportedRef = useRef(false)
  const startMicRef = useRef(() => {})

  const { speak, stop: stopSpeak } = useSpeechSynthesis()

  messagesRef.current = messages
  loadingRef.current = loading
  speakRepliesRef.current = readVoiceSettings().speakReplies

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

      if (speakRepliesRef.current) speak(reply)
    } catch (requestError) {
      setError(requestError.message || 'Sesli asistan yanıt veremedi.')
    } finally {
      setLoading(false)
      setTextInput('')
    }
  }, [location.pathname, navigate, speak])

  const {
    supported: micSupported,
    recording,
    processing,
    listening,
    error: micError,
    start: startMic,
    stop: stopMic,
    toggle: toggleMic,
    clearError: clearMicError,
  } = useVoiceRecorder({
    onResult: processUserText,
  })

  startMicRef.current = startMic
  panelOpenRef.current = open
  micSupportedRef.current = micSupported

  useEffect(() => {
    if (!open) return
    checkVoiceApiHealth()
      .then((health) => setApiReady(Boolean(health?.hasApiKey)))
      .catch(() => setApiReady(false))
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, actionLogs, loading, recording, processing])

  function closePanel() {
    stopMic()
    stopSpeak()
    setOpen(false)
  }

  function openPanel({ startListening = false } = {}) {
    setOpen(true)
    clearMicError()
    if (startListening && micSupported) {
      window.setTimeout(() => startMic(), 120)
    }
  }

  function handleHeaderMicClick() {
    if (open) {
      toggleMic()
      return
    }
    openPanel({ startListening: true })
  }

  function handleTextSubmit(event) {
    event.preventDefault()
    processUserText(textInput)
  }

  const displayError = error || micError
  const statusText = recording
    ? 'Kaydediliyor… bitince mikrofona tekrar basın'
    : processing
      ? 'Ses yazıya dönüştürülüyor…'
      : loading
        ? 'AI yanıt hazırlanıyor…'
        : apiReady === false
          ? 'API anahtarı eksik — Ayarlar > Sesli AI veya .env dosyasını kontrol edin'
          : 'Mikrofona basın, konuşun, bitince tekrar basın'

  return (
    <>
      <button
        type="button"
        onClick={handleHeaderMicClick}
        disabled={processing || loading}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${
          recording
            ? 'border-red-500/50 bg-red-500/15 text-red-300 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]'
            : 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
        }`}
        title={recording ? 'Kaydı bitir' : 'Sesli AI Asistan'}
      >
        {recording || processing ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {recording && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 p-4 pt-20 backdrop-blur-sm" onClick={closePanel}>
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-dark-500/60 bg-dark-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-dark-500/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-white">Sesli AI Asistan</h2>
                  <p className="text-[11px] font-semibold text-gray-500">{statusText}</p>
                </div>
              </div>
              <button type="button" onClick={closePanel} className="rounded-lg p-2 text-gray-500 hover:bg-dark-700 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[340px] space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((message, index) => (
                <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.content} />
              ))}
              {listening && (
                <p className="flex items-center gap-2 text-xs font-semibold text-red-300">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  {recording ? 'Mikrofon açık — konuşun' : 'Whisper ile sesiniz işleniyor'}
                </p>
              )}
              {actionLogs.length > 0 && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-emerald-300">Yapılan işlemler</p>
                  <ul className="space-y-1 text-xs text-gray-300">
                    {actionLogs.map((log) => (
                      <li key={log}>• {log}</li>
                    ))}
                  </ul>
                </div>
              )}
              {displayError && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300">
                  {displayError}
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="border-t border-dark-500/50 p-4">
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!micSupported || loading || processing}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    recording
                      ? 'border-red-500/40 bg-red-500/15 text-red-300'
                      : 'border-dark-500/50 bg-dark-700/70 text-gray-300 hover:text-white'
                  }`}
                  title={recording ? 'Kaydı bitir ve gönder' : 'Kayda başla'}
                >
                  {recording || processing ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  placeholder="Örn: ABC Ambalaj için 5000 adet kraft kutu teklifi oluştur"
                  className="form-input min-w-0 flex-1"
                  disabled={loading || processing}
                />
                <button
                  type="submit"
                  disabled={loading || processing || !textInput.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-300 transition-colors hover:bg-blue-500/25 disabled:opacity-40"
                >
                  {loading || processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
              {!micSupported && (
                <p className="mt-2 text-[11px] text-amber-300">Tarayıcınız mikrofon kaydını desteklemiyor. Yazarak komut verebilirsiniz.</p>
              )}
              {micSupported && (
                <p className="mt-2 text-[11px] text-gray-500">Ses tanıma OpenAI Whisper ile sunucuda yapılır — Google ağı gerekmez.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
