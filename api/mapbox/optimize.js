import {
  encodeLngLat,
  handleOptions,
  hasAnyToken,
  mapboxGet,
  rateLimit,
  readJson,
  sendJson,
  unavailable,
} from './_lib.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' })
  }
  if (!rateLimit(req, 20))
    return sendJson(res, 429, { error: 'RATE_LIMIT', message: 'Çok fazla istek' })
  if (!hasAnyToken()) return sendJson(res, 503, unavailable())
  try {
    const body = await readJson(req)
    const coordinates = body.coordinates || []
    if (coordinates.length < 2)
      return sendJson(res, 400, { error: 'VALIDATION', message: 'Durak listesi gerekli' })
    const roundtrip = body.roundtrip ? 'true' : 'false'
    const data = await mapboxGet(
      `/optimized-trips/v1/mapbox/driving/${encodeLngLat(coordinates)}?geometries=geojson&overview=full&roundtrip=${roundtrip}&source=first&destination=last`,
      { kind: 'optimization' },
    )
    const trip = data.trips?.[0]
    return sendJson(res, 200, {
      ok: true,
      waypointOrder: (data.waypoints || []).map((item) => item.waypoint_index),
      distanceKm: trip ? Math.round((trip.distance / 1000) * 10) / 10 : null,
      durationMin: trip ? Math.round(trip.duration / 60) : null,
      geometry: trip?.geometry?.coordinates || [],
    })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
