import {
  appendMessage,
  appendWebhookLog,
  createId,
  markConversationRead,
  readChannelConfig,
  readConversations,
  upsertConversation,
} from '../store'
import { analyzeMessage } from '../ai/assistant'
import { sendWhatsAppServerMessage } from '../../utils/whatsappChannelApi'
import {
  isWhatsAppChannelConfigured,
  resolveWhatsAppRecipient,
  shouldWhatsAppLocalFallback,
} from './whatsappRecipients'

const channelSenders = {
  whatsapp: async (payload) => {
    const conversation = payload.conversation || {}
    const to = resolveWhatsAppRecipient(conversation)
    const text = payload.body || payload.text || ''

    if (!to) {
      throw new Error('Alıcı telefon numarası bulunamadı. Konuşmada contactPhone tanımlayın.')
    }

    try {
      const result = await sendWhatsAppServerMessage({ to, text })
      appendWebhookLog({
        channel: 'whatsapp',
        event: 'message.sent',
        to,
        messageId: result.messageId,
      })
      return { success: true, messageId: result.messageId || createId('WA'), localOnly: false }
    } catch (error) {
      if (shouldWhatsAppLocalFallback(error, conversation)) {
        appendWebhookLog({
          channel: 'whatsapp',
          event: 'message.local',
          to,
          note: error.message || 'Meta API — yerel taslak olarak kaydedildi',
        })
        return {
          success: true,
          messageId: createId('WA-LOCAL'),
          localOnly: true,
          warning:
            'WhatsApp API bağlı değil veya oturum yok. Mesaj yalnızca CRM içinde görünür; gerçek gönderim için Mesaj Merkezi ayarlarını tamamlayın.',
        }
      }
      throw error
    }
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

export async function sendChannelMessage({
  channel,
  conversationId,
  body,
  type = 'text',
  mediaUrl,
  mediaName,
  duration,
  senderName = 'Yönetici',
}) {
  const sender = channelSenders[channel]
  if (!sender) throw new Error(`Kanal desteklenmiyor: ${channel}`)

  const conversation = readConversations().find((item) => item.id === conversationId)
  if (!conversation) throw new Error('Konuşma bulunamadı')

  const dispatch = await sender({
    to: conversation.externalId,
    contactPhone: conversation.contactPhone,
    conversation,
    body,
    type,
    mediaUrl,
  })

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
    status: dispatch.localOnly ? 'local' : 'sent',
    deliveryMode: dispatch.localOnly ? 'local' : 'cloud',
  })

  const analysis = analyzeMessage(body)
  upsertConversation({
    ...conversation,
    lastMessageAt: message.at,
    lastMessagePreview: type === 'text' ? body.slice(0, 80) : `[${type}]`,
    sentiment: analysis.sentiment,
  })

  return { message, warning: dispatch.warning || null, localOnly: Boolean(dispatch.localOnly) }
}

export function openConversation(conversationId) {
  markConversationRead(conversationId)
}

export function getWhatsAppSetupStatus() {
  const config = readChannelConfig()
  return {
    configured: isWhatsAppChannelConfigured(config),
    displayPhone: config?.whatsapp?.displayPhone || '',
  }
}

export { channelSenders }
