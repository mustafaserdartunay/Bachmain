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
  if (!rateLimit(req, 40))
    return sendJson(res, 429, { error: 'RATE_LIMIT', message: 'Çok fazla istek' })
  if (!hasAnyToken()) return sendJson(res, 503, unavailable())
  try {
    const body = await readJson(req)
    const points = [body.origin, ...(body.waypoints || []), body.destination].filter(Boolean)
    if (points.length < 2)
      return sendJson(res, 400, { error: 'VALIDATION', message: 'Başlangıç ve varış gerekli' })
    const coords = encodeLngLat(points)
    const alt = body.alternatives === false ? 'false' : 'true'
    const data = await mapboxGet(
      `/directions/v5/mapbox/driving-traffic/${coords}?geometries=geojson&overview=full&alternatives=${alt}&language=tr`,
      { kind: 'directions' },
    )
    const routes = (data.routes || []).map((route, index) => ({
      id: `route-${index}`,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry?.coordinates || [],
    }))
    return sendJson(res, 200, { ok: true, routes, code: data.code })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
