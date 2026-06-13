import { createId, readLeads, upsertConversation, writeLeads } from './store'

export function createLeadFromContact({ channel, contactName, phone, email, handle, conversationId }) {
  const leads = readLeads()
  const existing = leads.find((lead) => lead.conversationId === conversationId)
  if (existing) return existing

  const lead = {
    id: createId('LEAD'),
    source: channel,
    channel,
    contactName: contactName || 'Yeni Lead',
    phone: phone || '',
    email: email || '',
    handle: handle || '',
    status: 'Yeni',
    createdAt: new Date().toISOString(),
    conversationId,
  }
  writeLeads([lead, ...leads])
  upsertConversation({ id: conversationId, leadId: lead.id, customerId: null })
  return lead
}
