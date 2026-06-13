import { getCustomerCoordinates } from './customerGeo'

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/** Nearest-neighbor TSP — başlangıç noktasından kısa rota sırası */
export function optimizeStopOrder(startPoint, customers) {
  const remaining = [...customers]
  const ordered = []
  let current = startPoint

  while (remaining.length) {
    let bestIndex = 0
    let bestDistance = Infinity
    remaining.forEach((customer, index) => {
      const coords = getCustomerCoordinates(customer)
      const distance = haversineKm(current, coords)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })
    const next = remaining.splice(bestIndex, 1)[0]
    ordered.push(next)
    current = getCustomerCoordinates(next)
  }

  return ordered
}

export function estimateRouteDistanceKm(startPoint, orderedCustomers) {
  if (!orderedCustomers.length) return 0
  let total = 0
  let current = startPoint
  orderedCustomers.forEach((customer) => {
    const coords = getCustomerCoordinates(customer)
    total += haversineKm(current, coords)
    current = coords
  })
  return Math.round(total * 10) / 10
}

export async function fetchOsrmRouteGeometry(startPoint, orderedCustomers) {
  const points = [startPoint, ...orderedCustomers.map(getCustomerCoordinates)]
  if (points.length < 2) return { geometry: [], distanceKm: 0, durationMin: 0 }

  const coordString = points.map((point) => `${point.lng},${point.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('OSRM failed')
    const data = await response.json()
    const route = data.routes?.[0]
    if (!route) return { geometry: [], distanceKm: 0, durationMin: 0 }
    return {
      geometry: route.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || [],
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
    }
  } catch {
    return {
      geometry: points.map((point) => [point.lat, point.lng]),
      distanceKm: estimateRouteDistanceKm(startPoint, orderedCustomers),
      durationMin: 0,
    }
  }
}
