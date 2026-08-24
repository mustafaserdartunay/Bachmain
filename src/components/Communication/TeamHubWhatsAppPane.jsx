import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Send, Sparkles, X, Zap } from 'lucide-react'
import {
  analyzeConversationWithAi,
  buildConversationContext,
  checkOmniAiHealth,
} from '../../omnichannel/ai/omniAiApi'
import { readAiSettings, saveAiSettings } from '../../omnichannel/ai/settings'
import { suggestReplies } from '../../omnichannel/ai/assistant'
import {
  getConversationMessages,
  markConversationRead,
  mergeWhatsAppInbox,
  readConversations,
} from '../../omnichannel/store'
import { getWhatsAppSetupStatus, sendChannelMessage } from '../../omnichannel/services/hub'
import { pullWhatsAppInbox } from '../../utils/whatsappChannelApi'
import { getCustomerProfiles } from '../../data/customerProfiles'
import { readLeads } from '../../omnichannel/store'
import { TEAM_HUB_FIELD_CLASS } from '../../utils/themeMode'

const CANNED_REPLIES = [
  'Merhaba, talebiniz için teşekkürler. Size nasıl yardımcı olabilirim?',
  'Talebiniz için teklif hazırlıyorum, kısa süre içinde ileteceğim.',
  'Ölçü, adet ve baskı detayını paylaşır mısınız?',
  'Siparişiniz üretim planına alındı. Tahmini teslim tarihini paylaşacağım.',
  'Mesajınızı aldım, hemen dönüş yapıyorum.',
]

