import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateLocationSample,
  isSameSample,
  filterByCompany,
} from '../../src/live/validateLocation.js'
import {
  isInsideGeofence,
  detectGeofenceTransitions,
  haversineMeters,
} from '../../src/live/geofence.js'
import { remainingEta, isOffRoute } from '../../src/live/eta.js'

test('location validation rejects out of range and accepts tenant sample', () => {
  const bad = validateLocationSample({
    latitude: 200,
    longitude: 29,
    entityId: 'e1',
    companyId: 'c1',
  })
  assert.equal(bad.ok, false)
  const good = validateLocationSample({
    lat: 41.01,
    lng: 29.05,
    entityId: 'e1',
    companyId: 'c1',
    timestamp: '2026-09-06T08:00:00.000Z',
  })
  assert.equal(good.ok, true)
  assert.equal(good.sample.companyId, 'c1')
})

test('idempotency key matches duplicate samples', () => {
  const a = { entityId: 'e1', timestamp: 't1', latitude: 1, longitude: 2, idempotencyKey: 'e1:t1' }
  const b = { entityId: 'e1', timestamp: 't1', latitude: 1, longitude: 2, idempotencyKey: 'e1:t1' }
  assert.equal(isSameSample(a, b), true)
})

test('tenant filter hides other company rows', () => {
  const rows = [
    { id: '1', companyId: 'a' },
    { id: '2', companyId: 'b' },
  ]
  assert.deepEqual(
    filterByCompany(rows, 'a').map((r) => r.id),
    ['1'],
  )
})

test('geofence circle entry and dwell', () => {
  const fence = {
    id: 'depo',
    name: 'Depo',
    shape: 'circle',
    center: { lat: 41, lng: 29 },
    radiusMeters: 200,
  }
  assert.equal(isInsideGeofence({ lat: 41.0005, lng: 29 }, fence), true)
  assert.equal(isInsideGeofence({ lat: 42, lng: 29 }, fence), false)
  const { events } = detectGeofenceTransitions({
    previous: { depo: false },
    next: { lat: 41.0005, lng: 29 },
    fences: [fence],
  })
  assert.equal(events[0].type, 'ENTRY')
})

test('ETA and off-route', () => {
  const eta = remainingEta({
    from: { lat: 41.01, lng: 29.0 },
    to: { lat: 41.02, lng: 29.01 },
    speedMps: 10,
  })
  assert.ok(eta.distanceKm > 0)
  assert.ok(eta.remainingMin >= 1)
  assert.equal(
    isOffRoute({ lat: 42, lng: 30 }, [
      { lat: 41, lng: 29 },
      { lat: 41.01, lng: 29.01 },
    ]),
    true,
  )
})

test('haversine is finite', () => {
  assert.ok(haversineMeters({ lat: 41, lng: 29 }, { lat: 41.01, lng: 29.01 }) > 0)
})
