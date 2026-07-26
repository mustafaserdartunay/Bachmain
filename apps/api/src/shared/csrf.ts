/**
 * Double-submit CSRF for cookie-authenticated mutating requests.
 * Bearer-only requests skip CSRF (XSS still mitigated separately).
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'

const CSRF_COOKIE = 'bachmain_csrf'
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

type CookieReply = {
  setCookie: (name: string, value: string, opts: Record<string, unknown>) => unknown
}

function hasBearer(req: FastifyRequest) {
  const h = req.headers.authorization
  return Boolean(h?.startsWith('Bearer ') && h.length > 20)
}

function hasRefreshCookie(req: FastifyRequest) {
  return Boolean((req as { cookies?: Record<string, string> }).cookies?.bachmain_refresh)
}

export function issueCsrfToken(reply: CookieReply): string {
  const token = randomBytes(32).toString('hex')
  reply.setCookie(CSRF_COOKIE, token, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
  })
  return token
}

function tokensMatch(a: string, b: string) {
  try {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    if (left.length !== right.length) return false
    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}

export async function registerCsrf(app: FastifyInstance) {
  app.get('/v1/auth/csrf', async (_req, reply) => {
    const token = issueCsrfToken(reply as unknown as CookieReply)
    return { ok: true, csrfToken: token }
  })

  app.addHook('onRequest', async (req, reply) => {
    if (SAFE.has(req.method)) return
    if (req.url.startsWith('/v1/health')) return
    if (req.url.startsWith('/v1/billing/webhooks/')) return
    if (req.url.startsWith('/v1/social/') && req.url.includes('/webhook')) return
    if (
      req.url.startsWith('/v1/auth/login') ||
      req.url.startsWith('/v1/auth/register') ||
      req.url.startsWith('/v1/auth/forgot-password') ||
      req.url.startsWith('/v1/auth/reset-password') ||
      req.url.startsWith('/v1/auth/verify-email') ||
      req.url.startsWith('/v1/auth/mfa/verify') ||
      req.url.startsWith('/v1/auth/csrf')
    ) {
      return
    }

    if (hasBearer(req) && !hasRefreshCookie(req)) return
    if (!hasRefreshCookie(req) && !hasBearer(req)) return
    if (!hasRefreshCookie(req)) return

    const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.[CSRF_COOKIE] || ''
    const headerToken = String(
      req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || '',
    ).trim()

    if (!cookieToken || !headerToken || !tokensMatch(cookieToken, headerToken)) {
      return reply.status(403).send({
        error: 'CSRF_REJECTED',
        message: 'CSRF doğrulaması başarısız — /v1/auth/csrf ile token alın',
      })
    }
  })
}