function formatTime(value) {
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }) {
  const out = message.direction === 'out'
  const localOnly = message.deliveryMode === 'local' || message.status === 'local'
  return (
    <div className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-2.5 py-2 ${
          out
            ? localOnly
              ? 'rounded-br-md bg-emerald-600/75 text-white ring-1 ring-amber-300/50'
              : 'rounded-br-md bg-[#25D366]/90 text-white shadow-sm'
            : 'rounded-bl-md bg-white/72 text-[var(--ink)]'
        }`}
      >
        <p className="whitespace-pre-wrap text-[12px] font-semibold leading-snug">{message.body}</p>
        <p
          className={`mt-1 text-right text-[10px] ${out ? 'text-emerald-50/90' : 'text-[var(--muted)]'}`}
        >
          {formatTime(message.at)}
          {localOnly ? ' · yerel' : ''}
        </p>
      </div>
    </div>
  )
}

export default function TeamHubWhatsAppPane() {
  const [threads, setThreads] = useState(() =>
    readConversations().filter((item) => item.channel === 'whatsapp'),
  )
  const [selectedId, setSelectedId] = useState(() => {
    const list = readConversations().filter((item) => item.channel === 'whatsapp')
    return list.find((item) => item.unreadCount > 0)?.id || list[0]?.id || null
  })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [aiSettings, setAiSettings] = useState(() => readAiSettings())
  const [insights, setInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [waSetup, setWaSetup] = useState(() => getWhatsAppSetupStatus())
  const [aiHealth, setAiHealth] = useState(null)
  const bottomRef = useRef(null)
  const autoRepliedRef = useRef(new Set())
  const analyzeRequestRef = useRef(0)

  const refresh = useCallback(() => {
    const list = readConversations()
      .filter((item) => item.channel === 'whatsapp')
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    setThreads(list)
    setSelectedId((current) => {
      if (current && list.some((item) => item.id === current)) return current
      return list.find((item) => item.unreadCount > 0)?.id || list[0]?.id || null
    })
  }, [])

  useEffect(() => {
    window.addEventListener('bach:omni-updated', refresh)
    window.addEventListener('bach:omni-ai-settings-updated', () => setAiSettings(readAiSettings()))
    return () => {
      window.removeEventListener('bach:omni-updated', refresh)
      window.removeEventListener('bach:omni-ai-settings-updated', () =>
        setAiSettings(readAiSettings()),
      )
    }
  }, [refresh])

  useEffect(() => {
    setWaSetup(getWhatsAppSetupStatus())
    checkOmniAiHealth().then(setAiHealth)
    const onOmni = () => setWaSetup(getWhatsAppSetupStatus())
    window.addEventListener('bach:omni-updated', onOmni)
    return () => window.removeEventListener('bach:omni-updated', onOmni)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function syncInbox() {
      try {
        const data = await pullWhatsAppInbox()
        if (cancelled || !data?.inbox) return
        mergeWhatsAppInbox(data.inbox)
        refresh()
      } catch {
        /* oturum / yapılandırma yok */
      }
    }
    syncInbox()
    const timer = window.setInterval(syncInbox, 25000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [refresh])

  const conversation = useMemo(
    () => threads.find((item) => item.id === selectedId) || null,
    [threads, selectedId],
  )

  const messages = useMemo(
    () => (selectedId ? getConversationMessages(selectedId) : []),
    [selectedId, threads, sending],
  )

  const customers = useMemo(() => getCustomerProfiles(), [threads])
  const leads = useMemo(() => readLeads(), [threads])

  const customer = conversation?.customerId
    ? customers.find((item) => item.id === conversation.customerId)
    : null
  const lead = conversation?.leadId ? leads.find((item) => item.id === conversation.leadId) : null

  const lastInbound = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === 'in' && m.type === 'text')
    return inbound[inbound.length - 1] || null
  }, [messages])

  const localSuggestions = useMemo(() => {
    if (!lastInbound?.body) return CANNED_REPLIES.slice(0, 4)
    return suggestReplies(lastInbound.body, 'whatsapp')
  }, [lastInbound?.body])

  const runAiAnalysis = useCallback(async () => {
    if (!conversation || messages.length === 0 || !aiSettings.enabled) {
      setInsights(null)
      return
    }
    const requestId = ++analyzeRequestRef.current
    setAiLoading(true)
    try {
      const result = await analyzeConversationWithAi({
        messages,
        context: buildConversationContext({ conversation, customer, lead }),
      })
      if (requestId === analyzeRequestRef.current) {
        setInsights(result)
      }
    } finally {
      if (requestId === analyzeRequestRef.current) {
        setAiLoading(false)
      }
    }
  }, [conversation, messages, customer, lead, aiSettings.enabled])

  useEffect(() => {
    runAiAnalysis()
  }, [runAiAnalysis])

  useEffect(() => {
    if (selectedId) markConversationRead(selectedId)
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [selectedId, messages.length])

  useEffect(() => {
    if (!aiSettings.autoReply || !conversation || !lastInbound || sending) return
    if (autoRepliedRef.current.has(lastInbound.id)) return
    const replied = messages.some(
      (m) => m.direction === 'out' && new Date(m.at) > new Date(lastInbound.at),
    )
    if (replied) {
      autoRepliedRef.current.add(lastInbound.id)
      return
    }
    const text = insights?.primaryReply || insights?.replies?.[0]
    if (!text) return
    if (
      insights.source === 'openai' &&
      (insights.confidence || 0) < aiSettings.autoReplyMinConfidence
    ) {
      return
    }

    const timer = window.setTimeout(async () => {
      if (autoRepliedRef.current.has(lastInbound.id)) return
      autoRepliedRef.current.add(lastInbound.id)
      setSending(true)
      try {
        const result = await sendChannelMessage({
          channel: 'whatsapp',
          conversationId: conversation.id,
          body: text,
          type: 'text',
          senderName: 'AI Asistan',
        })
        if (result.warning) setStatusNote(result.warning)
        refresh()
      } catch {
        autoRepliedRef.current.delete(lastInbound.id)
      } finally {
        setSending(false)
      }
    }, aiSettings.autoReplyDelayMs)

    return () => window.clearTimeout(timer)
  }, [
    aiSettings.autoReply,
    aiSettings.autoReplyDelayMs,
    aiSettings.autoReplyMinConfidence,
    conversation,
    insights,
    lastInbound,
    messages,
    refresh,
    sending,
  ])

  async function handleSend(body = draft) {
    const text = String(body || '').trim()
    if (!conversation || !text || sending) return
    setSending(true)
    try {
      const result = await sendChannelMessage({
        channel: 'whatsapp',
        conversationId: conversation.id,
        body: text,
        type: 'text',
      })
      setDraft('')
      setQuickOpen(false)
      if (result.warning) setStatusNote(result.warning)
      else setStatusNote('')
      refresh()
    } catch (error) {
      window.alert(error?.message || 'WhatsApp mesajı gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  function handlePickReply(text) {
    handleSend(text)
  }

  function handleApplyToDraft(text) {
    setDraft(text)
    setQuickOpen(false)
  }

  if (threads.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3 py-6 text-center">
        <p className="text-[13px] font-bold text-[var(--ink)]">WhatsApp konuşması yok</p>
        <p className="text-[12px] font-semibold text-[var(--muted)]">
          Gelen kutusu /mesajlar ile senkron olur.
        </p>
        <Link to="/mesajlar?kanal=whatsapp" className="text-[12px] font-bold text-sky-700">
          Mesaj merkezini aç
        </Link>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {!waSetup.configured || !aiHealth?.hasApiKey ? (
        <div className="shrink-0 space-y-1 border-b border-amber-300/40 bg-amber-500/10 px-2.5 py-2">
          {!waSetup.configured ? (
            <p className="text-[10px] font-semibold leading-snug text-amber-900">
              WhatsApp API bağlı değil — mesajlar yerel kaydedilir.{' '}
              <Link to="/mesajlar?ayarlar=1" className="font-bold underline">
                Ayarları aç
              </Link>
            </p>
          ) : null}
          {!aiHealth?.hasApiKey ? (
            <p className="text-[10px] font-semibold leading-snug text-violet-900">
              OpenAI anahtarı yok — yerel şablonlar kullanılır.{' '}
              <Link to="/mesajlar?ayarlar=1" className="font-bold underline">
                API key ekle
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
      {statusNote ? (
        <p className="shrink-0 border-b border-white/40 bg-white/55 px-2.5 py-1.5 text-[10px] font-semibold text-[var(--muted)]">
          {statusNote}
        </p>
      ) : null}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/40 px-2 py-1.5">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => setSelectedId(thread.id)}
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
              thread.id === selectedId
                ? 'bg-[#25D366]/15 text-[#128C7E] ring-1 ring-[#25D366]/35'
                : 'bg-white/45 text-[var(--muted)]'
            }`}
            title={thread.contactPhone || thread.contactName}
          >
            {thread.contactName?.split(' ')[0] || 'WA'}
            {thread.unreadCount ? ` · ${thread.unreadCount}` : ''}
          </button>
        ))}
      </div>

      {conversation ? (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/35 px-2.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-extrabold text-[var(--ink)]">
                {conversation.contactName}
              </p>
              <p className="truncate text-[10px] font-semibold text-[var(--muted)]">
                {conversation.contactPhone || conversation.lastMessagePreview}
              </p>
            </div>
            <Link
              to={`/mesajlar?kanal=whatsapp`}
              className="shrink-0 text-[10px] font-bold text-sky-700"
            >
              Tam ekran
            </Link>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain p-2.5">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-[12px] font-semibold text-[var(--muted)]">
                Henüz mesaj yok.
              </p>
            ) : (
              messages.map((message) =>
                message.type === 'text' && message.body ? (
                  <MessageBubble key={message.id} message={message} />
                ) : null,
              )
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex shrink-0 items-center gap-1.5 border-t border-white/50 p-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
          >
            <button
              type="button"
              onClick={() => setQuickOpen((value) => !value)}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                quickOpen
                  ? 'bg-violet-500/15 text-violet-700 ring-1 ring-violet-400/40'
                  : 'bg-white/70 text-violet-600 hover:bg-violet-500/10'
              }`}
              title="Hazır cevaplar"
              aria-label="Hazır cevaplar"
              aria-expanded={quickOpen}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="WhatsApp yanıtı..."
              className={`${TEAM_HUB_FIELD_CLASS} min-w-0 flex-1 !h-8 !rounded-full !text-[12px]`}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white disabled:opacity-40"
              aria-label="Gönder"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </form>

          {quickOpen ? (
            <div className="absolute inset-x-0 bottom-0 top-[4.5rem] z-20 flex flex-col rounded-t-[16px] bg-white/92 shadow-[0_-8px_28px_rgba(30,35,60,0.12)] ring-1 ring-white/80 backdrop-blur-md">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/60 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-violet-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Hazır cevaplar
                </p>
                <div className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1 text-[10px] font-bold text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(aiSettings.autoReply)}
                      onChange={(event) => {
                        const next = saveAiSettings({ autoReply: event.target.checked })
                        setAiSettings(next)
                      }}
                      className="rounded"
                    />
                    <Zap className="h-3 w-3" />
                    Otomatik
                  </label>
                  <button
                    type="button"
                    onClick={() => setQuickOpen(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/70 text-[var(--muted)]"
                    aria-label="Kapat"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                {aiLoading ? (
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-violet-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    OpenAI önerileri hazırlanıyor...
                  </p>
                ) : null}

                {insights?.error ? (
                  <p className="rounded-[12px] bg-amber-500/12 px-2.5 py-2 text-[11px] font-semibold text-amber-900">
                    OpenAI: {insights.error} — yerel öneriler kullanılıyor.
                  </p>
                ) : null}

                {insights?.primaryReply ? (
                  <div className="rounded-[12px] bg-violet-500/8 px-2.5 py-2 ring-1 ring-violet-400/20">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                      OpenAI ·{' '}
                      {insights.source === 'openai' ? aiSettings.model || 'gpt-4o-mini' : 'Yerel'}
                    </p>
                    <p className="text-[12px] font-semibold leading-snug text-[var(--ink)]">
                      {insights.primaryReply}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleApplyToDraft(insights.primaryReply)}
                        className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-[var(--muted)]"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePickReply(insights.primaryReply)}
                        className="rounded-lg bg-[#25D366] px-2 py-1 text-[10px] font-bold text-white"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                ) : null}

                {(insights?.replySuggestions || insights?.replies || localSuggestions).length >
                0 ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Öneriler
                    </p>
                    <div className="space-y-1">
                      {[
                        ...(insights?.replySuggestions || insights?.replies || []),
                        ...localSuggestions,
                      ]
                        .filter(Boolean)
                        .filter((item, index, arr) => arr.indexOf(item) === index)
                        .slice(0, 6)
                        .map((text) => (
                          <button
                            key={text}
                            type="button"
                            onClick={() => handlePickReply(text)}
                            className="w-full rounded-[12px] bg-white/75 px-2.5 py-2 text-left text-[11px] font-semibold leading-snug text-[var(--ink)] transition-colors hover:bg-white"
                          >
                            {text}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    Şablonlar
                  </p>
                  <div className="space-y-1">
                    {CANNED_REPLIES.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => handlePickReply(text)}
                        className="w-full rounded-[12px] bg-white/55 px-2.5 py-2 text-left text-[11px] font-semibold leading-snug text-[var(--ink)] hover:bg-white/85"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
