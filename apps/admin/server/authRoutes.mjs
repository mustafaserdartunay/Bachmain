import crypto from 'node:crypto'
import {
  registerAccount,
  loginAccount,
  getAccountFromToken,
  getBearerOrCookieToken,
  buildSessionCookie,
  completeOnboarding,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
  listAccessibleCompanies,
  switchCompanySession,
  listCompanyUsers,
  setCompanyUserAccess,
} from './auth.mjs'
import { loadStore, withStore } from './store.mjs'
import { hitRateLimit } from './db.mjs'
import { loginStaff, getStaffSession, buildStaffCookie } from './staffAuth.mjs'
import { completeEmailChange } from './emailChange.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'

function hashB2bToken(token) {
  return crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex')
}

async function withLegalUser(_store, user, _account) {
  if (!user) return user
  // App login no longer gates on outstanding contracts — only purchase flow collects them.
  user.legal = { mustAccept: false, outstanding: [], lawyerNotice: '' }
  return user
}

function allowedOrigins() {
  const fromEnv = String(process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const defaults = [
    'https://uygulama.bachmain.com',
    'https://app.bachmain.com',
    'https://crm.bachmain.com',
    'https://bachmain.com',
    'https://www.bachmain.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
  return [...new Set([...fromEnv, ...defaults])]
}

export function applyCors(req, res) {
  const origin = req.headers?.origin || ''
  const allowed = allowedOrigins()
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin) {
    // Same-origin / server-to-server — no browser CORS needed
  }
  // Do not reflect a default origin for disallowed browser origins.
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function sendJson(req, res, status, data, { cookie } = {}) {
  applyCors(req, res)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (cookie) res.setHeader('Set-Cookie', cookie)
  res.end(JSON.stringify(data))
}

/**
 * Handle /api/auth/* paths. Returns true if handled.
 * @param {string} path - without leading api/, e.g. "auth/register"
 */
export async function handleAuthApi(req, res, path, body = {}) {
  const method = req.method

  if (method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    res.end()
    return true
  }

  if (method === 'POST' && path === 'auth/register') {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`register:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla kayıt denemesi. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      const result = await withStore((store) => registerAccount(store, body))
      const account = result.user
        ? { id: result.user.id, role: result.user.role, customerId: result.user.customerId }
        : null
      // Prefer full account from store for outstanding check
      const store = await loadStore()
      const fullAccount = store.accounts?.find((a) => a.id === result.user?.id)
      await withLegalUser(store, result.user, fullAccount || account)
      sendJson(
        req,
        res,
        201,
        {
          ok: true,
          user: result.user,
          token: result.token,
        },
        { cookie: buildSessionCookie(result.token) },
      )
      return true
    } catch (error) {
      const status = error.code === 'EMAIL_TAKEN' ? 409 : 400
      sendJson(req, res, status, { error: error.code || 'REGISTER_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/login') {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`login:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla giriş denemesi. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      let accountRef = null
      const result = await withStore((store) => {
        const out = loginAccount(store, {
          ...body,
          userAgent: req.headers?.['user-agent'] || '',
          ip,
        })
        return out
      })
      const store = await loadStore()
      accountRef = store.accounts?.find((a) => a.id === result.user?.id)
      await withLegalUser(store, result.user, accountRef)
      sendJson(
        req,
        res,
        200,
        {
          ok: true,
          user: result.user,
          token: result.token,
          legal: result.user?.legal || null,
        },
        { cookie: buildSessionCookie(result.token) },
      )
      return true
    } catch (error) {
      sendJson(req, res, 401, { error: error.code || 'LOGIN_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'POST' && path === 'staff/login') {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`staff-login:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, { error: 'RATE_LIMITED', message: 'Çok fazla giriş denemesi.' })
      return true
    }
    try {
      const result = await loginStaff(body)
      sendJson(
        req,
        res,
        200,
        { ok: true, user: result.user, token: result.token },
        {
          cookie: buildStaffCookie(result.token),
        },
      )
      return true
    } catch (error) {
      sendJson(req, res, 401, { error: error.code || 'LOGIN_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'GET' && path === 'staff/me') {
    const session = getStaffSession(req)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Personel oturumu yok' })
      return true
    }
    sendJson(req, res, 200, { ok: true, user: session.user })
    return true
  }

  if (method === 'POST' && path === 'staff/logout') {
    sendJson(req, res, 200, { ok: true }, { cookie: buildStaffCookie('', { clear: true }) })
    return true
  }

  if (method === 'GET' && path === 'auth/me') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = getAccountFromToken(store, token)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Oturum bulunamadı' })
      return true
    }
    await withLegalUser(store, session.user, session.account)
    sendJson(req, res, 200, { ok: true, user: session.user, legal: session.user?.legal || null })
    return true
  }

  // Üye hesabına özel bildirimler (CRM header Bildirimler)
  // Sadece bu hesabın / aktif firmanın membership bildirimleri — staff/demo/global yok.
  if (method === 'GET' && path === 'auth/notifications') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = getAccountFromToken(store, token)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Oturum bulunamadı' })
      return true
    }
    const accountId = session.account?.id || session.user?.id || null
    // Aktif şirket (company switch) öncelikli — primary account.customerId değil
    const customerId = session.user?.customerId || session.account?.customerId || null
    const items = (store.notifications || [])
      .filter((n) => {
        if (!n || n.audience === 'staff') return false
        const allowedType = n.type === 'membership' || n.type === 'support'
        if (!allowedType) return false
        // Firma skopu zorunlu: başka firmanın satırı asla dönmez
        if (n.customerId) {
          return Boolean(customerId) && n.customerId === customerId
        }
        // customerId yoksa yalnızca aynı accountId
        if (accountId && n.accountId === accountId && !n.customerId) {
          return true
        }
        return false
      })
      .slice(0, 50)
      .map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        kind: n.kind || n.type || 'membership',
        type: n.type || 'membership',
        endDate: n.endDate || null,
        daysAdded: n.daysAdded || null,
        link: n.link || (n.type === 'support' ? '/hesap' : '/hesap/lisans'),
        createdAt: n.createdAt,
        sortAt: n.createdAt,
      }))
    sendJson(req, res, 200, { ok: true, items })
    return true
  }

  if (method === 'GET' && path.startsWith('b2b/portal/')) {
    const token = decodeURIComponent(path.slice('b2b/portal/'.length))
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`b2b-portal:${ip}`, { limit: 120, windowMs: 15 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla panel isteği. Lütfen kısa süre sonra tekrar deneyin.',
      })
      return true
    }
    const store = await loadStore()
    const portal = (store.b2bPortals || []).find(
      (row) => row.enabled !== false && row.tokenHash === hashB2bToken(token),
    )
    if (!portal) {
      sendJson(req, res, 404, {
        error: 'PORTAL_NOT_FOUND',
        message: 'B2B panel bağlantısı geçersiz veya erişim kapatılmış.',
      })
      return true
    }
    sendJson(req, res, 200, {
      ok: true,
      snapshot: portal.snapshot,
      publishedAt: portal.updatedAt,
    })
    return true
  }

  if (method === 'POST' && path === 'auth/b2b/portal') {
    const token = getBearerOrCookieToken(req)
    try {
      const result = await withStore(async (store) => {
        const session = getAccountFromToken(store, token)
        if (!session) {
          const err = new Error('Oturum bulunamadı')
          err.code = 'UNAUTHORIZED'
          throw err
        }
        if (!['owner', 'editor'].includes(session.user.accessLevel)) {
          const err = new Error('B2B erişimi oluşturma yetkiniz yok')
          err.code = 'FORBIDDEN'
          throw err
        }

        const accessToken = String(body.accessToken || '').trim()
        const customerId = String(body.customerId || '').trim()
        const customerName = String(body.customerName || '').trim()
        const email = String(body.email || '')
          .trim()
          .toLowerCase()
        const snapshot = body.snapshot
        if (
          !accessToken.startsWith('b2b-') ||
          accessToken.length < 40 ||
          !customerId ||
          !snapshot ||
          typeof snapshot !== 'object'
        ) {
          const err = new Error('Geçersiz B2B panel verisi')
          err.code = 'INVALID_B2B_PAYLOAD'
          throw err
        }
        if (JSON.stringify(snapshot).length > 2_000_000) {
          const err = new Error('B2B panel verisi izin verilen boyutu aşıyor')
          err.code = 'B2B_PAYLOAD_TOO_LARGE'
          throw err
        }
        if (body.sendEmail && !email.includes('@')) {
          const err = new Error('Müşterinin kayıtlı e-posta adresi bulunamadı')
          err.code = 'INVALID_EMAIL'
          throw err
        }

        if (!Array.isArray(store.b2bPortals)) store.b2bPortals = []
        const tokenHash = hashB2bToken(accessToken)
        const now = new Date().toISOString()
        const existing = store.b2bPortals.find(
          (row) => row.tenantCode === session.user.tenantCode && row.customerId === customerId,
        )
        const portal = {
          id: existing?.id || `b2b_${crypto.randomUUID()}`,
          tenantCode: session.user.tenantCode,
          customerId,
          tokenHash,
          enabled: true,
          snapshot,
          createdByAccountId: session.account.id,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        }
        store.b2bPortals = [
          portal,
          ...store.b2bPortals.filter((row) => row.id !== portal.id),
        ].slice(0, 5000)

        const portalUrl = `https://uygulama.bachmain.com/portal/${encodeURIComponent(accessToken)}`
        let mail = null
        if (body.sendEmail) {
          try {
            mail = await sendTemplateMail(store, {
              to: email,
              template: 'b2b_portal_invitation',
              type: 'b2b_portal_invitation',
              customerId,
              accountId: session.account.id,
              immediate: true,
              data: {
                name: customerName,
                companyName: session.user.companyName,
                senderName: session.user.fullName,
                portalUrl,
              },
              meta: {
                source: 'crm_customer_list',
                tenantCode: session.user.tenantCode,
              },
            })
          } catch (mailError) {
            mail = { status: 'failed', error: mailError.message }
          }
        }
        return { portalUrl, mail }
      })
      sendJson(req, res, 200, {
        ok: true,
        portalUrl: result.portalUrl,
        mailStatus: result.mail?.status || (body.sendEmail ? 'failed' : 'not_requested'),
        mailError: result.mail?.error || null,
      })
      return true
    } catch (error) {
      const status =
        error.code === 'UNAUTHORIZED'
          ? 401
          : error.code === 'FORBIDDEN'
            ? 403
            : error.code === 'INVALID_EMAIL'
              ? 422
              : 400
      sendJson(req, res, status, {
        error: error.code || 'B2B_PORTAL_FAILED',
        message: error.message,
      })
      return true
    }
  }

  if (method === 'GET' && path === 'auth/companies') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = getAccountFromToken(store, token)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Oturum bulunamadı' })
      return true
    }
    sendJson(req, res, 200, {
      ok: true,
      activeTenantCode: session.user.tenantCode,
      companies: listAccessibleCompanies(store, session.account.id),
    })
    return true
  }

  if (method === 'POST' && path === 'auth/company/switch') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = getAccountFromToken(store, token)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Oturum bulunamadı' })
      return true
    }
    try {
      const result = switchCompanySession(store, session.account.id, body.tenantCode)
      sendJson(
        req,
        res,
        200,
        { ok: true, user: result.user, token: result.token },
        { cookie: buildSessionCookie(result.token) },
      )
      return true
    } catch (error) {
      const status = error.code === 'COMPANY_FORBIDDEN' ? 403 : 404
      sendJson(req, res, status, {
        error: error.code || 'COMPANY_SWITCH_FAILED',
        message: error.message,
      })
      return true
    }
  }

  if (method === 'GET' && path === 'auth/company/users') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    const session = getAccountFromToken(store, token)
    if (!session) {
      sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Oturum bulunamadı' })
      return true
    }
    try {
      sendJson(req, res, 200, { ok: true, users: listCompanyUsers(store, session) })
      return true
    } catch (error) {
      sendJson(req, res, 403, { error: error.code || 'FORBIDDEN', message: error.message })
      return true
    }
  }

  if (method === 'PUT' && path === 'auth/company/access') {
    const token = getBearerOrCookieToken(req)
    try {
      const users = await withStore((store) => {
        const session = getAccountFromToken(store, token)
        if (!session) {
          const err = new Error('Oturum bulunamadı')
          err.code = 'UNAUTHORIZED'
          throw err
        }
        return setCompanyUserAccess(store, session, body)
      })
      sendJson(req, res, 200, { ok: true, users })
      return true
    } catch (error) {
      const status =
        error.code === 'UNAUTHORIZED'
          ? 401
          : error.code === 'FORBIDDEN'
            ? 403
            : error.code === 'ACCOUNT_NOT_FOUND'
              ? 404
              : 400
      sendJson(req, res, status, {
        error: error.code || 'COMPANY_ACCESS_FAILED',
        message: error.message,
      })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/onboarding/complete') {
    const token = getBearerOrCookieToken(req)
    try {
      const result = await withStore((store) => {
        const session = getAccountFromToken(store, token)
        if (!session) {
          const err = new Error('Oturum bulunamadı')
          err.code = 'UNAUTHORIZED'
          throw err
        }
        return completeOnboarding(store, session.account.id)
      })
      sendJson(req, res, 200, { ok: true, user: result.user })
      return true
    } catch (error) {
      const status = error.code === 'UNAUTHORIZED' ? 401 : error.code === 'NOT_FOUND' ? 404 : 400
      sendJson(req, res, status, {
        error: error.code || 'ONBOARDING_FAILED',
        message: error.message,
      })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/logout') {
    sendJson(req, res, 200, { ok: true }, { cookie: buildSessionCookie('', { clear: true }) })
    return true
  }

  if (method === 'POST' && path === 'auth/forgot-password') {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`forgot:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla deneme. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      await withStore((store) => requestPasswordReset(store, body.email))
      sendJson(req, res, 200, {
        ok: true,
        message: 'Eşleşen hesap varsa sıfırlama bağlantısı e-posta ile gönderildi.',
      })
      return true
    } catch (error) {
      sendJson(req, res, 400, { error: error.code || 'FORGOT_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/reset-password') {
    try {
      await withStore((store) =>
        resetPasswordWithToken(store, { token: body.token, password: body.password }),
      )
      sendJson(req, res, 200, { ok: true, message: 'Şifreniz güncellendi. Giriş yapabilirsiniz.' })
      return true
    } catch (error) {
      sendJson(req, res, 400, { error: error.code || 'RESET_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/verify-email') {
    try {
      const result = await withStore((store) => verifyEmailWithToken(store, body.token))
      sendJson(req, res, 200, { ok: true, ...result })
      return true
    } catch (error) {
      sendJson(req, res, 400, { error: error.code || 'VERIFY_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'GET' && path === 'auth/email-change') {
    try {
      const token = String(getQueryToken(req) || body.token || '').trim()
      const store = await loadStore()
      const tok = (store.emailTokens || []).find(
        (t) => t.purpose === 'email_change' && t.token === token,
      )
      if (!tok || new Date(tok.expiresAt).getTime() < Date.now()) {
        sendJson(req, res, 400, {
          ok: false,
          error: 'INVALID_TOKEN',
          message: 'Geçersiz veya süresi dolmuş bağlantı',
        })
        return true
      }
      const account = (store.accounts || []).find((a) => a.id === tok.accountId)
      sendJson(req, res, 200, {
        ok: true,
        oldEmail: tok.email || account?.email || null,
        expiresAt: tok.expiresAt,
      })
      return true
    } catch (error) {
      sendJson(req, res, 400, { error: error.code || 'PEEK_FAILED', message: error.message })
      return true
    }
  }

  if (method === 'POST' && path === 'auth/email-change') {
    const ip =
      req.headers?.['x-forwarded-for']?.split?.(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    const rate = await hitRateLimit(`emailchg:${ip}`, { limit: 12, windowMs: 60 * 60 * 1000 })
    if (!rate.allowed) {
      sendJson(req, res, 429, {
        error: 'RATE_LIMITED',
        message: 'Çok fazla deneme. Lütfen sonra tekrar deneyin.',
      })
      return true
    }
    try {
      const result = await withStore((store) =>
        completeEmailChange(store, { token: body.token, newEmail: body.newEmail }),
      )
      sendJson(req, res, 200, {
        ok: true,
        message: 'E-posta adresiniz güncellendi. Yeni adresinizle giriş yapabilirsiniz.',
        ...result,
      })
      return true
    } catch (error) {
      sendJson(req, res, error.status || 400, {
        ok: false,
        error: error.code || 'EMAIL_CHANGE_FAILED',
        message: error.message,
      })
      return true
    }
  }

  return false
}

function getQueryToken(req) {
  try {
    if (req.query?.token) return String(req.query.token)
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(String(req.url || ''), 'http://localhost')
    return url.searchParams.get('token')
  } catch {
    return null
  }
}
