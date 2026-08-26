/**
 * Google Routes API client — computeRoutes (JS Routes library, then REST).
 * Does not use DirectionsService. Caches by request hash. Never invents ETA.
 */

import { getGoogleMapsBrowserKey, importGoogleMapsLibraries } from './googleMapsLoader'

const CACHE_KEY = 'bach-truck-route-cache'
const CACHE_LIMIT = 24
const FIELD_MASK = [
  'routes.distanceMeters',
  'routes.duration',
  'routes.staticDuration',
  'routes.polyline.encodedPolyline',
  'routes.legs.distanceMeters',
  'routes.legs.duration',
  'routes.legs.staticDuration',
  'routes.legs.polyline.encodedPolyline',
  'routes.travelAdvisory',
  'routes.routeLabels',
].join(',')

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCache(entries) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, CACHE_LIMIT)))
}

export function hashRouteRequest(input) {
  return JSON.stringify({
    origin: roundPoint(input.origin),
    destination: roundPoint(input.destination),
    intermediates: (input.intermediates || []).map(roundPoint),
    avoidTolls: Boolean(input.avoidTolls),
    avoidHighways: Boolean(input.avoidHighways),
    avoidFerries: Boolean(input.avoidFerries),
    vehicle: {
      weightKg: Number(input.vehicle?.weightKg) || 0,
      heightM: Number(input.vehicle?.heightM) || 0,
      widthM: Number(input.vehicle?.widthM) || 0,
      lengthM: Number(input.vehicle?.lengthM) || 0,
    },
    alternatives: Boolean(input.computeAlternativeRoutes),
  })
}

function roundPoint(point) {
  if (!point) return null
  return {
    lat: Number(Number(point.lat).toFixed(5)),
    lng: Number(Number(point.lng).toFixed(5)),
  }
}

export function getCachedRoute(requestHash) {
  const hit = readCache().find((row) => row.hash === requestHash)
  return hit?.result || null
}

function putCachedRoute(requestHash, result) {
  const next = [
    { hash: requestHash, result, at: new Date().toISOString() },
    ...readCache().filter((row) => row.hash !== requestHash),
  ]
  writeCache(next)
}

function parseDurationSeconds(value) {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e6 ? Math.round(value / 1000) : Math.round(value)
  }
  const text = String(value)
  const seconds = text.match(/^(\d+(?:\.\d+)?)s$/)
  if (seconds) return Math.round(Number(seconds[1]))
  const millis = text.match(/^(\d+(?:\.\d+)?)ms$/)
  if (millis) return Math.round(Number(millis[1]) / 1000)
  const asNumber = Number(text)
  if (Number.isFinite(asNumber)) return Math.round(asNumber)
  return null
}

function toLatLngLiteral(point) {
  return { lat: Number(point.lat), lng: Number(point.lng) }
}

function toLatLngDto(point) {
  return { latitude: Number(point.lat), longitude: Number(point.lng) }
}

function normalizeRoute(raw, index = 0) {
  if (!raw) return null
  const distanceMeters =
    raw.distanceMeters == null && raw.distance?.meters == null
      ? null
      : Number(raw.distanceMeters ?? raw.distance?.meters)
  const durationSec = parseDurationSeconds(raw.duration ?? raw.durationMillis)
  const staticDurationSec = parseDurationSeconds(raw.staticDuration ?? raw.staticDurationMillis)
  const encodedPolyline =
    raw.polyline?.encodedPolyline ||
    raw.polyline?.encodedPath ||
    (typeof raw.polyline === 'string' ? raw.polyline : '') ||
    ''

  const legs = Array.isArray(raw.legs)
    ? raw.legs.map((leg, legIndex) => ({
        index: legIndex,
        distanceMeters: Number(leg.distanceMeters) || null,
        durationSec: parseDurationSeconds(leg.duration ?? leg.durationMillis),
        staticDurationSec: parseDurationSeconds(leg.staticDuration ?? leg.staticDurationMillis),
        encodedPolyline: leg.polyline?.encodedPolyline || '',
      }))
    : []

  const trafficDeltaSec =
    durationSec != null && staticDurationSec != null ? durationSec - staticDurationSec : null

  return {
    index,
    label:
      index === 0 ? 'Rota A' : index === 1 ? 'Rota B' : `Rota ${String.fromCharCode(65 + index)}`,
    distanceMeters,
    durationSec,
    staticDurationSec,
    trafficDeltaSec,
    encodedPolyline,
    legs,
    travelAdvisory: raw.travelAdvisory || null,
    routeLabels: raw.routeLabels || [],
    source: 'google-routes',
  }
}

