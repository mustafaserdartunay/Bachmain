/**
 * Public lead capture from bachmain.com (demo form).
 * Creates a loginable 7-day demo account (role: demo_lead) listed in Üye Hesapları.
 */
import { withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { hitRateLimit } from './db.mjs'
import { hashPassword, signToken, validateSignupPassword, buildSessionCookie } from './auth.mjs'
import { ensureLegalStore, assertPackConsents, recordConsentBatch } from './legal.mjs'

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

function isLicenseExpired(licenseExpiry) {
  if (!licenseExpiry) return false
  const end = new Date(`${String(licenseExpiry).slice(0, 10)}T23:59:59.999`)
  if (Number.isNaN(end.getTime())) return false
  return end.getTime() < Date.now()
}

function sessionPayload(account, customer) {
  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId: account.customerId,
    tenantCode: account.tenantCode,
    role: account.role,
  })
  return {
    token,
    user: {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      companyName: account.companyName || customer?.company || '',
      phone: account.phone || customer?.phone || '',
      role: account.role || 'demo_lead',
      customerId: account.customerId,
      plan: customer?.plan || account.plan || 'Starter',
      status: 'trial',
      subscriptionStatus: customer?.subscriptionStatus || 'trialing',
      licenseExpiry: customer?.licenseExpiry || null,
      tenantCode: account.tenantCode,
      isDemo: true,
    },
  }
}

/**
 * Create or activate a demo membership → Üye Hesapları (/uyeler).
 * One email = one demo; admin extend renews days, no second signup.
 */
