import crypto from 'node:crypto'
import { newId } from './store.mjs'
import { entitlementPayloadForCustomer, seedBillingIfEmpty } from './subscriptionService.mjs'
import { mailConfig } from './mail/mailConfig.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'

const COOKIE_NAME = 'bachmain_session'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  return 'bachmain-dev-secret-change-me'
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlJson(obj) {
  return b64url(JSON.stringify(obj))
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  if (!stored || !String(stored).includes(':')) return false
  const [salt, hash] = String(stored).split(':')
  const next = crypto.scryptSync(String(password), salt, 64).toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(next, 'hex'))
  } catch {
    return false
  }
}

/** TR signup: min 8, upper, lower, digit, special */
export function validateSignupPassword(password) {
  const pw = String(password || '')
  if (pw.length < 8) {
    return { ok: false, message: 'Şifre en az 8 karakter olmalı' }
  }
  if (!/[a-z]/.test(pw)) {
    return { ok: false, message: 'Şifrede en az bir küçük harf olmalı' }
  }
  if (!/[A-Z]/.test(pw)) {
    return { ok: false, message: 'Şifrede en az bir büyük harf olmalı' }
  }
  if (!/[0-9]/.test(pw)) {
    return { ok: false, message: 'Şifrede en az bir rakam olmalı' }
  }
  if (!/[^A-Za-z0-9]/.test(pw)) {
    return { ok: false, message: 'Şifrede en az bir özel karakter olmalı (!@#$%…)' }
  }
  return { ok: true }
}

export function signToken(payload) {
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' })
  const body = b64urlJson({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })
  const data = `${header}.${body}`
  const sig = crypto.createHmac('sha256', jwtSecret()).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts
  const data = `${header}.${body}`
  const expected = crypto.createHmac('sha256', jwtSecret()).update(data).digest('base64url')
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return null
  try {
    if (!crypto.timingSafeEqual(left, right)) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const header = req.headers?.cookie || ''
  const out = {}
  String(header)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf('=')
      if (idx < 0) return
      const key = decodeURIComponent(part.slice(0, idx).trim())
      const value = decodeURIComponent(part.slice(idx + 1).trim())
      out[key] = value
    })
  return out
}

export function getBearerOrCookieToken(req) {
  const auth = req.headers?.authorization || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  const cookies = parseCookies(req)
  return cookies[COOKIE_NAME] || null
}

