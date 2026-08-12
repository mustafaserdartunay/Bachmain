/**
 * CRM → yonetim.bachmain.com destek talepleri.
 * Bildirim: destek@bachmain.com + admin Destek listesi.
 */
import { newId } from './store.mjs'
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'
import { MAIL_BRAND } from './mail/mailConfig.mjs'

export const SUPPORT_CATEGORIES = [
  { id: 'not', label: 'Not' },
  { id: 'sikayet', label: 'Şikayet' },
  { id: 'destek', label: 'Destek' },
  { id: 'talep', label: 'Talep' },
  { id: 'bilgi', label: 'Bilgi' },
]

const CATEGORY_LABELS = Object.fromEntries(SUPPORT_CATEGORIES.map((c) => [c.id, c.label]))

const PRIORITY_BY_CATEGORY = {
  sikayet: 'high',
  destek: 'medium',
  talep: 'medium',
  bilgi: 'low',
  not: 'low',
}

const STATUS_TR = {
  open: 'Açık',
  in_progress: 'İşlemde',
  waiting: 'Bekliyor',
  resolved: 'Çözüldü',
  closed: 'Kapalı',
}

const PRIORITY_TR = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
}

function resolveCategory(raw) {
  const id = String(raw || 'destek')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
  if (CATEGORY_LABELS[id]) return id
  const byLabel = SUPPORT_CATEGORIES.find(
    (c) => c.label.toLowerCase() === String(raw || '').trim().toLowerCase(),
  )
  return byLabel?.id || 'destek'
}

function syncSupportModuleRow(store, ticket) {
  if (!store.modules) store.modules = {}
  if (!Array.isArray(store.modules.support)) store.modules.support = []
  const row = {
    id: ticket.id,
    subject: ticket.subject,
    customer: ticket.customer,
    category: CATEGORY_LABELS[ticket.category] || ticket.category || 'Destek',
    priority: PRIORITY_TR[ticket.priority] || ticket.priority,
    status: STATUS_TR[ticket.status] || ticket.status,
    assignee: ticket.assignee || 'Atanmadı',
    createdAt: String(ticket.createdAt || '').slice(0, 10),
  }
  store.modules.support = [row, ...store.modules.support.filter((item) => item.id !== ticket.id)]
}

function resolveRequester(store, req, body) {
  const token = getBearerOrCookieToken(req)
  const session = token ? getAccountFromToken(store, token) : null
  const user = session?.user || null
  const displayName =
    String(body.displayName || body.name || user?.fullName || '').trim() || 'Kullanıcı'
  const email = String(body.email || user?.email || '').trim().toLowerCase() || ''
  const companyName =
    String(body.companyName || user?.companyName || '').trim() || '—'
  const phone = String(body.phone || user?.phone || '').trim()
  const tenantCode = String(
    body.tenantCode || user?.tenantCode || session?.companySession?.tenantCode || '',
  ).trim()
  return {
    accountId: user?.id || session?.account?.id || null,
    displayName,
    email,
    companyName,
    phone,
    tenantCode,
  }
}

export function listSupportTickets(store) {
  return Array.isArray(store.supportTickets) ? store.supportTickets : []
}

export function getSupportTicket(store, id) {
  return listSupportTickets(store).find((t) => t.id === id) || null
}

export function buildSupportModuleRows(store) {
  return listSupportTickets(store).map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    customer: ticket.customer,
    category: CATEGORY_LABELS[ticket.category] || ticket.category || 'Destek',
    priority: PRIORITY_TR[ticket.priority] || ticket.priority,
    status: STATUS_TR[ticket.status] || ticket.status,
    assignee: ticket.assignee || 'Atanmadı',
    createdAt: String(ticket.createdAt || '').slice(0, 10),
  }))
}

