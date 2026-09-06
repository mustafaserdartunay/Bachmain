const usage = {
  map: 0,
  geocoding: 0,
  directions: 0,
  matrix: 0,
  optimization: 0,
  matching: 0,
}

const hits = new Map()

export function getPublicToken() {
  return String(
    process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_PUBLIC_TOKEN || '',
  ).trim()
}

export function getSecretToken() {
  return String(process.env.MAPBOX_SECRET_TOKEN || '').trim()
}

export function accessToken() {
  return getSecretToken() || getPublicToken()
}

export function hasAnyToken() {
  return Boolean(accessToken())
}

export function statusPayload() {
  const publicToken = Boolean(getPublicToken())
  const secretToken = Boolean(getSecretToken())
  const ready = publicToken || secretToken
  return {
    ok: true,
    connected: ready,
    hasPublicToken: publicToken,
    hasSecretToken: secretToken,
    services: {
      maps: publicToken,
      geocoding: ready,
      directions: ready,
      matrix: ready,
      optimization: ready,
      matching: ready,
      live: true,
    },
    usage: { ...usage },
  }
}

export function bumpUsage(kind) {
  if (kind in usage) usage[kind] += 1
}

export function rateLimit(req, limit = 60) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local')
    .split(',')[0]
    .trim()
  const now = Date.now()
  const row = hits.get(ip) || { count: 0, start: now }
  if (now - row.start > 60_000) {
    row.count = 0
    row.start = now
  }
  row.count += 1
  hits.set(ip, row)
  return row.count <= limit
}

export function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function coordsParam(list) {
  return list
    .map((item) => {
      const lng = item.lng ?? item[0]
      const lat = item.lat ?? item[1]
      return `${Number(lng)},${Number(lat)}`
    })
    .join(';')
}

export async function mapboxGet(path, { kind } = {}) {
  const token = accessToken()
  if (!token) {
    const error = new Error('MAPBOX_TOKEN_MISSING')
    error.status = 503
    throw error
  }
  const url = new URL(`https://api.mapbox.com${path}`)
  url.searchParams.set('access_token', token)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.message || 'MAPBOX_ERROR')
      error.status = response.status
      throw error
    }
    if (kind) bumpUsage(kind)
    return data
  } finally {
    clearTimeout(timer)
  }
}

export function encodeLngLat(list) {
  return coordsParam(list)
}

export function unavailable() {
  return {
    error: 'MAPBOX_UNAVAILABLE',
    message: 'Harita servisine şu anda ulaşılamıyor.',
  }
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
