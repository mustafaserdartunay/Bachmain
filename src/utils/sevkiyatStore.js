/**
 * Sevkiyat (process) store — multi-stop trips, vehicle types, live tracking tokens.
 * Synced via workspace blob (bach-sevkiyat-* keys).
 */
import {
  buildGoogleMapsDirectionsUrl,
  formatCustomerAddress,
  getCompanyStartPoint,
  getCustomerCoordinates,
  resolveAddressCoordinates,
} from './customerGeo'
import { readCompanySettings } from './companySettings'
import { getCustomerDisplay } from './customerDisplay'
import { getCustomerProfiles } from '../data/customerProfiles'
import {
  permanentlyDeleteRecord,
  restoreDeletedRecord,
  softDeleteRecord,
} from './deletedRecordsStore'

const DELETED_COLLECTION = 'sevkiyat'

const TRIPS_KEY = 'bach-sevkiyat-trips'
const VEHICLE_TYPES_KEY = 'bach-sevkiyat-vehicle-types'
export const SEVKIYAT_EVENT = 'bach:sevkiyat-updated'

export const SEVKIYAT_STATUS = {
  draft: { id: 'draft', label: 'Taslak', tone: 'default' },
  planned: { id: 'planned', label: 'Planlanan', tone: 'primary' },
  in_transit: { id: 'in_transit', label: 'Yolda', tone: 'orange' },
  delivered: { id: 'delivered', label: 'Teslim', tone: 'success' },
  cancelled: { id: 'cancelled', label: 'İptal', tone: 'danger' },
}

const DEFAULT_VEHICLE_TYPES = [
  { id: 'kamyonet', label: 'Kamyonet', color: 'bg-sky-500' },
  { id: 'kamyon', label: 'Kamyon', color: 'bg-blue-500' },
  { id: 'tir', label: 'TIR', color: 'bg-indigo-500' },
  { id: 'panelvan', label: 'Panelvan', color: 'bg-emerald-500' },
]

function notify() {
  window.dispatchEvent(new CustomEvent(SEVKIYAT_EVENT))
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  notify()
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function createTrackingToken() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `ST-${hex}`
}

function nextTripCode(trips = []) {
  const max = trips.reduce((acc, trip) => {
    const match = String(trip.code || '').match(/SVK-(\d+)/i)
    const n = match ? Number(match[1]) : 0
    return Math.max(acc, n)
  }, 0)
  return `SVK-${String(max + 1).padStart(4, '0')}`
}

export function loadVehicleTypes() {
  const saved = readJson(VEHICLE_TYPES_KEY, null)
  if (Array.isArray(saved) && saved.length) return saved
  writeJson(VEHICLE_TYPES_KEY, DEFAULT_VEHICLE_TYPES)
  return [...DEFAULT_VEHICLE_TYPES]
}

export function saveVehicleTypes(types) {
  const next = (Array.isArray(types) ? types : [])
    .map((item) => ({
      id: item.id || createId('vt'),
      label: String(item.label || '').trim(),
      color: item.color || 'bg-gray-500',
    }))
    .filter((item) => item.label)
  writeJson(VEHICLE_TYPES_KEY, next)
  return next
}

export function loadTrips() {
  const trips = readJson(TRIPS_KEY, [])
  return Array.isArray(trips)
    ? trips.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    : []
}

function saveTrips(trips) {
  writeJson(TRIPS_KEY, trips)
}

export function getTrip(tripId) {
  return loadTrips().find((trip) => trip.id === tripId) || null
}

export function getTripByToken(token) {
  if (!token) return null
  return loadTrips().find((trip) => trip.trackingToken === token) || null
}

export function getTripsForCustomer(customerId) {
  if (!customerId) return []
  return loadTrips().filter((trip) =>
    (trip.stops || []).some((stop) => String(stop.customerId) === String(customerId)),
  )
}

export function createEmptyStop(seq = 1) {
  return {
    id: createId('stop'),
    customerId: '',
    customerLabel: '',
    address: '',
    city: '',
    lat: null,
    lng: null,
    goods: [],
    seq,
    status: 'pending',
  }
}

export function createEmptyGood() {
  return {
    id: createId('good'),
    label: '',
    qty: 1,
    unit: 'adet',
    note: '',
  }
}

