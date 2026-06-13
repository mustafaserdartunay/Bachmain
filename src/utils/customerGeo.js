/** Türkiye il/ilçe merkez koordinatları — harita için yaklaşık konum */
const CITY_COORDS = {
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'Tuzla': { lat: 40.8175, lng: 29.3009 },
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'Ostim': { lat: 39.9678, lng: 32.7459 },
  'İzmir': { lat: 38.4192, lng: 27.1287 },
  'Kemalpaşa': { lat: 38.4302, lng: 27.4208 },
  'Bursa': { lat: 40.1885, lng: 29.0610 },
  'Nilüfer': { lat: 40.2100, lng: 28.9900 },
  'Kocaeli': { lat: 40.8533, lng: 29.8815 },
  'Gebze': { lat: 40.8028, lng: 29.4308 },
  'Kadıköy': { lat: 40.9819, lng: 29.0576 },
}

function hashOffset(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return ((hash % 1000) / 1000 - 0.5) * 0.08
}

export function parseCityParts(city = '') {
  const parts = String(city).split('/').map((part) => part.trim()).filter(Boolean)
  return {
    province: parts[0] || '',
    district: parts[1] || parts[0] || '',
  }
}

export function resolveCityCoordinates(city = '', customerId = '') {
  const { province, district } = parseCityParts(city)
  const base = CITY_COORDS[district] || CITY_COORDS[province] || CITY_COORDS.İstanbul
  const lat = base.lat + hashOffset(`${customerId}-lat-${district}`)
  const lng = base.lng + hashOffset(`${customerId}-lng-${district}`)
  return { lat, lng }
}

export function getCustomerCoordinates(customer) {
  if (customer?.lat != null && customer?.lng != null) {
    return { lat: Number(customer.lat), lng: Number(customer.lng) }
  }
  return resolveCityCoordinates(customer?.city, customer?.id)
}

export function resolveAddressCoordinates(address = '', seed = 'company') {
  const text = String(address).toLocaleLowerCase('tr-TR')
  const entries = Object.entries(CITY_COORDS).sort((a, b) => b[0].length - a[0].length)
  for (const [name, coords] of entries) {
    if (text.includes(name.toLocaleLowerCase('tr-TR'))) {
      return {
        lat: coords.lat + hashOffset(`${seed}-lat-${name}`),
        lng: coords.lng + hashOffset(`${seed}-lng-${name}`),
      }
    }
  }
  return resolveCityCoordinates('İstanbul / Kadıköy', seed)
}

export function getCompanyStartPoint(settings) {
  const address = settings?.address || ''
  const coords = resolveAddressCoordinates(address, 'company')
  return {
    ...coords,
    source: 'company',
    label: address || 'Firma adresi',
  }
}

export function formatCustomerAddress(customer) {
  const parts = [customer?.address, customer?.city].filter(Boolean)
  return parts.join(', ')
}

export function buildGoogleMapsDirectionsUrl({ origin, destination, waypoints = [] }) {
  const params = new URLSearchParams({ api: '1', travelmode: 'driving' })
  if (origin) params.set('origin', origin)
  if (destination) params.set('destination', destination)
  if (waypoints.length) params.set('waypoints', waypoints.join('|'))
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function buildGoogleMapsPlaceUrl(customer) {
  const coords = getCustomerCoordinates(customer)
  const query = formatCustomerAddress(customer) || `${coords.lat},${coords.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function buildGoogleMapsNavigationUrl(customer) {
  const coords = getCustomerCoordinates(customer)
  return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}&travelmode=driving`
}
