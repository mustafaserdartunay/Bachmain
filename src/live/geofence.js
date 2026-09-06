function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(h))
}

function pointInCircle(point, fence) {
  const center = fence.center || { lat: fence.lat, lng: fence.lng }
  return haversineMeters(point, center) <= Number(fence.radiusMeters || 0)
}

function pointInPolygon(point, fence) {
  const ring = fence.polygon || fence.coordinates || []
  if (ring.length < 3) return false
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i].lng ?? ring[i][0]
    const yi = ring[i].lat ?? ring[i][1]
    const xj = ring[j].lng ?? ring[j][0]
    const yj = ring[j].lat ?? ring[j][1]
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function isInsideGeofence(point, fence) {
  if (!point || !fence) return false
  const kind = fence.shape || (fence.radiusMeters ? 'circle' : 'polygon')
  if (kind === 'circle') return pointInCircle(point, fence)
  return pointInPolygon(point, fence)
}

export function detectGeofenceTransitions({
  previous,
  next,
  fences,
  now = Date.now(),
  dwellMs = 10 * 60 * 1000,
}) {
  const events = []
  const prevMap = previous instanceof Map ? previous : new Map(Object.entries(previous || {}))
  const nextMap = new Map()

  for (const fence of fences || []) {
    const inside = isInsideGeofence(next, fence)
    nextMap.set(fence.id, inside)
    const wasInside = Boolean(prevMap.get(fence.id))
    if (inside && !wasInside) {
      events.push({
        type: 'ENTRY',
        fenceId: fence.id,
        fenceName: fence.name,
        at: new Date(now).toISOString(),
      })
    } else if (!inside && wasInside) {
      events.push({
        type: 'EXIT',
        fenceId: fence.id,
        fenceName: fence.name,
        at: new Date(now).toISOString(),
      })
    }
  }

  const enteredAt = Number(next.enteredAt || 0)
  if (next.fenceId && enteredAt && now - enteredAt >= dwellMs) {
    const fence = (fences || []).find((item) => item.id === next.fenceId)
    if (fence) {
      events.push({
        type: 'DWELL',
        fenceId: fence.id,
        fenceName: fence.name,
        minutes: Math.round((now - enteredAt) / 60000),
        at: new Date(now).toISOString(),
      })
    }
  }

  return { events, insideMap: nextMap }
}

export function formatGeofenceEvent(event, actorName) {
  const who = actorName || 'Kayıt'
  if (event.type === 'ENTRY') return `${who} ${event.fenceName || 'bölgeye'} giriş yaptı.`
  if (event.type === 'EXIT') return `${who} ${event.fenceName || 'bölgeden'} ayrıldı.`
  if (event.type === 'DWELL') {
    return `${who} ${event.fenceName || 'bölgede'} ${event.minutes || 0} dakika bekledi.`
  }
  return `${who} konum olayı.`
}
