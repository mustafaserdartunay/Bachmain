/**
 * WhatsApp alıcı numarası ve yerel gönderim fallback yardımcıları.
 */
import { getStoredSession } from '../../utils/platformAuth'
import { readChannelConfig } from '../store'

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
  if (externalId.startsWith('demo-') || externalId === 'demo-whatsapp') return true
  // Ayşe Yılmaz demo seed — gerçek Meta gönderimi beklenmez
  if (externalId === '905551112233') return true
  return false
}

export function isWhatsAppChannelConfigured(channelConfig) {
  const wa = channelConfig?.whatsapp || {}
  return Boolean(wa.connected && wa.phoneNumberId)
}

export function canSendWhatsAppCloud(conversation = {}) {
  if (isDemoWhatsAppConversation(conversation)) return false
  const { token } = getStoredSession()
  if (!token) return false
  return isWhatsAppChannelConfigured(readChannelConfig())
}

export function shouldWhatsAppLocalFallback(error, conversation) {
  if (isDemoWhatsAppConversation(conversation)) return true
  if (!canSendWhatsAppCloud(conversation)) return true

  const code = String(error?.code || error?.details?.error || '').toUpperCase()
  const message = String(error?.message || '').toLowerCase()
  const status = Number(error?.status || 0)

  if (code === 'NOT_CONFIGURED') return true
  if (code === 'UNAUTHORIZED') return true
  if (code === 'NETWORK_ERROR') return true
  if (status === 401 || status === 403 || status === 502 || status === 503) return true
  if (message.includes('failed to fetch')) return true
  if (message.includes('networkerror')) return true
  if (message.includes('load failed')) return true
  if (message.includes('oturum yok')) return true
  if (message.includes('whatsapp api ayarları eksik')) return true
  if (message.includes('fetch')) return true
  return false
}

export function buildWhatsAppLocalDispatch(to, note) {
  return {
    success: true,
    messageId: `WA-LOCAL-${Date.now()}`,
    localOnly: true,
    warning:
      note ||
      'WhatsApp API bağlı değil veya oturum yok. Mesaj yalnızca CRM içinde görünür; gerçek gönderim için Mesaj Merkezi ayarlarını tamamlayın.',
  }
}
