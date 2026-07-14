import { getCustomerProfiles } from '../data/customerProfiles'
import { CHANNELS, DEPARTMENTS, STORAGE_KEYS } from './schema'
import { mergeMessageCenterChannelConfig } from '../utils/messageCenterChannels'

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('bach:omni-updated'))
}

export function createId(prefix = 'OMNI') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function readConversations() {
  return readJson(STORAGE_KEYS.conversations, [])
}

export function writeConversations(items) {
  writeJson(STORAGE_KEYS.conversations, items)
}

export function readMessages() {
  return readJson(STORAGE_KEYS.messages, [])
}

export function writeMessages(items) {
  writeJson(STORAGE_KEYS.messages, items)
}

export function readLeads() {
  return readJson(STORAGE_KEYS.leads, [])
}

export function writeLeads(items) {
  writeJson(STORAGE_KEYS.leads, items)
}

export function readWebhookLog() {
  return readJson(STORAGE_KEYS.webhookLog, [])
}

export function appendWebhookLog(entry) {
  const log = [{ id: createId('WH'), at: new Date().toISOString(), ...entry }, ...readWebhookLog()].slice(0, 200)
  writeJson(STORAGE_KEYS.webhookLog, log)
}

export function readChannelConfig() {
  const saved = readJson(STORAGE_KEYS.channelConfig, {})
  return mergeMessageCenterChannelConfig(saved)
}

export function saveChannelConfig(config) {
  writeJson(STORAGE_KEYS.channelConfig, config)
}

export function getConversationMessages(conversationId) {
  return readMessages()
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => new Date(a.at) - new Date(b.at))
}

export function upsertConversation(conversation) {
  const list = readConversations()
  const index = list.findIndex((item) => item.id === conversation.id)
  if (index >= 0) {
    list[index] = { ...list[index], ...conversation }
  } else {
    list.unshift(conversation)
  }
  writeConversations(list)
  return conversation
}

export function appendMessage(message, { bumpUnread = true } = {}) {
  const existing = readMessages()
  if (message.id && existing.some((item) => item.id === message.id)) {
    return existing.find((item) => item.id === message.id)
  }
  const messages = [...existing, message]
  writeMessages(messages)

  const conversations = readConversations()
  const index = conversations.findIndex((item) => item.id === message.conversationId)
  if (index >= 0) {
    conversations[index] = {
      ...conversations[index],
      lastMessageAt: message.at,
      lastMessagePreview: message.type === 'text' ? message.body : `[${message.type}]`,
      unreadCount: bumpUnread && message.direction === 'in'
        ? (conversations[index].unreadCount || 0) + 1
        : conversations[index].unreadCount || 0,
    }
    writeConversations(conversations)
  }
  return message
}

/** Merge server-side WhatsApp inbox (webhook) into local omnichannel store. */
export function mergeWhatsAppInbox(inbox = {}) {
  const remoteConversations = Array.isArray(inbox.conversations) ? inbox.conversations : []
  const remoteMessages = Array.isArray(inbox.messages) ? inbox.messages : []
  if (!remoteConversations.length && !remoteMessages.length) return { conversations: 0, messages: 0 }

  let conversationCount = 0
  let messageCount = 0
  const localConversations = readConversations()
  const idByExternal = new Map(
    localConversations
      .filter((item) => item.channel === 'whatsapp' && item.externalId)
      .map((item) => [String(item.externalId), item.id]),
  )

  remoteConversations.forEach((conversation) => {
    const existingId = conversation.id
      && localConversations.some((item) => item.id === conversation.id)
      ? conversation.id
      : idByExternal.get(String(conversation.externalId))
    const existing = existingId
      ? localConversations.find((item) => item.id === existingId)
      : null
    const id = existing?.id || conversation.id
    upsertConversation({
      ...(existing || {}),
      ...conversation,
      id,
      unreadCount: Math.max(existing?.unreadCount || 0, conversation.unreadCount || 0),
    })
    idByExternal.set(String(conversation.externalId), id)
    conversationCount += 1
  })

  remoteMessages.forEach((message) => {
    const mappedId = idByExternal.get(
      String(remoteConversations.find((item) => item.id === message.conversationId)?.externalId || ''),
    ) || message.conversationId
    const before = readMessages().length
    appendMessage({ ...message, conversationId: mappedId }, { bumpUnread: false })
    if (readMessages().length > before) messageCount += 1
  })

  return { conversations: conversationCount, messages: messageCount }
}

