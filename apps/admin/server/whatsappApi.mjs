/**
 * Per-tenant WhatsApp Business Cloud API — config, test, send, Meta webhooks.
 */
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { loadStore } from './store.mjs'
import {
  getTenantCollection,
  setTenantCollection,
  hasDatabase,
  loadPayload,
  savePayload,
} from './db.mjs'
import { sendJson, applyCors } from './authRoutes.mjs'

const GRAPH = 'https://graph.facebook.com/v19.0'
const SECRETS_COLLECTION = 'channelSecrets'
const INBOX_COLLECTION = 'omniInbox'
const INDEX_ID = 'whatsapp_index'

function emptyWhatsAppConfig() {
  return {
    connected: false,
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: '',
    displayPhone: '',
    updatedAt: null,
  }
}

function publicWhatsAppConfig(cfg = {}) {
  const token = String(cfg.accessToken || '')
  return {
    connected: Boolean(cfg.connected),
    phoneNumberId: cfg.phoneNumberId || '',
    webhookVerifyToken: cfg.webhookVerifyToken || '',
    displayPhone: cfg.displayPhone || '',
    updatedAt: cfg.updatedAt || null,
    hasAccessToken: Boolean(token),
    accessTokenMasked: token ? `${token.slice(0, 4)}…${token.slice(-4)}` : '',
  }
}

async function readWhatsAppIndex() {
  const payload = (await loadPayload(INDEX_ID)) || {}
  return {
    byPhoneNumberId: payload.byPhoneNumberId || {},
    byVerifyToken: payload.byVerifyToken || {},
  }
}

async function writeWhatsAppIndex(index) {
  await savePayload(index, INDEX_ID)
}

async function syncWhatsAppIndex(tenantCode, nextCfg, prevCfg = {}) {
  const index = await readWhatsAppIndex()
  const prevPhone = String(prevCfg.phoneNumberId || '').trim()
  const nextPhone = String(nextCfg.phoneNumberId || '').trim()
  const prevVerify = String(prevCfg.webhookVerifyToken || '').trim()
  const nextVerify = String(nextCfg.webhookVerifyToken || '').trim()

  if (prevPhone && prevPhone !== nextPhone && index.byPhoneNumberId[prevPhone] === tenantCode) {
    delete index.byPhoneNumberId[prevPhone]
  }
  if (prevVerify && prevVerify !== nextVerify && index.byVerifyToken[prevVerify] === tenantCode) {
    delete index.byVerifyToken[prevVerify]
  }
  if (nextPhone) index.byPhoneNumberId[nextPhone] = tenantCode
  if (nextVerify) index.byVerifyToken[nextVerify] = tenantCode
  await writeWhatsAppIndex(index)
}

async function getSecrets(tenantCode) {
  return (await getTenantCollection(tenantCode, SECRETS_COLLECTION)) || {}
}

async function getWhatsAppSecrets(tenantCode) {
  const secrets = await getSecrets(tenantCode)
  return { ...emptyWhatsAppConfig(), ...(secrets.whatsapp || {}) }
}

async function setWhatsAppSecrets(tenantCode, whatsapp) {
  const secrets = await getSecrets(tenantCode)
  const next = {
    ...secrets,
    whatsapp: {
      ...emptyWhatsAppConfig(),
      ...whatsapp,
      updatedAt: new Date().toISOString(),
    },
  }
  await setTenantCollection(tenantCode, SECRETS_COLLECTION, next)
  return next.whatsapp
}

async function requireTenantSession(req, res) {
  if (!hasDatabase()) {
    sendJson(req, res, 503, {
      error: 'DATABASE_REQUIRED',
      message: 'WhatsApp için DATABASE_URL gerekli',
    })
    return null
  }
  const token = getBearerOrCookieToken(req)
  const store = await loadStore()
  const session = getAccountFromToken(store, token)
  if (!session?.user?.tenantCode) {
    sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Üye oturumu gerekli' })
    return null
  }
  return session
}