export function buildSessionCookie(token, { clear = false } = {}) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : encodeURIComponent(token || '')}`,
    'Path=/',
    clear ? 'Max-Age=0' : `Max-Age=${TOKEN_TTL_SECONDS}`,
    'HttpOnly',
    secure ? 'Secure' : '',
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ].filter(Boolean)
  if (secure) parts.push('Domain=.bachmain.com')
  return parts.join('; ')
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function remainingTrialDays(licenseExpiry) {
  if (!licenseExpiry) return null
  const end = new Date(licenseExpiry)
  if (Number.isNaN(end.getTime())) return null
  end.setHours(23, 59, 59, 999)
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function publicUser(account, customer, entitlements = null) {
  const licenseExpiry = entitlements?.licenseExpiry || customer?.licenseExpiry || null
  const status =
    entitlements?.subscriptionStatus === 'expired'
      ? 'expired'
      : entitlements?.subscriptionStatus === 'trialing'
        ? 'trial'
        : entitlements?.subscriptionStatus === 'grace'
          ? 'active'
          : customer?.status || 'trial'
  const remaining =
    typeof entitlements?.remainingDays === 'number'
      ? entitlements.remainingDays
      : status === 'trial' || status === 'trialing'
        ? remainingTrialDays(licenseExpiry)
        : (entitlements?.remainingDays ?? remainingTrialDays(licenseExpiry))

  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    companyName: account.companyName || customer?.company || '',
    phone: account.phone || customer?.phone || '',
    role: account.role || 'owner',
    customerId: account.customerId,
    plan: entitlements?.plan || customer?.plan || account.plan || 'Starter',
    planCode: entitlements?.planCode || customer?.planCode || null,
    status,
    subscriptionStatus: entitlements?.subscriptionStatus || customer?.subscriptionStatus || status,
    licenseExpiry,
    trialEnd: entitlements?.trialEnd || licenseExpiry,
    remainingDays: remaining,
    remainingHours: entitlements?.remainingHours ?? null,
    remainingMinutes: entitlements?.remainingMinutes ?? null,
    graceUntil: entitlements?.graceUntil || customer?.graceUntil || null,
    entitlements: entitlements?.entitlements || customer?.entitlements || null,
    limits: entitlements?.limits || customer?.limits || null,
    onboardingCompleted: account.onboardingCompleted !== false,
    tenantCode: account.tenantCode,
  }
}

function enrichUser(store, account, customer) {
  try {
    seedBillingIfEmpty(store)
    if (customer?.id) {
      return publicUser(account, customer, entitlementPayloadForCustomer(store, customer.id))
    }
  } catch {
    // fallback below
  }
  return publicUser(account, customer)
}

function ensureCollections(store) {
  if (!Array.isArray(store.accounts)) store.accounts = []
  if (!Array.isArray(store.customers)) store.customers = []
  if (!Array.isArray(store.emailTokens)) store.emailTokens = []
  if (!store.modules) store.modules = {}
  if (!Array.isArray(store.modules.customers)) store.modules.customers = []
  if (!store.customerExtras) store.customerExtras = {}
  if (!Array.isArray(store.customerExtras.loginHistory)) store.customerExtras.loginHistory = []
}

function makeTenantCode(store) {
  let code = String(Math.floor(10000 + Math.random() * 90000))
  let tries = 0
  while (store.accounts.some((a) => a.tenantCode === code) && tries < 40) {
    code = String(Math.floor(10000 + Math.random() * 90000))
    tries += 1
  }
  return code
}

export async function registerAccount(store, body) {
  ensureCollections(store)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const fullName = String(body.fullName || body.contact || '').trim()
  const companyName = String(body.companyName || body.company || '').trim()
  const phone = String(body.phone || '').trim()
  const gsm = String(body.gsm || body.mobile || '').trim()
  const taxNo = String(body.taxNo || body.vkn || '').replace(/\D/g, '')
  const taxOffice = String(body.taxOffice || '').trim()
  const address = String(body.address || '').trim()
  const city = String(body.city || '').trim()
  const district = String(body.district || '').trim()
  const companySize = String(body.companySize || body.size || '').trim()
  const sourceTag = String(body.source || 'self_signup').trim() || 'self_signup'

  if (!email || !email.includes('@')) {
    const err = new Error('Geçerli bir e-posta girin')
    err.code = 'INVALID_EMAIL'
    throw err
  }
  const requirePayment =
    body.requirePayment === true ||
    body.source === 'bachmain_register_page' ||
    body.source === 'bachmain_register_checkout'
  const passwordCheck = validateSignupPassword(password)
  if (!passwordCheck.ok) {
    const err = new Error(passwordCheck.message)
    err.code = 'WEAK_PASSWORD'
    throw err
  }
  if (!fullName || !companyName) {
    const err = new Error('Ad soyad ve firma adı zorunlu')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!taxNo || taxNo.length < 10 || taxNo.length > 11) {
    const err = new Error('Vergi / T.C. kimlik no 10 veya 11 haneli olmalı')
    err.code = 'INVALID_TAX_NO'
    throw err
  }
  if (!taxOffice) {
    const err = new Error('Vergi dairesi zorunlu')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!address || !city || !district) {
    const err = new Error('Adres, il ve ilçe zorunlu')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (!(gsm || phone)) {
    const err = new Error('Telefon zorunlu')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (
    store.accounts.some((a) => a.email === email && a.canLogin !== false && a.role !== 'demo_lead')
  ) {
    const err = new Error('Bu e-posta ile zaten üyelik var')
    err.code = 'EMAIL_TAKEN'
    throw err
  }

  const existingLead = store.accounts.find(
    (a) => a.email === email && (a.role === 'demo_lead' || a.canLogin === false),
  )
  const now = new Date()
  const licenseExpiry = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const customerId = existingLead?.customerId || newId('c')
  const accountId = existingLead?.id || newId('acc')
  const tenantCode = existingLead?.tenantCode || makeTenantCode(store)
  const primaryPhone = gsm || phone

  const account = {
    id: accountId,
    email,
    fullName,
    companyName,
    phone: primaryPhone,
    gsm: gsm || primaryPhone,
    landline: phone,
    taxNo,
    taxOffice,
    address,
    city,
    district,
    companySize,
    passwordHash: hashPassword(password),
    role: 'owner',
    canLogin: !requirePayment,
    customerId,
    tenantCode,
    plan:
      body.plan === 'Pro' || body.plan === 'Enterprise' || body.plan === 'Starter'
        ? body.plan
        : 'Starter',
    onboardingCompleted: false,
    createdAt: existingLead?.createdAt || now.toISOString(),
    lastLoginAt: requirePayment ? null : now.toISOString(),
    source: existingLead
      ? 'demo_converted'
      : sourceTag === 'bachmain_signup_modal'
        ? 'self_signup'
        : sourceTag || 'self_signup',
    paymentPending: requirePayment,
  }

  let customer = store.customers.find((c) => c.id === customerId)
  if (!customer) {
    customer = {
      id: customerId,
      company: companyName,
      contact: fullName,
      email,
      phone: primaryPhone,
      gsm: gsm || primaryPhone,
      landline: phone,
      taxNo: taxNo || '',
      taxOffice,
      address,
      city: city || '',
      district,
      companySize,
      status: requirePayment ? 'pending_payment' : 'trial',
      plan: account.plan,
      mrr: 0,
      users: 1,
      createdAt: now.toISOString().slice(0, 10),
      licenseExpiry: requirePayment ? null : licenseExpiry,
      balance: 0,
      source: existingLead ? 'demo_converted' : 'self_signup',
      tenantCode,
      subscriptionStatus: requirePayment ? 'pending_payment' : 'trialing',
    }
    store.customers.unshift(customer)
  } else {
    customer.company = companyName
    customer.contact = fullName
    customer.email = email
    customer.phone = primaryPhone || customer.phone
    customer.gsm = gsm || customer.gsm || customer.phone
    customer.landline = phone || customer.landline
    if (taxNo) customer.taxNo = taxNo
    if (taxOffice) customer.taxOffice = taxOffice
    if (address) customer.address = address
    if (city) customer.city = city
    if (district) customer.district = district
    if (companySize) customer.companySize = companySize
    customer.status = requirePayment ? 'pending_payment' : 'trial'
    customer.plan = account.plan
    customer.licenseExpiry = requirePayment ? null : licenseExpiry
    customer.subscriptionStatus = requirePayment ? 'pending_payment' : 'trialing'
    customer.source = existingLead ? 'demo_converted' : customer.source || 'self_signup'
    customer.tenantCode = tenantCode
  }

  if (existingLead) {
    Object.assign(existingLead, account)
  } else {
    store.accounts.unshift(account)
  }

  const moduleIdx = store.modules.customers.findIndex((c) => c.id === customer.id)
  const moduleRow = {
    id: customer.id,
    company: customer.company,
    contact: customer.contact,
    email: customer.email,
    phone: customer.phone,
    taxNo: customer.taxNo || '—',
    city: customer.city || '—',
    plan: customer.plan,
    mrr: '₺0',
    status: requirePayment ? 'Ödeme Bekliyor' : 'Deneme',
    source: 'Web Üyelik',
    licenseExpiry: customer.licenseExpiry,
  }
  if (moduleIdx >= 0) store.modules.customers[moduleIdx] = moduleRow
  else store.modules.customers.unshift(moduleRow)

  const verifyToken = crypto.randomBytes(32).toString('hex')
  store.emailTokens.unshift({
    id: newId('etok'),
    purpose: 'verify',
    token: verifyToken,
    accountId: account.id,
    email: account.email,
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    createdAt: now.toISOString(),
  })
  store.emailTokens = store.emailTokens.slice(0, 2000)
  account.emailVerifiedAt = null

  const cfg = mailConfig()
  const verifyUrl = `${cfg.appUrl}/eposta-dogrula?token=${encodeURIComponent(verifyToken)}`
  await sendTemplateMail(store, {
    to: account.email,
    template: 'welcome',
    type: 'welcome',
    customerId,
    accountId: account.id,
    data: { name: fullName, company: companyName, plan: account.plan, appUrl: cfg.appUrl },
  })
  await sendTemplateMail(store, {
    to: account.email,
    template: 'email_verification',
    type: 'email_verification',
    customerId,
    accountId: account.id,
    data: { name: fullName, verifyUrl },
  })

  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId,
    tenantCode,
    role: account.role,
  })

  return {
    token,
    user: enrichUser(store, account, customer),
    customer,
  }
}

export async function loginAccount(store, body) {
  ensureCollections(store)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const account = store.accounts.find((a) => a.email === email)
  if (!account || account.role === 'demo_lead') {
    const err = new Error(
      account?.role === 'demo_lead'
        ? 'Bu e-posta yalnızca demo talebi olarak kayıtlı. Lütfen üye olun veya uygulama üzerinden kayıt olun.'
        : 'E-posta veya şifre hatalı',
    )
    err.code = account?.role === 'demo_lead' ? 'DEMO_LEAD_ONLY' : 'INVALID_CREDENTIALS'
    throw err
  }
  if (account.canLogin === false || account.paymentPending) {
    const err = new Error(
      'Ödemeniz henüz onaylanmadı. Havale/EFT yaptıysanız onay sonrası e-posta ile bilgilendirileceksiniz.',
    )
    err.code = 'PAYMENT_PENDING'
    throw err
  }
  if (!verifyPassword(password, account.passwordHash)) {
    const err = new Error('E-posta veya şifre hatalı')
    err.code = 'INVALID_CREDENTIALS'
    throw err
  }
  account.lastLoginAt = new Date().toISOString()
  const customer = store.customers.find((c) => c.id === account.customerId) || null
  if (customer) {
    customer.lastLoginAt = account.lastLoginAt
    if (!customer.source) customer.source = 'self_signup'
  }
  store.customerExtras.loginHistory.unshift({
    id: newId('lh'),
    user: account.fullName,
    email: account.email,
    customerId: account.customerId,
    ip: body.ip || '—',
    device: body.userAgent || '—',
    date: account.lastLoginAt,
  })
  store.customerExtras.loginHistory = store.customerExtras.loginHistory.slice(0, 200)

  await sendTemplateMail(store, {
    to: account.email,
    template: 'new_login',
    type: 'new_login',
    customerId: account.customerId,
    accountId: account.id,
    data: {
      name: account.fullName,
      at: account.lastLoginAt,
      userAgent: body.userAgent || '—',
      ip: body.ip || '—',
    },
    immediate: true,
    meta: { quiet: true },
  })

  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId: account.customerId,
    tenantCode: account.tenantCode,
    role: account.role,
  })

  return {
    token,
    user: enrichUser(store, account, customer),
    customer,
  }
}

export async function requestPasswordReset(store, emailRaw) {
  ensureCollections(store)
  const email = normalizeEmail(emailRaw)
  const account = store.accounts.find(
    (a) => a.email === email && a.canLogin !== false && a.role !== 'demo_lead',
  )
  // Always succeed to avoid account enumeration
  if (!account) return { ok: true }

  const token = crypto.randomBytes(32).toString('hex')
  store.emailTokens = store.emailTokens.filter(
    (t) => !(t.accountId === account.id && t.purpose === 'reset'),
  )
  store.emailTokens.unshift({
    id: newId('etok'),
    purpose: 'reset',
    token,
    accountId: account.id,
    email: account.email,
    expiresAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  })
  store.emailTokens = store.emailTokens.slice(0, 2000)

  const cfg = mailConfig()
  const resetUrl = `${cfg.appUrl}/sifre-sifirla?token=${encodeURIComponent(token)}`
  await sendTemplateMail(store, {
    to: account.email,
    template: 'password_reset',
    type: 'password_reset',
    customerId: account.customerId,
    accountId: account.id,
    data: { name: account.fullName, resetUrl },
  })
  return { ok: true }
}

export async function resetPasswordWithToken(store, { token, password }) {
  ensureCollections(store)
  const row = store.emailTokens.find((t) => t.purpose === 'reset' && t.token === token)
  if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
    const err = new Error('Geçersiz veya süresi dolmuş bağlantı')
    err.code = 'INVALID_TOKEN'
    throw err
  }
  if (String(password || '').length < 6) {
    const err = new Error('Şifre en az 6 karakter olmalı')
    err.code = 'WEAK_PASSWORD'
    throw err
  }
  const account = store.accounts.find((a) => a.id === row.accountId)
  if (!account) {
    const err = new Error('Hesap bulunamadı')
    err.code = 'NOT_FOUND'
    throw err
  }
  account.passwordHash = hashPassword(password)
  account.passwordChangedAt = new Date().toISOString()
  store.emailTokens = store.emailTokens.filter((t) => t.id !== row.id)

  await sendTemplateMail(store, {
    to: account.email,
    template: 'password_changed',
    type: 'password_changed',
    customerId: account.customerId,
    accountId: account.id,
    data: { name: account.fullName },
  })
  return { ok: true }
}

export async function verifyEmailWithToken(store, token) {
  ensureCollections(store)
  const row = store.emailTokens.find((t) => t.purpose === 'verify' && t.token === token)
  if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
    const err = new Error('Geçersiz veya süresi dolmuş doğrulama bağlantısı')
    err.code = 'INVALID_TOKEN'
    throw err
  }
  const account = store.accounts.find((a) => a.id === row.accountId)
  if (!account) {
    const err = new Error('Hesap bulunamadı')
    err.code = 'NOT_FOUND'
    throw err
  }
  account.emailVerifiedAt = new Date().toISOString()
  store.emailTokens = store.emailTokens.filter((t) => t.id !== row.id)
  return { ok: true, email: account.email }
}

export function completeOnboarding(store, accountId) {
  ensureCollections(store)
  const account = store.accounts.find((a) => a.id === accountId)
  if (!account) {
    const err = new Error('Hesap bulunamadı')
    err.code = 'NOT_FOUND'
    throw err
  }
  account.onboardingCompleted = true
  account.onboardingCompletedAt = new Date().toISOString()
  const customer = store.customers.find((c) => c.id === account.customerId) || null
  return { user: enrichUser(store, account, customer) }
}

export function getAccountFromToken(store, token) {
  ensureCollections(store)
  const payload = verifyToken(token)
  if (!payload?.sub) return null
  const account = store.accounts.find((a) => a.id === payload.sub)
  if (!account) return null
  const customer = store.customers.find((c) => c.id === account.customerId) || null
  return { account, customer, user: enrichUser(store, account, customer), payload }
}

export { COOKIE_NAME, TOKEN_TTL_SECONDS }
