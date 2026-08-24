/**
 * Client helpers for per-tenant WhatsApp Cloud API (platform admin API).
 */
import { getStoredSession } from './platformAuth'

const API_BASE = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'

async function waFetch(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!token) {
    const err = new Error('Oturum yok — önce giriş yapın')
    err.code = 'UNAUTHORIZED'
    throw err
  }

  let res
  try {
    res = await fetch(`${API_BASE}/${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body != null ? JSON.stringify(body) : undefined,
    })
  } catch (networkError) {
    const err = new Error(networkError?.message || 'WhatsApp API bağlantı hatası')
    err.code = 'NETWORK_ERROR'
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || 'WhatsApp API hatası')
    err.code = data.error
    err.status = res.status
    err.details = data.details
    throw err
  }
  return data
}

export async function loadWhatsAppServerConfig() {
  return waFetch('channels/whatsapp')
}

export async function saveWhatsAppServerConfig(config) {
  return waFetch('channels/whatsapp', { method: 'PUT', body: { config } })
}

export async function testWhatsAppServerConnection(partial = {}) {
  return waFetch('channels/whatsapp/test', { method: 'POST', body: partial })
}

export async function sendWhatsAppServerMessage({ to, text }) {
  return waFetch('channels/whatsapp/send', { method: 'POST', body: { to, text } })
}

export async function pullWhatsAppInbox() {
  return waFetch('channels/whatsapp/inbox')
}

export const WHATSAPP_WEBHOOK_URL = 'https://yonetim.bachmain.com/api/webhooks/whatsapp'