async function graphGetPhone(phoneNumberId, accessToken) {
  const url = `${GRAPH}/${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name,quality_rating`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message || 'Meta Graph API hatası'
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

async function graphSendText({ phoneNumberId, accessToken, to, text }) {
  const url = `${GRAPH}/${encodeURIComponent(phoneNumberId)}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: String(to).replace(/\D/g, ''),
      type: 'text',
      text: { body: String(text || '').slice(0, 4096) },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.error?.message || 'WhatsApp gönderim hatası'
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

function parseMetaInbound(body) {
  const items = []
  const entries = Array.isArray(body?.entry) ? body.entry : []
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : []
    for (const change of changes) {
      const value = change?.value || {}
      const phoneNumberId = value?.metadata?.phone_number_id || ''
      const contacts = Array.isArray(value.contacts) ? value.contacts : []
      const messages = Array.isArray(value.messages) ? value.messages : []
      for (const message of messages) {
        const contact = contacts.find((c) => c.wa_id === message.from) || contacts[0] || {}
        const type = message.type || 'text'
        let text = ''
        if (type === 'text') text = message.text?.body || ''
        else if (type === 'button') text = message.button?.text || ''
        else if (type === 'interactive')
          text =
            message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || ''
        else text = `[${type}]`
        items.push({
          phoneNumberId,
          from: message.from,
          contactName: contact?.profile?.name || message.from,
          type,
          text,
          messageId: message.id,
          timestamp: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
        })
      }
    }
  }
  return items
}

async function appendOmniInbox(tenantCode, inbound) {
  const inbox = (await getTenantCollection(tenantCode, INBOX_COLLECTION)) || {
    conversations: [],
    messages: [],
  }
  const conversations = Array.isArray(inbox.conversations) ? [...inbox.conversations] : []
  const messages = Array.isArray(inbox.messages) ? [...inbox.messages] : []

  let conversation = conversations.find(
    (item) => item.channel === 'whatsapp' && item.externalId === inbound.from,
  )
  if (!conversation) {
    conversation = {
      id: `CONV-WA-${inbound.from}`,
      channel: 'whatsapp',
      externalId: inbound.from,
      contactName: inbound.contactName,
      contactPhone: inbound.from,
      contactEmail: '',
      contactHandle: '',
      customerId: null,
      leadId: null,
      assignedUserId: null,
      departmentId: 'sales',
      lastMessageAt: inbound.timestamp,
      lastMessagePreview: String(inbound.text || '').slice(0, 80),
      unreadCount: 1,
      sentiment: 'neutral',
      status: 'open',
    }
    conversations.unshift(conversation)
  } else {
    conversation = {
      ...conversation,
      contactName: inbound.contactName || conversation.contactName,
      lastMessageAt: inbound.timestamp,
      lastMessagePreview: String(inbound.text || '').slice(0, 80),
      unreadCount: (conversation.unreadCount || 0) + 1,
      status: 'open',
    }
    const idx = conversations.findIndex((item) => item.id === conversation.id)
    conversations[idx] = conversation
  }

  const message = {
    id: inbound.messageId || `MSG-WA-${Date.now()}`,
    conversationId: conversation.id,
    channel: 'whatsapp',
    direction: 'in',
    type: inbound.type === 'text' ? 'text' : inbound.type,
    body: inbound.text || '',
    mediaUrl: null,
    mediaName: null,
    duration: null,
    senderName: inbound.contactName || 'Müşteri',
    at: inbound.timestamp,
    status: 'delivered',
  }
  if (!messages.some((item) => item.id === message.id)) {
    messages.push(message)
  }

  await setTenantCollection(tenantCode, INBOX_COLLECTION, {
    conversations: conversations.slice(0, 500),
    messages: messages.slice(-2000),
    updatedAt: new Date().toISOString(),
  })
  return { conversation, message }
}

function sendPlain(res, status, text) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end(String(text ?? ''))
}

/**
 * @returns {Promise<boolean>} true if handled
 */
export async function handleWhatsAppApi(req, res, path, body = {}) {
  const method = req.method

  // —— Public Meta webhook ——
  if (path === 'webhooks/whatsapp' || path === 'webhook/whatsapp') {
    applyCors(req, res)

    if (method === 'GET') {
      if (!hasDatabase()) {
        sendPlain(res, 503, 'DATABASE_REQUIRED')
        return true
      }
      const url = new URL(req.url, 'http://localhost')
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      const index = await readWhatsAppIndex()
      const tenantCode = token ? index.byVerifyToken[token] : null
      if (mode === 'subscribe' && tenantCode && challenge) {
        sendPlain(res, 200, challenge)
        return true
      }
      sendPlain(res, 403, 'FORBIDDEN')
      return true
    }

    if (method === 'POST') {
      if (!hasDatabase()) {
        sendJson(req, res, 503, { error: 'DATABASE_REQUIRED' })
        return true
      }
      const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || ''
      const sigHeader = String(req.headers['x-hub-signature-256'] || '')
      if (process.env.NODE_ENV === 'production') {
        if (!appSecret) {
          sendJson(req, res, 503, {
            error: 'WHATSAPP_APP_SECRET_REQUIRED',
            message: 'Production WhatsApp webhook requires META/WHATSAPP app secret',
          })
          return true
        }
        if (!sigHeader.startsWith('sha256=')) {
          sendJson(req, res, 401, { error: 'MISSING_SIGNATURE' })
          return true
        }
        const crypto = await import('node:crypto')
        const raw =
          typeof req.rawBody === 'string'
            ? req.rawBody
            : Buffer.isBuffer(req.rawBody)
              ? req.rawBody.toString('utf8')
              : JSON.stringify(body || {})
        const expected =
          'sha256=' + crypto.createHmac('sha256', appSecret).update(raw, 'utf8').digest('hex')
        const a = Buffer.from(sigHeader)
        const b = Buffer.from(expected)
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
          sendJson(req, res, 401, { error: 'INVALID_SIGNATURE' })
          return true
        }
      }
      const items = parseMetaInbound(body)
      const index = await readWhatsAppIndex()
      for (const item of items) {
        const tenantCode = index.byPhoneNumberId[String(item.phoneNumberId || '')]
        if (!tenantCode) continue
        await appendOmniInbox(tenantCode, item)
      }
      sendJson(req, res, 200, { ok: true, processed: items.length })
      return true
    }

    sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
    return true
  }

  // —— Authenticated channel routes ——
  if (!path.startsWith('channels/whatsapp')) return false

  const session = await requireTenantSession(req, res)
  if (!session) return true
  const tenantCode = session.user.tenantCode

  if (method === 'GET' && path === 'channels/whatsapp') {
    const cfg = await getWhatsAppSecrets(tenantCode)
    sendJson(req, res, 200, {
      ok: true,
      config: publicWhatsAppConfig(cfg),
      webhookUrl: 'https://yonetim.bachmain.com/api/webhooks/whatsapp',
    })
    return true
  }

  if ((method === 'PUT' || method === 'POST') && path === 'channels/whatsapp') {
    const prev = await getWhatsAppSecrets(tenantCode)
    const incoming = body.config || body.whatsapp || body
    const next = {
      ...prev,
      connected: Boolean(incoming.connected),
      phoneNumberId: String(incoming.phoneNumberId || '').trim(),
      webhookVerifyToken: String(incoming.webhookVerifyToken || '').trim(),
      displayPhone: String(incoming.displayPhone || prev.displayPhone || '').trim(),
      accessToken:
        incoming.accessToken != null && String(incoming.accessToken).trim()
          ? String(incoming.accessToken).trim()
          : prev.accessToken,
    }
    if (!next.phoneNumberId) {
      sendJson(req, res, 400, {
        error: 'PHONE_NUMBER_ID_REQUIRED',
        message: 'Phone Number ID gerekli',
      })
      return true
    }
    if (!next.accessToken) {
      sendJson(req, res, 400, { error: 'ACCESS_TOKEN_REQUIRED', message: 'Access Token gerekli' })
      return true
    }
    if (!next.webhookVerifyToken) {
      sendJson(req, res, 400, {
        error: 'VERIFY_TOKEN_REQUIRED',
        message: 'Webhook Verify Token gerekli',
      })
      return true
    }
    await setWhatsAppSecrets(tenantCode, next)
    await syncWhatsAppIndex(tenantCode, next, prev)
    sendJson(req, res, 200, {
      ok: true,
      config: publicWhatsAppConfig(next),
      webhookUrl: 'https://yonetim.bachmain.com/api/webhooks/whatsapp',
    })
    return true
  }

  if (method === 'POST' && path === 'channels/whatsapp/test') {
    const cfg = await getWhatsAppSecrets(tenantCode)
    const phoneNumberId = String(body.phoneNumberId || cfg.phoneNumberId || '').trim()
    const accessToken = String(body.accessToken || cfg.accessToken || '').trim()
    if (!phoneNumberId || !accessToken) {
      sendJson(req, res, 400, {
        error: 'MISSING_CREDENTIALS',
        message: 'Phone Number ID ve Access Token gerekli',
      })
      return true
    }
    try {
      const meta = await graphGetPhone(phoneNumberId, accessToken)
      const next = {
        ...cfg,
        phoneNumberId,
        accessToken,
        connected: true,
        displayPhone: meta.display_phone_number || cfg.displayPhone || '',
      }
      await setWhatsAppSecrets(tenantCode, next)
      await syncWhatsAppIndex(tenantCode, next, cfg)
      sendJson(req, res, 200, {
        ok: true,
        meta: {
          displayPhone: meta.display_phone_number || '',
          verifiedName: meta.verified_name || '',
          qualityRating: meta.quality_rating || '',
        },
        config: publicWhatsAppConfig(next),
      })
    } catch (error) {
      sendJson(req, res, error.status || 400, {
        error: 'WHATSAPP_TEST_FAILED',
        message: error.message,
        details: error.data || null,
      })
    }
    return true
  }

  if (method === 'POST' && path === 'channels/whatsapp/send') {
    const cfg = await getWhatsAppSecrets(tenantCode)
    if (!cfg.accessToken || !cfg.phoneNumberId) {
      sendJson(req, res, 400, {
        error: 'NOT_CONFIGURED',
        message: 'WhatsApp API ayarları eksik. Mesaj Merkezi Yönetimi’nden kaydedin.',
      })
      return true
    }
    const to = String(body.to || '').trim()
    const text = String(body.text || body.body || '').trim()
    if (!to || !text) {
      sendJson(req, res, 400, { error: 'INVALID_PAYLOAD', message: 'Alıcı ve mesaj gerekli' })
      return true
    }
    try {
      const result = await graphSendText({
        phoneNumberId: cfg.phoneNumberId,
        accessToken: cfg.accessToken,
        to,
        text,
      })
      sendJson(req, res, 200, {
        ok: true,
        messageId: result?.messages?.[0]?.id || null,
        result,
      })
    } catch (error) {
      sendJson(req, res, error.status || 400, {
        error: 'WHATSAPP_SEND_FAILED',
        message: error.message,
        details: error.data || null,
      })
    }
    return true
  }

  if (method === 'GET' && path === 'channels/whatsapp/inbox') {
    const inbox = (await getTenantCollection(tenantCode, INBOX_COLLECTION)) || {
      conversations: [],
      messages: [],
    }
    sendJson(req, res, 200, { ok: true, inbox })
    return true
  }

  sendJson(req, res, 404, { error: 'NOT_FOUND', path })
  return true
}