export function createDemoLead(store, body = {}) {
  if (!Array.isArray(store.customers)) store.customers = []
  if (!Array.isArray(store.accounts)) store.accounts = []
  if (!Array.isArray(store.demoRequests)) store.demoRequests = []
  if (!store.modules) store.modules = {}
  if (!Array.isArray(store.modules.customers)) store.modules.customers = []
  if (!Array.isArray(store.notifications)) store.notifications = []

  const fullName = String(body.name || body.fullName || body.contact || '').trim()
  const companyName =
    String(body.company || body.companyName || '').trim() || fullName || 'Demo Firma'
  const phone = String(body.phone || body.gsm || '').trim()
  const email = normalizeEmail(body.email)
  const taxNo = String(body.taxNo || '').trim()
  const taxOffice = String(body.taxOffice || '').trim()
  const address = String(body.address || '').trim()
  const city = String(body.city || '').trim()
  const district = String(body.district || '').trim()
  const companySize = String(body.size || body.companySize || '').trim()
  const message = String(body.message || '').trim()
  const password = String(body.password || '')
  const source = String(body.source || 'bachmain_demo').trim() || 'bachmain_demo'

  if (!fullName) {
    const err = new Error('Ad soyad gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!companyName) {
    const err = new Error('Firma ünvanı gerekli')
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
  if (!taxNo) {
    const err = new Error('TC veya vergi no gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!taxOffice) {
    const err = new Error('Vergi dairesi gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!address || !city || !district) {
    const err = new Error('Adres, il ve ilçe gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  const pwCheck = validateSignupPassword(password)
  if (!pwCheck.ok) {
    const err = new Error(pwCheck.message)
    err.code = 'WEAK_PASSWORD'
    throw err
  }

  const existingAccount = store.accounts.find((a) => a.email === email)
  if (existingAccount) {
    const isPaidMember = existingAccount.role !== 'demo_lead' && existingAccount.canLogin !== false
    if (isPaidMember || existingAccount.role === 'owner') {
      const err = new Error('Bu e-posta ile zaten üyelik var. Giriş yapabilirsiniz.')
      err.code = 'EMAIL_TAKEN'
      throw err
    }
    // Already activated demo (loginable) — no second demo signup
    if (existingAccount.role === 'demo_lead' && existingAccount.canLogin !== false) {
      const customer = store.customers.find((c) => c.id === existingAccount.customerId)
      const expired = isLicenseExpired(customer?.licenseExpiry || existingAccount.licenseExpiry)
      const err = new Error(
        expired
          ? 'Bu e-posta ile demo süreniz dolmuş. Yönetim süreyi uzatmadan yeni demo açılamaz.'
          : 'Bu e-posta ile zaten demo hesabınız var. Giriş yaparak devam edin.',
      )
      err.code = expired ? 'DEMO_EXPIRED' : 'DEMO_ALREADY_EXISTS'
      throw err
    }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const licenseExpiry = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const requestId = newId('demo')

  const demoRequest = {
    id: requestId,
    fullName,
    companyName,
    phone,
    email,
    taxNo,
    taxOffice,
    address,
    city,
    district,
    companySize,
    message,
    source,
    status: 'activated',
    createdAt: nowIso,
  }
  store.demoRequests.unshift(demoRequest)
  store.demoRequests = store.demoRequests.slice(0, 1000)

  let account = existingAccount || null
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
      gsm: phone,
      taxNo,
      taxOffice,
      address,
      city,
      district,
      status: 'trial',
      subscriptionStatus: 'trialing',
      plan: 'Starter',
      mrr: 0,
      users: 1,
      createdAt: nowIso.slice(0, 10),
      licenseExpiry,
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
      city: customer.city || '—',
      plan: customer.plan,
      mrr: '₺0',
      status: 'Demo Kullanıcısı',
      licenseExpiry: customer.licenseExpiry,
    })
  } else {
    customer.contact = fullName
    customer.company = companyName
    customer.phone = phone
    customer.gsm = phone
    customer.email = email
    customer.taxNo = taxNo
    customer.taxOffice = taxOffice
    customer.address = address
    customer.city = city
    customer.district = district
    customer.companySize = companySize || customer.companySize
    customer.demoMessage = message || customer.demoMessage
    customer.lastDemoAt = nowIso
    customer.status = 'trial'
    customer.subscriptionStatus = 'trialing'
    customer.licenseExpiry = licenseExpiry
    customer.source = 'demo_request'
    const moduleRow = store.modules.customers.find((c) => c.id === customer.id)
    if (moduleRow) {
      moduleRow.company = customer.company
      moduleRow.contact = customer.contact
      moduleRow.city = customer.city || '—'
      moduleRow.status = 'Demo Kullanıcısı'
      moduleRow.licenseExpiry = customer.licenseExpiry
    }
  }

  if (!account) {
    account = {
      id: newId('acc'),
      email,
      fullName,
      companyName,
      phone,
      gsm: phone,
      taxNo,
      taxOffice,
      address,
      city,
      district,
      passwordHash: hashPassword(password),
      role: 'demo_lead',
      canLogin: true,
      customerId: customer.id,
      tenantCode: customer.tenantCode,
      plan: 'Starter',
      source: 'demo_request',
      companySize,
      demoMessage: message,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastDemoAt: nowIso,
      onboardingCompleted: false,
      licenseExpiry,
    }
    store.accounts.unshift(account)
  } else {
    // Legacy lead-only row → activate once
    account.fullName = fullName
    account.companyName = companyName
    account.phone = phone
    account.gsm = phone
    account.taxNo = taxNo
    account.taxOffice = taxOffice
    account.address = address
    account.city = city
    account.district = district
    account.passwordHash = hashPassword(password)
    account.role = 'demo_lead'
    account.canLogin = true
    account.source = 'demo_request'
    account.companySize = companySize || account.companySize
    account.demoMessage = message || account.demoMessage
    account.lastDemoAt = nowIso
    account.lastLoginAt = nowIso
    account.licenseExpiry = licenseExpiry
    account.customerId = customer.id
    account.tenantCode = customer.tenantCode || account.tenantCode
  }

  demoRequest.customerId = customer.id
  demoRequest.accountId = account.id

  store.notifications.unshift({
    id: newId('ntf'),
    title: `Demo kullanıcı: ${companyName}`,
    body: `${fullName} · ${email} · ${phone} · 7 gün demo`,
    type: 'demo_request',
    createdAt: nowIso,
  })
  store.notifications = store.notifications.slice(0, 200)

  // Persist demo legal consents (server-validated)
  const consentItems = Array.isArray(body.consents) ? body.consents : []
  if (!consentItems.length && body.source === 'bachmain_demo') {
    const err = new Error('Demo sözleşmeleri kabul edilmeden devam edilemez')
    err.code = 'CONSENT_REQUIRED'
    throw err
  }
  if (consentItems.length) {
    ensureLegalStore(store)
    assertPackConsents(store, 'demo', consentItems)
    const ua = String(body.userAgent || '')
    recordConsentBatch(store, {
      accountId: account.id,
      customerId: customer.id,
      email,
      items: consentItems.map((i) => ({
        type: i.type,
        version: i.version,
        accepted: Boolean(i.accepted),
      })),
      context: 'demo',
      meta: {
        ip: body.ip || '—',
        userAgent: ua,
        browser: body.browser || '—',
        os: body.os || '—',
        device: body.device || '—',
        language: body.language || 'tr',
      },
    })
  }

  const session = sessionPayload(account, customer)
  return { request: demoRequest, customer, account, ...session }
}

export async function handleLeadsApi(req, res, path, body = {}) {
  const method = req.method

  if (method === 'POST' && (path === 'leads/demo' || path === 'demo-requests')) {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`demo:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla demo talebi. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      const result = await withStore((store) =>
        createDemoLead(store, {
          ...body,
          ip,
          userAgent: req.headers?.['user-agent'] || body.userAgent || '',
          language: body.language || req.headers?.['accept-language']?.split?.(',')[0] || 'tr',
        }),
      )
      sendJson(
        req,
        res,
        201,
        {
          ok: true,
          id: result.request.id,
          customerId: result.customer.id,
          accountId: result.account.id,
          token: result.token,
          user: result.user,
          licenseExpiry: result.customer.licenseExpiry,
          message: 'Demonuz oluşturuldu. Teşekkür ederiz!',
        },
        { cookie: buildSessionCookie(result.token) },
      )
      return true
    } catch (error) {
      const status =
        error.code === 'EMAIL_TAKEN' ||
        error.code === 'DEMO_ALREADY_EXISTS' ||
        error.code === 'DEMO_EXPIRED'
          ? 409
          : 400
      sendJson(req, res, status, {
        error: error.code || 'DEMO_FAILED',
        message: error.message,
      })
      return true
    }
  }

  return false
}
