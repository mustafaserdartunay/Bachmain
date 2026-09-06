import { and, desc, eq, gte, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  liveEntities,
  liveGeofenceEvents,
  liveGeofences,
  liveRoutes,
  liveRouteStops,
  liveTrackingTokens,
  locationSamples,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { logActivity } from '../audit/activityService.js'
import { emitCompanyLive } from './liveEvents.js'

function asNum(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function ingestLocation(
  companyId: string,
  input: {
    entityId?: string
    externalId: string
    entityKind?: string
    name?: string
    latitude: number
    longitude: number
    accuracy?: number | null
    speed?: number | null
    heading?: number | null
    altitude?: number | null
    timestamp?: string
    batteryLevel?: number | null
    isMoving?: boolean
    deviceId?: string | null
    platform?: string | null
    activity?: string | null
    locationPermissionStatus?: string | null
    idempotencyKey: string
  },
  io?: Parameters<typeof emitCompanyLive>[0],
) {
  const lat = asNum(input.latitude)
  const lng = asNum(input.longitude)
  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('VALIDATION', 'Geçersiz koordinat', 400)
  }

  const existing = await db
    .select()
    .from(liveEntities)
    .where(
      and(
        eq(liveEntities.companyId, companyId),
        eq(liveEntities.entityKind, input.entityKind || 'personnel'),
        eq(liveEntities.externalId, input.externalId),
        isNull(liveEntities.deletedAt),
      ),
    )
    .limit(1)

  let entity = existing[0]
  if (!entity) {
    const [created] = await db
      .insert(liveEntities)
      .values({
        companyId,
        entityKind: input.entityKind || 'personnel',
        externalId: input.externalId,
        name: input.name || input.externalId,
        status: 'active',
      })
      .returning()
    entity = created
  }

  const recordedAt = input.timestamp ? new Date(input.timestamp) : new Date()
  try {
    const [row] = await db
      .insert(locationSamples)
      .values({
        companyId,
        entityId: entity.id,
        latitude: String(lat),
        longitude: String(lng),
        accuracy: input.accuracy != null ? String(input.accuracy) : null,
        speed: input.speed != null ? String(input.speed) : null,
        heading: input.heading != null ? String(input.heading) : null,
        altitude: input.altitude != null ? String(input.altitude) : null,
        recordedAt,
        batteryLevel: input.batteryLevel != null ? String(input.batteryLevel) : null,
        isMoving: Boolean(input.isMoving),
        deviceId: input.deviceId || null,
        platform: input.platform || null,
        activity: input.activity || null,
        permissionStatus: input.locationPermissionStatus || null,
        idempotencyKey: input.idempotencyKey,
      })
      .returning()

    emitCompanyLive(io || null, companyId, 'location.updated', {
      id: row.id,
      meta: { entityId: entity.id, externalId: input.externalId, v: 1 },
    })
    return { ok: true, duplicate: false, sample: row, entity }
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === '23505') return { ok: true, duplicate: true, entity }
    throw error
  }
}

export async function listLive(companyId: string) {
  const entities = await db
    .select()
    .from(liveEntities)
    .where(and(eq(liveEntities.companyId, companyId), isNull(liveEntities.deletedAt)))
    .limit(1000)

  const latest = await Promise.all(
    entities.map(async (entity) => {
      const [sample] = await db
        .select()
        .from(locationSamples)
        .where(
          and(eq(locationSamples.companyId, companyId), eq(locationSamples.entityId, entity.id)),
        )
        .orderBy(desc(locationSamples.recordedAt))
        .limit(1)
      return { ...entity, sample: sample || null }
    }),
  )
  return latest
}

export async function historyForEntity(
  companyId: string,
  entityId: string,
  since?: string,
  actor?: { userId?: string },
) {
  const [entity] = await db
    .select()
    .from(liveEntities)
    .where(
      and(
        eq(liveEntities.id, entityId),
        eq(liveEntities.companyId, companyId),
        isNull(liveEntities.deletedAt),
      ),
    )
    .limit(1)
  if (!entity) throw new AppError('NOT_FOUND', 'Kayıt bulunamadı', 404)

  await logActivity({
    companyId,
    userId: actor?.userId || null,
    action: 'live.history.view',
    resource: 'live_entity',
    resourceId: entityId,
  })

  const filters = [eq(locationSamples.companyId, companyId), eq(locationSamples.entityId, entityId)]
  if (since) filters.push(gte(locationSamples.recordedAt, new Date(since)))
  const rows = await db
    .select()
    .from(locationSamples)
    .where(and(...filters))
    .orderBy(desc(locationSamples.recordedAt))
    .limit(2000)
  return { entity, rows }
}