function normalizeComputeResponse(payload) {
  const routes = Array.isArray(payload?.routes)
    ? payload.routes.map(normalizeRoute).filter(Boolean)
    : []
  return {
    ok: routes.length > 0,
    routes,
    primary: routes[0] || null,
    computedAt: new Date().toISOString(),
    error: routes.length ? null : 'empty',
  }
}

async function computeViaJsLibrary(input) {
  const { routes, google } = await importGoogleMapsLibraries()
  const RouteCtor = routes?.Route || google?.maps?.routes?.Route
  if (typeof RouteCtor?.computeRoutes !== 'function') {
    throw new Error('Route.computeRoutes kullanılamıyor.')
  }

  const request = {
    origin: toLatLngLiteral(input.origin),
    destination: toLatLngLiteral(input.destination),
    intermediates: (input.intermediates || []).map(toLatLngLiteral),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: Boolean(input.computeAlternativeRoutes),
    languageCode: 'tr-TR',
    units: 'METRIC',
    routeModifiers: {
      avoidTolls: Boolean(input.avoidTolls),
      avoidHighways: Boolean(input.avoidHighways),
      avoidFerries: Boolean(input.avoidFerries),
      vehicleInfo: {
        emissionType: 'DIESEL',
        ...(Number(input.vehicle?.heightM) > 0 ? { height: Number(input.vehicle.heightM) } : {}),
        ...(Number(input.vehicle?.widthM) > 0 ? { width: Number(input.vehicle.widthM) } : {}),
        ...(Number(input.vehicle?.lengthM) > 0 ? { length: Number(input.vehicle.lengthM) } : {}),
        ...(Number(input.vehicle?.weightKg) > 0
          ? { weightKg: Number(input.vehicle.weightKg) }
          : {}),
      },
    },
    fields: [
      'path',
      'distanceMeters',
      'durationMillis',
      'staticDurationMillis',
      'legs',
      'routeLabels',
    ],
  }

  const response = await RouteCtor.computeRoutes(request)
  const list = Array.isArray(response?.routes)
    ? response.routes
    : Array.isArray(response)
      ? response
      : response
        ? [response]
        : []

  const mapped = list.map((item, index) => {
    if (item && (item.distanceMeters != null || item.polyline || item.legs)) {
      return normalizeRoute(item, index)
    }
    const path = typeof item?.path === 'function' ? item.path() : item?.path
    const encoded = item?.polyline?.encodedPolyline || (Array.isArray(path) ? '' : '')
    return normalizeRoute(
      {
        distanceMeters: item?.distanceMeters,
        duration: item?.durationMillis ?? item?.duration,
        staticDuration: item?.staticDurationMillis ?? item?.staticDuration,
        polyline: { encodedPolyline: encoded },
        legs: item?.legs,
        routeLabels: item?.routeLabels,
      },
      index,
    )
  })

  return {
    ok: mapped.length > 0,
    routes: mapped,
    primary: mapped[0] || null,
    computedAt: new Date().toISOString(),
    error: mapped.length ? null : 'empty',
    via: 'js-library',
  }
}

