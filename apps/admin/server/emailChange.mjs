/**
 * Account email change — staff starts → mail to old address → user submits new → auto-approve.
 */
import crypto from 'node:crypto'
import { newId } from './store.mjs'
import { mailConfig } from './mail/mailConfig.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'
import { accountProduct } from './auth.mjs'

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function ensureEmailChangeStore(store) {
  if (!Array.isArray(store.emailChangeRequests)) store.emailChangeRequests = []
  if (!Array.isArray(store.notifications)) store.notifications = []
  if (!Array.isArray(store.authEvents)) store.authEvents = []
  if (!Array.isArray(store.emailTokens)) store.emailTokens = []
  return store
}

function pushNotify(store, { title, body, type, meta }) {
  store.notifications.unshift({
    id: newId('ntf'),
    title,
    body,
    type: type || 'email_change',
    meta: meta || {},
    createdAt: new Date().toISOString(),
    read: false,
  })
  store.notifications = store.notifications.slice(0, 300)
}

/**
 * Staff starts email-change flow for a membership account.
 * Mail goes to the CURRENT (old) address with a secure link.
 */
export async function startEmailChange(store, { accountId, staffEmail }) {
  ensureEmailChangeStore(store)
  const account = (store.accounts || []).find((a) => a.id === accountId)
  if (!account) {
    const err = new Error('Üye hesabı bulunamadı')
    err.code = 'NOT_FOUND'
    err.status = 404
    throw err
  }
  const oldEmail = normalizeEmail(account.email)
  if (!oldEmail || !oldEmail.includes('@')) {
    const err = new Error('Geçerli mevcut e-posta yok')
    err.code = 'NO_EMAIL'
    err.status = 400
    throw err
  }

  // Invalidate previous pending requests for this account
  for (const row of store.emailChangeRequests) {
    if (row.accountId === accountId && row.status === 'pending') {
      row.status = 'cancelled'
      row.updatedAt = new Date().toISOString()
    }
  }
  store.emailTokens = store.emailTokens.filter(
    (t) => !(t.accountId === accountId && t.purpose === 'email_change'),
  )

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const requestId = newId('emch')

  store.emailTokens.unshift({
    id: newId('etok'),
    purpose: 'email_change',
    token,
    accountId: account.id,
    email: oldEmail,
    requestId,
    expiresAt,
    createdAt: new Date().toISOString(),
  })
  store.emailTokens = store.emailTokens.slice(0, 2000)

  const request = {
    id: requestId,
    accountId: account.id,
    customerId: account.customerId || null,
    oldEmail,
    newEmail: null,
    status: 'pending',
    autoApproved: false,
    staffEmail: staffEmail || null,
    tokenHint: token.slice(0, 8),
    expiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  }
  store.emailChangeRequests.unshift(request)
  store.emailChangeRequests = store.emailChangeRequests.slice(0, 2000)

  const cfg = mailConfig()
  const changeUrl = `${cfg.webUrl}/email-degistir?token=${encodeURIComponent(token)}`

  await sendTemplateMail(store, {
    to: oldEmail,
    template: 'email_change_request',
    type: 'email_change_request',
    customerId: account.customerId,
    accountId: account.id,
    data: {
      name: account.fullName || account.email,
      oldEmail,
      changeUrl,
    },
  })

  pushNotify(store, {
    title: 'E-posta değişim talebi başlatıldı',
    body: `${account.fullName || oldEmail} · mevcut: ${oldEmail} · kullanıcıya link gönderildi`,
    type: 'email_change_started',
    meta: { requestId, accountId: account.id, oldEmail },
  })

  store.authEvents.unshift({
    id: newId('aev'),
    type: 'email_change_started',
    accountId: account.id,
    customerId: account.customerId,
    email: oldEmail,
    at: new Date().toISOString(),
    result: 'mail_queued',
    meta: { requestId, staffEmail: staffEmail || null },
  })
  store.authEvents = store.authEvents.slice(0, 2000)

  return { ok: true, request, changeUrl }
}

/**
 * User completes change from old-mail link — auto-approved.
 */
