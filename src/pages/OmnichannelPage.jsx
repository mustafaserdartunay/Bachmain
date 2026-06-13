import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, Settings2, Wifi, WifiOff } from 'lucide-react'
import ConversationList from '../components/Omnichannel/ConversationList'
import ChatThread from '../components/Omnichannel/ChatThread'
import MessageComposer from '../components/Omnichannel/MessageComposer'
import CrmContextPanel from '../components/Omnichannel/CrmContextPanel'
import AiInsightsPanel from '../components/Omnichannel/AiInsightsPanel'
import ChannelBadge from '../components/Omnichannel/ChannelBadge'
import { analyzeConversation } from '../omnichannel/ai/assistant'
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

export default function OmnichannelPage() {
  const [conversations, setConversations] = useState(() => readConversations())
  const [selectedId, setSelectedId] = useState(() => readConversations()[0]?.id || null)
  const [channelFilter, setChannelFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestedText, setSuggestedText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [channelConfig, setChannelConfig] = useState(() => readChannelConfig())

  const refresh = useCallback(() => {
    setConversations(readConversations())
  }, [])

  useEffect(() => {
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [refresh])

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

  const insights = selectedConversation
    ? {
        ...analyzeConversation(messages),
        replySuggestions: analyzeConversation(messages).replies,
      }
    : null

  useEffect(() => {
    if (selectedId) openConversation(selectedId)
  }, [selectedId, messages.length])

  async function handleSend(payload) {
    if (!selectedConversation || sending) return
    setSending(true)
    try {
      await sendChannelMessage({
        channel: selectedConversation.channel,
        conversationId: selectedConversation.id,
        body: payload.body,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
        mediaName: payload.mediaName,
        duration: payload.duration,
      })
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
    setSuggestedText(text)
  }

  function handleSaveConfig() {
    saveChannelConfig(channelConfig)
    setSettingsOpen(false)
  }

  const connectedCount = Object.values(channelConfig).filter((item) => item.connected).length

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-dark-500/45 bg-dark-800/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Omnichannel Communication Center</h1>
            <p className="text-xs text-gray-500">
              WhatsApp · Instagram · Messenger · E-posta · TikTok Leads — tek ekranda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 md:inline">
            {connectedCount}/5 kanal bağlı
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700"
          >
            <Settings2 className="h-4 w-4" />
            Kanal Ayarları
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="border-b border-dark-500/45 bg-dark-900/95 px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {Object.values(CHANNELS).map((channel) => {
              const config = channelConfig[channel.id] || {}
              return (
                <div key={channel.id} className="rounded-xl border border-dark-500/45 bg-dark-800/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <ChannelBadge channel={channel.id} showLabel />
                    {config.connected ? (
                      <Wifi className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <p className="mb-2 text-[10px] text-gray-500">{channel.api}</p>
                  <label className="mb-2 flex items-center gap-2 text-xs text-gray-400">
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
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-lg px-3 py-2 text-xs font-bold text-gray-400">
              İptal
            </button>
            <button type="button" onClick={handleSaveConfig} className={`${BTN_SUCCESS} px-4 py-2 text-xs`}>
              Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr_300px] xl:grid-cols-[360px_1fr_320px]">
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          channelFilter={channelFilter}
          onChannelFilter={setChannelFilter}
          search={search}
          onSearch={setSearch}
        />

        <section className="flex min-h-0 flex-col border-r border-dark-500/45">
          <ChatThread conversation={selectedConversation} messages={messages} />
          <AiInsightsPanel insights={insights} onApplySuggestion={handleApplySuggestion} />
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

      <div className="border-t border-dark-500/45 bg-dark-900/80 px-4 py-2 text-[10px] text-gray-500">
        Webhook uçları: <code className="text-gray-400">/api/webhooks/whatsapp</code> ·{' '}
        <code className="text-gray-400">/api/webhooks/instagram</code> ·{' '}
        <code className="text-gray-400">/api/webhooks/facebook</code> ·{' '}
        <code className="text-gray-400">/api/webhooks/email</code> ·{' '}
        <code className="text-gray-400">/api/webhooks/tiktok</code>
        {' · '}
        <Link to="/teklifler" className="text-blue-400 hover:text-blue-300">Teklifler</Link>
        {' · '}
        <Link to="/siparisler" className="text-blue-400 hover:text-blue-300">Siparişler</Link>
      </div>
    </div>
  )
}
