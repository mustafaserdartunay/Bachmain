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
    const query = encodeURIComponent(String(body.query || '').trim())
    if (!query) return sendJson(res, 400, { error: 'VALIDATION', message: 'Adres gerekli' })
    const data = await mapboxGet(
      `/geocoding/v5/mapbox.places/${query}.json?limit=5&language=tr&country=TR`,
      {
        kind: 'geocoding',
      },
    )
    return sendJson(res, 200, {
      ok: true,
      features: (data.features || []).map((item) => ({
        id: item.id,
        placeName: item.place_name,
        lng: item.center?.[0],
        lat: item.center?.[1],
      })),
    })
  } catch {
    return sendJson(res, 503, unavailable())
  }
}
