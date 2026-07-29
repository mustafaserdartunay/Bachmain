import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ConversationList, { ConversationToolbar } from '../components/Omnichannel/ConversationList'
import ChatThread from '../components/Omnichannel/ChatThread'
import MessageComposer from '../components/Omnichannel/MessageComposer'
import CrmContextPanel from '../components/Omnichannel/CrmContextPanel'
import AiInsightsPanel from '../components/Omnichannel/AiInsightsPanel'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { analyzeConversationWithAi, buildConversationContext } from '../omnichannel/ai/omniAiApi'
import {
  getLearningStats,
  recordAcceptedReply,
  recordFeedback,
} from '../omnichannel/ai/learningStore'
import { readAiSettings, saveAiSettings } from '../omnichannel/ai/settings'
import {
  assignConversation,
  getConversationMessages,
  mergeWhatsAppInbox,
  readConversations,
  readLeads,
} from '../omnichannel/store'
import { sendChannelMessage, openConversation } from '../omnichannel/services/hub'
import { pullWhatsAppInbox } from '../utils/whatsappChannelApi'
import { getCustomerProfiles } from '../data/customerProfiles'

export default function OmnichannelPage() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState(() => readConversations())
  const [selectedId, setSelectedId] = useState(() => readConversations()[0]?.id || null)
  const [channelFilter, setChannelFilter] = useState(() => searchParams.get('kanal') || 'all')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestedText, setSuggestedText] = useState('')
  const [aiSettings, setAiSettings] = useState(() => readAiSettings())
  const [insights, setInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [learningStats, setLearningStats] = useState(() => getLearningStats())

  const appliedSuggestionRef = useRef('')
  const autoRepliedRef = useRef(new Set())
  const analyzeRequestRef = useRef(0)

  const refresh = useCallback(() => {
    setConversations(readConversations())
    setLearningStats(getLearningStats())
  }, [])

  useEffect(() => {
    const kanal = searchParams.get('kanal')
    if (kanal) setChannelFilter(kanal)
  }, [searchParams])

  useEffect(() => {
    window.addEventListener('bach:omni-updated', refresh)
    window.addEventListener('bach:omni-ai-learning-updated', refresh)
    window.addEventListener('bach:omni-ai-settings-updated', () => setAiSettings(readAiSettings()))
    return () => {
      window.removeEventListener('bach:omni-updated', refresh)
      window.removeEventListener('bach:omni-ai-learning-updated', refresh)
      window.removeEventListener('bach:omni-ai-settings-updated', () =>
        setAiSettings(readAiSettings()),
      )
    }
  }, [refresh])

  useEffect(() => {
    let cancelled = false
    async function syncInbox() {
      try {
        const data = await pullWhatsAppInbox()
        if (cancelled || !data?.inbox) return
        mergeWhatsAppInbox(data.inbox)
        refresh()
      } catch {
        // no session / not configured
      }
    }
    syncInbox()
    const timer = window.setInterval(syncInbox, 20000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [refresh])

  const customers = useMemo(() => getCustomerProfiles(), [conversations])
  const leads = useMemo(() => readLeads(), [conversations])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return conversations
      .filter((item) => channelFilter === 'all' || item.channel === channelFilter)
      .filter((item) => {
        if (!query) return true
        return [
          item.contactName,
          item.contactPhone,
          item.contactEmail,
          item.contactHandle,
          item.lastMessagePreview,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
  }, [conversations, channelFilter, search])

  const selectedConversation = conversations.find((item) => item.id === selectedId) || null
  const messages = selectedId ? getConversationMessages(selectedId) : []

  const customer = selectedConversation?.customerId
    ? customers.find((item) => item.id === selectedConversation.customerId)
    : null

  const lead = selectedConversation?.leadId
    ? leads.find((item) => item.id === selectedConversation.leadId)
    : null

  const lastInboundMessage = useMemo(() => {
    const inbound = messages.filter((m) => m.direction === 'in' && m.type === 'text')
    return inbound[inbound.length - 1] || null
  }, [messages])

  const runAiAnalysis = useCallback(async () => {
    if (!selectedConversation || messages.length === 0) {
      setInsights(null)
      return
    }

    const requestId = ++analyzeRequestRef.current
    setAiLoading(true)

    try {
      const result = await analyzeConversationWithAi({
        messages,
        context: buildConversationContext({ conversation: selectedConversation, customer, lead }),
      })
      if (requestId === analyzeRequestRef.current) {
        setInsights(result)
      }
    } finally {
      if (requestId === analyzeRequestRef.current) {
        setAiLoading(false)
      }
    }
  }, [selectedConversation, messages, customer, lead])

  useEffect(() => {
    runAiAnalysis()
  }, [runAiAnalysis])

  useEffect(() => {
    if (selectedId) openConversation(selectedId)
  }, [selectedId, messages.length])

  useEffect(() => {
    if (!aiSettings.autoReply || !selectedConversation || !lastInboundMessage || sending) return
    if (autoRepliedRef.current.has(lastInboundMessage.id)) return

    const outboundAfter = messages.some(
      (m) => m.direction === 'out' && new Date(m.at) > new Date(lastInboundMessage.at),
    )
    if (outboundAfter) {
      autoRepliedRef.current.add(lastInboundMessage.id)
      return
    }

    if (!insights?.primaryReply || insights.source !== 'openai') return
    if ((insights.confidence || 0) < aiSettings.autoReplyMinConfidence) return

    const timer = setTimeout(async () => {
      if (autoRepliedRef.current.has(lastInboundMessage.id)) return
      autoRepliedRef.current.add(lastInboundMessage.id)

      setSending(true)
      try {
        await sendChannelMessage({
          channel: selectedConversation.channel,
          conversationId: selectedConversation.id,
          body: insights.primaryReply,
          type: 'text',
          senderName: 'AI Asistan',
        })
        recordAcceptedReply({
          customerMessage: lastInboundMessage.body,
          suggestion: insights.primaryReply,
          finalText: insights.primaryReply,
          channel: selectedConversation.channel,
          conversationId: selectedConversation.id,
        })
        refresh()
      } finally {
        setSending(false)
      }
    }, aiSettings.autoReplyDelayMs)

    return () => clearTimeout(timer)
  }, [
    aiSettings.autoReply,
    aiSettings.autoReplyDelayMs,
    aiSettings.autoReplyMinConfidence,
    insights,
    lastInboundMessage,
    messages,
    refresh,
    selectedConversation,
    sending,
  ])

  async function handleSend(payload) {
    if (!selectedConversation || sending) return
    setSending(true)
    try {
      const body = payload.body?.trim() || ''
      await sendChannelMessage({
        channel: selectedConversation.channel,
        conversationId: selectedConversation.id,
        body,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        mediaName: payload.mediaName,
        duration: payload.duration,
      })

      if (body && (appliedSuggestionRef.current || insights?.primaryReply)) {
        recordAcceptedReply({
          customerMessage: lastInboundMessage?.body || '',
          suggestion: appliedSuggestionRef.current || insights?.primaryReply || '',
          finalText: body,
          channel: selectedConversation.channel,
          conversationId: selectedConversation.id,
        })
      }

      appliedSuggestionRef.current = ''
      setSuggestedText('')
      refresh()
    } catch (error) {
      window.alert(
        error?.message ||
          'Mesaj gönderilemedi. WhatsApp için Ayarlar → Mesaj Merkezi’nde Phone Number ID ve Access Token kaydedin.',
      )
    } finally {
      setSending(false)
    }
  }

  function handleAssignUser(userId) {
    if (!selectedId) return
    assignConversation(selectedId, { userId, departmentId: selectedConversation?.departmentId })
    refresh()
  }

  function handleAssignDepartment(departmentId) {
    if (!selectedId) return
    assignConversation(selectedId, { userId: selectedConversation?.assignedUserId, departmentId })
    refresh()
  }

  function handleApplySuggestion(text) {
    appliedSuggestionRef.current = text
    setSuggestedText(text)
  }

  async function handleSendPrimary(text) {
    appliedSuggestionRef.current = text
    await handleSend({ type: 'text', body: text })
  }

  function handleFeedback({ suggestion, rating }) {
    if (!selectedConversation) return
    recordFeedback({
      conversationId: selectedConversation.id,
      suggestion,
      rating,
      channel: selectedConversation.channel,
    })
    setLearningStats(getLearningStats())
  }

  function handleToggleAutoReply(enabled) {
    const next = saveAiSettings({ autoReply: enabled })
    setAiSettings(next)
  }

  return (
    <div className="modern-dashboard space-y-2.5">
      <ConversationToolbar
        channelFilter={channelFilter}
        onChannelFilter={setChannelFilter}
        search={search}
        onSearch={setSearch}
        conversationCount={filteredConversations.length}
      />

      <div className="grid min-h-[calc(100dvh-9rem)] grid-cols-1 gap-2 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,16rem)]">
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <section className="glass flex min-h-0 flex-col overflow-hidden rounded-2xl">
          <ChatThread conversation={selectedConversation} messages={messages} />
          <AiInsightsPanel
            insights={insights}
            loading={aiLoading}
            aiSettings={aiSettings}
            learningStats={learningStats}
            onApplySuggestion={handleApplySuggestion}
            onSendPrimary={handleSendPrimary}
            onRegenerate={runAiAnalysis}
            onFeedback={handleFeedback}
            onToggleAutoReply={handleToggleAutoReply}
          />
          <MessageComposer
            onSend={handleSend}
            disabled={!selectedConversation || sending}
            suggestedText={suggestedText}
          />
        </section>

        <CrmContextPanel
          conversation={selectedConversation}
          customer={customer}
          lead={lead}
          onAssignUser={handleAssignUser}
          onAssignDepartment={handleAssignDepartment}
        />
      </div>

      <ActivityArchivePanel
        title="Mesaj Merkezi Arşiv ve İşlem Geçmişi"
        modules={['omnichannel']}
        emptyMessage="Henüz mesaj merkezi arşiv veya silme kaydı yok."
      />
    </div>
  )
}
