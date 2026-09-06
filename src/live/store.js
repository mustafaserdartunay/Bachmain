import { scheduleTenantPush } from '../utils/tenantSync'
import { withOrgScope, getActiveOrgScope, filterByOrgScope } from '../utils/orgScope'
import {
  LIVE_AUDIT_KEY,
  LIVE_EVENT,
  LIVE_GEOFENCE_EVENTS_KEY,
  LIVE_GEOFENCES_KEY,
  LIVE_LOCATIONS_KEY,
  LIVE_ROUTES_KEY,
  LIVE_SETTINGS_KEY,
} from './constants.js'
import { isSameSample, validateLocationSample } from './validateLocation.js'
import { detectGeofenceTransitions, formatGeofenceEvent } from './geofence.js'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  try {
    scheduleTenantPush(key, value)
  } catch {
    // tenant sync optional
  }
  window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: { key } }))
  return value
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function stamp(record, scope = getActiveOrgScope()) {
  return withOrgScope(record, scope)
}

export function loadLiveLocations() {
  const rows = readJson(LIVE_LOCATIONS_KEY, [])
  return Array.isArray(rows) ? filterByOrgScope(rows, getActiveOrgScope()) : []
}

export function loadLiveLocationsAll() {
  const rows = readJson(LIVE_LOCATIONS_KEY, [])
  return Array.isArray(rows) ? rows : []
}

export function upsertLiveLocation(input) {
  const checked = validateLocationSample({
    ...input,
    companyId: input.companyId ?? getActiveOrgScope().companyId ?? null,
    requireTenant: false,
  })
  if (!checked.ok) {
    const error = new Error('INVALID_LOCATION')
    error.details = checked.errors
    throw error
  }
  const sample = stamp(checked.sample)
  const rows = loadLiveLocationsAll()
  const dup = rows.find((row) => isSameSample(row, sample))
  if (dup) return dup
  const next = [{ id: createId('loc'), ...sample }, ...rows].slice(0, 8000)
  writeJson(LIVE_LOCATIONS_KEY, next)
  evaluateGeofencesForSample(sample)
  return next[0]
}

export function latestByEntity(entityId) {
  return loadLiveLocations().find((row) => row.entityId === entityId) || null
}

export function historyForEntity(entityId, { since } = {}) {
  const start = since ? Date.parse(since) : 0
  return loadLiveLocations()
    .filter((row) => row.entityId === entityId && (!start || Date.parse(row.timestamp) >= start))
    .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
}

export function loadGeofences() {
  const rows = readJson(LIVE_GEOFENCES_KEY, [])
  return Array.isArray(rows) ? filterByOrgScope(rows, getActiveOrgScope()) : []
}

export function saveGeofence(fence) {
  const rows = readJson(LIVE_GEOFENCES_KEY, [])
  const nextFence = stamp({
    id: fence.id || createId('gf'),
    name: String(fence.name || '').trim() || 'Bölge',
    kind: fence.kind || 'depo',
    shape: fence.shape || (fence.radiusMeters ? 'circle' : 'polygon'),
    center: fence.center || null,
    radiusMeters: fence.radiusMeters || null,
    polygon: fence.polygon || [],
    autoArrive: Boolean(fence.autoArrive),
    updatedAt: new Date().toISOString(),
  })
  const idx = rows.findIndex((row) => row.id === nextFence.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...nextFence }
  else rows.unshift(nextFence)
  writeJson(LIVE_GEOFENCES_KEY, rows)
  return nextFence
}

export function deleteGeofence(id) {
  writeJson(
    LIVE_GEOFENCES_KEY,
    readJson(LIVE_GEOFENCES_KEY, []).filter((row) => row.id !== id),
  )
}

export function loadGeofenceEvents() {
  const rows = readJson(LIVE_GEOFENCE_EVENTS_KEY, [])
  return Array.isArray(rows) ? filterByOrgScope(rows, getActiveOrgScope()) : []
}

function evaluateGeofencesForSample(sample) {
  const fences = loadGeofences()
  if (!fences.length) return
  const previousInside = {}
  const prev = loadLiveLocationsAll().find(
    (row) => row.entityId === sample.entityId && row.id !== sample.id,
  )
  fences.forEach((fence) => {
    previousInside[fence.id] = Boolean(prev?.insideFenceIds?.includes(fence.id))
  })
  const { events } = detectGeofenceTransitions({
    previous: previousInside,
    next: { lat: sample.latitude, lng: sample.longitude },
    fences,
  })
  if (!events.length) return
  const existing = readJson(LIVE_GEOFENCE_EVENTS_KEY, [])
  const stamped = events.map((event) =>
    stamp({
      id: createId('gfe'),
      ...event,
      entityId: sample.entityId,
      entityKind: sample.entityKind,
      message: formatGeofenceEvent(event, sample.name || sample.entityId),
    }),
  )
  writeJson(LIVE_GEOFENCE_EVENTS_KEY, [...stamped, ...existing].slice(0, 2000))
}

export function loadLiveRoutes() {
  const rows = readJson(LIVE_ROUTES_KEY, [])
  return Array.isArray(rows) ? filterByOrgScope(rows, getActiveOrgScope()) : []
}

export function saveLiveRoute(route) {
  const rows = readJson(LIVE_ROUTES_KEY, [])
  const next = stamp({
    id: route.id || createId('rt'),
    name: route.name || 'Rota',
    stops: Array.isArray(route.stops) ? route.stops : [],
    geometry: route.geometry || [],
    distanceKm: route.distanceKm || null,
    durationMin: route.durationMin || null,
    entityId: route.entityId || null,
    updatedAt: new Date().toISOString(),
  })
  const idx = rows.findIndex((row) => row.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  writeJson(LIVE_ROUTES_KEY, rows)
  return next
}

export function appendLiveAudit(entry) {
  const rows = readJson(LIVE_AUDIT_KEY, [])
  const next = stamp({
    id: createId('aud'),
    at: new Date().toISOString(),
    ...entry,
  })
  writeJson(LIVE_AUDIT_KEY, [next, ...rows].slice(0, 2000))
  return next
}

export function loadLiveAudit() {
  const rows = readJson(LIVE_AUDIT_KEY, [])
  return Array.isArray(rows) ? filterByOrgScope(rows, getActiveOrgScope()) : []
}

export function loadLiveSettings() {
  return {
    trackingNotice: true,
    autoArrive: false,
    ...readJson(LIVE_SETTINGS_KEY, {}),
  }
}

export function saveLiveSettings(partial) {
  const next = { ...loadLiveSettings(), ...partial }
  writeJson(LIVE_SETTINGS_KEY, next)
  return next
}
