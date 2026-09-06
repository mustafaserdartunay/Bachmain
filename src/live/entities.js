import { getGpsLogs } from '../utils/pdksStore'
import { loadPersonnel } from '../utils/personnelStore'
import { fullName } from '../utils/personnelHelpers'
import { loadVehicles } from '../utils/logisticsStore'
import { loadTrips } from '../utils/sevkiyatStore'
import { loadCourierState } from '../utils/courierStore'
import { getCustomerCoordinates } from '../utils/customerGeo'
import { getCustomerProfiles } from '../data/customerProfiles'
import { filterByOrgScope, getActiveOrgScope } from '../utils/orgScope'
import {
  DRIVER_STATUS,
  ENTITY_KINDS,
  OFFLINE_AFTER_MS,
  PERSONNEL_STATUS,
  vehicleKindFromLabel,
} from './constants.js'
import { buildDemoEntities, demoGeofences } from './demo.js'
import { isLiveFlagOn } from './flags.js'
import { loadGeofences, loadGeofenceEvents, loadLiveLocations, loadLiveRoutes } from './store.js'
import { remainingEta } from './eta.js'

function ageMs(iso) {
  const t = Date.parse(iso || '')
  return Number.isFinite(t) ? Date.now() - t : Number.POSITIVE_INFINITY
}

function lastSeenLabel(iso) {
  const ms = ageMs(iso)
  if (!Number.isFinite(ms)) return 'Konum yok'
  if (ms < 15000) return 'az önce'
  if (ms < 60000) return `${Math.round(ms / 1000)} saniye önce`
  if (ms < 3600000) return `${Math.round(ms / 60000)} dakika önce`
  return `${Math.round(ms / 3600000)} saat önce`
}

function personnelStatus(sample, employee) {
  if (employee?.status === 'Ayrıldı') return PERSONNEL_STATUS.offline.id
  if (!sample) return PERSONNEL_STATUS.permission_off.id
  if (ageMs(sample.timestamp || sample.updatedAt) > OFFLINE_AFTER_MS)
    return PERSONNEL_STATUS.offline.id
  if (sample.activity === 'waiting') return PERSONNEL_STATUS.waiting.id
  if (sample.delayed) return PERSONNEL_STATUS.delayed.id
  if (sample.task || sample.activity === 'on_task') return PERSONNEL_STATUS.on_task.id
  return PERSONNEL_STATUS.active.id
}

function driverStatus(trip, sample) {
  if (!sample || ageMs(sample.timestamp || sample.updatedAt) > OFFLINE_AFTER_MS)
    return DRIVER_STATUS.offline.id
  if (trip?.status === 'in_transit') return DRIVER_STATUS.delivering.id
  if (trip?.status === 'planned') return DRIVER_STATUS.on_task.id
  return DRIVER_STATUS.available.id
}

function latestMap(rows) {
  const map = new Map()
  rows.forEach((row) => {
    const id = row.entityId || row.employeeId
    if (!id || map.has(id)) return
    map.set(id, row)
  })
  return map
}

