import { getCustomerProfiles } from '../data/customerProfiles'
import { CHANNELS, DEPARTMENTS, STORAGE_KEYS } from './schema'

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
  return readJson(STORAGE_KEYS.channelConfig, {
    whatsapp: { connected: true, phoneNumberId: '', accessToken: '***', webhookVerifyToken: '' },
    instagram: { connected: true, pageId: '', accessToken: '***' },
    facebook: { connected: true, pageId: '', accessToken: '***' },
    email: { connected: true, imapHost: '', smtpHost: '', username: '', password: '***' },
    tiktok: { connected: false, advertiserId: '', accessToken: '***' },
  })
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

export function appendMessage(message) {
  const messages = [...readMessages(), message]
  writeMessages(messages)

  const conversations = readConversations()
  const index = conversations.findIndex((item) => item.id === message.conversationId)
  if (index >= 0) {
    conversations[index] = {
      ...conversations[index],
      lastMessageAt: message.at,
      lastMessagePreview: message.type === 'text' ? message.body : `[${message.type}]`,
      unreadCount: message.direction === 'in'
        ? (conversations[index].unreadCount || 0) + 1
        : conversations[index].unreadCount || 0,
    }
    writeConversations(conversations)
  }
  return message
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
  // Demo conversations are intentionally not seeded.
}



export { CHANNELS }
