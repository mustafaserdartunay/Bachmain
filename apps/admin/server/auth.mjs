import crypto from 'node:crypto'
import { newId } from './store.mjs'

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

function publicUser(account, customer) {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    companyName: account.companyName || customer?.company || '',
    phone: account.phone || customer?.phone || '',
    role: account.role || 'owner',
    customerId: account.customerId,
    plan: customer?.plan || account.plan || 'Starter',
    status: customer?.status || 'trial',
    licenseExpiry: customer?.licenseExpiry || null,
    tenantCode: account.tenantCode,
  }
}

function ensureCollections(store) {
  if (!Array.isArray(store.accounts)) store.accounts = []
  if (!Array.isArray(store.customers)) store.customers = []
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

  if (!email || !email.includes('@')) {
    const err = new Error('Geçerli bir e-posta girin')
    err.code = 'INVALID_EMAIL'
    throw err
  }
  if (password.length < 6) {
    const err = new Error('Şifre en az 6 karakter olmalı')
    err.code = 'WEAK_PASSWORD'
    throw err
  }
  if (!fullName || !companyName) {
    const err = new Error('Ad soyad ve firma adı zorunlu')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  if (store.accounts.some((a) => a.email === email && a.canLogin !== false && a.role !== 'demo_lead')) {
    const err = new Error('Bu e-posta ile zaten üyelik var')
    err.code = 'EMAIL_TAKEN'
    throw err
  }

  const existingLead = store.accounts.find((a) => a.email === email && (a.role === 'demo_lead' || a.canLogin === false))
  const now = new Date()
  const licenseExpiry = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
  const customerId = existingLead?.customerId || newId('c')
  const accountId = existingLead?.id || newId('acc')
  const tenantCode = existingLead?.tenantCode || makeTenantCode(store)

  const account = {
    id: accountId,
    email,
    fullName,
    companyName,
    phone,
    passwordHash: hashPassword(password),
    role: 'owner',
    canLogin: true,
    customerId,
    tenantCode,
    plan: body.plan === 'Pro' || body.plan === 'Enterprise' || body.plan === 'Starter' ? body.plan : 'Starter',
    createdAt: existingLead?.createdAt || now.toISOString(),
    lastLoginAt: now.toISOString(),
    source: existingLead ? 'demo_converted' : 'self_signup',
  }

  let customer = store.customers.find((c) => c.id === customerId)
  if (!customer) {
    customer = {
      id: customerId,
      company: companyName,
      contact: fullName,
      email,
      phone,
      taxNo: '',
      city: body.city || '',
      status: 'trial',
      plan: account.plan,
      mrr: 0,
      users: 1,
      createdAt: now.toISOString().slice(0, 10),
      licenseExpiry,
      balance: 0,
      source: existingLead ? 'demo_converted' : 'self_signup',
      tenantCode,
    }
    store.customers.unshift(customer)
  } else {
    customer.company = companyName
    customer.contact = fullName
    customer.email = email
    customer.phone = phone || customer.phone
    customer.status = 'trial'
    customer.plan = account.plan
    customer.licenseExpiry = licenseExpiry
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
    city: customer.city || '—',
    plan: customer.plan,
    mrr: '₺0',
    status: 'Deneme',
    licenseExpiry: customer.licenseExpiry,
  }
  if (moduleIdx >= 0) store.modules.customers[moduleIdx] = moduleRow
  else store.modules.customers.unshift(moduleRow)

  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId,
    tenantCode,
    role: account.role,
  })

  return {
    token,
    user: publicUser(account, customer),
    customer,
  }
}

export async function loginAccount(store, body) {
  ensureCollections(store)
  const email = normalizeEmail(body.email)
  const password = String(body.password || '')
  const account = store.accounts.find((a) => a.email === email)
  if (!account || account.canLogin === false || account.role === 'demo_lead') {
    const err = new Error(
      account?.role === 'demo_lead'
        ? 'Bu e-posta yalnızca demo talebi olarak kayıtlı. Lütfen üye olun veya uygulama üzerinden kayıt olun.'
        : 'E-posta veya şifre hatalı',
    )
    err.code = account?.role === 'demo_lead' ? 'DEMO_LEAD_ONLY' : 'INVALID_CREDENTIALS'
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

  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId: account.customerId,
    tenantCode: account.tenantCode,
    role: account.role,
  })

  return {
    token,
    user: publicUser(account, customer),
    customer,
  }
}

export function getAccountFromToken(store, token) {
  ensureCollections(store)
  const payload = verifyToken(token)
  if (!payload?.sub) return null
  const account = store.accounts.find((a) => a.id === payload.sub)
  if (!account) return null
  const customer = store.customers.find((c) => c.id === account.customerId) || null
  return { account, customer, user: publicUser(account, customer), payload }
}

export { COOKIE_NAME, TOKEN_TTL_SECONDS }
