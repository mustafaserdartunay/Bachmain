/**
 * Public lead capture from bachmain.com (demo form, etc.).
 * Persists into customers + üye (accounts) so yonetim lists stay complete.
 */
import { withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { hitRateLimit } from './db.mjs'
import { hashPassword } from './auth.mjs'

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function makeTenantCode(store) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'BM'
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  let tries = 0
  while ((store.accounts || []).some((a) => a.tenantCode === code) && tries < 40) {
    code = 'BM'
    for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    tries += 1
  }
  return code
}

/**
 * Save demo request → Üye Hesapları (/uyeler) + Müşteriler (/musteriler).
 */
export function createDemoLead(store, body = {}) {
  if (!Array.isArray(store.customers)) store.customers = []
  if (!Array.isArray(store.accounts)) store.accounts = []
  if (!Array.isArray(store.demoRequests)) store.demoRequests = []
  if (!store.modules) store.modules = {}
  if (!Array.isArray(store.modules.customers)) store.modules.customers = []
  if (!Array.isArray(store.notifications)) store.notifications = []

  const fullName = String(body.name || body.fullName || body.contact || '').trim()
  const companyName = String(body.company || body.companyName || '').trim() || fullName || 'Demo Talebi'
  const phone = String(body.phone || '').trim()
  const email = normalizeEmail(body.email)
  const companySize = String(body.size || body.companySize || '').trim()
  const message = String(body.message || '').trim()

  if (!fullName) {
    const err = new Error('Ad soyad gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!email || !email.includes('@')) {
    const err = new Error('Geçerli bir e-posta girin')
    err.code = 'INVALID_EMAIL'
    throw err
  }
  if (!phone) {
    const err = new Error('Telefon gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const requestId = newId('demo')

  const demoRequest = {
    id: requestId,
    fullName,
    companyName,
    phone,
    email,
    companySize,
    message,
    source: 'bachmain_demo',
    status: 'pending',
    createdAt: nowIso,
  }
  store.demoRequests.unshift(demoRequest)
  store.demoRequests = store.demoRequests.slice(0, 1000)

  let account = store.accounts.find((a) => a.email === email)
  let customer = account
    ? store.customers.find((c) => c.id === account.customerId)
    : store.customers.find((c) => normalizeEmail(c.email) === email)

  if (!customer) {
    const customerId = newId('c')
    const tenantCode = account?.tenantCode || makeTenantCode(store)
    customer = {
      id: customerId,
      company: companyName,
      contact: fullName,
      email,
      phone,
      taxNo: '',
      city: '',
      status: 'trial',
      plan: 'Starter',
      mrr: 0,
      users: 1,
      createdAt: nowIso.slice(0, 10),
      licenseExpiry: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
      balance: 0,
      source: 'demo_request',
      tenantCode,
      companySize,
      demoMessage: message,
      lastDemoAt: nowIso,
    }
    store.customers.unshift(customer)
    store.modules.customers.unshift({
      id: customer.id,
      company: customer.company,
      contact: customer.contact,
      city: '—',
      plan: customer.plan,
      mrr: '₺0',
      status: 'Demo Talep',
      licenseExpiry: customer.licenseExpiry,
    })
  } else {
    customer.contact = fullName || customer.contact
    customer.company = companyName || customer.company
    customer.phone = phone || customer.phone
    customer.email = email
    customer.companySize = companySize || customer.companySize
    customer.demoMessage = message || customer.demoMessage
    customer.lastDemoAt = nowIso
    if (!customer.source || customer.source === 'Manuel') customer.source = 'demo_request'
    const moduleRow = store.modules.customers.find((c) => c.id === customer.id)
    if (moduleRow) {
      moduleRow.company = customer.company
      moduleRow.contact = customer.contact
      moduleRow.status = moduleRow.status || 'Demo Talep'
    }
  }

  if (!account) {
    account = {
      id: newId('acc'),
      email,
      fullName,
      companyName,
      phone,
      // Unusable password — demo lead cannot log in until they register
      passwordHash: hashPassword(`demo-lead-${requestId}-${Math.random().toString(36)}`),
      role: 'demo_lead',
      canLogin: false,
      customerId: customer.id,
      tenantCode: customer.tenantCode,
      plan: 'Starter',
      source: 'demo_request',
      companySize,
      demoMessage: message,
      createdAt: nowIso,
      lastLoginAt: null,
      lastDemoAt: nowIso,
    }
    store.accounts.unshift(account)
  } else {
    account.fullName = fullName || account.fullName
    account.companyName = companyName || account.companyName
    account.phone = phone || account.phone
    account.lastDemoAt = nowIso
    account.companySize = companySize || account.companySize
    account.demoMessage = message || account.demoMessage
    if (account.role === 'demo_lead' || !account.role) {
      account.source = account.source || 'demo_request'
    }
  }

  demoRequest.customerId = customer.id
  demoRequest.accountId = account.id

  store.notifications.unshift({
    id: newId('ntf'),
    title: `Demo talebi: ${companyName}`,
    body: `${fullName} · ${email} · ${phone}${companySize ? ` · ${companySize}` : ''}`,
    type: 'demo_request',
    createdAt: nowIso,
  })
  store.notifications = store.notifications.slice(0, 200)

  return { request: demoRequest, customer, account }
}

export async function handleLeadsApi(req, res, path, body = {}) {
  const method = req.method

  if (method === 'POST' && (path === 'leads/demo' || path === 'demo-requests')) {
    const ip = req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
    const rate = await hitRateLimit(`demo:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla demo talebi. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      const result = await withStore((store) => createDemoLead(store, body))
      sendJson(req, res, 201, {
        ok: true,
        id: result.request.id,
        customerId: result.customer.id,
        accountId: result.account.id,
        message: 'Demo talebiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
      })
      return true
    } catch (error) {
      sendJson(req, res, 400, {
        error: error.code || 'DEMO_FAILED',
        message: error.message,
      })
      return true
    }
  }

  return false
}
