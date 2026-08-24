/**
 * WhatsApp alıcı numarası ve yerel gönderim fallback yardımcıları.
 */
export function normalizeWhatsAppDigits(value = '') {
  return String(value || '').replace(/\D/g, '')
}

export function resolveWhatsAppRecipient(conversation = {}) {
  const externalDigits = normalizeWhatsAppDigits(conversation.externalId)
  const phoneDigits = normalizeWhatsAppDigits(conversation.contactPhone)

  if (externalDigits.length >= 10) return externalDigits
  if (phoneDigits.length >= 10) return phoneDigits
  return String(conversation.externalId || conversation.contactPhone || '').trim()
}

export function isDemoWhatsAppConversation(conversation = {}) {
  const externalId = String(conversation.externalId || '').toLowerCase()
  return externalId.startsWith('demo-') || externalId === 'demo-whatsapp'
}

export function shouldWhatsAppLocalFallback(error, conversation) {
  if (isDemoWhatsAppConversation(conversation)) return true
  const code = String(error?.code || error?.details?.error || '').toUpperCase()
  const message = String(error?.message || '').toLowerCase()
  if (code === 'NOT_CONFIGURED') return true
  if (code === 'UNAUTHORIZED') return true
  if (message.includes('oturum yok')) return true
  if (message.includes('whatsapp api ayarları eksik')) return true
  return false
}

export function isWhatsAppChannelConfigured(channelConfig) {
  const wa = channelConfig?.whatsapp || {}
  return Boolean(wa.connected && wa.phoneNumberId)
}
