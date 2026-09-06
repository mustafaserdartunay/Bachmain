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
      return sendJson(res, 400, { error: 'VALIDATION', message: 'Koordinat listesi gerekli' })
    const data = await mapboxGet(
      `/directions-matrix/v1/mapbox/driving/${encodeLngLat(coordinates)}?annotations=duration,distance`,
      { kind: 'matrix' },
    )
    return sendJson(res, 200, { ok: true, durations: data.durations, distances: data.distances })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
