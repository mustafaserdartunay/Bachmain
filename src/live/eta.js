import { haversineMeters } from './geofence.js'

export function remainingEta({ from, to, speedMps, durationSec }) {
  if (!from || !to) return { distanceKm: null, remainingMin: null, etaClock: null }
  const meters = haversineMeters(from, to)
  const distanceKm = Math.round((meters / 1000) * 10) / 10
  let remainingMin = durationSec != null ? Math.round(durationSec / 60) : null
  const speed = Number(speedMps)
  if (remainingMin == null && Number.isFinite(speed) && speed > 0.5) {
    remainingMin = Math.max(1, Math.round(meters / speed / 60))
  }
  const etaClock =
    remainingMin != null
      ? new Date(Date.now() + remainingMin * 60000).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null
  return { distanceKm, remainingMin, etaClock }
}

export function isOffRoute(point, polyline = [], thresholdMeters = 120) {
  if (!point || polyline.length < 2) return false
  let min = Infinity
  for (let i = 1; i < polyline.length; i += 1) {
    const a = polyline[i - 1]
    const b = polyline[i]
    const mid = {
      lat: (Number(a.lat ?? a[1]) + Number(b.lat ?? b[1])) / 2,
      lng: (Number(a.lng ?? a[0]) + Number(b.lng ?? b[0])) / 2,
    }
    min = Math.min(min, haversineMeters(point, { lat: Number(mid.lat), lng: Number(mid.lng) }))
  }
  return min > thresholdMeters
}