export async function createSupportTicketFromRequest(store, req, body = {}) {
  const requester = resolveRequester(store, req, body)
  const category = resolveCategory(body.category || body.topic)
  const categoryLabel = CATEGORY_LABELS[category]
  const message = String(body.message || body.description || body.body || '').trim()
  const subjectRaw = String(body.subject || '').trim()
  if (!message || message.length < 3) {
    const err = new Error('MESSAGE_REQUIRED')
    err.status = 400
    throw err
  }

  const subject =
    subjectRaw ||
    `${categoryLabel}: ${message.split('\n').find((line) => line.trim())?.trim().slice(0, 72) || 'Yeni talep'}`

  const now = new Date().toISOString()
  const ticket = {
    id: newId('t'),
    subject,
    description: message,
    category,
    categoryLabel,
    customer: requester.companyName,
    customerId: requester.accountId || '',
    contactName: requester.displayName,
    contactEmail: requester.email,
    contactPhone: requester.phone,
    tenantCode: requester.tenantCode,
    source: 'crm-header',
    priority: PRIORITY_BY_CATEGORY[category] || 'medium',
    status: 'open',
    assignee: 'Atanmadı',
    tags: [categoryLabel],
    internalNotes: [],
    attachments: [],
    replies: [],
    timeline: [
      {
        id: newId('tl'),
        title: 'Ticket oluşturuldu',
        description: `${categoryLabel} · ${requester.displayName}`,
        date: now,
        type: 'info',
        user: requester.displayName,
      },
    ],
    createdAt: now,
    updatedAt: now,
    slaDeadline: new Date(Date.now() + 24 * 3600000).toISOString(),
  }

  if (!Array.isArray(store.supportTickets)) store.supportTickets = []
  store.supportTickets.unshift(ticket)
  syncSupportModuleRow(store, ticket)

  if (!Array.isArray(store.dashboard?.recentActivities)) {
    if (!store.dashboard) store.dashboard = {}
    store.dashboard.recentActivities = []
  }
  store.dashboard.recentActivities.unshift({
    id: newId('a'),
    title: 'Yeni destek talebi',
    description: `${ticket.subject} · ${ticket.customer}`,
    date: now,
    type: 'warning',
    user: requester.displayName,
  })
  store.dashboard.recentActivities = store.dashboard.recentActivities.slice(0, 40)

  const supportEmail = MAIL_BRAND.supportEmail()
  const adminUrl = `${MAIL_BRAND.adminUrl()}/destek/${ticket.id}`

  await sendTemplateMail(store, {
    to: supportEmail,
    template: 'ticket_staff_alert',
    type: 'support_staff',
    immediate: true,
    accountId: requester.accountId || undefined,
    data: {
      name: 'Destek Ekibi',
      subject: ticket.subject,
      ticketId: ticket.id,
      category: categoryLabel,
      customer: ticket.customer,
      contactName: ticket.contactName,
      contactEmail: ticket.contactEmail || '—',
      contactPhone: ticket.contactPhone || '—',
      message: ticket.description,
      ticketUrl: adminUrl,
    },
    meta: { ticketId: ticket.id, category },
  })

  if (requester.email) {
    await sendTemplateMail(store, {
      to: requester.email,
      template: 'ticket_new',
      type: 'support_user',
      immediate: true,
      accountId: requester.accountId || undefined,
      data: {
        name: requester.displayName,
        subject: ticket.subject,
        ticketId: ticket.id,
        ticketUrl: adminUrl,
      },
      meta: { ticketId: ticket.id },
    })
  }

  return ticket
}

export async function addSupportReply(store, ticketId, { content, author = 'Destek', notifyUser = true }) {
  const ticket = getSupportTicket(store, ticketId)
  if (!ticket) {
    const err = new Error('NOT_FOUND')
    err.status = 404
    throw err
  }
  const now = new Date().toISOString()
  const reply = {
    id: newId('r'),
    author,
    content: String(content || '').trim(),
    date: now,
    isStaff: true,
  }
  if (!reply.content) {
    const err = new Error('MESSAGE_REQUIRED')
    err.status = 400
    throw err
  }
  if (!Array.isArray(ticket.replies)) ticket.replies = []
  ticket.replies.push(reply)
  ticket.status = 'waiting'
  ticket.updatedAt = now
  ticket.timeline.push({
    id: newId('tl'),
    title: 'Yanıt gönderildi',
    description: reply.content.slice(0, 140),
    date: now,
    type: 'success',
    user: author,
  })
  syncSupportModuleRow(store, ticket)

  if (notifyUser && ticket.contactEmail) {
    await sendTemplateMail(store, {
      to: ticket.contactEmail,
      template: 'ticket_replied',
      type: 'support_reply',
      immediate: true,
      data: {
        name: ticket.contactName || 'Kullanıcı',
        subject: ticket.subject,
        replyPreview: reply.content.slice(0, 280),
        ticketUrl: `${MAIL_BRAND.adminUrl()}/destek/${ticket.id}`,
      },
      meta: { ticketId: ticket.id, replyId: reply.id },
    })
  }

  return { ticket, reply }
}
