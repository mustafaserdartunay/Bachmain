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
} from './auth.mjs'
import { loadStore, withStore } from './store.mjs'
import { hitRateLimit } from './db.mjs'
import { loginStaff, getStaffSession, buildStaffCookie } from './staffAuth.mjs'

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
      const result = await withStore((store) =>
        loginAccount(store, {
          ...body,
          userAgent: req.headers?.['user-agent'] || '',
          ip,
        }),
      )
      sendJson(
        req,
        res,
        200,
        {
          ok: true,
          user: result.user,
          token: result.token,
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
    sendJson(req, res, 200, { ok: true, user: session.user })
    return true
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

  return false
}
