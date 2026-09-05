/**
 * Public lead capture from bachmain.com (demo form).
 * Creates a loginable 7-day demo account (role: demo_lead) listed in Üye Hesapları.
 */
import { withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { hitRateLimit } from './db.mjs'
import {
  hashPassword,
  signToken,
  validateSignupPassword,
  buildSessionCookie,
  requestedProduct,
  findAccountByEmailProduct,
  accountProduct,
  isLicenseExpired,
} from './auth.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'
import { ensureLegalStore, assertPackConsents, recordConsentBatch } from './legal.mjs'
import { notifyStaffAdmin, rowsFromFields } from './staffNotify.mjs'
import { MAIL_BRAND } from './mail/mailConfig.mjs'

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

function sessionPayload(account, customer) {
  const token = signToken({
    sub: account.id,
    email: account.email,
    customerId: account.customerId,
    tenantCode: account.tenantCode,
    role: account.role,
    product: accountProduct(account),
  })
  const product = accountProduct(account)
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
      plan: customer?.plan || account.plan || (product === 'studio' ? 'Studio' : 'Starter'),
      status: 'trial',
      subscriptionStatus: customer?.subscriptionStatus || 'trialing',
      licenseExpiry: customer?.licenseExpiry || null,
      tenantCode: account.tenantCode,
      isDemo: true,
      product,
      products: [product],
      hasStudioAccess: product === 'studio',
      linkedStudio:
        product === 'studio'
          ? { status: 'trial', expiresAt: customer?.licenseExpiry || null, isDemo: true }
          : { status: 'none', expiresAt: null, isDemo: false },
      onboardingCompleted: account.onboardingCompleted !== false,
      taxNo: account.taxNo || customer?.taxNo || '',
      taxOffice: account.taxOffice || customer?.taxOffice || '',
      address: account.address || customer?.address || '',
      city: account.city || customer?.city || '',
      district: account.district || customer?.district || '',
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
  const companyName = String(body.company || body.companyName || '').trim()
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
  const product = requestedProduct(body)
  const isStudio = product === 'studio'
  const source = String(body.source || '').trim() || (isStudio ? 'studio_demo' : 'bachmain_demo')

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
  if (!password) {
    const err = new Error('Şifre gerekli')
    err.code = 'MISSING_FIELDS'
    throw err
  }
  const pwCheck = validateSignupPassword(password)
  if (!pwCheck.ok) {
    const err = new Error(pwCheck.message)
    err.code = 'WEAK_PASSWORD'
    throw err
  }

  const existingAccount = findAccountByEmailProduct(store, email, product)
  if (existingAccount) {
    const isPaidMember = existingAccount.role !== 'demo_lead' && existingAccount.canLogin !== false
    if (isPaidMember || existingAccount.role === 'owner') {
      const err = new Error(
        isStudio
          ? 'Bu e-posta ile zaten Studio üyeliği var. Studio girişinden devam edin.'
          : 'Bu e-posta ile zaten üyelik var. Giriş yapabilirsiniz.',
      )
      err.code = 'EMAIL_TAKEN'
      throw err
    }
    if (existingAccount.role === 'demo_lead' && existingAccount.canLogin !== false) {
      const customer = store.customers.find((c) => c.id === existingAccount.customerId)
      const expired = isLicenseExpired(customer?.licenseExpiry || existingAccount.licenseExpiry)
      const err = new Error(
        expired
          ? isStudio
            ? 'Bu e-posta ile Studio demo süreniz dolmuş. Yönetim uzatmadan yeni Studio demosu açılamaz.'
            : 'Bu e-posta ile demo süreniz dolmuş. Yönetim süreyi uzatmadan yeni demo açılamaz.'
          : isStudio
            ? 'Bu e-posta ile zaten Studio demo hesabınız var. Studio girişinden devam edin.'
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
    product,
    status: 'activated',
    createdAt: nowIso,
  }
  store.demoRequests.unshift(demoRequest)
  store.demoRequests = store.demoRequests.slice(0, 1000)

  let account = existingAccount || null
  let customer = account ? store.customers.find((c) => c.id === account.customerId) : null

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
      plan: isStudio ? 'Studio' : 'Starter',
      planCode: isStudio ? 'studio' : undefined,
      product,
      products: [product],
      mrr: 0,
      users: 1,
      createdAt: nowIso.slice(0, 10),
      licenseExpiry,
      balance: 0,
      source: isStudio ? 'studio_demo' : 'demo_request',
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
    customer.source = isStudio ? 'studio_demo' : 'demo_request'
    customer.product = product
    customer.products = [product]
    if (isStudio) {
      customer.plan = 'Studio'
      customer.planCode = 'studio'
    }
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
      plan: isStudio ? 'Studio' : 'Starter',
      product,
      products: [product],
      source: isStudio ? 'studio_demo' : 'demo_request',
      companySize,
      demoMessage: message,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      lastDemoAt: nowIso,
      onboardingCompleted: true,
      onboardingCompletedAt: nowIso,
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
    account.source = isStudio ? 'studio_demo' : 'demo_request'
    account.product = product
    account.products = [product]
    account.plan = isStudio ? 'Studio' : account.plan || 'Starter'
    account.companySize = companySize || account.companySize
    account.demoMessage = message || account.demoMessage
    account.lastDemoAt = nowIso
    account.lastLoginAt = nowIso
    account.licenseExpiry = licenseExpiry
    account.customerId = customer.id
    account.tenantCode = customer.tenantCode || account.tenantCode
    account.onboardingCompleted = true
    account.onboardingCompletedAt = nowIso
  }

  demoRequest.customerId = customer.id
  demoRequest.accountId = account.id

  // Demo no longer requires contracts; purchase flow records consents instead.
  const consentItems = Array.isArray(body.consents) ? body.consents : []
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
  return {
    request: demoRequest,
    customer,
    account,
    staffAlertRows: rowsFromFields({
      'Ad Soyad': fullName,
      Firma: companyName,
      Eposta: email,
      Telefon: phone,
      'Vergi / TC No': taxNo,
      'Vergi Dairesi': taxOffice,
      Adres: address,
      İl: city,
      İlçe: district,
      'Firma Ölçeği': companySize || undefined,
      Mesaj: message || undefined,
      Kaynak: source,
      'Demo Bitiş': licenseExpiry,
      'Hesap ID': account.id,
      'Müşteri ID': customer.id,
    }),
    ...session,
  }
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
      const result = await withStore(async (store) => {
        const created = createDemoLead(store, {
          ...body,
          ip,
          origin: body.origin || req.headers?.origin || '',
          referer: body.referer || req.headers?.referer || '',
          userAgent: req.headers?.['user-agent'] || body.userAgent || '',
          language: body.language || req.headers?.['accept-language']?.split?.(',')[0] || 'tr',
        })
        const product = accountProduct(created.account)
        try {
          await sendTemplateMail(store, {
            to: created.account.email,
            template: 'welcome',
            type: 'welcome',
            customerId: created.customer.id,
            accountId: created.account.id,
            data: {
              name: created.account.fullName,
              company: created.customer.company,
              plan: created.account.plan,
              licenseExpiry: created.customer.licenseExpiry,
              appUrl: product === 'studio' ? MAIL_BRAND.studioUrl() : MAIL_BRAND.appUrl(),
              product: product === 'studio' ? 'studio' : undefined,
            },
          })
        } catch (mailError) {
          console.warn('[bachmain] demo welcome mail failed', mailError?.message || mailError)
        }
        await notifyStaffAdmin(store, {
          type: 'demo_request',
          eventLabel: product === 'studio' ? 'Yeni Studio demo' : 'Yeni demo kullanıcı',
          title: `${product === 'studio' ? 'Studio demo' : 'Yeni demo'}: ${created.customer.company}`,
          body: `${created.account.fullName} · ${created.account.email} · 7 gün ${product === 'studio' ? 'Studio ' : ''}demo`,
          rows: created.staffAlertRows,
          customerId: created.customer.id,
          accountId: created.account.id,
          link: `${MAIL_BRAND.adminUrl()}/uyeler/${created.account.id}`,
          ctaLabel: 'Üye hesabını aç',
          intro:
            product === 'studio'
              ? 'Studio tanıtım sayfasından ayrı bir Studio demo hesabı oluşturuldu. Uygulama üyeliği ile karıştırılmamalıdır.'
              : 'bachmain.com üzerinden yeni bir demo hesabı oluşturuldu. Tablodaki bilgiler yalnızca bu formun kendi verileridir.',
          meta: { source: created.account.source, requestId: created.request.id, product },
        })
        return created
      })
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
