/**
 * Production mail layer — Resend API + durable queue/logs in platform store.
 */
import { newId, saveStore } from '../store.mjs'
import { mailConfig } from './mailConfig.mjs'
import { listMailTemplates, renderMailTemplate } from './mailTemplates.mjs'
import { logoAttachments, publicLogoUrl, LOGO_CONTENT_ID } from './mailAssets.mjs'

function ensureMailStore(store) {
  if (!store.mail) store.mail = {}
  if (!Array.isArray(store.mail.logs)) store.mail.logs = []
  if (!Array.isArray(store.mail.queue)) store.mail.queue = []
  if (!store.mail.settings) {
    store.mail.settings = {
      enabled: true,
      defaultFrom: null,
      maxAttempts: 5,
      updatedAt: null,
    }
  }
  return store.mail
}

/** Fix legacy / broken logo paths in stored or custom HTML → CID. */
function normalizeMailHtml(html) {
  if (!html) return html
  const cid = `cid:${LOGO_CONTENT_ID}`
  const good = publicLogoUrl()
  return String(html)
    .replace(/https?:\/\/(?:www\.)?bachmain\.com\/bachmain-logo\.png/gi, cid)
    .replace(/https?:\/\/(?:www\.)?bachmain\.com\/assets\/bachmain-logo(?:-on-dark)?\.png/gi, cid)
    .replace(/src=(["'])(?!cid:)[^"']*bachmain-logo[^"']*\1/gi, `src="${cid}"`)
    .replace(/<!-- fallback url:.*?-->/g, `<!-- fallback url: ${good} -->`)
}

export function getMailStatus(store) {
  const cfg = mailConfig()
  const mail = ensureMailStore(store)
  return {
    provider: cfg.provider,
    enabled: Boolean(cfg.enabled && mail.settings.enabled !== false),
    configured: Boolean(cfg.apiKey),
    from: cfg.from,
    replyTo: cfg.replyTo || null,
    templates: listMailTemplates(),
    queuePending: mail.queue.filter(
      (row) =>
        ['queued', 'pending', 'failed'].includes(row.status) &&
        (row.attempts || 0) < (mail.settings.maxAttempts || 5),
    ).length,
    sentLast24h: mail.logs.filter(
      (row) =>
        row.status === 'sent' &&
        Date.now() - new Date(row.sentAt || row.createdAt).getTime() < 86400000,
    ).length,
    failedLast24h: mail.logs.filter(
      (row) =>
        row.status === 'failed' &&
        Date.now() - new Date(row.updatedAt || row.createdAt).getTime() < 86400000,
    ).length,
  }
}

async function resendSend({ apiKey, from, replyTo, to, subject, html, text, tags, attachments }) {
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: normalizeMailHtml(html),
    text,
  }
  if (replyTo) payload.reply_to = replyTo
  if (tags?.length) payload.tags = tags
  if (attachments?.length) payload.attachments = attachments

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Resend HTTP ${res.status}`)
    err.code = 'RESEND_ERROR'
    err.status = res.status
    err.details = data
    throw err
  }
  return data
}

function pushLog(mail, row) {
  mail.logs.unshift(row)
  mail.logs = mail.logs.slice(0, 5000)
  return row
}

function upsertQueue(mail, row) {
  const idx = mail.queue.findIndex((item) => item.id === row.id)
  if (idx >= 0) mail.queue[idx] = row
  else mail.queue.unshift(row)
  mail.queue = mail.queue.slice(0, 2000)
  return row
}

/**
 * Queue + optionally send immediately.
 * @returns {Promise<{id:string,status:string,providerId?:string,error?:string}>}
 */
export async function enqueueMail(store, input = {}) {
  const mail = ensureMailStore(store)
  const cfg = mailConfig()
  const template = input.template || 'announcement'
  const data = input.data || {}
  const rendered =
    input.html || input.subject
      ? { subject: input.subject, html: input.html, text: input.text || '' }
      : renderMailTemplate(template, data)

  const row = {
    id: input.id || newId('mail'),
    to: String(input.to || '')
      .trim()
      .toLowerCase(),
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text || '',
    template,
    type: input.type || template,
    customerId: input.customerId || null,
    accountId: input.accountId || null,
    status: 'queued',
    attempts: 0,
    maxAttempts: mail.settings.maxAttempts || 5,
    provider: 'resend',
    providerId: null,
    error: null,
    meta: input.meta || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
  }

  if (!row.to || !row.to.includes('@')) {
    row.status = 'failed'
    row.error = 'INVALID_TO'
    pushLog(mail, { ...row })
    return row
  }

  if (!cfg.enabled || mail.settings.enabled === false) {
    row.status = 'skipped_no_provider'
    row.error = 'RESEND_API_KEY missing or mail disabled'
    pushLog(mail, { ...row })
    upsertQueue(mail, row)
    return row
  }

  upsertQueue(mail, row)
  pushLog(mail, { ...row })

  if (input.immediate !== false) {
    return sendQueuedMail(store, row.id)
  }
  return row
}

export async function sendQueuedMail(store, mailId) {
  const mail = ensureMailStore(store)
  const cfg = mailConfig()
  const row =
    mail.queue.find((item) => item.id === mailId) || mail.logs.find((item) => item.id === mailId)
  if (!row) {
    const err = new Error('Mail kaydı bulunamadı')
    err.code = 'NOT_FOUND'
    throw err
  }

  row.attempts = (row.attempts || 0) + 1
  row.updatedAt = new Date().toISOString()
  row.status = 'pending'

  if (!cfg.apiKey || mail.settings.enabled === false) {
    row.status = 'skipped_no_provider'
    row.error = 'Provider not configured'
    upsertQueue(mail, row)
    pushLog(mail, { ...row, id: newId('mlog') })
    return row
  }

  try {
    const attachments = logoAttachments()
    const result = await resendSend({
      apiKey: cfg.apiKey,
      from: mail.settings.defaultFrom || cfg.from,
      replyTo: cfg.replyTo,
      to: row.to,
      subject: row.subject,
      html: row.html,
      text: row.text,
      attachments,
      tags: [
        { name: 'template', value: String(row.template || 'custom').slice(0, 40) },
        { name: 'type', value: String(row.type || 'mail').slice(0, 40) },
      ],
    })
    row.status = 'sent'
    row.providerId = result?.id || null
    row.error = null
    row.sentAt = new Date().toISOString()
    row.updatedAt = row.sentAt
    upsertQueue(mail, row)
    // drop from queue once sent
    mail.queue = mail.queue.filter((item) => item.id !== row.id)
    pushLog(mail, { ...row })
    await saveStore(store).catch(() => {})
    return row
  } catch (error) {
    row.status = 'failed'
    row.error = error.message || 'SEND_FAILED'
    row.updatedAt = new Date().toISOString()
    upsertQueue(mail, row)
    pushLog(mail, { ...row, id: newId('mlog') })
    await saveStore(store).catch(() => {})
    return row
  }
}

export async function processMailQueue(store, { limit = 20 } = {}) {
  const mail = ensureMailStore(store)
  const max = mail.settings.maxAttempts || 5
  const pending = mail.queue
    .filter(
      (row) => ['queued', 'pending', 'failed'].includes(row.status) && (row.attempts || 0) < max,
    )
    .slice(0, limit)
  const results = []
  for (const row of pending) {
    results.push(await sendQueuedMail(store, row.id))
  }
  return { processed: results.length, results }
}

export async function resendMail(store, mailId) {
  const mail = ensureMailStore(store)
  const original =
    mail.logs.find((item) => item.id === mailId) || mail.queue.find((item) => item.id === mailId)
  if (!original) {
    const err = new Error('Mail kaydı bulunamadı')
    err.code = 'NOT_FOUND'
    throw err
  }
  const clone = {
    ...original,
    id: newId('mail'),
    status: 'queued',
    attempts: 0,
    error: null,
    providerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sentAt: null,
    meta: { ...(original.meta || {}), resentFrom: original.id },
  }
  upsertQueue(mail, clone)
  pushLog(mail, { ...clone, status: 'resent' })
  return sendQueuedMail(store, clone.id)
}

export function listMailLogs(store, { status, template, limit = 100 } = {}) {
  const mail = ensureMailStore(store)
  let rows = [...mail.logs]
  if (status) rows = rows.filter((row) => row.status === status)
  if (template) {
    const t = String(template).toLowerCase()
    if (t === 'auth') {
      rows = rows.filter((row) =>
        [
          'new_login',
          'password_reset',
          'password_changed',
          'email_verification',
          'welcome',
        ].includes(String(row.template || row.type || '')),
      )
    } else {
      rows = rows.filter(
        (row) =>
          String(row.template || '').toLowerCase() === t ||
          String(row.type || '').toLowerCase() === t,
      )
    }
  }
  return rows.slice(0, limit).map((row) => ({
    id: row.id,
    to: row.to,
    subject: row.subject,
    template: row.template,
    type: row.type,
    status: row.status,
    attempts: row.attempts,
    providerId: row.providerId,
    error: row.error,
    customerId: row.customerId,
    createdAt: row.createdAt,
    sentAt: row.sentAt,
    updatedAt: row.updatedAt,
  }))
}

export function listMailQueue(store, { limit = 100 } = {}) {
  const mail = ensureMailStore(store)
  return mail.queue.slice(0, limit).map((row) => ({
    id: row.id,
    to: row.to,
    subject: row.subject,
    template: row.template,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    error: row.error,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

export function updateMailSettings(store, patch = {}) {
  const mail = ensureMailStore(store)
  if (typeof patch.enabled === 'boolean') mail.settings.enabled = patch.enabled
  if (typeof patch.defaultFrom === 'string')
    mail.settings.defaultFrom = patch.defaultFrom.trim() || null
  if (typeof patch.maxAttempts === 'number')
    mail.settings.maxAttempts = Math.max(1, Math.min(10, patch.maxAttempts))
  mail.settings.updatedAt = new Date().toISOString()
  return mail.settings
}

/** Fire-and-forget helper that still persists via withStore when caller wraps it. */
export async function sendTemplateMail(
  store,
  { to, template, data, type, customerId, accountId, immediate = true, meta },
) {
  return enqueueMail(store, { to, template, data, type, customerId, accountId, immediate, meta })
}

export { listMailTemplates, renderMailTemplate }
