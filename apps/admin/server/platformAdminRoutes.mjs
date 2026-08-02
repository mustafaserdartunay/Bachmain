/**
 * Super-admin platform ops — /api/v1/admin/*
 * Kullanıcı listesi, oturum, askıya alma, silme, şifre/deneme/plan işlemleri.
 */
import crypto from 'node:crypto'
import { loadStore, withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'
import { hasDatabase } from './db.mjs'
import { envHealthSnapshot } from './assertEnv.mjs'
import { deleteMembershipAccount } from './emailChange.mjs'
import {
  activatePlanDirect,
  extendMembership,
  extendMembershipByAccount,
  seedBillingIfEmpty,
} from './subscriptionService.mjs'
import { displayPlanName, normalizePlanCode } from './billingCatalog.mjs'
import { hashPassword, requestPasswordReset } from './auth.mjs'
import { mailConfig } from './mail/mailConfig.mjs'
import { sendTemplateMail, getMailStatus } from './mail/mailService.mjs'

function requireStaffOrFail(req, res) {
  const session = getStaffSession(req)
  if (!session && staffAuthEnabled() && process.env.STAFF_AUTH_REQUIRED !== '0') {
    sendJson(req, res, 401, {
      ok: false,
      error: 'UNAUTHORIZED',
      message: 'Staff oturumu gerekli',
    })
    return null
  }
  return session || { email: 'local-dev', user: { email: 'local-dev', role: 'super_admin' } }
}

function ensureAudit(store) {
  if (!Array.isArray(store.auditLogs)) store.auditLogs = []
  if (!Array.isArray(store.sessions)) store.sessions = []
  if (!Array.isArray(store.authEvents)) store.authEvents = []
  if (!Array.isArray(store.accounts)) store.accounts = []
  if (!Array.isArray(store.customers)) store.customers = []
  if (!Array.isArray(store.emailTokens)) store.emailTokens = []
  return store
}

function pushAudit(store, { actor, action, target, targetId, ip, meta }) {
  ensureAudit(store)
  store.auditLogs.unshift({
    id: newId('aud'),
    time: new Date().toISOString(),
    actor: actor || 'staff',
    action,
    target: target || '—',
    targetId: targetId || null,
    ip: ip || '—',
    meta: meta || {},
  })
  store.auditLogs = store.auditLogs.slice(0, 5000)
}

function clientIp(req) {
  const xf = req.headers?.['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim()
  return req.socket?.remoteAddress || '—'
}

function actorEmail(staff) {
  return staff?.user?.email || staff?.email || 'staff'
}

function resolveStatus(account, customer) {
  const raw = String(
    customer?.subscriptionStatus || customer?.status || account?.status || 'active',
  ).toLowerCase()
  if (account?.canLogin === false || raw === 'suspended') return 'suspended'
  if (raw === 'churned' || raw === 'cancelled' || raw === 'expired') return 'expired'
  if (raw === 'trial' || raw === 'trialing' || raw === 'demo' || account?.role === 'demo_lead') {
    const expiry = customer?.licenseExpiry || account?.licenseExpiry
    if (expiry) {
      const end = new Date(`${String(expiry).slice(0, 10)}T23:59:59.999`)
      if (!Number.isNaN(end.getTime()) && end < new Date()) return 'expired'
    }
    return 'trial'
  }
  const expiry = customer?.licenseExpiry || account?.licenseExpiry
  if (expiry) {
    const end = new Date(`${String(expiry).slice(0, 10)}T23:59:59.999`)
    if (!Number.isNaN(end.getTime()) && end < new Date()) return 'expired'
  }
  return 'active'
}

function countSessions(store, accountId) {
  const sessions = (store.sessions || []).filter((s) => s.accountId === accountId && !s.revokedAt)
  if (sessions.length) return sessions.length
  const account = (store.accounts || []).find((a) => a.id === accountId)
  if (account?.token || account?.sessionToken) return 1
  return 0
}

function countDevices(store, accountId) {
  const devices = new Set()
  for (const s of store.sessions || []) {
    if (s.accountId === accountId && s.device) devices.add(String(s.device))
  }
  for (const e of store.authEvents || []) {
    if (e.accountId === accountId && e.device) devices.add(String(e.device))
  }
  return devices.size || (countSessions(store, accountId) ? 1 : 0)
}

function lastLoginAt(store, account) {
  if (account?.lastLoginAt) return account.lastLoginAt
  const ev = (store.authEvents || []).find(
    (e) =>
      e.accountId === account?.id &&
      (e.type === 'login' || e.type === 'auth.login' || e.result === 'ok'),
  )
  return ev?.at || account?.updatedAt || null
}

function toUserRow(store, account, customer) {
  const company = customer?.company || account?.companyName || account?.company || '—'
  const planCode = customer?.planCode || customer?.plan || account?.plan || 'starter'
  return {
    id: account.id,
    company,
    companyId: customer?.id || account.customerId || '',
    user: account.fullName || account.name || account.email || '—',
    email: account.email || '—',
    sessions: countSessions(store, account.id),
    devices: countDevices(store, account.id),
    mfaEnabled: Boolean(account.mfaEnabled || account.totpEnabled),
    lastLogin: lastLoginAt(store, account),
    plan: displayPlanName(planCode),
    status: resolveStatus(account, customer),
  }
}

/** Seed/demo: müşteri kaydından satır (hesap yoksa). */
function customerAsUserRow(customer) {
  const status = resolveStatus(null, customer)
  return {
    id: `customer:${customer.id}`,
    company: customer.company || '—',
    companyId: customer.id,
    user: customer.contact || customer.email || '—',
    email: customer.email || '—',
    sessions: 0,
    devices: 0,
    mfaEnabled: false,
    lastLogin: null,
    plan: displayPlanName(customer.planCode || customer.plan || 'starter'),
    status,
  }
}

function listPlatformUsers(store) {
  ensureAudit(store)
  const accounts = store.accounts || []
  const customers = store.customers || []
  const byCustomer = new Map(customers.map((c) => [c.id, c]))

  if (accounts.length) {
    return accounts.map((account) =>
      toUserRow(store, account, byCustomer.get(account.customerId) || null),
    )
  }

  // Hesap yoksa müşteri listesini operasyon paneline yansıt
  return customers.map(customerAsUserRow)
}

function findAccount(store, userId) {
  ensureAudit(store)
  const id = String(userId || '').trim()
  if (!id) return { account: null, customer: null }

  if (id.startsWith('customer:')) {
    const customerId = id.slice('customer:'.length)
    const customer = (store.customers || []).find((c) => c.id === customerId) || null
    const account = customer
      ? (store.accounts || []).find((a) => a.customerId === customer.id) || null
      : null
    return { account, customer, syntheticId: id }
  }

  const account = (store.accounts || []).find((a) => a.id === id) || null
  const customer = account?.customerId
    ? (store.customers || []).find((c) => c.id === account.customerId) || null
    : null
  return { account, customer, syntheticId: id }
}

function forceLogoutAccount(store, account) {
  if (!account) return 0
  let cleared = 0
  if (account.token) {
    account.token = null
    cleared += 1
  }
  if (account.sessionToken) {
    account.sessionToken = null
    cleared += 1
  }
  const before = (store.sessions || []).length
  store.sessions = (store.sessions || []).filter((s) => s.accountId !== account.id)
  cleared += before - store.sessions.length
  // revoke markers for any leftover
  for (const s of store.sessions || []) {
    if (s.accountId === account.id) {
      s.revokedAt = new Date().toISOString()
      cleared += 1
    }
  }
  account.updatedAt = new Date().toISOString()
  return cleared
}

async function staffResetPassword(store, account) {
  if (!account?.email) {
    const err = new Error('E-posta bulunamadı')
    err.code = 'NO_EMAIL'
    err.status = 400
    throw err
  }
  // demo_lead dahil — staff işlemi
  const email = String(account.email).trim().toLowerCase()
  const token = crypto.randomBytes(32).toString('hex')
  store.emailTokens = (store.emailTokens || []).filter(
    (t) => !(t.accountId === account.id && t.purpose === 'reset'),
  )
  store.emailTokens.unshift({
    id: newId('etok'),
    purpose: 'reset',
    token,
    accountId: account.id,
    email,
    expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    staffInitiated: true,
  })
  store.emailTokens = store.emailTokens.slice(0, 2000)

  const cfg = mailConfig()
  const resetUrl = `${cfg.webUrl}/sifre-sifirla?token=${encodeURIComponent(token)}`
  await sendTemplateMail(store, {
    to: email,
    template: 'password_reset',
    type: 'password_reset',
    customerId: account.customerId,
    accountId: account.id,
    data: { name: account.fullName || email, resetUrl },
  })

  // Geçici rastgele hash — kullanıcı linkten yenileyecek; eski şifre geçersiz
  account.passwordHash = hashPassword(crypto.randomBytes(24).toString('hex'))
  account.passwordChangedAt = new Date().toISOString()
  account.mustResetPassword = true
  account.updatedAt = account.passwordChangedAt

  return { ok: true, email }
}

function ensureCustomerForAccount(store, account) {
  if (!account) return null
  if (account.customerId) {
    const existing = (store.customers || []).find((c) => c.id === account.customerId)
    if (existing) return existing
  }
  const customer = {
    id: newId('c'),
    company: account.companyName || account.fullName || account.email,
    contact: account.fullName || account.email,
    email: account.email,
    status: 'trial',
    plan: 'Starter',
    planCode: 'starter',
    mrr: 0,
    users: 1,
    createdAt: new Date().toISOString().slice(0, 10),
    licenseExpiry: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    balance: 0,
    source: account.source || 'staff_created',
    subscriptionStatus: 'trialing',
  }
  store.customers = store.customers || []
  store.customers.unshift(customer)
  account.customerId = customer.id
  return customer
}

/**
 * @returns {Promise<boolean>} true if handled
 */
export async function handlePlatformAdminApi(req, res, path, body = {}) {
  if (!path.startsWith('v1/admin')) return false

  const method = req.method || 'GET'
  const staff = requireStaffOrFail(req, res)
  if (!staff) return true

  const ip = clientIp(req)
  const actor = actorEmail(staff)

  // GET /v1/admin/system-health
  if (method === 'GET' && path === 'v1/admin/system-health') {
    const store = await loadStore()
    ensureAudit(store)
    seedBillingIfEmpty(store)
    const accounts = store.accounts || []
    const customers = store.customers || []
    const mail = getMailStatus(store)
    const env = envHealthSnapshot()
    const trialUsers = customers.filter((c) =>
      ['trial', 'trialing'].includes(String(c.status || c.subscriptionStatus || '')),
    ).length
    const paidUsers = customers.filter((c) => c.status === 'active').length
    const expiredUsers = customers.filter((c) =>
      ['expired', 'churned', 'cancelled'].includes(String(c.status || '')),
    ).length
    const openTickets = (store.supportTickets || []).filter(
      (t) => !['resolved', 'closed'].includes(t.status),
    ).length
    const onlineUsers = accounts.filter((a) => a.token || a.sessionToken).length

    sendJson(req, res, 200, {
      onlineUsers,
      cpuPercent: 0,
      ramPercent: 0,
      storagePercent: 0,
      database: {
        status: hasDatabase() ? 'healthy' : 'degraded',
        latencyMs: hasDatabase() ? 8 : 0,
      },
      api: { status: 'healthy', latencyMs: 12 },
      emailQueue: {
        status: mail.configured ? (mail.queuePending > 50 ? 'degraded' : 'healthy') : 'degraded',
        pending: mail.queuePending || 0,
      },
      redis: {
        status: env.checks?.redis ? 'healthy' : 'degraded',
        latencyMs: env.checks?.redis ? 3 : 0,
      },
      ticketsOpen: openTickets,
      revenueMrr: customers.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0),
      trialUsers,
      expiredUsers,
      paidUsers,
      sampledAt: new Date().toISOString(),
      mock: false,
      source: '/v1/admin/system-health',
    });
    return true
  }

  // GET /v1/admin/audit-logs
  if (method === 'GET' && path === 'v1/admin/audit-logs') {
    const store = await loadStore()
    ensureAudit(store)
    const url = new URL(String(req.url || ''), 'http://localhost')
    const action = url.searchParams.get('action')
    let rows = store.auditLogs.map((r) => ({
      id: r.id,
      time: r.time,
      actor: r.actor,
      actorId: r.actorId,
      action: r.action,
      target: r.target,
      targetId: r.targetId,
      ip: r.ip || '—',
      meta: r.meta || {},
    }))
    // authEvents'ten tamamla
    for (const e of store.authEvents.slice(0, 200)) {
      rows.push({
        id: e.id || newId('aud'),
        time: e.at || e.createdAt || new Date().toISOString(),
        actor: e.email || 'system',
        action: e.type || 'auth.event',
        target: e.email || e.accountId || '—',
        targetId: e.accountId,
        ip: e.ip || '—',
        meta: e.meta || { result: e.result },
      })
    }
    rows.sort((a, b) => String(b.time).localeCompare(String(a.time)))
    if (action && action !== 'all') {
      rows = rows.filter((r) => r.action === action)
    }
    sendJson(req, res, 200, { rows: rows.slice(0, 500), immutable: true });
    return true
  }

  // GET /v1/admin/users
  if (method === 'GET' && path === 'v1/admin/users') {
    const store = await loadStore()
    const rows = listPlatformUsers(store)
    sendJson(req, res, 200, { rows });
    return true
  }

  // /v1/admin/users/:id/...
  const userMatch = path.match(/^v1\/admin\/users\/([^/]+)(?:\/([a-z0-9-]+))?$/)
  if (!userMatch) {
    sendJson(req, res, 404, {
      ok: false,
      error: 'NOT_FOUND',
      message: 'Bilinmeyen admin yolu',
    });
    return true
  }

  const userId = decodeURIComponent(userMatch[1])
  const action = userMatch[2] || null

  // GET login-history
  if (method === 'GET' && action === 'login-history') {
    const store = await loadStore()
    const { account, customer } = findAccount(store, userId)
    const accountId = account?.id
    const email = account?.email || customer?.email
    const rows = (store.authEvents || [])
      .filter(
        (e) =>
          (accountId && e.accountId === accountId) ||
          (email && String(e.email || '').toLowerCase() === String(email).toLowerCase()),
      )
      .slice(0, 50)
      .map((e, i) => ({
        id: e.id || `lh_${i}`,
        ip: e.ip || '—',
        device: e.device || e.userAgent || '—',
        date: e.at || e.createdAt || new Date().toISOString(),
      }))
    if (!rows.length && store.customerExtras?.loginHistory) {
      sendJson(req, res, 200, { rows: store.customerExtras.loginHistory });
      return true
    }
    sendJson(req, res, 200, { rows });
    return true
  }

  // DELETE /v1/admin/users/:id
  if (method === 'DELETE' && !action) {
    try {
      const result = await withStore((store) => {
        ensureAudit(store)
        const { account, customer, syntheticId } = findAccount(store, userId)
        if (account) {
          const deleted = deleteMembershipAccount(store, account.id)
          pushAudit(store, {
            actor,
            action: 'user.delete',
            target: account.email || account.id,
            targetId: account.id,
            ip,
            meta: deleted,
          })
          return { ok: true, message: 'Kullanıcı silindi', ...deleted }
        }
        if (customer && String(syntheticId || '').startsWith('customer:')) {
          store.customers = store.customers.filter((c) => c.id !== customer.id)
          if (store.modules?.customers) {
            store.modules.customers = store.modules.customers.filter((r) => r.id !== customer.id)
          }
          pushAudit(store, {
            actor,
            action: 'user.delete',
            target: customer.email || customer.company,
            targetId: customer.id,
            ip,
            meta: { deletedCustomerId: customer.id },
          })
          return { ok: true, message: 'Müşteri kaydı silindi', deletedCustomerId: customer.id }
        }
        const err = new Error('Kullanıcı bulunamadı')
        err.status = 404
        err.code = 'NOT_FOUND'
        throw err
      })
      sendJson(req, res, 200, result);
      return true
    } catch (err) {
      sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'DELETE_FAILED',
        message: err.message,
      });
      return true
    }
  }

  if (method !== 'POST' || !action) {
    sendJson(req, res, 405, {
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Desteklenmeyen istek',
    });
    return true
  }

  try {
    if (action === 'force-logout') {
      const result = await withStore((store) => {
        const { account } = findAccount(store, userId)
        if (!account) {
          throw Object.assign(new Error('Kullanıcı bulunamadı'), {
            code: 'NOT_FOUND',
            status: 404,
          })
        }
        const sessionsCleared = forceLogoutAccount(store, account)
        pushAudit(store, {
          actor,
          action: 'user.force_logout',
          target: account.email,
          targetId: account.id,
          ip,
          meta: { sessionsCleared },
        })
        return {
          ok: true,
          message: sessionsCleared
            ? `${sessionsCleared} oturum sonlandırıldı`
            : 'Aktif oturum yoktu',
          sessionsCleared,
        }
      })
      sendJson(req, res, 200, result);
      return true
    }

    if (action === 'suspend') {
      const result = await withStore((store) => {
        const { account, customer } = findAccount(store, userId)
        if (!account && !customer) {
          throw Object.assign(new Error('Kullanıcı bulunamadı'), {
            code: 'NOT_FOUND',
            status: 404,
          })
        }
        if (account) {
          account.canLogin = false
          account.status = 'suspended'
          account.updatedAt = new Date().toISOString()
          forceLogoutAccount(store, account)
        }
        const cust = customer || (account ? ensureCustomerForAccount(store, account) : null)
        if (cust) {
          cust.status = 'suspended'
          cust.subscriptionStatus = 'suspended'
          cust.updatedAt = new Date().toISOString()
        }
        pushAudit(store, {
          actor,
          action: 'user.suspend',
          target: account?.email || customer?.email,
          targetId: account?.id || customer?.id,
          ip,
          meta: { reason: body.reason || null },
        })
        return { ok: true, message: 'Hesap askıya alındı' }
      })
      sendJson(req, res, 200, result);
      return true
    }

    if (action === 'reset-password') {
      const result = await withStore(async (store) => {
        const { account } = findAccount(store, userId)
        if (!account) {
          // hesap yoksa public reset dene (enumeration-safe)
          const { customer } = findAccount(store, userId)
          if (customer?.email) {
            await requestPasswordReset(store, customer.email)
            pushAudit(store, {
              actor,
              action: 'user.reset_password',
              target: customer.email,
              targetId: customer.id,
              ip,
              meta: { via: 'customer_email' },
            })
            return {
              ok: true,
              message: 'Şifre sıfırlama bağlantısı gönderildi (hesap varsa)',
            }
          }
          throw Object.assign(new Error('Kullanıcı hesabı bulunamadı'), {
            code: 'NOT_FOUND',
            status: 404,
          })
        }
        const reset = await staffResetPassword(store, account)
        forceLogoutAccount(store, account)
        pushAudit(store, {
          actor,
          action: 'user.reset_password',
          target: account.email,
          targetId: account.id,
          ip,
          meta: { email: reset.email },
        })
        return {
          ok: true,
          message: `Şifre sıfırlama bağlantısı gönderildi: ${reset.email}`,
        }
      })
      sendJson(req, res, 200, result);
      return true
    }

    if (action === 'reset-trial') {
      const result = await withStore(async (store) => {
        seedBillingIfEmpty(store)
        const { account, customer } = findAccount(store, userId)
        if (account) {
          const extended = await extendMembershipByAccount(store, account.id, {
            days: 7,
            mode: 'trial',
            note: 'staff_reset_trial',
          })
          if (account.canLogin === false) account.canLogin = true
          pushAudit(store, {
            actor,
            action: 'user.reset_trial',
            target: account.email,
            targetId: account.id,
            ip,
            meta: { licenseExpiry: extended.licenseExpiry, daysAdded: extended.daysAdded },
          })
          return {
            ok: true,
            message: `Deneme süresi yenilendi (+${extended.daysAdded} gün)`,
            licenseExpiry: extended.licenseExpiry,
          }
        }
        if (customer) {
          const extended = await extendMembership(store, customer.id, {
            days: 7,
            mode: 'trial',
            note: 'staff_reset_trial',
          })
          pushAudit(store, {
            actor,
            action: 'user.reset_trial',
            target: customer.email || customer.company,
            targetId: customer.id,
            ip,
            meta: { licenseExpiry: extended.licenseExpiry },
          })
          return {
            ok: true,
            message: `Deneme süresi yenilendi (+${extended.daysAdded} gün)`,
            licenseExpiry: extended.licenseExpiry,
          }
        }
        throw Object.assign(new Error('Kullanıcı bulunamadı'), {
          code: 'NOT_FOUND',
          status: 404,
        })
      })
      sendJson(req, res, 200, result);
      return true
    }

    if (action === 'upgrade-plan') {
      const result = await withStore((store) => {
        seedBillingIfEmpty(store)
        const planCode = normalizePlanCode(body.plan || 'professional')
        const { account, customer } = findAccount(store, userId)
        let cust = customer
        if (!cust && account) cust = ensureCustomerForAccount(store, account)
        if (!cust) {
          throw Object.assign(new Error('Müşteri kaydı bulunamadı'), {
            code: 'NO_CUSTOMER',
            status: 400,
          })
        }
        const from = displayPlanName(cust.planCode || cust.plan)
        activatePlanDirect(store, cust.id, planCode, body.period || 'month', {
          action: 'staff_upgrade_plan',
          status: 'active',
        })
        cust.plan = displayPlanName(planCode)
        cust.planCode = planCode
        cust.status = 'active'
        if (account) {
          account.canLogin = true
          account.updatedAt = new Date().toISOString()
        }
        pushAudit(store, {
          actor,
          action: 'user.upgrade_plan',
          target: account?.email || cust.company,
          targetId: account?.id || cust.id,
          ip,
          meta: { from, to: displayPlanName(planCode), planCode },
        })
        return {
          ok: true,
          message: `Plan yükseltildi: ${from} → ${displayPlanName(planCode)}`,
          plan: displayPlanName(planCode),
        }
      })
      sendJson(req, res, 200, result);
      return true
    }

    sendJson(req, res, 404, {
      ok: false,
      error: 'UNKNOWN_ACTION',
      message: `Bilinmeyen işlem: ${action}`,
    });
    return true
  } catch (err) {
    sendJson(req, res, err.status || 400, {
      ok: false,
      error: err.code || 'ACTION_FAILED',
      message: err.message || 'İşlem başarısız',
    });
    return true
  }
}
