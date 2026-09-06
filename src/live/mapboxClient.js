const cache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000

function cacheGet(key) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value })
  return value
}

async function proxy(path, body) {
  const response = await fetch(`/api/mapbox/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Harita servisine şu anda ulaşılamıyor.')
    error.code = data.error || 'MAPBOX_UNAVAILABLE'
    error.status = response.status
    throw error
  }
  return data
}

export async function fetchMapboxStatus() {
  try {
    return await proxy('status')
  } catch {
    return {
      ok: false,
      connected: false,
      hasPublicToken: false,
      hasSecretToken: false,
      services: {},
    }
  }
}

export async function testMapboxConnection() {
  return proxy('test', {})
}

export async function geocodeAddress(query) {
  const key = `geo:${query}`
  const cached = cacheGet(key)
  if (cached) return cached
  const data = await proxy('geocode', { query })
  return cacheSet(key, data)
}

export async function reverseGeocode({ lat, lng }) {
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`
  const cached = cacheGet(key)
  if (cached) return cached
  const data = await proxy('reverse', { lat, lng })
  return cacheSet(key, data)
}

export async function fetchDirections({
  origin,
  destination,
  waypoints = [],
  alternatives = true,
}) {
  return proxy('directions', { origin, destination, waypoints, alternatives })
}

export async function fetchMatrix({ coordinates }) {
  return proxy('matrix', { coordinates })
}

export async function optimizeStops({ coordinates, roundtrip = false }) {
  return proxy('optimize', { coordinates, roundtrip })
}

export async function matchTrace({ coordinates }) {
  return proxy('match', { coordinates })
}
