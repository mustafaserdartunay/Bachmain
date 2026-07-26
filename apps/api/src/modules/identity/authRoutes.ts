import type { FastifyInstance, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  getMe,
  issueSessionForUser,
  loginUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from './authService.js'
import {
  beginMfaSetup,
  disableMfa,
  enableMfa,
  listTrustedDevices,
  markOnboardingComplete,
  revokeTrustedDevice,
  verifyMfaChallenge,
} from './mfaService.js'
import { authenticate } from '../../shared/authGuard.js'
import { logActivity } from '../audit/activityService.js'
import { issueCsrfToken } from '../../shared/csrf.js'

const REFRESH_COOKIE = 'bachmain_refresh'

function setRefreshCookie(reply: FastifyReply, token: string) {
  ;(
    reply as unknown as { setCookie: (n: string, v: string, o: Record<string, unknown>) => void }
  ).setCookie(REFRESH_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60,
  })
}

function attachCsrf(reply: FastifyReply) {
  issueCsrfToken(reply as unknown as Parameters<typeof issueCsrfToken>[0])
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/register', async (req, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(12),
        fullName: z.string().min(1),
        companyName: z.string().min(1),
        phone: z.string().optional(),
        plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
      })
      .parse(req.body)
    const result = await registerUser({
      ...body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    setRefreshCookie(reply, result.tokens.refreshToken)
    attachCsrf(reply)
    return result
  })

  app.post('/v1/auth/login', async (req, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
        deviceId: z.string().optional(),
      })
      .parse(req.body)
    const result = await loginUser({
      ...body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    if ('tokens' in result && result.tokens) {
      setRefreshCookie(reply, result.tokens.refreshToken)
      attachCsrf(reply)
    }
    return result
  })

  app.post('/v1/auth/mfa/verify', async (req, reply) => {
    const body = z
      .object({
        mfaToken: z.string().min(10),
        code: z.string().min(4).max(16),
        trustDevice: z.boolean().optional(),
        deviceId: z.string().optional(),
      })
      .parse(req.body)
    const { userId } = await verifyMfaChallenge({
      ...body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    const session = await issueSessionForUser(userId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    await logActivity({
      userId,
      companyId: session.companyId,
      action: 'auth.mfa.verify',
      resource: 'user',
      resourceId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
    setRefreshCookie(reply, session.tokens.refreshToken)
    attachCsrf(reply)
    return { ok: true, user: session.user, tokens: session.tokens }
  })

  app.post('/v1/auth/refresh', async (req, reply) => {
    const body = z.object({ refreshToken: z.string().min(10).optional() }).parse(req.body || {})
    const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE]
    const refreshToken = body.refreshToken || cookieToken
    if (!refreshToken) {
      return reply.status(401).send({ error: 'INVALID_REFRESH', message: 'Oturum yenilenemedi' })
    }
    const tokens = await refreshSession(refreshToken)
    setRefreshCookie(reply, tokens.refreshToken)
    attachCsrf(reply)
    return { ok: true, tokens }
  })

  app.post('/v1/auth/forgot-password', async (req) => {
    const body = z.object({ email: z.string().email() }).parse(req.body)
    return requestPasswordReset(body.email)
  })

  app.post('/v1/auth/reset-password', async (req) => {
    const body = z
      .object({
        token: z.string().min(10),
        password: z.string().min(12),
      })
      .parse(req.body)
    return resetPassword(body.token, body.password)
  })

  app.post('/v1/auth/verify-email', async (req) => {
    const body = z.object({ token: z.string().min(10) }).parse(req.body)
    return verifyEmail(body.token)
  })

  app.get('/v1/auth/me', { preHandler: authenticate }, async (req) => {
    return getMe(req.auth!.sub)
  })

  app.post('/v1/auth/onboarding/complete', { preHandler: authenticate }, async (req) => {
    await markOnboardingComplete(req.auth!.sub)
    return getMe(req.auth!.sub)
  })

  app.post('/v1/auth/mfa/setup', { preHandler: authenticate }, async (req) => {
    return beginMfaSetup(req.auth!.sub)
  })

  app.post('/v1/auth/mfa/enable', { preHandler: authenticate }, async (req) => {
    const body = z.object({ code: z.string().min(4).max(12) }).parse(req.body)
    return enableMfa(req.auth!.sub, body.code)
  })

  app.post('/v1/auth/mfa/disable', { preHandler: authenticate }, async (req) => {
    const body = z.object({ code: z.string().min(4).max(12) }).parse(req.body)
    return disableMfa(req.auth!.sub, body.code)
  })

  app.get('/v1/auth/trusted-devices', { preHandler: authenticate }, async (req) => {
    const rows = await listTrustedDevices(req.auth!.sub)
    return { ok: true, rows }
  })

  app.delete('/v1/auth/trusted-devices/:id', { preHandler: authenticate }, async (req) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    return revokeTrustedDevice(req.auth!.sub, id)
  })
}
