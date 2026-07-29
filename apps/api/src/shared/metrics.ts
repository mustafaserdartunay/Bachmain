/**
 * Prometheus metrics for BachMain API.
 * Soft-loads prom-client so local builds degrade gracefully.
 */
import type { FastifyInstance } from 'fastify'
import { createHash } from 'node:crypto'

type Labels = { method: string; route: string; status_code: string }

let registerMetricsFn: (() => Promise<string>) | null = null
let contentType = 'text/plain; version=0.0.4; charset=utf-8'
let observe: ((labels: Labels, seconds: number) => void) | null = null
let incRequest: ((labels: Labels) => void) | null = null
let incError: ((labels: { method: string; route: string }) => void) | null = null
let setActiveUsers: ((n: number) => void) | null = null

const ACTIVE_WINDOW_MS = 5 * 60 * 1000
const activeAuthKeys = new Map<string, number>()

async function loadClient() {
  if (registerMetricsFn) return true
  try {
    const client = await import('prom-client')
    client.collectDefaultMetrics({ prefix: 'bachmain_' })
    const httpDuration = new client.Histogram({
      name: 'bachmain_http_request_duration_seconds',
      help: 'API request duration',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    })
    const httpRequests = new client.Counter({
      name: 'bachmain_http_requests_total',
      help: 'Total API requests',
      labelNames: ['method', 'route', 'status_code'],
    })
    const httpErrors = new client.Counter({
      name: 'bachmain_http_errors_total',
      help: 'API responses with status >= 500',
      labelNames: ['method', 'route'],
    })
    const activeUsers = new client.Gauge({
      name: 'bachmain_active_users',
      help: 'Approximate active authenticated users (in-process)',
    })
    observe = (labels, seconds) => httpDuration.observe(labels, seconds)
    incRequest = (labels) => httpRequests.inc(labels)
    incError = (labels) => httpErrors.inc(labels)
    setActiveUsers = (n) => activeUsers.set(n)
    registerMetricsFn = () => client.register.metrics()
    contentType = client.register.contentType
    return true
  } catch {
    return false
  }
}

export async function registerMetrics(app: FastifyInstance) {
  const loaded = await loadClient()
  if (!loaded || !registerMetricsFn) {
    app.log.warn('prom-client not installed — /metrics disabled')
    return
  }

  app.addHook('onResponse', async (req, reply) => {
    const route = req.routeOptions?.url || req.url.split('?')[0] || 'unknown'
    const labels: Labels = {
      method: req.method,
      route,
      status_code: String(reply.statusCode),
    }
    const seconds = reply.elapsedTime / 1000
    observe?.(labels, seconds)
    incRequest?.(labels)
    if (reply.statusCode >= 500) {
      incError?.({ method: req.method, route })
    }
    const auth = req.headers.authorization
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const now = Date.now()
      const key = createHash('sha256').update(auth.slice(7)).digest('hex').slice(0, 24)
      activeAuthKeys.set(key, now)
      for (const [candidate, seenAt] of activeAuthKeys) {
        if (now - seenAt > ACTIVE_WINDOW_MS) activeAuthKeys.delete(candidate)
      }
      setActiveUsers?.(activeAuthKeys.size)
    }
  })

  app.get('/metrics', async (req, reply) => {
    const configuredToken = String(process.env.METRICS_TOKEN || '').trim()
    if (configuredToken && req.headers.authorization !== `Bearer ${configuredToken}`) {
      return reply.status(401).send({ error: 'METRICS_UNAUTHORIZED' })
    }
    reply.header('Content-Type', contentType)
    return registerMetricsFn!()
  })
}