export function markConversationRead(conversationId) {
  const conversations = readConversations().map((item) => (
    item.id === conversationId ? { ...item, unreadCount: 0 } : item
  ))
  writeConversations(conversations)
}

export function getMessageCenterBadge() {
  const conversations = readConversations()
  const messages = readMessages()

  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0,
  )

  const lastMessageByConversation = new Map()
  for (const message of messages) {
    const current = lastMessageByConversation.get(message.conversationId)
    if (!current || new Date(message.at).getTime() >= new Date(current.at).getTime()) {
      lastMessageByConversation.set(message.conversationId, message)
    }
  }

  const unansweredCount = conversations.filter((conversation) => {
    const lastMessage = lastMessageByConversation.get(conversation.id)
    return lastMessage?.direction === 'in'
  }).length

  const count = unreadTotal > 0 ? unreadTotal : unansweredCount

  return { count, unreadTotal, unansweredCount }
}

const SOCIAL_CHANNEL_IDS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'linkedin', 'pinterest', 'x', 'email']

function normalizeSocialChannel(channel) {
  const value = String(channel || '').trim().toLowerCase()
  if (value === 'twitter' || value === 'x') return 'x'
  return value
}

export function getChannelUnreadCounts() {
  const conversations = readConversations()
  const counts = Object.fromEntries(SOCIAL_CHANNEL_IDS.map((id) => [id, 0]))

  conversations.forEach((conversation) => {
    const channel = normalizeSocialChannel(conversation.channel)
    if (!SOCIAL_CHANNEL_IDS.includes(channel)) return
    counts[channel] += Number(conversation.unreadCount) || 0
  })

  return counts
}

export function assignConversation(conversationId, { userId, departmentId }) {
  const conversations = readConversations().map((item) => (
    item.id === conversationId
      ? { ...item, assignedUserId: userId, departmentId, status: 'pending' }
      : item
  ))
  writeConversations(conversations)
}

export function getDepartments() {
  return DEPARTMENTS
}

function seedIfEmpty() {
  if (readConversations().length > 0) return

  const conversationId = createId('CONV')
  const at = new Date().toISOString()

  writeConversations([{
    id: conversationId,
    channel: 'whatsapp',
    externalId: 'demo-whatsapp',
    contactName: 'Ayşe Yılmaz',
    contactPhone: '+905551112233',
    contactEmail: '',
    contactHandle: '',
    customerId: null,
    leadId: null,
    assignedUserId: null,
    departmentId: 'dep-sales',
    lastMessageAt: at,
    lastMessagePreview: 'Merhaba, teklif hakkında bilgi alabilir miyim?',
    unreadCount: 2,
    sentiment: 'neutral',
    status: 'open',
  }])

  writeMessages([{
    id: createId('MSG'),
    conversationId,
    direction: 'in',
    type: 'text',
    body: 'Merhaba, teklif hakkında bilgi alabilir miyim?',
    at,
    senderName: 'Ayşe Yılmaz',
  }])
}

seedIfEmpty()

/** Always creates a sample WhatsApp thread so the inbox UI can be checked. */
export function createWhatsAppExampleThread({
  contactName = 'Örnek Müşteri',
  contactPhone = '+905301285610',
} = {}) {
  const conversationId = createId('CONV')
  const at = new Date().toISOString()
  const externalId = String(contactPhone).replace(/\D/g, '') || '905301285610'

  upsertConversation({
    id: conversationId,
    channel: 'whatsapp',
    externalId,
    contactName,
    contactPhone,
    contactEmail: '',
    contactHandle: '',
    customerId: null,
    leadId: null,
    assignedUserId: null,
    departmentId: 'dep-sales',
    lastMessageAt: at,
    lastMessagePreview: 'Merhaba, BachMain WhatsApp örneği — fiyat alabilir miyim?',
    unreadCount: 1,
    sentiment: 'neutral',
    status: 'open',
  })

  appendMessage({
    id: createId('MSG'),
    conversationId,
    channel: 'whatsapp',
    direction: 'in',
    type: 'text',
    body: 'Merhaba, BachMain WhatsApp örneği — fiyat alabilir miyim?',
    mediaUrl: null,
    mediaName: null,
    duration: null,
    senderName: contactName,
    at,
    status: 'delivered',
  }, { bumpUnread: false })

  appendWebhookLog({
    channel: 'whatsapp',
    event: 'example.created',
    externalId,
    note: 'Yerel örnek konuşma (Meta API olmadan UI testi)',
  })

  return conversationId
}

export { CHANNELS }
