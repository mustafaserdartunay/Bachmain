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
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }
  if (!rateLimit(req, 20))
    return sendJson(res, 429, { error: 'RATE_LIMIT', message: 'Çok fazla istek' })
  if (!hasAnyToken()) return sendJson(res, 503, unavailable())

  try {
    const body = req.method === 'POST' ? await readJson(req) : {}
    const query = encodeURIComponent(body.query || 'Istanbul')
    const geocode = await mapboxGet(
      `/geocoding/v5/mapbox.places/${query}.json?limit=1&language=tr`,
      {
        kind: 'geocoding',
      },
    )
    const feature = geocode.features?.[0]
    const center = feature?.center
    const reverse = center
      ? await mapboxGet(
          `/geocoding/v5/mapbox.places/${center[0]},${center[1]}.json?limit=1&language=tr`,
          {
            kind: 'geocoding',
          },
        )
      : null
    const origin = '28.97953,41.015137'
    const dest = center ? `${center[0]},${center[1]}` : '29.0576,40.9819'
    const route = await mapboxGet(
      `/directions/v5/mapbox/driving/${origin};${dest}?overview=false&alternatives=false&geometries=geojson`,
      { kind: 'directions' },
    )
    const matrix = await mapboxGet(
      `/directions-matrix/v1/mapbox/driving/${origin};${dest}?annotations=duration,distance`,
      { kind: 'matrix' },
    )
    return sendJson(res, 200, {
      ok: true,
      geocoding: Boolean(feature),
      reverseGeocoding: Boolean(reverse?.features?.[0]),
      route: Boolean(route.routes?.[0]),
      matrix: Boolean(matrix.durations),
      map: true,
    })
  } catch (error) {
    return sendJson(res, error.status || 503, unavailable())
  }
}