export function createTripDraft(partial = {}) {
  const trips = loadTrips()
  const types = loadVehicleTypes()
  const hq = getCompanyStartPoint(readCompanySettings())
  return {
    id: createId('trip'),
    code: nextTripCode(trips),
    status: 'draft',
    vehicleTypeId: types[0]?.id || '',
    vehicleTypeLabel: types[0]?.label || '',
    plate: '',
    driverName: '',
    driverPhone: '',
    stops: [createEmptyStop(1)],
    route: { orderedStopIds: [], distanceKm: null, durationMin: null, calculatedAt: null },
    trackingToken: createTrackingToken(),
    sharedWithCustomer: false,
    livePosition: {
      lat: hq.lat,
      lng: hq.lng,
      heading: 0,
      speed: 0,
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    departedAt: null,
    deliveredAt: null,
    _simProgress: 0,
    ...partial,
  }
}

export function upsertTrip(trip) {
  if (!trip?.id) return null
  const trips = loadTrips()
  const index = trips.findIndex((item) => item.id === trip.id)
  const nextTrip = {
    ...trip,
    updatedAt: new Date().toISOString(),
  }
  if (index >= 0) trips[index] = nextTrip
  else trips.unshift(nextTrip)
  saveTrips(trips)
  return nextTrip
}

export function deleteTrip(tripId) {
  const trip = getTrip(tripId)
  if (trip) {
    softDeleteRecord(DELETED_COLLECTION, trip, { entityLabel: trip.code || tripId || 'Sevkiyat' })
  }
  saveTrips(loadTrips().filter((item) => item.id !== tripId))
  return true
}

export function restoreDeletedTrip(tripId) {
  const record = restoreDeletedRecord(DELETED_COLLECTION, tripId)
  if (!record) return null
  const trips = loadTrips()
  if (trips.some((item) => item.id === record.id)) return record
  saveTrips([record, ...trips])
  return record
}

export function permanentlyDeleteTrip(tripId) {
  return permanentlyDeleteRecord(DELETED_COLLECTION, tripId)
}

export function shareTrackingLink(tripId, shared = true) {
  const trip = getTrip(tripId)
  if (!trip) return null
  return upsertTrip({ ...trip, sharedWithCustomer: Boolean(shared) })
}

export function getSevkiyatTrackingUrl(token) {
  if (typeof window === 'undefined') return `/sevkiyat-takip/${token}`
  return `${window.location.origin}/sevkiyat-takip/${token}`
}

export function markTripStatus(tripId, status) {
  const trip = getTrip(tripId)
  if (!trip) return null
  const next = { ...trip, status }
  if (status === 'in_transit' && !trip.departedAt) {
    next.departedAt = new Date().toISOString()
    next._simProgress = 0.05
  }
  if (status === 'delivered') {
    next.deliveredAt = new Date().toISOString()
    next._simProgress = 1
    next.stops = (trip.stops || []).map((stop) => ({ ...stop, status: 'delivered' }))
  }
  return upsertTrip(next)
}

function haversineKm(a, b) {
  if (!a || !b) return 0
  const toRad = (d) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function enrichStopCoordinates(stop) {
  if (stop.lat != null && stop.lng != null) return stop
  const customer = stop.customerId
    ? getCustomerProfiles().find((item) => item.id === stop.customerId)
    : null
  if (customer) {
    const coords = getCustomerCoordinates(customer)
    return {
      ...stop,
      address: stop.address || formatCustomerAddress(customer),
      city: stop.city || customer.city || '',
      lat: coords.lat,
      lng: coords.lng,
      customerLabel:
        stop.customerLabel || getCustomerDisplay(customer).brandShortName || customer.company || '',
    }
  }
  const coords = resolveAddressCoordinates(
    `${stop.address || ''} ${stop.city || ''}`,
    stop.id || 'stop',
  )
  return { ...stop, lat: coords.lat, lng: coords.lng }
}

/** Nearest-neighbor route order from company HQ through all stops. */
export function calculateRouteForTrip(trip) {
  const hq = getCompanyStartPoint(readCompanySettings())
  const stops = (trip.stops || []).map(enrichStopCoordinates).filter((s) => s.lat != null)
  if (!stops.length) {
    return {
      trip: { ...trip, stops },
      mapsUrl: null,
    }
  }

  const remaining = [...stops]
  const ordered = []
  let current = { lat: hq.lat, lng: hq.lng }
  let totalKm = 0

  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    remaining.forEach((stop, index) => {
      const d = haversineKm(current, stop)
      if (d < bestDist) {
        bestDist = d
        bestIdx = index
      }
    })
    const next = remaining.splice(bestIdx, 1)[0]
    totalKm += bestDist
    ordered.push({ ...next, seq: ordered.length + 1 })
    current = next
  }

  const durationMin = Math.max(15, Math.round((totalKm / 35) * 60))
  const nextTrip = {
    ...trip,
    stops: ordered,
    route: {
      orderedStopIds: ordered.map((s) => s.id),
      distanceKm: Math.round(totalKm * 10) / 10,
      durationMin,
      calculatedAt: new Date().toISOString(),
    },
  }

  const origin = hq.label || `${hq.lat},${hq.lng}`
  const destination = ordered[ordered.length - 1]
  const waypoints = ordered.slice(0, -1).map((s) => s.address || `${s.lat},${s.lng}`)
  const mapsUrl = buildGoogleMapsDirectionsUrl({
    origin,
    destination: destination.address || `${destination.lat},${destination.lng}`,
    waypoints,
  })

  return { trip: nextTrip, mapsUrl }
}

function interpolatePosition(from, to, progress) {
  const p = Math.max(0, Math.min(1, progress))
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lng: from.lng + (to.lng - from.lng) * p,
    heading: 90 + p * 90,
    speed: 35 + Math.round(Math.random() * 12),
    updatedAt: new Date().toISOString(),
  }
}

