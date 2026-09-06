import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import { env } from '../../config/env.js'
import {
  historyForEntity,
  ingestLocation,
  listGeofenceEvents,
  listGeofences,
  listLive,
  publicTrack,
  saveGeofence,
  saveRoute,
} from './liveService.js'

const sampleSchema = z.object({
  externalId: z.string().min(1),
  entityKind: z.string().optional(),
  name: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional().nullable(),
  speed: z.number().optional().nullable(),
  heading: z.number().optional().nullable(),
  altitude: z.number().optional().nullable(),
  timestamp: z.string().optional(),
  batteryLevel: z.number().optional().nullable(),
  isMoving: z.boolean().optional(),
  deviceId: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  activity: z.string().optional().nullable(),
  locationPermissionStatus: z.string().optional().nullable(),
  idempotencyKey: z.string().min(8),
})

export async function liveRoutes(app: FastifyInstance) {
  app.get(
    '/v1/live/mapbox/status',
    { preHandler: [authenticate, requirePermission('live.view')] },
    async () => ({
      ok: true,
      connected: Boolean(env.MAPBOX_SECRET_TOKEN || env.MAPBOX_PUBLIC_TOKEN),
      hasPublicToken: Boolean(env.MAPBOX_PUBLIC_TOKEN),
      hasSecretToken: Boolean(env.MAPBOX_SECRET_TOKEN),
      services: {
        maps: Boolean(env.MAPBOX_PUBLIC_TOKEN),
        geocoding: Boolean(env.MAPBOX_SECRET_TOKEN || env.MAPBOX_PUBLIC_TOKEN),
        directions: Boolean(env.MAPBOX_SECRET_TOKEN || env.MAPBOX_PUBLIC_TOKEN),
        live: true,
      },
    }),
  )

  app.get(
    '/v1/live/locations',
    { preHandler: [authenticate, requirePermission('live.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listLive(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/live/locations',
    { preHandler: [authenticate, requirePermission('live.track')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = sampleSchema.parse(req.body)
      const io = (app as FastifyInstance & { io?: import('socket.io').Server }).io
      const result = await ingestLocation(companyId, body, io)
      return result
    },
  )

  app.get(
    '/v1/live/locations/:entityId/history',
    { preHandler: [authenticate, requirePermission('live.history')] },
    async (req) => {
      const companyId = requireTenant(req)
      const entityId = z
        .string()
        .uuid()
        .parse((req.params as { entityId: string }).entityId)
      const since =
        typeof req.query === 'object' ? (req.query as { since?: string }).since : undefined
      return historyForEntity(companyId, entityId, since, { userId: req.auth?.sub })
    },
  )

  app.get(
    '/v1/live/geofences',
    { preHandler: [authenticate, requirePermission('live.geofence')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, rows: await listGeofences(companyId) }
    },
  )

  app.post(
    '/v1/live/geofences',
    { preHandler: [authenticate, requirePermission('live.geofence')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          kind: z.string().optional(),
          shape: z.string().optional(),
          centerLat: z.number().optional(),
          centerLng: z.number().optional(),
          radiusMeters: z.number().optional(),
          polygon: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
          autoArrive: z.boolean().optional(),
        })
        .parse(req.body)
      const row = await saveGeofence(companyId, body)
      return { ok: true, geofence: row }
    },
  )

  app.get(
    '/v1/live/geofences/events',
    { preHandler: [authenticate, requirePermission('live.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, rows: await listGeofenceEvents(companyId) }
    },
  )

  app.post(
    '/v1/live/routes',
    { preHandler: [authenticate, requirePermission('live.route')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().optional(),
          entityId: z.string().uuid().optional(),
          stops: z
            .array(z.object({ label: z.string().optional(), lat: z.number(), lng: z.number() }))
            .optional(),
          geometry: z.array(z.array(z.number())).optional(),
          distanceKm: z.number().optional(),
          durationMin: z.number().optional(),
        })
        .parse(req.body)
      const io = (app as FastifyInstance & { io?: import('socket.io').Server }).io
      const row = await saveRoute(companyId, body, io)
      return { ok: true, route: row }
    },
  )

  app.post(
    '/v1/live/routes/optimize',
    { preHandler: [authenticate, requirePermission('live.route')] },
    async (req) => {
      requireTenant(req)
      z.object({
        coordinates: z.array(z.object({ lat: z.number(), lng: z.number() })).min(2),
      }).parse(req.body)
      return {
        ok: true,
        message: 'Optimizasyon Mapbox proxy üzerinden çalışır',
        requiresApproval: true,
      }
    },
  )

  app.get('/v1/live/track/:token', async (req) => {
    const token = z
      .string()
      .min(4)
      .parse((req.params as { token: string }).token)
    const payload = await publicTrack(token)
    return { ok: true, ...payload }
  })
}
