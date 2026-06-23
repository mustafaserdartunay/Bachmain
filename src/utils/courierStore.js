import { getCustomerCoordinates, formatCustomerAddress } from './customerGeo'
import { getCustomerProfiles } from '../data/customerProfiles'
import { getCustomerDisplay } from './customerDisplay'

const STORAGE_KEY = 'bach-courier-tracking-v1'
export const COURIER_UPDATED_EVENT = 'bach:courier-updated'

export const VEHICLE_TYPES = [
  { id: 'motor', label: 'Motor Kurye', shortLabel: 'Motor', color: '#f97316', emoji: '🏍️' },
  { id: 'car', label: 'Araba Kurye', shortLabel: 'Araba', color: '#3b82f6', emoji: '🚗' },
  { id: 'panelvan', label: 'Panelvan', shortLabel: 'Panelvan', color: '#a855f7', emoji: '🚐' },
  { id: 'minivan', label: 'Minivan', shortLabel: 'Minivan', color: '#06b6d4', emoji: '🚙' },
  { id: 'kamyonet', label: 'Kamyonet', shortLabel: 'Kamyonet', color: '#eab308', emoji: '🛻' },
  { id: 'bisiklet', label: 'Bisiklet Kurye', shortLabel: 'Bisiklet', color: '#10b981', emoji: '🚲' },
]

export const DISPATCH_STATUSES = [
  { id: 'draft', label: 'Taslak', tone: 'text-gray-400', bg: 'bg-gray-500/10' },
  { id: 'assigned', label: 'Atandı', tone: 'text-blue-300', bg: 'bg-blue-500/10' },
  { id: 'picked_up', label: 'Teslim Alındı', tone: 'text-cyan-300', bg: 'bg-cyan-500/10' },
  { id: 'en_route', label: 'Yolda', tone: 'text-orange-300', bg: 'bg-orange-500/10' },
  { id: 'nearby', label: 'Yaklaştı', tone: 'text-amber-300', bg: 'bg-amber-500/10' },
  { id: 'delivered', label: 'Teslim Edildi', tone: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  { id: 'cancelled', label: 'İptal', tone: 'text-red-300', bg: 'bg-red-500/10' },
]

const HQ = { lat: 41.015, lng: 28.979, label: 'Merkez Depo' }

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(COURIER_UPDATED_EVENT))
}

export function createCourierId(prefix = 'CR') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

