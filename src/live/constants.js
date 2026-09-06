export const LIVE_EVENT = 'bach:live-updated'
export const LIVE_LOCATIONS_KEY = 'bach-live-locations'
export const LIVE_GEOFENCES_KEY = 'bach-live-geofences'
export const LIVE_GEOFENCE_EVENTS_KEY = 'bach-live-geofence-events'
export const LIVE_ROUTES_KEY = 'bach-live-routes'
export const LIVE_AUDIT_KEY = 'bach-live-audit'
export const LIVE_SETTINGS_KEY = 'bach-live-settings'

export const FEATURE_FLAGS = {
  LIVE_MAP: 'LIVE_MAP',
  EMPLOYEE_TRACKING: 'EMPLOYEE_TRACKING',
  DRIVER_TRACKING: 'DRIVER_TRACKING',
  VEHICLE_TRACKING: 'VEHICLE_TRACKING',
  ROUTE_OPTIMIZATION: 'ROUTE_OPTIMIZATION',
  GEOFENCE: 'GEOFENCE',
  LOCATION_HISTORY: 'LOCATION_HISTORY',
  CUSTOMER_TRACKING: 'CUSTOMER_TRACKING',
  NAVIGATION: 'NAVIGATION',
  AI_LIVE_ASSISTANT: 'AI_LIVE_ASSISTANT',
}

export const DEFAULT_FLAGS = {
  LIVE_MAP: true,
  EMPLOYEE_TRACKING: true,
  DRIVER_TRACKING: true,
  VEHICLE_TRACKING: true,
  ROUTE_OPTIMIZATION: true,
  GEOFENCE: true,
  LOCATION_HISTORY: true,
  CUSTOMER_TRACKING: true,
  NAVIGATION: false,
  AI_LIVE_ASSISTANT: true,
}

export const PERSONNEL_STATUS = {
  active: { id: 'active', label: 'Aktif', tone: 'emerald' },
  on_task: { id: 'on_task', label: 'Görevde', tone: 'blue' },
  waiting: { id: 'waiting', label: 'Bekliyor', tone: 'amber' },
  delayed: { id: 'delayed', label: 'Gecikmiş', tone: 'orange' },
  offline: { id: 'offline', label: 'Çevrimdışı', tone: 'rose' },
  permission_off: { id: 'permission_off', label: 'Konum izni kapalı', tone: 'zinc' },
}

export const DRIVER_STATUS = {
  available: { id: 'available', label: 'Müsait', tone: 'emerald' },
  on_task: { id: 'on_task', label: 'Görevde', tone: 'blue' },
  delivering: { id: 'delivering', label: 'Teslimatta', tone: 'cyan' },
  break: { id: 'break', label: 'Molada', tone: 'amber' },
  offline: { id: 'offline', label: 'Çevrimdışı', tone: 'rose' },
}

export const VEHICLE_KINDS = [
  { id: 'motor', label: 'Motor', icon: '🏍️' },
  { id: 'otomobil', label: 'Otomobil', icon: '🚗' },
  { id: 'minivan', label: 'Minivan', icon: '🚐' },
  { id: 'panelvan', label: 'Panelvan', icon: '🚐' },
  { id: 'kamyonet', label: 'Kamyonet', icon: '🚚' },
  { id: 'kamyon', label: 'Kamyon', icon: '🚛' },
  { id: 'tir', label: 'Tır', icon: '🚛' },
  { id: 'diger', label: 'Diğer', icon: '🚜' },
]

export const ENTITY_KINDS = {
  personnel: { id: 'personnel', label: 'Personel', icon: '👤' },
  driver: { id: 'driver', label: 'Sürücü', icon: '🚚' },
  vehicle: { id: 'vehicle', label: 'Araç', icon: '🚛' },
  delivery: { id: 'delivery', label: 'Teslimat', icon: '📦' },
  customer: { id: 'customer', label: 'Müşteri', icon: '📍' },
  geofence: { id: 'geofence', label: 'Bölge', icon: '⬡' },
}

export const GEOFENCE_KINDS = ['depo', 'fabrika', 'musteri', 'sube', 'showroom', 'calisma_alani']

export const RETENTION_DAYS = [30, 90, 180, 365]

export const OFFLINE_AFTER_MS = 3 * 60 * 1000
export const DELAYED_AFTER_MS = 15 * 60 * 1000

export const ISTANBUL = {
  depo: { lat: 41.015137, lng: 28.97953, label: 'Merkez Depo' },
  kadikoy: { lat: 40.9819, lng: 29.0576, label: 'Kadıköy' },
  atasehir: { lat: 40.9923, lng: 29.1244, label: 'Ataşehir' },
  uskudar: { lat: 41.0228, lng: 29.0137, label: 'Üsküdar' },
  maltepe: { lat: 40.935, lng: 29.131, label: 'Maltepe' },
}

export const MAPBOX_STYLES = {
  day: 'mapbox://styles/mapbox/light-v11',
  night: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

export function vehicleKindFromLabel(value = '') {
  const text = String(value || '').toLocaleLowerCase('tr-TR')
  if (text.includes('motor') || text.includes('bisiklet')) return 'motor'
  if (text.includes('tır') || text.includes('tir')) return 'tir'
  if (text.includes('kamyon')) return 'kamyon'
  if (text.includes('kamyonet')) return 'kamyonet'
  if (text.includes('panel')) return 'panelvan'
  if (text.includes('minivan') || text.includes('van')) return 'minivan'
  if (text.includes('otomobil') || text.includes('araba') || text.includes('car')) return 'otomobil'
  return 'diger'
}