/** Simulate live vehicle movement along stop sequence for in_transit trips. */
export function tickSevkiyatLivePositions() {
  const hq = getCompanyStartPoint(readCompanySettings())
  const trips = loadTrips()
  let changed = false

  const nextTrips = trips.map((trip) => {
    if (trip.status !== 'in_transit') return trip
    const stops = (trip.stops || []).map(enrichStopCoordinates)
    if (!stops.length) return trip

    const progress = trip._simProgress ?? 0.08
    const nextProgress = Math.min(0.98, progress + 0.01 + Math.random() * 0.008)
    const segmentCount = stops.length
    const scaled = nextProgress * segmentCount
    const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaled))
    const segmentT = scaled - segmentIndex
    const from = segmentIndex === 0 ? hq : stops[segmentIndex - 1]
    const to = stops[segmentIndex]
    const livePosition = interpolatePosition(from, to, segmentT)

    const routeGeometry = [[hq.lat, hq.lng], ...stops.map((s) => [s.lat, s.lng])]

    if (nextProgress !== progress) changed = true
    return {
      ...trip,
      stops,
      _simProgress: nextProgress,
      livePosition,
      routeGeometry,
    }
  })

  if (changed) saveTrips(nextTrips)
  return changed
}

export function getSevkiyatSummary(trips = loadTrips()) {
  return {
    total: trips.length,
    planned: trips.filter((t) => t.status === 'planned' || t.status === 'draft').length,
    inTransit: trips.filter((t) => t.status === 'in_transit').length,
    delivered: trips.filter((t) => t.status === 'delivered').length,
    cancelled: trips.filter((t) => t.status === 'cancelled').length,
  }
}

export function saveTripRouteSnapshot(tripId, snapshot, extras = {}) {
  const trip = getTrip(tripId)
  if (!trip) return null
  return upsertTrip({
    ...trip,
    routeSnapshot: snapshot || null,
    routeAlternatives: extras.alternatives || trip.routeAlternatives || [],
    routePreferences: extras.preferences || trip.routePreferences || trip.routePreferences,
    route: {
      ...(trip.route || {}),
      distanceKm:
        snapshot?.distanceMeters != null
          ? Math.round((snapshot.distanceMeters / 1000) * 10) / 10
          : (trip.route?.distanceKm ?? null),
      durationMin:
        snapshot?.durationSec != null
          ? Math.round(snapshot.durationSec / 60)
          : (trip.route?.durationMin ?? null),
      calculatedAt: snapshot?.computedAt || new Date().toISOString(),
      source: snapshot?.source || trip.route?.source || null,
    },
  })
}

export function saveTripRoutePreferences(tripId, preferences) {
  const trip = getTrip(tripId)
  if (!trip) return null
  return upsertTrip({
    ...trip,
    routePreferences: {
      avoidTolls: Boolean(preferences?.avoidTolls),
      avoidHighways: Boolean(preferences?.avoidHighways),
      avoidFerries: Boolean(preferences?.avoidFerries),
    },
  })
}

export function reorderTripStops(tripId, orderedIds) {
  const trip = getTrip(tripId)
  if (!trip) return null
  const byId = new Map((trip.stops || []).map((stop) => [stop.id, stop]))
  const next = orderedIds
    .map((id, index) => {
      const stop = byId.get(id)
      return stop ? { ...stop, seq: index + 1 } : null
    })
    .filter(Boolean)
  const leftover = (trip.stops || []).filter((stop) => !orderedIds.includes(stop.id))
  leftover.forEach((stop) => next.push({ ...stop, seq: next.length + 1 }))
  return upsertTrip({
    ...trip,
    stops: next,
    routeDirty: true,
  })
}

export function updateTripStop(tripId, stopId, patch) {
  const trip = getTrip(tripId)
  if (!trip) return null
  return upsertTrip({
    ...trip,
    stops: (trip.stops || []).map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop)),
  })
}

export function appendTripEvent(tripId, event) {
  const trip = getTrip(tripId)
  if (!trip) return null
  const entry = {
    id: createId('evt'),
    at: event?.at || new Date().toISOString(),
    type: event?.type || 'note',
    label: event?.label || '',
    detail: event?.detail || '',
  }
  return upsertTrip({
    ...trip,
    events: [entry, ...(trip.events || [])].slice(0, 200),
    statusHistory: [
      {
        id: entry.id,
        at: entry.at,
        status: event?.status || trip.status,
        label: entry.label,
      },
      ...(trip.statusHistory || []),
    ].slice(0, 200),
  })
}

export function appendTripNote(tripId, note) {
  const trip = getTrip(tripId)
  if (!trip) return null
  const entry = {
    id: createId('note'),
    at: note?.at || new Date().toISOString(),
    authorType: note?.authorType || 'ops',
    authorLabel: note?.authorLabel || 'Lojistik sorumlusu',
    text: String(note?.text || '').trim(),
  }
  if (!entry.text) return trip
  return upsertTrip({
    ...trip,
    opsNotes: [entry, ...(trip.opsNotes || [])].slice(0, 200),
  })
}
