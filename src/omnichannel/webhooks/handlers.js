import { appendMessage, appendWebhookLog, createId, upsertConversation, readConversations } from '../store'
import { matchCustomer } from '../customerMatcher'
import { createLeadFromContact } from '../leadService'
import { getDepartments } from '../store'
import { analyzeMessage } from '../ai/assistant'

function routeDepartment(channel) {
  return getDepartments().find((dep) => dep.channels.includes(channel)) || getDepartments()[0]
}

function processInbound({ channel, externalId, contactName, phone, email, handle, body, type = 'text', mediaUrl, mediaName, duration }) {
  appendWebhookLog({ channel, event: 'message.received', externalId })

  const customer = matchCustomer({ phone, email, name: contactName })
  const department = routeDepartment(channel)
  const existing = readConversations().find(
    (item) => item.channel === channel && String(item.externalId) === String(externalId),
  )
  const conversationId = existing?.id || createId('CONV')

  const conversation = {
    id: conversationId,
    channel,
    externalId,
    contactName: contactName || existing?.contactName || 'Bilinmeyen',
    contactPhone: phone || existing?.contactPhone || '',
    contactEmail: email || existing?.contactEmail || '',
    contactHandle: handle || existing?.contactHandle || '',
    customerId: customer?.id || existing?.customerId || null,
    leadId: existing?.leadId || null,
    assignedUserId: existing?.assignedUserId || department.defaultAssignee,
    departmentId: existing?.departmentId || department.id,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: body?.slice(0, 80) || `[${type}]`,
    unreadCount: (existing?.unreadCount || 0) + 1,
    sentiment: analyzeMessage(body).sentiment,
    status: 'open',
  }

  upsertConversation(conversation)

  if (!customer && !existing) {
    createLeadFromContact({
      channel,
      contactName,
      phone,
      email,
      handle,
      conversationId,
    })
  }

  appendMessage({
    id: createId('MSG'),
    conversationId,
    channel,
    direction: 'in',
    type,
    body: body || '',
    mediaUrl: mediaUrl || null,
    mediaName: mediaName || null,
    duration: duration || null,
    senderName: contactName || 'Müşteri',
    at: new Date().toISOString(),
    status: 'delivered',
  })

  return { conversationId, customerId: customer?.id }
}

export const webhookHandlers = {
  whatsapp(payload) {
    return processInbound({
      channel: 'whatsapp',
      externalId: payload.from || payload.wa_id,
      contactName: payload.profile?.name,
      phone: payload.from,
      body: payload.text?.body || payload.message,
      type: payload.type || 'text',
      mediaUrl: payload.media?.url,
      mediaName: payload.media?.filename,
    })
  },
  instagram(payload) {
    return processInbound({
      channel: 'instagram',
      externalId: payload.sender?.id,
      contactName: payload.sender?.username,
      handle: payload.sender?.username ? `@${payload.sender.username}` : '',
      body: payload.message?.text,
      type: payload.message?.attachments?.[0]?.type || 'text',
      mediaUrl: payload.message?.attachments?.[0]?.url,
    })
  },
  facebook(payload) {
    return processInbound({
      channel: 'facebook',
      externalId: payload.sender?.id,
      contactName: `${payload.sender?.first_name || ''} ${payload.sender?.last_name || ''}`.trim(),
      email: payload.sender?.email,
      body: payload.message?.text,
    })
  },
  email(payload) {
    return processInbound({
      channel: 'email',
      externalId: payload.from,
      contactName: payload.fromName || payload.from,
      email: payload.from,
      body: payload.subject ? `${payload.subject}\n\n${payload.body}` : payload.body,
      type: payload.attachments?.length ? 'file' : 'text',
      mediaName: payload.attachments?.[0]?.name,
    })
  },
  tiktok(payload) {
    return processInbound({
      channel: 'tiktok',
      externalId: payload.lead_id,
      contactName: payload.full_name || 'TikTok Lead',
      phone: payload.phone,
      email: payload.email,
      body: payload.form_message || `Lead: ${payload.campaign_name}`,
    })
  },
}

export function routeWebhook(channel, payload) {
  const handler = webhookHandlers[channel]
  if (!handler) throw new Error(`Desteklenmeyen kanal: ${channel}`)
  return handler(payload)
}
