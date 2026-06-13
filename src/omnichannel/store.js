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

  const customers = getCustomerProfiles()
  const c1 = customers[0]
  const c2 = customers[1]

  const conversations = [
    {
      id: 'conv-wa-001',
      channel: 'whatsapp',
      externalId: 'wa:+905321112233',
      contactName: c1?.contact || 'Ahmet Yılmaz',
      contactPhone: '+90 532 111 22 33',
      contactEmail: c1?.email || '',
      contactHandle: '',
      customerId: c1?.id || null,
      leadId: null,
      assignedUserId: 'Serdar Tünay',
      departmentId: 'dep-sales',
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: '5000 adet kraft kutu fiyat alabilir miyim?',
      unreadCount: 2,
      sentiment: 'positive',
      status: 'open',
    },
    {
      id: 'conv-ig-001',
      channel: 'instagram',
      externalId: 'ig:@premiumkutu',
      contactName: 'Premium Kutu DM',
      contactPhone: '',
      contactEmail: '',
      contactHandle: '@premiumkutu',
      customerId: c2?.id || null,
      leadId: null,
      assignedUserId: 'Ayşe Demir',
      departmentId: 'dep-sales',
      lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
      lastMessagePreview: 'Yeni koleksiyon hakkında bilgi istiyorum',
      unreadCount: 1,
      sentiment: 'neutral',
      status: 'open',
    },
    {
      id: 'conv-fb-001',
      channel: 'facebook',
      externalId: 'fb:page-user-8821',
      contactName: 'Mehmet Kaya',
      contactPhone: '',
      contactEmail: 'mehmet@example.com',
      contactHandle: '',
      customerId: null,
      leadId: 'lead-fb-001',
      assignedUserId: null,
      departmentId: 'dep-support',
      lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
      lastMessagePreview: 'Teslimat tarihi değişikliği talebi',
      unreadCount: 0,
      sentiment: 'negative',
      status: 'pending',
    },
    {
      id: 'conv-em-001',
      channel: 'email',
      externalId: 'email:info@ambalajco.com',
      contactName: 'Ambalaj Co.',
      contactPhone: '',
      contactEmail: 'info@ambalajco.com',
      contactHandle: '',
      customerId: null,
      leadId: 'lead-em-001',
      assignedUserId: 'Mehmet Kaya',
      departmentId: 'dep-finance',
      lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
      lastMessagePreview: 'Proforma fatura talebi - 1200 adet oluklu kutu',
      unreadCount: 0,
      sentiment: 'positive',
      status: 'open',
    },
    {
      id: 'conv-tt-001',
      channel: 'tiktok',
      externalId: 'tiktok:lead-9921',
      contactName: 'TikTok Lead · E-Ticaret Kutusu',
      contactPhone: '+90 533 999 88 77',
      contactEmail: 'lead@tiktok.form',
      contactHandle: '',
      customerId: null,
      leadId: 'lead-tt-001',
      assignedUserId: null,
      departmentId: 'dep-sales',
      lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
      lastMessagePreview: 'Form: 2000 adet e-ticaret kutusu teklif istiyorum',
      unreadCount: 1,
      sentiment: 'positive',
      status: 'open',
    },
  ]

  const messages = [
    { id: 'msg-1', conversationId: 'conv-wa-001', channel: 'whatsapp', direction: 'in', type: 'text', body: 'Merhaba, 5000 adet kraft kutu fiyat alabilir miyim?', senderName: 'Ahmet Yılmaz', at: new Date(Date.now() - 600000).toISOString(), status: 'delivered' },
    { id: 'msg-2', conversationId: 'conv-wa-001', channel: 'whatsapp', direction: 'out', type: 'text', body: 'Merhaba Ahmet Bey, tabii ki. Ölçü ve baskı detayını paylaşır mısınız?', senderName: 'Serdar Tünay', at: new Date(Date.now() - 540000).toISOString(), status: 'read' },
    { id: 'msg-3', conversationId: 'conv-wa-001', channel: 'whatsapp', direction: 'in', type: 'text', body: '30x20 cm, tek renk baskılı olacak.', senderName: 'Ahmet Yılmaz', at: new Date(Date.now() - 300000).toISOString(), status: 'delivered' },
    { id: 'msg-4', conversationId: 'conv-ig-001', channel: 'instagram', direction: 'in', type: 'text', body: 'Yeni koleksiyon hakkında bilgi alabilir miyim?', senderName: 'Premium Kutu', at: new Date(Date.now() - 3600000).toISOString(), status: 'delivered' },
    { id: 'msg-5', conversationId: 'conv-fb-001', channel: 'facebook', direction: 'in', type: 'text', body: 'Sipariş teslimat tarihini 1 hafta erteleyebilir misiniz?', senderName: 'Mehmet Kaya', at: new Date(Date.now() - 7200000).toISOString(), status: 'read' },
    { id: 'msg-6', conversationId: 'conv-em-001', channel: 'email', direction: 'in', type: 'text', body: 'Merhaba, 1200 adet oluklu kutu için proforma fatura rica ederiz.', senderName: 'Ambalaj Co.', at: new Date(Date.now() - 86400000).toISOString(), status: 'delivered' },
    { id: 'msg-7', conversationId: 'conv-tt-001', channel: 'tiktok', direction: 'in', type: 'text', body: 'TikTok Lead Form: 2000 adet e-ticaret kutusu, İstanbul', senderName: 'TikTok Lead', at: new Date(Date.now() - 1800000).toISOString(), status: 'delivered' },
  ]

  const leads = [
    { id: 'lead-fb-001', source: 'facebook', channel: 'facebook', contactName: 'Mehmet Kaya', phone: '', email: 'mehmet@example.com', handle: '', status: 'Yeni', createdAt: new Date().toISOString(), conversationId: 'conv-fb-001' },
    { id: 'lead-em-001', source: 'email', channel: 'email', contactName: 'Ambalaj Co.', phone: '', email: 'info@ambalajco.com', handle: '', status: 'Yeni', createdAt: new Date().toISOString(), conversationId: 'conv-em-001' },
    { id: 'lead-tt-001', source: 'tiktok', channel: 'tiktok', contactName: 'TikTok Lead', phone: '+90 533 999 88 77', email: 'lead@tiktok.form', handle: '', status: 'Yeni', createdAt: new Date().toISOString(), conversationId: 'conv-tt-001' },
  ]

  writeConversations(conversations)
  writeMessages(messages)
  writeLeads(leads)
}

seedIfEmpty()

export { CHANNELS }
