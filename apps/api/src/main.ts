import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import cookie from '@fastify/cookie'
import { Server } from 'socket.io'
import { env, corsOrigins } from './config/env.js'
import { isAppError } from './shared/errors.js'
import { authRoutes } from './modules/identity/authRoutes.js'
import { leadRoutes } from './modules/tenancy/leadRoutes.js'
import { billingRoutes } from './modules/billing/billingRoutes.js'
import { supportRoutes } from './modules/support/supportRoutes.js'
import { registerRealtime } from './realtime/socket.js'
import { bindNotificationIo } from './modules/notifications/notificationService.js'
import { adminRoutes } from './modules/admin/adminRoutes.js'
import { crmRoutes } from './modules/crm/crmRoutes.js'

async function main() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
    trustProxy: true,
  })

  // Preserve raw JSON for Stripe webhook signature verification
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    const raw = typeof body === 'string' ? body : Buffer.from(body as Buffer).toString('utf8')
    ;(req as { rawBody?: string }).rawBody = raw
    try {
      done(null, raw ? JSON.parse(raw) : {})
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  await app.register(sensible)
  await app.register(cookie)
  await app.register(helmet, { global: true })
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || corsOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'), false)
    },
    credentials: true,
  })
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    hook: 'onRequest',
    allowList: (req) =>
      req.url.startsWith('/v1/health') || req.url.startsWith('/v1/billing/webhooks/'),
    keyGenerator: (req) => req.ip,
  })

  // Distributed Redis limiter when REDIS_URL is set (in-memory fallback inside helper)
  app.addHook('onRequest', async (req, reply) => {
    if (!env.REDIS_URL) return
    if (req.url.startsWith('/v1/health') || req.url.startsWith('/v1/billing/webhooks/')) return
    const { hitDistributedRateLimit } = await import('./shared/redisRateLimit.js')
    const ok = await hitDistributedRateLimit(`${req.ip}:${req.method}`, { limit: 300, windowSec: 60 })
    if (!ok) {
      return reply.status(429).send({ error: 'RATE_LIMIT', message: 'Çok fazla istek' })
    }
  })

  app.setErrorHandler((err, req, reply) => {
    if (isAppError(err)) {
      return reply.status(err.statusCode).send({
        error: err.code,
        message: err.message,
        details: err.details,
      })
    }
    if ((err as { validation?: unknown; message?: string }).validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: (err as { message?: string }).message || 'Validation error',
      })
    }
    req.log.error(err)
    return reply.status(500).send({ error: 'INTERNAL', message: 'Sunucu hatası' })
  })

  app.get('/v1/health', async () => ({
    ok: true,
    service: 'bachmain-api',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }))

  await app.register(authRoutes)
  await app.register(leadRoutes)
  await app.register(billingRoutes)
  await app.register(adminRoutes)
  await app.register(crmRoutes)

  await app.ready()

  const io = new Server(app.server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  })
  registerRealtime(io)
  bindNotificationIo(io)
  await supportRoutes(app, io)

  await app.listen({ port: env.PORT, host: env.HOST })
  app.log.info(`BachMain API listening on ${env.HOST}:${env.PORT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