export function collectLiveEntities({ includeDemo = true } = {}) {
  const scope = getActiveOrgScope()
  const flags = {
    personnel: isLiveFlagOn('EMPLOYEE_TRACKING'),
    driver: isLiveFlagOn('DRIVER_TRACKING'),
    vehicle: isLiveFlagOn('VEHICLE_TRACKING'),
    delivery: isLiveFlagOn('CUSTOMER_TRACKING'),
  }

  const liveSamples = latestMap(loadLiveLocations())
  const gpsLogs = latestMap(getGpsLogs())
  const personnel = filterByOrgScope(loadPersonnel(), scope)
  const vehicles = filterByOrgScope(loadVehicles(), scope)
  const trips = filterByOrgScope(loadTrips(), scope)
  const courier = loadCourierState()
  const customers = getCustomerProfiles()

  const entities = []

  if (flags.personnel) {
    personnel.forEach((employee) => {
      const sample = liveSamples.get(employee.id) || gpsLogs.get(employee.id)
      const lat = sample?.latitude ?? sample?.lat
      const lng = sample?.longitude ?? sample?.lng
      if (lat == null || lng == null) return
      entities.push({
        id: employee.id,
        kind: 'personnel',
        name: fullName(employee) || employee.name,
        subtitle: employee.title || employee.department || 'Personel',
        status: personnelStatus(sample, employee),
        lat: Number(lat),
        lng: Number(lng),
        heading: sample?.heading || 0,
        speed: sample?.speed || 0,
        updatedAt: sample?.timestamp || sample?.createdAt || sample?.updatedAt,
        task: employee.currentTask || sample?.task,
        icon: ENTITY_KINDS.personnel.icon,
      })
    })
  }

  if (flags.vehicle) {
    vehicles.forEach((vehicle) => {
      const trip = trips.find((row) => row.vehicleId === vehicle.id || row.plate === vehicle.plate)
      const sample = liveSamples.get(vehicle.id) || trip?.livePosition || trip?.gpsFix
      const lat = sample?.latitude ?? sample?.lat
      const lng = sample?.longitude ?? sample?.lng
      if (lat == null || lng == null) return
      entities.push({
        id: vehicle.id,
        kind: 'vehicle',
        name: vehicle.plate || vehicle.label || 'Araç',
        subtitle: vehicle.driver || trip?.driverName || '',
        plate: vehicle.plate,
        vehicleKind: vehicleKindFromLabel(vehicle.type || vehicle.label),
        status:
          ageMs(sample?.timestamp || sample?.updatedAt) > OFFLINE_AFTER_MS ? 'offline' : 'active',
        lat: Number(lat),
        lng: Number(lng),
        heading: sample?.heading || 0,
        speed: sample?.speed || 0,
        updatedAt: sample?.timestamp || sample?.updatedAt,
        icon: ENTITY_KINDS.vehicle.icon,
      })
    })
  }

  if (flags.driver) {
    trips.forEach((trip) => {
      const pos = trip.livePosition || trip.gpsFix
      if (!pos || trip.status === 'draft') return
      const from = { lat: Number(pos.lat), lng: Number(pos.lng) }
      const nextStop = (trip.stops || []).find((stop) => stop.status !== 'delivered')
      const dest = nextStop
        ? getCustomerCoordinates({ ...nextStop, lat: nextStop.lat, lng: nextStop.lng })
        : null
      const eta = dest ? remainingEta({ from, to: dest, speedMps: pos.speed }) : {}
      entities.push({
        id: trip.id,
        kind: 'driver',
        name: trip.driverName || trip.plate || trip.code,
        subtitle: trip.plate || trip.code,
        plate: trip.plate,
        status: driverStatus(trip, pos),
        lat: from.lat,
        lng: from.lng,
        heading: pos.heading || 0,
        speed: pos.speed || 0,
        updatedAt: pos.updatedAt || trip.updatedAt,
        task: nextStop?.customerLabel || trip.code,
        nextStop: nextStop?.customerLabel,
        etaClock: eta.etaClock,
        remainingMin: eta.remainingMin,
        distanceKm: eta.distanceKm,
        trackingToken: trip.trackingToken,
        delayed: trip.status === 'in_transit' && Boolean(trip.delayed),
        icon: ENTITY_KINDS.driver.icon,
      })
    })
  }

  if (flags.delivery) {
    trips.forEach((trip) => {
      ;(trip.stops || []).forEach((stop, index) => {
        const coords = getCustomerCoordinates(stop)
        entities.push({
          id: `${trip.id}-stop-${index}`,
          kind: 'delivery',
          name: stop.customerLabel || `Durak ${index + 1}`,
          subtitle: trip.code,
          status:
            stop.status === 'delivered'
              ? 'done'
              : trip.status === 'in_transit'
                ? 'on_task'
                : 'waiting',
          lat: coords.lat,
          lng: coords.lng,
          updatedAt: trip.updatedAt,
          icon: ENTITY_KINDS.delivery.icon,
        })
      })
    })
    ;(courier.dispatches || []).forEach((dispatch) => {
      const pos = dispatch.livePosition
      if (!pos) return
      entities.push({
        id: dispatch.id,
        kind: 'delivery',
        name: dispatch.customerLabel || dispatch.code || 'Kurye teslimatı',
        subtitle: dispatch.trackingToken,
        status: dispatch.status === 'en_route' ? 'on_task' : dispatch.status,
        lat: Number(pos.lat),
        lng: Number(pos.lng),
        trackingToken: dispatch.trackingToken,
        updatedAt: dispatch.updatedAt,
        icon: ENTITY_KINDS.delivery.icon,
      })
    })
  }

  const customerEntities = []
  if (flags.delivery) {
    customers.slice(0, 40).forEach((customer) => {
      if (customer.lat == null && !customer.city) return
      const coords = getCustomerCoordinates(customer)
      customerEntities.push({
        id: customer.id,
        kind: 'customer',
        name: customer.company || customer.name,
        subtitle: customer.city,
        status: 'waiting',
        lat: coords.lat,
        lng: coords.lng,
        icon: ENTITY_KINDS.customer.icon,
      })
    })
  }

  const liveKinds = new Set(['personnel', 'driver', 'vehicle'])
  const hasReal = entities.some(
    (row) => liveKinds.has(row.kind) || (row.kind === 'delivery' && row.trackingToken),
  )
  const demo = !hasReal && includeDemo ? buildDemoEntities() : []
  const merged = hasReal ? entities.concat(customerEntities) : demo.concat(customerEntities)

  return {
    entities: merged,
    usingDemo: !hasReal && includeDemo,
    geofences: loadGeofences().concat(!hasReal && includeDemo ? demoGeofences() : []),
    geofenceEvents: loadGeofenceEvents(),
    routes: loadLiveRoutes(),
  }
}

export function summarizeLiveKpis(entities = []) {
  const nowEntities = entities.filter((row) => ageMs(row.updatedAt) <= OFFLINE_AFTER_MS)
  return {
    personnel: nowEntities.filter((row) => row.kind === 'personnel').length,
    vehicles: nowEntities.filter((row) => row.kind === 'vehicle' || row.kind === 'driver').length,
    deliveries: entities.filter((row) => row.kind === 'delivery' && row.status !== 'done').length,
    delayed: entities.filter((row) => row.delayed || row.status === 'delayed').length,
    offline: entities.filter((row) => row.status === 'offline').length,
    waiting: entities.filter((row) => row.status === 'waiting').length,
    done: entities.filter((row) => row.status === 'done').length,
  }
}

export { lastSeenLabel, ageMs }