function createTrackingToken() {
  return `KT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

function getVehicleType(typeId) {
  return VEHICLE_TYPES.find((item) => item.id === typeId) || VEHICLE_TYPES[0]
}

function defaultFleet() {
  return [
    { id: 'veh-m1', name: 'MK-01', plate: '34 KRY 01', vehicleType: 'motor', courierName: 'Emre Kaya', courierPhone: '0532 111 22 33', status: 'available' },
    { id: 'veh-m2', name: 'MK-02', plate: '34 KRY 02', vehicleType: 'motor', courierName: 'Selin Arslan', courierPhone: '0533 222 33 44', status: 'available' },
    { id: 'veh-c1', name: 'AK-01', plate: '34 KRY 10', vehicleType: 'car', courierName: 'Burak Demir', courierPhone: '0534 333 44 55', status: 'available' },
    { id: 'veh-p1', name: 'PV-01', plate: '34 KRY 20', vehicleType: 'panelvan', courierName: 'Murat Yıldız', courierPhone: '0535 444 55 66', status: 'available' },
    { id: 'veh-p2', name: 'PV-02', plate: '34 KRY 21', vehicleType: 'panelvan', courierName: 'Ayşe Çelik', courierPhone: '0536 555 66 77', status: 'available' },
    { id: 'veh-v1', name: 'MV-01', plate: '34 KRY 30', vehicleType: 'minivan', courierName: 'Can Öztürk', courierPhone: '0537 666 77 88', status: 'available' },
    { id: 'veh-k1', name: 'KN-01', plate: '34 KRY 40', vehicleType: 'kamyonet', courierName: 'Hakan Şahin', courierPhone: '0538 777 88 99', status: 'available' },
    { id: 'veh-b1', name: 'BK-01', plate: '—', vehicleType: 'bisiklet', courierName: 'Deniz Ak', courierPhone: '0539 888 99 00', status: 'available' },
  ]
}

function seedDispatches(fleet) {
  const customers = getCustomerProfiles().slice(0, 3)
  if (!customers.length) return []

  const vehicle = fleet.find((item) => item.vehicleType === 'motor') || fleet[0]
  const customer = customers[0]
  const display = getCustomerDisplay(customer)
  const coords = getCustomerCoordinates(customer)
  const now = new Date()

  return [{
    id: createCourierId('DSP'),
    trackingToken: 'KT-DEMO2026',
    referenceNo: 'SIP-2401',
    customerId: customer.id,
    customerName: display.brandShortName || display.companyTitle,
    customerPhone: customer.phone || customer.mobile || '',
    address: formatCustomerAddress(customer),
    destination: coords,
    vehicleId: vehicle.id,
    vehicleType: vehicle.vehicleType,
    courierName: vehicle.courierName,
    courierPhone: vehicle.courierPhone,
    status: 'en_route',
    priority: 'normal',
    packageNote: 'Kırılabilir ürün — dikkatli taşıma',
    sharedWithCustomer: true,
    createdAt: new Date(now.getTime() - 45 * 60000).toISOString(),
    startedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
    estimatedArrival: new Date(now.getTime() + 18 * 60000).toISOString(),
    deliveredAt: null,
    livePosition: {
      lat: HQ.lat + (coords.lat - HQ.lat) * 0.55,
      lng: HQ.lng + (coords.lng - HQ.lng) * 0.55,
      heading: 135,
      speed: 32,
      updatedAt: now.toISOString(),
    },
    routeGeometry: [
      [HQ.lat, HQ.lng],
      [HQ.lat + (coords.lat - HQ.lat) * 0.3, HQ.lng + (coords.lng - HQ.lng) * 0.3],
      [HQ.lat + (coords.lat - HQ.lat) * 0.55, HQ.lng + (coords.lng - HQ.lng) * 0.55],
    ],
    timeline: [
      { status: 'assigned', label: 'Kurye atandı', at: new Date(now.getTime() - 40 * 60000).toISOString() },
      { status: 'picked_up', label: 'Paket depodan alındı', at: new Date(now.getTime() - 30 * 60000).toISOString() },
      { status: 'en_route', label: 'Teslimat yolunda', at: new Date(now.getTime() - 25 * 60000).toISOString() },
    ],
  }]
}

function defaultState() {
  const fleet = defaultFleet()
  return {
    fleet,
    dispatches: seedDispatches(fleet),
    hq: HQ,
  }
}

export function loadCourierState() {
  const saved = readJson(STORAGE_KEY, null)
  if (!saved) {
    const seeded = defaultState()
    writeJson(STORAGE_KEY, seeded)
    return seeded
  }
  return {
    ...defaultState(),
    ...saved,
    fleet: Array.isArray(saved.fleet) && saved.fleet.length ? saved.fleet : defaultFleet(),
    dispatches: Array.isArray(saved.dispatches) ? saved.dispatches : [],
  }
}

export function saveCourierState(state) {
  writeJson(STORAGE_KEY, state)
}

export function getDispatchStatusMeta(statusId) {
  return DISPATCH_STATUSES.find((item) => item.id === statusId) || DISPATCH_STATUSES[0]
}

export function getVehicleTypeMeta(typeId) {
  return getVehicleType(typeId)
}

export function getDispatchByToken(trackingToken) {
  const state = loadCourierState()
  return state.dispatches.find((item) => item.trackingToken === trackingToken) || null
}

export function getDispatchById(dispatchId) {
  const state = loadCourierState()
  return state.dispatches.find((item) => item.id === dispatchId) || null
}

export function getActiveDispatches() {
  return loadCourierState().dispatches.filter((item) => !['delivered', 'cancelled'].includes(item.status))
}

export function getFleetByType(vehicleType) {
  const state = loadCourierState()
  if (!vehicleType || vehicleType === 'all') return state.fleet
  return state.fleet.filter((item) => item.vehicleType === vehicleType)
}

export function getCourierMetrics() {
  const state = loadCourierState()
  const active = state.dispatches.filter((item) => ['assigned', 'picked_up', 'en_route', 'nearby'].includes(item.status))
  const deliveredToday = state.dispatches.filter((item) => {
    if (item.status !== 'delivered' || !item.deliveredAt) return false
    const delivered = new Date(item.deliveredAt)
    const now = new Date()
    return delivered.toDateString() === now.toDateString()
  })
  const onRoadVehicles = new Set(active.map((item) => item.vehicleId)).size
  const availableFleet = state.fleet.filter((item) => item.status === 'available').length

  return {
    activeCount: active.length,
    onRoadVehicles,
    deliveredToday: deliveredToday.length,
    availableFleet,
    totalFleet: state.fleet.length,
  }
}

function appendTimeline(dispatch, status, label) {
  return {
    ...dispatch,
    timeline: [
      ...(Array.isArray(dispatch.timeline) ? dispatch.timeline : []),
      { status, label, at: new Date().toISOString() },
    ],
  }
}

function interpolatePosition(from, to, progress) {
  const p = Math.max(0, Math.min(1, progress))
  return {
    lat: from.lat + (to.lat - from.lat) * p,
    lng: from.lng + (to.lng - from.lng) * p,
    heading: 90 + p * 90,
    speed: 28 + Math.round(Math.random() * 8),
    updatedAt: new Date().toISOString(),
  }
}

export function tickLivePositions() {
  const state = loadCourierState()
  let changed = false

  const dispatches = state.dispatches.map((dispatch) => {
    if (!['en_route', 'nearby', 'picked_up'].includes(dispatch.status)) return dispatch
    const dest = dispatch.destination
    const current = dispatch.livePosition || state.hq
    const progress = dispatch._simProgress ?? 0.55
    const nextProgress = Math.min(0.98, progress + 0.012 + Math.random() * 0.008)
    const nextPosition = interpolatePosition(state.hq, dest, nextProgress)
    let nextStatus = dispatch.status
    if (nextProgress > 0.82 && dispatch.status === 'en_route') nextStatus = 'nearby'
    if (nextProgress !== progress || nextStatus !== dispatch.status) changed = true
    return {
      ...dispatch,
      status: nextStatus,
      _simProgress: nextProgress,
      livePosition: nextPosition,
      estimatedArrival: new Date(Date.now() + Math.max(5, (1 - nextProgress) * 40) * 60000).toISOString(),
      routeGeometry: [
        [state.hq.lat, state.hq.lng],
        [nextPosition.lat, nextPosition.lng],
        [dest.lat, dest.lng],
      ],
    }
  })

  if (changed) {
    saveCourierState({ ...state, dispatches })
  }
  return changed
}

export function createDispatch(payload) {
  const state = loadCourierState()
  const vehicle = state.fleet.find((item) => item.id === payload.vehicleId)
  if (!vehicle) throw new Error('Araç seçilmedi')

  const customer = payload.customerId
    ? getCustomerProfiles().find((item) => item.id === payload.customerId)
    : null
  const display = customer ? getCustomerDisplay(customer) : null
  const destination = payload.destination || (customer ? getCustomerCoordinates(customer) : HQ)

  const dispatch = {
    id: createCourierId('DSP'),
    trackingToken: createTrackingToken(),
    referenceNo: payload.referenceNo || '',
    customerId: customer?.id || '',
    customerName: payload.customerName || display?.brandShortName || 'Müşteri',
    customerPhone: payload.customerPhone || customer?.phone || customer?.mobile || '',
    address: payload.address || (customer ? formatCustomerAddress(customer) : ''),
    destination,
    vehicleId: vehicle.id,
    vehicleType: vehicle.vehicleType,
    courierName: vehicle.courierName,
    courierPhone: vehicle.courierPhone,
    status: 'assigned',
    priority: payload.priority || 'normal',
    packageNote: payload.packageNote || '',
    sharedWithCustomer: Boolean(payload.sharedWithCustomer),
    createdAt: new Date().toISOString(),
    startedAt: null,
    estimatedArrival: payload.estimatedArrival || new Date(Date.now() + 45 * 60000).toISOString(),
    deliveredAt: null,
    livePosition: { ...state.hq, heading: 0, speed: 0, updatedAt: new Date().toISOString() },
    routeGeometry: [[state.hq.lat, state.hq.lng], [destination.lat, destination.lng]],
    timeline: [{ status: 'assigned', label: `${vehicle.courierName} göreve atandı`, at: new Date().toISOString() }],
    _simProgress: 0,
  }

  const fleet = state.fleet.map((item) => (
    item.id === vehicle.id ? { ...item, status: 'busy' } : item
  ))

  saveCourierState({
    ...state,
    fleet,
    dispatches: [dispatch, ...state.dispatches],
  })

  return dispatch
}

export function updateDispatchStatus(dispatchId, status, note = '') {
  const state = loadCourierState()
  const meta = getDispatchStatusMeta(status)
  const dispatches = state.dispatches.map((dispatch) => {
    if (dispatch.id !== dispatchId) return dispatch
    let next = appendTimeline({ ...dispatch, status }, status, note || meta.label)
    if (status === 'en_route' && !next.startedAt) next.startedAt = new Date().toISOString()
    if (status === 'delivered') {
      next = {
        ...next,
        deliveredAt: new Date().toISOString(),
        livePosition: { ...next.destination, heading: 0, speed: 0, updatedAt: new Date().toISOString() },
        _simProgress: 1,
      }
    }
    return next
  })

  let fleet = state.fleet
  if (['delivered', 'cancelled'].includes(status)) {
    const dispatch = dispatches.find((item) => item.id === dispatchId)
    if (dispatch) {
      fleet = fleet.map((item) => (
        item.id === dispatch.vehicleId ? { ...item, status: 'available' } : item
      ))
    }
  }

  saveCourierState({ ...state, dispatches, fleet })
}

export function shareDispatchWithCustomer(dispatchId, shared = true) {
  const state = loadCourierState()
  saveCourierState({
    ...state,
    dispatches: state.dispatches.map((item) => (
      item.id === dispatchId ? { ...item, sharedWithCustomer: shared } : item
    )),
  })
}

export function getCustomerTrackingUrl(trackingToken) {
  if (typeof window === 'undefined') return `/kurye-takip/${trackingToken}`
  return `${window.location.origin}/kurye-takip/${trackingToken}`
}

export function formatEta(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMin = Math.max(0, Math.round((date.getTime() - Date.now()) / 60000))
  if (diffMin <= 1) return '1 dk içinde'
  if (diffMin < 60) return `${diffMin} dk`
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatTimelineTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
