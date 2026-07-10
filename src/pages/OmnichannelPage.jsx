import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bot, Inbox, Settings2, Wifi, WifiOff } from 'lucide-react'
import ConversationList from '../components/Omnichannel/ConversationList'
import ChatThread from '../components/Omnichannel/ChatThread'
import MessageComposer from '../components/Omnichannel/MessageComposer'
import CrmContextPanel from '../components/Omnichannel/CrmContextPanel'
import AiInsightsPanel from '../components/Omnichannel/AiInsightsPanel'
import ChannelBadge from '../components/Omnichannel/ChannelBadge'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { AppPanelDot } from '../components/Layout/AppPageLayout'
import {
  analyzeConversationWithAi,
  buildConversationContext,
  checkOmniAiHealth,
} from '../omnichannel/ai/omniAiApi'
import { getLearningStats, recordAcceptedReply, recordFeedback } from '../omnichannel/ai/learningStore'
import { readAiSettings, saveAiSettings } from '../omnichannel/ai/settings'
import {
  assignConversation,
  getConversationMessages,
  readChannelConfig,
  readConversations,
  readLeads,
  saveChannelConfig,
} from '../omnichannel/store'
import { sendChannelMessage, openConversation } from '../omnichannel/services/hub'
import { getCustomerProfiles } from '../data/customerProfiles'
import { CHANNELS } from '../omnichannel/schema'
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { getClientOpenAiApiKey, saveVoiceSettings } from '../utils/voiceSettings'
import {
  APP_FILTER_LABEL_CLASS,
  APP_OMNI_SECTION_CLASS,
  APP_PANEL_TITLE_CLASS,
} from '../utils/dashboardDesign'

