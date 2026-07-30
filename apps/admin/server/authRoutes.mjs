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
