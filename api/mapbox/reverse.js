import {
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
  if (!rateLimit(req))
    return sendJson(res, 429, { error: 'RATE_LIMIT', message: 'Çok fazla istek' })
  if (!hasAnyToken()) return sendJson(res, 503, unavailable())
  try {
    const body = await readJson(req)
    const lng = Number(body.lng)
    const lat = Number(body.lat)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return sendJson(res, 400, { error: 'VALIDATION', message: 'Koordinat gerekli' })
    }
    const data = await mapboxGet(
      `/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&language=tr`,
      {
        kind: 'geocoding',
      },
    )
    const feature = data.features?.[0]
    return sendJson(res, 200, {
      ok: true,
      placeName: feature?.place_name || null,
      lng: feature?.center?.[0] ?? lng,
      lat: feature?.center?.[1] ?? lat,
    })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
