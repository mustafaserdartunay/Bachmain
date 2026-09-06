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
      return sendJson(res, 400, { error: 'VALIDATION', message: 'İz noktası gerekli' })
    const data = await mapboxGet(
      `/matching/v5/mapbox/driving/${encodeLngLat(coordinates)}?geometries=geojson&overview=full`,
      { kind: 'matching' },
    )
    const match = data.matchings?.[0]
    return sendJson(res, 200, {
      ok: true,
      confidence: match?.confidence ?? null,
      geometry: match?.geometry?.coordinates || [],
      distanceKm: match ? Math.round((match.distance / 1000) * 10) / 10 : null,
    })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