export default function OmnichannelPage() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState(() => readConversations())
  const [selectedId, setSelectedId] = useState(() => readConversations()[0]?.id || null)
  const [channelFilter, setChannelFilter] = useState(() => searchParams.get('kanal') || 'all')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestedText, setSuggestedText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [channelConfig, setChannelConfig] = useState(() => readChannelConfig())
  const [aiSettings, setAiSettings] = useState(() => readAiSettings())
  const [openAiKeyInput, setOpenAiKeyInput] = useState(() => getClientOpenAiApiKey())
  const [insights, setInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHealth, setAiHealth] = useState(null)
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
      window.removeEventListener('bach:omni-ai-settings-updated', () => setAiSettings(readAiSettings()))
    }
  }, [refresh])

  useEffect(() => {
    checkOmniAiHealth().then(setAiHealth)
  }, [openAiKeyInput])

  const customers = useMemo(() => getCustomerProfiles(), [conversations])
  const leads = useMemo(() => readLeads(), [conversations])

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return conversations
      .filter((item) => channelFilter === 'all' || item.channel === channelFilter)
      .filter((item) => {
        if (!query) return true
        return [item.contactName, item.contactPhone, item.contactEmail, item.contactHandle, item.lastMessagePreview]
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

  function handleSaveConfig() {
    saveChannelConfig(channelConfig)
    saveAiSettings(aiSettings)
    if (openAiKeyInput.trim()) {
      saveVoiceSettings({ openAiApiKey: openAiKeyInput.trim() })
    }
    setSettingsOpen(false)
    checkOmniAiHealth().then(setAiHealth)
  }

  const connectedCount = Object.values(channelConfig).filter((item) => item.connected).length

  return (
    <div className="modern-dashboard space-y-4">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[20px] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="emerald" />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[rgba(140,145,165,0.14)] text-emerald-600">
            <Inbox className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h1 className={APP_PANEL_TITLE_CLASS}>Mesaj Merkezi</h1>
            <p className="text-[12px] font-semibold text-[var(--muted)]">
              WhatsApp · Instagram · Messenger · E-posta · TikTok Leads
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`glass-pill !h-8 !px-3 !text-[12px] !font-bold ${
            aiHealth?.hasApiKey ? 'text-violet-600' : 'text-amber-600'
          }`}
          >
            <Bot className="mr-1 inline h-3.5 w-3.5" />
            {aiHealth?.hasApiKey ? 'OpenAI bağlı' : 'OpenAI anahtarı gerekli'}
          </span>
          <span className="glass-pill !h-8 !px-3 !text-[12px] !font-bold text-emerald-600">
            {connectedCount}/5 kanal bağlı
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className="btn-ghost inline-flex items-center gap-2 !px-3 !py-2 text-[12px] font-bold"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Kanal Ayarları
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="glass space-y-4 rounded-[20px] p-4">
          <div className={APP_OMNI_SECTION_CLASS}>
            <p className={`mb-3 flex items-center gap-2 ${APP_FILTER_LABEL_CLASS}`}>
              <Bot className="h-3.5 w-3.5" /> Yapay Zeka Ayarları
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={Boolean(aiSettings.enabled)}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                OpenAI analizi aktif
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={Boolean(aiSettings.autoReply)}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, autoReply: e.target.checked }))}
                />
                Otomatik müşteri yanıtı
              </label>
              <input
                type="password"
                placeholder="OpenAI API Key (sk-...)"
                value={openAiKeyInput}
                onChange={(e) => setOpenAiKeyInput(e.target.value)}
                className="form-input text-xs"
              />
              <input
                placeholder="Firma adı"
                value={aiSettings.companyName}
                onChange={(e) => setAiSettings((prev) => ({ ...prev, companyName: e.target.value }))}
                className="form-input text-xs"
              />
              <input
                placeholder="Marka sesi / ton"
                value={aiSettings.brandVoice}
                onChange={(e) => setAiSettings((prev) => ({ ...prev, brandVoice: e.target.value }))}
                className="form-input text-xs md:col-span-2"
              />
              <label className="text-xs text-[var(--muted)]">
                Min. güven ({Math.round((aiSettings.autoReplyMinConfidence || 0.72) * 100)}%)
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.01"
                  value={aiSettings.autoReplyMinConfidence}
                  onChange={(e) => setAiSettings((prev) => ({
                    ...prev,
                    autoReplyMinConfidence: Number(e.target.value),
                  }))}
                  className="mt-1 w-full"
                />
              </label>
              <p className="text-[12px] font-semibold text-[var(--muted)] md:col-span-2">
                {learningStats.exampleCount} öğrenilmiş yanıt · {learningStats.positiveFeedback} olumlu geri bildirim
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Object.values(CHANNELS).map((channel) => {
              const config = channelConfig[channel.id] || {}
              return (
                <div key={channel.id} className={APP_OMNI_SECTION_CLASS}>
                  <div className="mb-2 flex items-center justify-between">
                    <ChannelBadge channel={channel.id} showLabel />
                    {config.connected ? (
                      <Wifi className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-[var(--muted)]" />
                    )}
                  </div>
                  <p className="mb-2 text-[12px] font-semibold text-[var(--muted)]">{channel.api}</p>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={Boolean(config.connected)}
                      onChange={(e) => setChannelConfig((prev) => ({
                        ...prev,
                        [channel.id]: { ...prev[channel.id], connected: e.target.checked },
                      }))}
                    />
                    Bağlı
                  </label>
                  {channel.id === 'whatsapp' && (
                    <input
                      placeholder="Phone Number ID"
                      value={config.phoneNumberId || ''}
                      onChange={(e) => setChannelConfig((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, phoneNumberId: e.target.value },
                      }))}
                      className="form-input mb-2 w-full text-xs"
                    />
                  )}
                  {['instagram', 'facebook'].includes(channel.id) && (
                    <input
                      placeholder="Page ID"
                      value={config.pageId || ''}
                      onChange={(e) => setChannelConfig((prev) => ({
                        ...prev,
                        [channel.id]: { ...prev[channel.id], pageId: e.target.value },
                      }))}
                      className="form-input mb-2 w-full text-xs"
                    />
                  )}
                  {channel.id === 'email' && (
                    <>
                      <input
                        placeholder="IMAP Host"
                        value={config.imapHost || ''}
                        onChange={(e) => setChannelConfig((prev) => ({
                          ...prev,
                          email: { ...prev.email, imapHost: e.target.value },
                        }))}
                        className="form-input mb-2 w-full text-xs"
                      />
                      <input
                        placeholder="SMTP Host"
                        value={config.smtpHost || ''}
                        onChange={(e) => setChannelConfig((prev) => ({
                          ...prev,
                          email: { ...prev.email, smtpHost: e.target.value },
                        }))}
                        className="form-input w-full text-xs"
                      />
                    </>
                  )}
                  {channel.id === 'tiktok' && (
                    <input
                      placeholder="Advertiser ID"
                      value={config.advertiserId || ''}
                      onChange={(e) => setChannelConfig((prev) => ({
                        ...prev,
                        tiktok: { ...prev.tiktok, advertiserId: e.target.value },
                      }))}
                      className="form-input w-full text-xs"
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSettingsOpen(false)} className="btn-ghost !px-3 !py-2 text-[12px] font-bold">
              İptal
            </button>
            <button type="button" onClick={handleSaveConfig} className={`${BTN_SUCCESS} px-4 py-2 text-xs`}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="grid min-h-[calc(100dvh-14rem)] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-3">
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          channelFilter={channelFilter}
          onChannelFilter={setChannelFilter}
          search={search}
          onSearch={setSearch}
        />

        <section className="glass flex min-h-0 flex-col overflow-hidden rounded-[20px]">
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

      <div className="glass-inset rounded-[16px] px-4 py-2 text-[12px] font-semibold text-[var(--muted)]">
        Webhook uçları: <code className="text-[var(--ink)]">/api/webhooks/whatsapp</code> ·{' '}
        <code className="text-[var(--ink)]">/api/webhooks/instagram</code> ·{' '}
        <code className="text-[var(--ink)]">/api/webhooks/facebook</code> ·{' '}
        <code className="text-[var(--ink)]">/api/webhooks/email</code> ·{' '}
        <code className="text-[var(--ink)]">/api/webhooks/tiktok</code>
        {' · '}
        <Link to="/teklifler" className="font-bold text-blue-600 hover:text-blue-700">Teklifler</Link>
        {' · '}
        <Link to="/siparisler" className="font-bold text-blue-600 hover:text-blue-700">Siparişler</Link>
      </div>

      <ActivityArchivePanel
        title="Mesaj Merkezi Arşiv ve İşlem Geçmişi"
        modules={['omnichannel']}
        emptyMessage="Henüz mesaj merkezi arşiv veya silme kaydı yok."
      />
    </div>
  )
}
