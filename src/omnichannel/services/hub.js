import { appendMessage, appendWebhookLog, createId, markConversationRead, readConversations, upsertConversation } from '../store'
import { analyzeMessage } from '../ai/assistant'

const channelSenders = {
  whatsapp: async (payload) => {
    appendWebhookLog({ channel: 'whatsapp', event: 'message.sent', to: payload.to })
    return { success: true, messageId: createId('WA') }
  },
  instagram: async (payload) => {
    appendWebhookLog({ channel: 'instagram', event: 'message.sent', to: payload.to })
    return { success: true, messageId: createId('IG') }
  },
  facebook: async (payload) => {
    appendWebhookLog({ channel: 'facebook', event: 'message.sent', to: payload.to })
    return { success: true, messageId: createId('FB') }
  },
  email: async (payload) => {
    appendWebhookLog({ channel: 'email', event: 'message.sent', to: payload.to })
    return { success: true, messageId: createId('EM') }
  },
  tiktok: async (payload) => {
    appendWebhookLog({ channel: 'tiktok', event: 'lead.reply', to: payload.to })
    return { success: true, messageId: createId('TT') }
  },
}

export async function sendChannelMessage({ channel, conversationId, body, type = 'text', mediaUrl, mediaName, duration, senderName = 'Yönetici' }) {
  const sender = channelSenders[channel]
  if (!sender) throw new Error(`Kanal desteklenmiyor: ${channel}`)

  const conversation = readConversations().find((item) => item.id === conversationId)
  if (!conversation) throw new Error('Konuşma bulunamadı')

  await sender({ to: conversation.externalId, body, type, mediaUrl })

  const message = appendMessage({
    id: createId('MSG'),
    conversationId,
    channel,
    direction: 'out',
    type,
    body: body || '',
    mediaUrl: mediaUrl || null,
    mediaName: mediaName || null,
    duration: duration || null,
    senderName,
    at: new Date().toISOString(),
    status: 'sent',
  })

  const analysis = analyzeMessage(body)
  upsertConversation({
    ...conversation,
    lastMessageAt: message.at,
    lastMessagePreview: type === 'text' ? body.slice(0, 80) : `[${type}]`,
    sentiment: analysis.sentiment,
  })

  return message
}

export function openConversation(conversationId) {
  markConversationRead(conversationId)
}

export { channelSenders }