async function computeViaRest(input) {
  const key = getGoogleMapsBrowserKey()
  if (!key) throw new Error('Google Maps API anahtarı bulunamadı.')

  const body = {
    origin: { location: { latLng: toLatLngDto(input.origin) } },
    destination: { location: { latLng: toLatLngDto(input.destination) } },
    intermediates: (input.intermediates || []).map((point) => ({
      location: { latLng: toLatLngDto(point) },
    })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: Boolean(input.computeAlternativeRoutes),
    languageCode: 'tr-TR',
    units: 'METRIC',
    extraComputations: ['TOLLS'],
    routeModifiers: {
      avoidTolls: Boolean(input.avoidTolls),
      avoidHighways: Boolean(input.avoidHighways),
      avoidFerries: Boolean(input.avoidFerries),
      vehicleInfo: {
        emissionType: 'DIESEL',
        ...(Number(input.vehicle?.heightM) > 0 ? { height: Number(input.vehicle.heightM) } : {}),
        ...(Number(input.vehicle?.widthM) > 0 ? { width: Number(input.vehicle.widthM) } : {}),
        ...(Number(input.vehicle?.lengthM) > 0 ? { length: Number(input.vehicle.lengthM) } : {}),
        ...(Number(input.vehicle?.weightKg) > 0
          ? { weightKg: Number(input.vehicle.weightKg) }
          : {}),
      },
    },
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.warn('[truck-control] Routes REST', response.status, text)
    throw new Error('Rota servisine şu anda ulaşılamıyor.')
  }

  const payload = await response.json()
  return { ...normalizeComputeResponse(payload), via: 'rest' }
}

/**
 * @param {object} input
 * @param {{ force?: boolean }} [options]
 */
export async function computeGoogleTruckRoute(input, options = {}) {
  if (!input?.origin || !input?.destination) {
    return { ok: false, routes: [], primary: null, error: 'missing-points', computedAt: null }
  }

  const hash = hashRouteRequest(input)
  if (!options.force) {
    const cached = getCachedRoute(hash)
    if (cached?.ok && cached.primary) {
      return { ...cached, cached: true, requestHash: hash }
    }
  }

  let result
  try {
    result = await computeViaJsLibrary(input)
  } catch (jsError) {
    console.warn('[truck-control] JS computeRoutes', jsError)
    try {
      result = await computeViaRest(input)
    } catch (restError) {
      console.warn('[truck-control] REST computeRoutes', restError)
      const cached = getCachedRoute(hash)
      if (cached?.ok) {
        return {
          ...cached,
          cached: true,
          stale: true,
          requestHash: hash,
          error: 'Rota servisine şu anda ulaşılamıyor.',
        }
      }
      return {
        ok: false,
        routes: [],
        primary: null,
        error: 'Rota servisine şu anda ulaşılamıyor.',
        computedAt: null,
        requestHash: hash,
      }
    }
  }

  const stored = { ...result, requestHash: hash }
  if (stored.ok) putCachedRoute(hash, stored)
  return stored
}

/** Google encoded polyline decoder */
export function decodeEncodedPolyline(encoded) {
  if (!encoded) return []
  const points = []
  let index = 0
  let lat = 0
  let lng = 0
  const str = String(encoded)

  while (index < str.length) {
    let result = 0
    let shift = 0
    let byte
    do {
      byte = str.charCodeAt(index) - 63
      index += 1
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    result = 0
    shift = 0
    do {
      byte = str.charCodeAt(index) - 63
      index += 1
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

export function formatDurationLabel(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return null
  const total = Math.max(0, Math.round(Number(seconds)))
  const hours = Math.floor(total / 3600)
  const minutes = Math.round((total % 3600) / 60)
  if (hours <= 0) return `${minutes} dk`
  return `${hours} sa ${minutes} dk`
}

export function formatKmLabel(meters) {
  if (meters == null || !Number.isFinite(Number(meters))) return null
  const km = Number(meters) / 1000
  if (km < 10) return `${km.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`
  return `${Math.round(km).toLocaleString('tr-TR')} km`
}

export function etaClockFromDuration(seconds, from = new Date()) {
  if (seconds == null || !Number.isFinite(Number(seconds))) return null
  const date = new Date(from.getTime() + Number(seconds) * 1000)
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export const etaClockFromSeconds = etaClockFromDuration

/** Compat alias used by Tır Sevkiyat detay sayfası */
export async function computeGoogleTruckRoutes(input = {}, options = {}) {
  const result = await computeGoogleTruckRoute(
    {
      origin: input.origin,
      destination: input.destination,
      intermediates: input.waypoints || input.intermediates || [],
      avoidTolls: Boolean(input.modifiers?.avoidTolls ?? input.avoidTolls),
      avoidHighways: Boolean(input.modifiers?.avoidHighways ?? input.avoidHighways),
      avoidFerries: Boolean(input.modifiers?.avoidFerries ?? input.avoidFerries),
      computeAlternativeRoutes: Boolean(input.alternatives ?? input.computeAlternativeRoutes),
      vehicle: input.vehicle,
    },
    options,
  )
  const routes = (result.routes || []).map((route, index) => ({
    ...route,
    id: route.id || `route-${index}`,
    trafficExtraSec: route.trafficDeltaSec,
  }))
  if (!result.ok) {
    const error = new Error(result.error || 'Rota servisine şu anda ulaşılamıyor.')
    error.fromCache = Boolean(result.cached)
    error.routes = routes
    throw error
  }
  return {
    routes,
    fromCache: Boolean(result.cached),
    stale: Boolean(result.stale),
    requestHash: result.requestHash,
  }
}
