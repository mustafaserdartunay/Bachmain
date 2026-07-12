import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  getMe,
  loginUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from './authService.js'
import { authenticate } from '../../shared/authGuard.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/v1/auth/register', async (req) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(1),
        companyName: z.string().min(1),
        phone: z.string().optional(),
        plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
      })
      .parse(req.body)
    return registerUser({
      ...body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
  })

  app.post('/v1/auth/login', async (req) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body)
    return loginUser({
      ...body,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
  })

  app.post('/v1/auth/refresh', async (req) => {
    const body = z.object({ refreshToken: z.string().min(10) }).parse(req.body)
    const tokens = await refreshSession(body.refreshToken)
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
        password: z.string().min(6),
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
}