export async function completeEmailChange(store, { token, newEmail: newEmailRaw }) {
  ensureEmailChangeStore(store)
  const newEmail = normalizeEmail(newEmailRaw)
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    const err = new Error('Geçerli bir e-posta girin')
    err.code = 'INVALID_EMAIL'
    err.status = 400
    throw err
  }

  const tok = store.emailTokens.find((t) => t.purpose === 'email_change' && t.token === token)
  if (!tok || new Date(tok.expiresAt).getTime() < Date.now()) {
    const err = new Error('Geçersiz veya süresi dolmuş bağlantı')
    err.code = 'INVALID_TOKEN'
    err.status = 400
    throw err
  }

  const account = (store.accounts || []).find((a) => a.id === tok.accountId)
  if (!account) {
    const err = new Error('Hesap bulunamadı')
    err.code = 'NOT_FOUND'
    err.status = 404
    throw err
  }

  const oldEmail = normalizeEmail(account.email)
  if (newEmail === oldEmail) {
    const err = new Error('Yeni e-posta mevcut adresle aynı olamaz')
    err.code = 'SAME_EMAIL'
    err.status = 400
    throw err
  }

  const taken = (store.accounts || []).some(
    (a) =>
      a.id !== account.id &&
      normalizeEmail(a.email) === newEmail &&
      accountProduct(a) === accountProduct(account),
  )
  if (taken) {
    const err = new Error('Bu e-posta başka bir hesapta kayıtlı')
    err.code = 'EMAIL_TAKEN'
    err.status = 409
    throw err
  }

  account.email = newEmail
  account.updatedAt = new Date().toISOString()
  const customer = (store.customers || []).find((c) => c.id === account.customerId)
  if (customer) {
    customer.email = newEmail
    if (customer.contactEmail) customer.contactEmail = newEmail
  }

  const request =
    store.emailChangeRequests.find((r) => r.id === tok.requestId) ||
    store.emailChangeRequests.find((r) => r.accountId === account.id && r.status === 'pending')

  if (request) {
    request.newEmail = newEmail
    request.status = 'completed'
    request.autoApproved = true
    request.completedAt = new Date().toISOString()
    request.updatedAt = request.completedAt
  }

  // consume token
  store.emailTokens = store.emailTokens.filter((t) => t.token !== token)

  pushNotify(store, {
    title: 'E-posta otomatik onaylandı',
    body: `${account.fullName || newEmail}: ${oldEmail} → ${newEmail}`,
    type: 'email_change_completed',
    meta: {
      requestId: request?.id || null,
      accountId: account.id,
      oldEmail,
      newEmail,
      autoApproved: true,
    },
  })

  store.authEvents.unshift({
    id: newId('aev'),
    type: 'email_change_completed',
    accountId: account.id,
    customerId: account.customerId,
    email: newEmail,
    at: new Date().toISOString(),
    result: 'auto_approved',
    meta: { oldEmail, newEmail, requestId: request?.id || null },
  })
  store.authEvents = store.authEvents.slice(0, 2000)

  await sendTemplateMail(store, {
    to: newEmail,
    template: 'email_changed',
    type: 'email_changed',
    customerId: account.customerId,
    accountId: account.id,
    data: {
      name: account.fullName || newEmail,
      oldEmail,
      newEmail,
      appUrl: mailConfig().appUrl,
    },
  })

  return {
    ok: true,
    autoApproved: true,
    oldEmail,
    newEmail,
    requestId: request?.id || null,
  }
}

export function listEmailChangesForAccount(store, accountId) {
  ensureEmailChangeStore(store)
  return store.emailChangeRequests
    .filter((r) => r.accountId === accountId)
    .slice(0, 40)
    .map((r) => ({
      id: r.id,
      oldEmail: r.oldEmail,
      newEmail: r.newEmail,
      status: r.status,
      autoApproved: Boolean(r.autoApproved),
      staffEmail: r.staffEmail,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      expiresAt: r.expiresAt,
    }))
}

/**
 * Permanently remove membership account (+ linked customer if orphaned).
 */
export function deleteMembershipAccount(store, accountId) {
  ensureEmailChangeStore(store)
  const account = (store.accounts || []).find((a) => a.id === accountId)
  if (!account) {
    const err = new Error('Üye hesabı bulunamadı')
    err.code = 'NOT_FOUND'
    err.status = 404
    throw err
  }

  const customerId = account.customerId
  const email = account.email
  const name = account.fullName
  let deletedCustomerId = null

  store.accounts = (store.accounts || []).filter((a) => a.id !== accountId)
  store.emailTokens = (store.emailTokens || []).filter((t) => t.accountId !== accountId)
  store.sessions = (store.sessions || []).filter((s) => s.accountId !== accountId)

  if (customerId) {
    const stillLinked = (store.accounts || []).some((a) => a.customerId === customerId)
    if (!stillLinked) {
      store.customers = (store.customers || []).filter((c) => c.id !== customerId)
      if (store.modules?.customers) {
        store.modules.customers = store.modules.customers.filter((r) => r.id !== customerId)
      }
      deletedCustomerId = customerId
    }
  }

  for (const row of store.emailChangeRequests || []) {
    if (row.accountId === accountId && row.status === 'pending') {
      row.status = 'cancelled'
      row.updatedAt = new Date().toISOString()
    }
  }

  pushNotify(store, {
    title: 'Üye hesabı silindi',
    body: `${name || email || accountId} kalıcı olarak silindi`,
    type: 'membership_deleted',
    meta: { accountId, customerId, email },
  })

  store.authEvents.unshift({
    id: newId('aev'),
    type: 'membership_deleted',
    accountId,
    customerId,
    email,
    at: new Date().toISOString(),
    result: 'deleted',
  })
  store.authEvents = store.authEvents.slice(0, 2000)

  return { ok: true, deletedAccountId: accountId, deletedCustomerId }
}
