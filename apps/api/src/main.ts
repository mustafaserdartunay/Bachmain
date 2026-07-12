import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
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

  await app.register(sensible)
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