export async function saveGeofence(
  companyId: string,
  body: {
    name: string
    kind?: string
    shape?: string
    centerLat?: number
    centerLng?: number
    radiusMeters?: number
    polygon?: Array<{ lat: number; lng: number }>
    autoArrive?: boolean
  },
) {
  const [row] = await db
    .insert(liveGeofences)
    .values({
      companyId,
      name: body.name,
      kind: body.kind || 'depo',
      shape: body.shape || 'circle',
      centerLat: body.centerLat != null ? String(body.centerLat) : null,
      centerLng: body.centerLng != null ? String(body.centerLng) : null,
      radiusMeters: body.radiusMeters || null,
      polygon: body.polygon || [],
      autoArrive: Boolean(body.autoArrive),
    })
    .returning()
  return row
}

export async function listGeofences(companyId: string) {
  return db
    .select()
    .from(liveGeofences)
    .where(and(eq(liveGeofences.companyId, companyId), isNull(liveGeofences.deletedAt)))
}

export async function saveRoute(
  companyId: string,
  body: {
    name?: string
    entityId?: string
    stops?: Array<{ label?: string; lat: number; lng: number }>
    geometry?: number[][]
    distanceKm?: number
    durationMin?: number
  },
  io?: Parameters<typeof emitCompanyLive>[0],
) {
  const [route] = await db
    .insert(liveRoutes)
    .values({
      companyId,
      name: body.name || 'Rota',
      entityId: body.entityId || null,
      geometry: body.geometry || [],
      distanceKm: body.distanceKm != null ? String(body.distanceKm) : null,
      durationMin: body.durationMin || null,
    })
    .returning()

  if (body.stops?.length) {
    await db.insert(liveRouteStops).values(
      body.stops.map((stop, seq) => ({
        routeId: route.id,
        companyId,
        seq,
        label: stop.label || `Durak ${seq + 1}`,
        latitude: String(stop.lat),
        longitude: String(stop.lng),
      })),
    )
  }
  emitCompanyLive(io || null, companyId, 'route.updated', { id: route.id, meta: { v: 1 } })
  return route
}

export async function publicTrack(token: string) {
  const [row] = await db
    .select()
    .from(liveTrackingTokens)
    .where(and(eq(liveTrackingTokens.token, token), isNull(liveTrackingTokens.deletedAt)))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Takip bağlantısı geçersiz', 404)
  if (row.expiresAt && row.expiresAt < new Date())
    throw new AppError('EXPIRED', 'Takip bağlantısının süresi doldu', 410)
  if (!row.entityId) return { status: 'waiting', eta: null, approx: null }

  const [sample] = await db
    .select()
    .from(locationSamples)
    .where(
      and(eq(locationSamples.companyId, row.companyId), eq(locationSamples.entityId, row.entityId)),
    )
    .orderBy(desc(locationSamples.recordedAt))
    .limit(1)

  return {
    status: 'in_transit',
    eta: null,
    approx: sample
      ? {
          lat: Number(Number(sample.latitude).toFixed(3)),
          lng: Number(Number(sample.longitude).toFixed(3)),
          updatedAt: sample.recordedAt,
        }
      : null,
  }
}

export async function liveAssistantSummary(
  companyId: string,
  kind: 'delayed' | 'offline' | 'region',
) {
  const rows = await listLive(companyId)
  const now = Date.now()
  if (kind === 'offline') {
    return rows
      .filter((row) => {
        const at = row.sample?.recordedAt ? new Date(row.sample.recordedAt).getTime() : 0
        return now - at > 3 * 60 * 1000
      })
      .map((row) => ({ id: row.id, name: row.name, kind: row.entityKind }))
  }
  if (kind === 'delayed') {
    return rows
      .filter((row) => row.status === 'delayed' || row.meta?.delayed)
      .map((row) => ({ id: row.id, name: row.name, kind: row.entityKind }))
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.entityKind,
    lat: row.sample ? Number(row.sample.latitude) : null,
    lng: row.sample ? Number(row.sample.longitude) : null,
  }))
}

export async function listGeofenceEvents(companyId: string) {
  return db
    .select()
    .from(liveGeofenceEvents)
    .where(eq(liveGeofenceEvents.companyId, companyId))
    .orderBy(desc(liveGeofenceEvents.createdAt))
    .limit(200)
}
