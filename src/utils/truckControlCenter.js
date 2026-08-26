/**
 * Tır Kontrol Merkezi — mevcut lojistik / sevkiyat / CRM kayıtlarını birleştirir.
 * Sahte GPS, sahte ETA, sahte fatura veya demo üretim verisi oluşturmaz.
 */

import { getCustomerProfiles } from '../data/customerProfiles'
import { getCustomerDisplay } from './customerDisplay'
import { resolveCustomerContactInfo } from './customerContacts'
import { formatCustomerAddress, getCompanyStartPoint, getCustomerCoordinates } from './customerGeo'
import { readCompanySettings } from './companySettings'
import {
  loadDeliveries,
  loadLoadPlans,
  loadLogisticsDocuments,
  loadRoutes,
  loadShipments,
  loadVehicles,
  upsertLoadPlan,
  upsertShipment,
} from './logisticsStore'
import { getTrip, loadTrips, upsertTrip } from './sevkiyatStore'
import { loadPersonnel } from './personnelStore'
import { fullName } from './personnelHelpers'
import { loadOrders, orderTotals } from './ordersStore'
import { readSalesInvoices } from './salesInvoicesStore'
import { appendActivityEntry } from './activityArchiveStore'
import { appendOrgLog } from './orgStructureStore'
import { filterByOrgScope, getActiveOrgScope, matchesOrgScope } from './orgScope'
import { etaClockFromDuration, formatDurationLabel, formatKmLabel } from './googleRoutesClient'

export const TRUCK_CONTROL_LIST_PATH = '/lojistik/tir-sevkiyat'
export const TRUCK_CONTROL_DETAIL_PATH = (id) => `/lojistik/tir-sevkiyat/${encodeURIComponent(id)}`

export const STOP_STATUS_META = {
  planned: { id: 'planned', label: 'Planlandı', tone: 'muted' },
  pending: { id: 'planned', label: 'Planlandı', tone: 'muted' },
  loading: { id: 'loading', label: 'Yükleniyor', tone: 'blue' },
  loaded: { id: 'loaded', label: 'Yüklendi', tone: 'blue' },
  in_transit: { id: 'in_transit', label: 'Yolda', tone: 'green' },
  yolda: { id: 'in_transit', label: 'Yolda', tone: 'green' },
  approaching: { id: 'approaching', label: 'Yaklaşıyor', tone: 'amber' },
  on_site: { id: 'on_site', label: 'Teslimat Noktasında', tone: 'amber' },
  delivered: { id: 'delivered', label: 'Teslim Edildi', tone: 'green' },
  teslim: { id: 'delivered', label: 'Teslim Edildi', tone: 'green' },
  partial: { id: 'partial', label: 'Kısmi Teslim', tone: 'amber' },
  failed: { id: 'failed', label: 'Başarısız', tone: 'red' },
  delayed: { id: 'delayed', label: 'Gecikmiş', tone: 'red' },
  returned: { id: 'returned', label: 'İade', tone: 'red' },
}

export const SHIPMENT_STATUS_META = {
  draft: { id: 'draft', label: 'Taslak', tone: 'muted' },
  planned: { id: 'planned', label: 'Planlandı', tone: 'blue' },
  active: { id: 'planned', label: 'Planlandı', tone: 'blue' },
  loading: { id: 'loading', label: 'Yükleniyor', tone: 'blue' },
  in_transit: { id: 'in_transit', label: 'Yolda', tone: 'green' },
  delivered: { id: 'delivered', label: 'Teslim Edildi', tone: 'green' },
  cancelled: { id: 'cancelled', label: 'İptal', tone: 'red' },
}

export const TABS = [
  { id: 'live', label: 'Canlı Rota' },
  { id: 'stops', label: 'Teslimatlar' },
  { id: 'cargo', label: 'Yük' },
  { id: 'invoices', label: 'Faturalar' },
  { id: 'orders', label: 'Siparişler' },
  { id: 'docs', label: 'Evraklar' },
  { id: 'crew', label: 'Şoför & Araç' },
  { id: 'gps', label: 'GPS Geçmişi' },
  { id: 'analysis', label: 'Rota Analizi' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'notes', label: 'Notlar' },
]

function mmToMeters(mm) {
  const n = Number(mm)
  if (!Number.isFinite(n) || n <= 0) return null
  return n >= 20 ? n / 1000 : n
}

function asNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function normalizeStopStatus(status) {
  const key = String(status || 'planned')
    .toLowerCase()
    .replace(/\s+/g, '_')
  return STOP_STATUS_META[key] || STOP_STATUS_META.planned
}

export function normalizeShipmentStatus(status) {
  const key = String(status || 'planned')
    .toLowerCase()
    .replace(/\s+/g, '_')
  return SHIPMENT_STATUS_META[key] || SHIPMENT_STATUS_META.planned
}

export function digitsPhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export function telHref(phone) {
  const digits = digitsPhone(phone)
  return digits ? `tel:${digits}` : ''
}

export function whatsappHref(phone, text = '') {
  const digits = digitsPhone(phone)
  if (!digits) return ''
  const withCountry = digits.startsWith('90')
    ? digits
    : digits.startsWith('0')
      ? `90${digits.slice(1)}`
      : digits
  const url = `https://wa.me/${withCountry}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}

export function isRealGpsFix(fix) {
  if (!fix || fix.lat == null || fix.lng == null) return false
  if (!Number.isFinite(Number(fix.lat)) || !Number.isFinite(Number(fix.lng))) return false
  const source = String(fix.source || fix.gpsSource || '').toLowerCase()
  if (['device', 'gps', 'tracker', 'telematics', 'hardware'].includes(source)) return true
  if (fix.deviceId || fix.hardwareId || fix.imei) return true
  return false
}

function findVehicle({ plate, vehicleId, driverName }) {
  const vehicles = loadVehicles()
  if (vehicleId) {
    const byId = vehicles.find((row) => row.id === vehicleId)
    if (byId) return byId
  }
  const plateNorm = String(plate || '')
    .replace(/\s+/g, '')
    .toUpperCase()
  if (plateNorm) {
    const byPlate = vehicles.find(
      (row) =>
        String(row.plate || '')
          .replace(/\s+/g, '')
          .toUpperCase() === plateNorm,
    )
    if (byPlate) return byPlate
  }
  if (driverName) {
    const byDriver = vehicles.find(
      (row) =>
        String(row.driver || '').toLocaleLowerCase('tr-TR') ===
        String(driverName).toLocaleLowerCase('tr-TR'),
    )
    if (byDriver) return byDriver
  }
  return null
}

function findDriver({ driverId, driverName, driverPhone, vehicle }) {
  const people = loadPersonnel()
  if (driverId) {
    const byId = people.find((row) => row.id === driverId)
    if (byId) return byId
  }
  const name = String(driverName || vehicle?.driver || '').trim()
  if (name) {
    const byName = people.find(
      (row) => fullName(row).toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'),
    )
    if (byName) return byName
  }
  const phone = digitsPhone(driverPhone || vehicle?.phone)
  if (phone) {
    const byPhone = people.find((row) => digitsPhone(row.phone) === phone)
    if (byPhone) return byPhone
  }
  return null
}

function customerById(id) {
  if (!id) return null
  return getCustomerProfiles().find((row) => String(row.id) === String(id)) || null
}

function mapCargoFromGoods(goods, stop, indexBase = 0) {
  return (goods || []).map((item, index) => ({
    id: item.id || `cargo-${indexBase}-${index}`,
    name: item.label || item.product || item.name || 'Ürün',
    sku: item.sku || item.productCode || '',
    qty: asNumber(item.qty ?? item.quantity) ?? 1,
    unit: item.unit || 'adet',
    boxes: asNumber(item.boxes ?? item.koli) ?? 0,
    pallets: asNumber(item.pallets ?? item.palet) ?? 0,
    kg: asNumber(item.kg ?? item.weightKg) ?? 0,
    volumeM3: asNumber(item.volumeM3 ?? item.m3) ?? 0,
    customerId: stop?.customerId || item.customerId || '',
    customerLabel: stop?.customerLabel || item.customer || '',
    orderNo: item.orderNo || stop?.orderNo || '',
    invoiceNo: item.invoiceNo || stop?.invoiceNo || '',
    stopId: stop?.id || '',
    status: normalizeStopStatus(item.status || stop?.status).label,
    productId: item.productId || '',
  }))
}

function mapStop(raw, index, customers) {
  const customer =
    customerById(raw.customerId) || customers.find((row) => row.id === raw.customerId) || null
  const display = customer
    ? getCustomerDisplay(customer)
    : { brandShortName: raw.customerLabel || '', companyTitle: raw.customerLabel || '' }
  const contact = customer
    ? resolveCustomerContactInfo(customer)
    : { phone: raw.phone || '', email: raw.email || '', contactName: '' }
  const coords = customer
    ? getCustomerCoordinates(customer)
    : { lat: raw.lat ?? null, lng: raw.lng ?? null }
  const lat = raw.lat != null ? Number(raw.lat) : coords.lat
  const lng = raw.lng != null ? Number(raw.lng) : coords.lng
  const status = normalizeStopStatus(raw.status)
  const windowStart = raw.windowStart || raw.timeWindowStart || raw.slotStart || ''
  const windowEnd = raw.windowEnd || raw.timeWindowEnd || raw.slotEnd || ''
  const proof = raw.deliveryProof || raw.proof || null

  return {
    id: raw.id || `stop-${index + 1}`,
    seq: raw.seq || index + 1,
    customerId: raw.customerId || customer?.id || '',
    customerLabel: display.brandShortName || display.companyTitle || raw.customerLabel || 'Müşteri',
    companyTitle: display.companyTitle || '',
    address: raw.address || (customer ? formatCustomerAddress(customer) : ''),
    city: raw.city || customer?.city || '',
    phone: contact.phone || raw.phone || '',
    email: contact.email || raw.email || '',
    contactName: contact.contactName || '',
    taxOffice: customer?.taxOffice || '',
    taxNumber: customer?.taxNumber || customer?.taxNo || '',
    lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
    lng: Number.isFinite(Number(lng)) ? Number(lng) : null,
    status: status.id,
    statusLabel: status.label,
    statusTone: status.tone,
    plannedAt: raw.plannedAt || raw.etaPlanned || raw.windowStart || '',
    etaAt: raw.etaAt || raw.eta || '',
    actualAt: raw.actualAt || raw.deliveredAt || proof?.at || '',
    waitMin: asNumber(raw.waitMin ?? raw.dwellMin),
    orderNo: raw.orderNo || raw.orderCode || '',
    invoiceNo: raw.invoiceNo || '',
    windowStart,
    windowEnd,
    priority: raw.priority || '',
    cargo: mapCargoFromGoods(raw.goods || raw.items || [], raw, index),
    proof:
      proof && (proof.photo || proof.signature || proof.receivedBy)
        ? {
            photo: proof.photo || proof.photoUrl || '',
            signature: proof.signature || proof.signatureUrl || '',
            receivedBy: proof.receivedBy || proof.recipient || '',
            note: proof.note || '',
            at: proof.at || proof.date || raw.deliveredAt || '',
            lat: proof.lat ?? null,
            lng: proof.lng ?? null,
          }
        : null,
    notes: raw.notes || raw.note || '',
    customer,
  }
}

function cargoFromPlan(plan) {
  return (plan?.pallets || []).map((pallet, index) => ({
    id: pallet.id || `pal-${index}`,
    name: pallet.label || pallet.code || 'Palet',
    sku: pallet.sku || pallet.code || '',
    qty: asNumber(pallet.qty) ?? 1,
    unit: 'palet',
    boxes: asNumber(pallet.boxes) ?? 0,
    pallets: 1,
    kg: asNumber(pallet.weightKg) ?? 0,
    volumeM3: asNumber(pallet.volumeM3) ?? 0,
    customerId: pallet.customerId || '',
    customerLabel: pallet.customer || '',
    orderNo: pallet.orderNo || '',
    invoiceNo: pallet.invoiceNo || '',
    stopId: '',
    status: normalizeShipmentStatus(plan.status).label,
    productId: pallet.productId || '',
  }))
}

function relatedInvoices(customerIds) {
  const ids = new Set(customerIds.filter(Boolean).map(String))
  if (!ids.size) return []
  return readSalesInvoices().filter((row) => ids.has(String(row.customerId)))
}

function relatedOrders(customerIds, customerLabels) {
  const ids = new Set(customerIds.filter(Boolean).map(String))
  const labels = new Set(
    customerLabels.filter(Boolean).map((label) => String(label).toLocaleLowerCase('tr-TR')),
  )
  return loadOrders().filter((order) => {
    if (order.customerId && ids.has(String(order.customerId))) return true
    const name = String(order.customer || '').toLocaleLowerCase('tr-TR')
    return name && labels.has(name)
  })
}

function relatedDocuments(codes) {
  const set = new Set(codes.filter(Boolean).map(String))
  if (!set.size) return []
  return loadLogisticsDocuments().filter(
    (doc) =>
      set.has(String(doc.palletCode || '')) ||
      set.has(String(doc.shipmentId || '')) ||
      set.has(String(doc.code || '')),
  )
}

function headingLabel(deg) {
  const n = Number(deg)
  if (!Number.isFinite(n)) return ''
  const dirs = [
    'Kuzey',
    'Kuzeydoğu',
    'Doğu',
    'Güneydoğu',
    'Güney',
    'Güneybatı',
    'Batı',
    'Kuzeybatı',
  ]
  const index = Math.round((((n % 360) + 360) % 360) / 45) % 8
  return dirs[index]
}

function formatWhen(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function vehicleView(vehicle, plateFallback, loadKg, loadM3) {
  if (!vehicle && !plateFallback) return null
  const maxKg = asNumber(vehicle?.maxWeightKg) || 0
  const maxM3 = asNumber(vehicle?.maxVolumeM3) || 0
  const fillKg = maxKg ? Math.min(100, Math.round((Number(loadKg || 0) / maxKg) * 100)) : null
  const fillM3 = maxM3 ? Math.min(100, Math.round((Number(loadM3 || 0) / maxM3) * 100)) : null
  const fill = fillKg != null ? fillKg : fillM3
  return {
    id: vehicle?.id || '',
    plate: vehicle?.plate || plateFallback || '',
    trailer: vehicle?.trailer || vehicle?.dorse || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
    type: vehicle?.type || 'truck',
    chassis: vehicle?.chassis || vehicle?.vin || '',
    gpsDevice: vehicle?.trackingNo || vehicle?.gpsDevice || '',
    hasGpsFlag: Boolean(vehicle?.gps),
    photoUrl: vehicle?.photoUrl || vehicle?.image || vehicle?.photo || '',
    maxKg,
    maxM3,
    maxPallets: asNumber(vehicle?.maxPallets) || 0,
    currentKg: Number(loadKg || 0),
    currentM3: Number(loadM3 || 0),
    fillPct: fill,
    heightM: mmToMeters(vehicle?.innerHeightMm || vehicle?.heightMm || vehicle?.heightM),
    widthM: mmToMeters(vehicle?.innerWidthMm || vehicle?.widthMm || vehicle?.widthM),
    lengthM: mmToMeters(vehicle?.innerLengthMm || vehicle?.lengthMm || vehicle?.lengthM),
    weightKg: asNumber(vehicle?.weightKg),
  }
}

function driverView(employee, trip, vehicle) {
  const name = employee ? fullName(employee) : trip?.driverName || vehicle?.driver || ''
  if (!name && !trip?.driverPhone && !vehicle?.phone) return null
  return {
    id: employee?.id || trip?.driverId || '',
    employeeNo: employee?.employeeNo || '',
    name,
    phone: employee?.phone || trip?.driverPhone || vehicle?.phone || '',
    email: employee?.email || '',
    photoUrl: employee?.photoUrl || employee?.avatar || employee?.photo || '',
    status: employee?.status || '',
    plate: vehicle?.plate || trip?.plate || '',
  }
}

function driverStats(driverName) {
  if (!driverName) return null
  const trips = loadTrips().filter(
    (trip) =>
      String(trip.driverName || '').toLocaleLowerCase('tr-TR') ===
      driverName.toLocaleLowerCase('tr-TR'),
  )
  if (!trips.length) return null
  let onTime = 0
  let delayed = 0
  let failed = 0
  let km = 0
  trips.forEach((trip) => {
    km += Number(trip.route?.distanceKm) || 0
    ;(trip.stops || []).forEach((stop) => {
      const status = normalizeStopStatus(stop.status).id
      if (status === 'delivered') onTime += 1
      if (status === 'delayed') delayed += 1
      if (status === 'failed') failed += 1
    })
  })
  return {
    totalShipments: trips.length,
    totalKm: km || null,
    onTime,
    delayed,
    failed,
  }
}

function gpsTrail(record) {
  const rows = record?.gpsHistory || record?.trackingPoints || record?.gpsTrail || []
  return (Array.isArray(rows) ? rows : []).filter(isRealGpsFix).map((point) => ({
    at: point.at || point.timestamp || point.updatedAt || '',
    lat: Number(point.lat),
    lng: Number(point.lng),
    speed: asNumber(point.speed ?? point.speedKmh),
    heading: asNumber(point.heading),
    source: point.source || point.gpsSource || 'device',
  }))
}

function eventsFrom(record) {
  const history = record?.statusHistory || record?.events || record?.timeline || []
  return (Array.isArray(history) ? history : []).map((item, index) => ({
    id: item.id || `evt-${index}`,
    at: item.at || item.date || item.createdAt || '',
    label: item.label || item.text || item.action || item.status || 'Olay',
    kind: item.kind || item.type || 'status',
  }))
}

function notesFrom(record) {
  const notes = record?.notesList || record?.logisticsNotes || []
  if (Array.isArray(notes) && notes.length) {
    return notes.map((note, index) => ({
      id: note.id || `note-${index}`,
      author: note.author || note.role || 'Operasyon',
      text: note.text || note.body || '',
      at: note.at || note.createdAt || '',
    }))
  }
  if (record?.notes && typeof record.notes === 'string' && record.notes.trim()) {
    return [
      { id: 'note-legacy', author: 'Operasyon', text: record.notes, at: record.updatedAt || '' },
    ]
  }
  return []
}

function originPoint(hq, record) {
  if (record?.originLat != null && record?.originLng != null) {
    return {
      lat: Number(record.originLat),
      lng: Number(record.originLng),
      label: record.origin || 'Çıkış',
    }
  }
  return { lat: hq.lat, lng: hq.lng, label: record?.origin || hq.label || 'Depo / Merkez' }
}

function assembleCard(id, title, subtitle, status, plate, extra = {}) {
  const meta = normalizeShipmentStatus(status)
  return {
    id,
    title,
    subtitle,
    plate,
    status: meta.id,
    statusLabel: meta.label,
    statusTone: meta.tone,
    ...extra,
  }
}

export function listTruckControlCards(orgScope = getActiveOrgScope()) {
  const trips = filterByOrgScope(loadTrips(), orgScope)
  const shipments = filterByOrgScope(loadShipments(), orgScope)
  const plans = filterByOrgScope(loadLoadPlans(), orgScope)
  const tripIds = new Set(trips.map((row) => row.id))
  const tripPlates = new Set(
    trips
      .map((row) =>
        String(row.plate || '')
          .replace(/\s+/g, '')
          .toUpperCase(),
      )
      .filter(Boolean),
  )
  const tripPlanIds = new Set(trips.map((row) => row.loadPlanId).filter(Boolean))

  const cards = trips.map((trip) => {
    const stops = trip.stops || []
    const origin = trip.origin || 'Depo'
    const dest =
      stops[stops.length - 1]?.city ||
      stops[stops.length - 1]?.customerLabel ||
      trip.destination ||
      ''
    return assembleCard(
      trip.id,
      trip.plate || trip.code || 'TIR',
      [origin, dest].filter(Boolean).join(' → '),
      trip.status,
      trip.plate || '',
      {
        code: trip.code,
        source: 'trip',
        stopCount: stops.length,
        stops: stops.length,
        corridor: [origin, dest].filter(Boolean).join(' → '),
        driverName: trip.driverName || '',
        hasLiveGps: isRealGpsFix(trip.gpsFix || trip.lastGps),
        gpsLive: isRealGpsFix(trip.gpsFix || trip.lastGps),
      },
    )
  })

  shipments.forEach((shipment) => {
    if (tripIds.has(shipment.id) || tripIds.has(shipment.tripId)) return
    cards.push(
      assembleCard(
        shipment.id,
        shipment.vehiclePlate || shipment.code || 'Sevkiyat',
        [shipment.origin, shipment.destination].filter(Boolean).join(' → '),
        shipment.status,
        shipment.vehiclePlate || '',
        { code: shipment.code, source: 'shipment', stopCount: (shipment.stops || []).length },
      ),
    )
  })

  plans.forEach((plan) => {
    if (tripPlanIds.has(plan.id) || tripIds.has(plan.id)) return
    const plate = String(plan.vehiclePlate || '')
      .replace(/\s+/g, '')
      .toUpperCase()
    if (plate && tripPlates.has(plate)) return
    cards.push(
      assembleCard(
        plan.id,
        plan.vehiclePlate || plan.truckKey || plan.code || 'Yük planı',
        plan.code || '',
        plan.status,
        plan.vehiclePlate || '',
        { code: plan.code, source: 'plan', stopCount: 0 },
      ),
    )
  })

  return cards.sort((a, b) => String(b.code || '').localeCompare(String(a.code || '')))
}

function assertScope(record, orgScope) {
  if (!record) return 'not_found'
  if (!matchesOrgScope(record, orgScope)) return 'forbidden'
  return null
}

function buildKpis({ stops, googleRoute, gpsFix, vehicle }) {
  const delivered = stops.filter((stop) => stop.status === 'delivered').length
  const delayed = stops.filter((stop) => stop.status === 'delayed').length
  const inTransit = stops.filter((stop) =>
    ['in_transit', 'approaching', 'on_site'].includes(stop.status),
  ).length
  const waiting = stops.filter((stop) =>
    ['planned', 'loading', 'loaded'].includes(stop.status),
  ).length
  const failed = stops.filter((stop) => ['failed', 'returned'].includes(stop.status)).length
  const remainingStops = Math.max(0, stops.length - delivered)
  const deliveryPct = stops.length ? Math.round((delivered / stops.length) * 100) : 0

  const remainingMeters = gpsFix && googleRoute?.distanceMeters != null ? null : null
  const planMeters = googleRoute?.distanceMeters ?? null
  const planDuration = googleRoute?.durationSec ?? null
  const staticDuration = googleRoute?.staticDurationSec ?? null

  return {
    remainingKmLabel: gpsFix ? formatKmLabel(remainingMeters ?? planMeters) : null,
    remainingDurationLabel: gpsFix ? formatDurationLabel(planDuration) : null,
    etaLabel: gpsFix && planDuration != null ? etaClockFromDuration(planDuration) : null,
    planKmLabel: formatKmLabel(planMeters),
    planDurationLabel: formatDurationLabel(staticDuration ?? planDuration),
    trafficDurationLabel: formatDurationLabel(planDuration),
    trafficDeltaLabel:
      googleRoute?.trafficDeltaSec != null && googleRoute.trafficDeltaSec !== 0
        ? `${googleRoute.trafficDeltaSec > 0 ? '+' : ''}${formatDurationLabel(Math.abs(googleRoute.trafficDeltaSec))}`
        : googleRoute?.trafficDeltaSec === 0
          ? '0 dk'
          : null,
    delivered,
    totalStops: stops.length,
    delayed,
    inTransit,
    waiting,
    failed,
    remainingStops,
    deliveryPct,
    fillPct: vehicle?.fillPct ?? null,
    remainingMeters: gpsFix ? (remainingMeters ?? planMeters) : null,
    remainingDurationSec: gpsFix ? planDuration : null,
  }
}

function operationBanner({ delayed, gpsFix, nextWindowRisk }) {
  if (delayed > 1 || nextWindowRisk?.critical) {
    return {
      tone: 'red',
      title: 'Kritik gecikme',
      detail: 'Birden fazla teslimatta gecikme riski var.',
    }
  }
  if (delayed === 1 || nextWindowRisk) {
    return {
      tone: 'amber',
      title: '1 teslimatta gecikme riski var',
      detail: nextWindowRisk?.label || 'Zaman penceresi aşılabilir.',
    }
  }
  if (!gpsFix) {
    return {
      tone: 'muted',
      title: 'Sevkiyat planı yüklendi',
      detail: 'Canlı GPS bağlantısı yok — konum tahmini üretilmiyor.',
    }
  }
  return {
    tone: 'green',
    title: 'Sevkiyat normal ilerliyor',
    detail: 'Canlı konum ve teslimat durumu güncel.',
  }
}

function nextWindowRisk(stops, googleRoute) {
  const next = stops.find((stop) => !['delivered', 'failed', 'returned'].includes(stop.status))
  if (!next?.windowEnd || googleRoute?.durationSec == null) return null
  const eta = new Date(Date.now() + googleRoute.durationSec * 1000)
  const [hh, mm] = String(next.windowEnd).split(':').map(Number)
  if (!Number.isFinite(hh)) return null
  const window = new Date()
  window.setHours(hh, Number.isFinite(mm) ? mm : 0, 0, 0)
  const delayMin = Math.round((eta.getTime() - window.getTime()) / 60000)
  if (delayMin <= 0) return null
  return {
    stopId: next.id,
    delayMin,
    critical: delayMin >= 45,
    label: `${delayMin} dakika gecikme riski · ${next.customerLabel}`,
  }
}

function persistTarget(kind, record) {
  if (kind === 'trip') return upsertTrip(record)
  if (kind === 'shipment') return upsertShipment(record)
  if (kind === 'plan') return upsertLoadPlan(record)
  return record
}

function resolveSource(id) {
  const trip = getTrip(id)
  if (trip) return { kind: 'trip', record: trip }
  const shipment = loadShipments().find((row) => row.id === id)
  if (shipment) return { kind: 'shipment', record: shipment }
  const plan = loadLoadPlans().find((row) => row.id === id)
  if (plan) return { kind: 'plan', record: plan }
  const vehicle = loadVehicles().find((row) => row.id === id)
  if (vehicle) return { kind: 'vehicle', record: vehicle }
  return null
}

export function loadTruckControlDetail(id, orgScope = getActiveOrgScope()) {
  try {
    return loadTruckControlDetailUnsafe(id, orgScope)
  } catch (error) {
    console.warn('[truck-control] detail load', error)
    return { error: 'not_found', detail: null }
  }
}

function loadTruckControlDetailUnsafe(id, orgScope = {}) {
  if (!id) return { error: 'not_found', detail: null }
  const source = resolveSource(id)
  if (!source) return { error: 'not_found', detail: null }
  const scopeError = assertScope(source.record, orgScope)
  if (scopeError) return { error: scopeError, detail: null }

  const hq = getCompanyStartPoint(readCompanySettings())
  const customers = getCustomerProfiles()
  const record = source.record
  const linkedPlan =
    source.kind !== 'plan'
      ? loadLoadPlans().find(
          (plan) => plan.id === record.loadPlanId || plan.code === record.loadPlanCode,
        ) || null
      : record
  const linkedRoute = loadRoutes().find((row) => row.id === record.routeId) || null
  const vehicle = findVehicle({
    plate: record.plate || record.vehiclePlate,
    vehicleId: record.vehicleId || linkedPlan?.vehicleId,
    driverName: record.driverName,
  })
  const employee = findDriver({
    driverId: record.driverId,
    driverName: record.driverName,
    driverPhone: record.driverPhone,
    vehicle,
  })

  let stops = []
  if (Array.isArray(record.stops) && record.stops.length) {
    stops = record.stops.map((stop, index) => mapStop(stop, index, customers))
  } else if (Array.isArray(linkedRoute?.stops) && linkedRoute.stops.length) {
    stops = linkedRoute.stops.map((stop, index) =>
      mapStop(
        {
          ...stop,
          customerLabel: stop.city || stop.customer,
          address: stop.address || stop.city,
        },
        index,
        customers,
      ),
    )
  } else if (record.destination) {
    stops = [
      mapStop(
        {
          id: 'dest-1',
          customerLabel: record.destination,
          city: record.destination,
          address: record.destination,
          status: record.status === 'delivered' ? 'delivered' : 'planned',
        },
        0,
        customers,
      ),
    ]
  }

  const deliveries = loadDeliveries().filter(
    (row) =>
      row.shipmentId === record.id || row.tripId === record.id || row.planId === linkedPlan?.id,
  )
  if (!stops.length && deliveries.length) {
    stops = deliveries.map((row, index) =>
      mapStop(
        {
          id: row.id,
          customerLabel: row.customer,
          city: row.city,
          status: row.status,
        },
        index,
        customers,
      ),
    )
  }

  const cargoFromStops = stops.flatMap((stop) => stop.cargo)
  const cargo = cargoFromStops.length ? cargoFromStops : cargoFromPlan(linkedPlan)
  const loadKg = cargo.reduce((sum, item) => sum + (Number(item.kg) || 0), 0)
  const loadM3 = cargo.reduce((sum, item) => sum + (Number(item.volumeM3) || 0), 0)
  const vehicleInfo = vehicleView(vehicle, record.plate || record.vehiclePlate, loadKg, loadM3)
  const driver = driverView(employee, record, vehicleInfo)
  const gpsFixRaw = record.gpsFix || record.lastGps || vehicle?.lastGps || vehicle?.gpsFix || null
  const gpsFix = isRealGpsFix(gpsFixRaw)
    ? { ...gpsFixRaw, source: gpsFixRaw.source || 'device' }
    : null
  const origin = originPoint(hq, record)
  const destination = stops[stops.length - 1] || null
  const intermediates = stops.slice(0, -1).filter((stop) => stop.lat != null && stop.lng != null)
  const googleSnapshot =
    record.routeSnapshot && record.routeSnapshot.encodedPolyline ? record.routeSnapshot : null
  const googleRoute = googleSnapshot?.primary || googleSnapshot || null
  const kpis = buildKpis({
    stops,
    googleRoute: googleRoute?.distanceMeters ? googleRoute : null,
    gpsFix,
    vehicle: vehicleInfo,
  })
  const windowRisk = nextWindowRisk(stops, googleRoute)
  const banner = operationBanner({ delayed: kpis.delayed, gpsFix, nextWindowRisk: windowRisk })
  const customerIds = stops.map((stop) => stop.customerId)
  const customerLabels = stops.map((stop) => stop.customerLabel)
  const invoices = relatedInvoices(customerIds)
  const orders = relatedOrders(customerIds, customerLabels).map((order) => ({
    ...order,
    totals: orderTotals(order),
  }))
  const documents = relatedDocuments([record.id, record.code, linkedPlan?.code, linkedPlan?.id])
  const neighbors = listTruckControlCards(orgScope)
  const index = neighbors.findIndex((row) => row.id === id)

  const corridor = [origin.label, ...stops.map((stop) => stop.city || stop.customerLabel)].filter(
    Boolean,
  )

  return {
    error: null,
    detail: {
      id: record.id,
      kind: source.kind,
      code: record.code || linkedPlan?.code || record.id,
      plate: vehicleInfo?.plate || record.plate || record.vehiclePlate || '',
      corridor: corridor.filter((item, idx, arr) => arr.indexOf(item) === idx),
      corridorLabel: corridor.filter((item, idx, arr) => arr.indexOf(item) === idx).join(' → '),
      status: normalizeShipmentStatus(record.status),
      origin,
      destination,
      intermediates,
      stops,
      cargo,
      cargoByCustomer: groupCargoByCustomer(cargo),
      vehicle: vehicleInfo,
      driver,
      driverStats: {
        shipment: {
          delivered: kpis.delivered,
          total: kpis.totalStops,
          onTime: Math.max(0, kpis.delivered - kpis.delayed),
          delayed: kpis.delayed,
          failed: kpis.failed,
        },
        overall: driverStats(driver?.name),
      },
      gpsFix,
      gpsHistory: gpsTrail(record).concat(gpsTrail(vehicle)),
      hasLiveGps: Boolean(gpsFix),
      kpis,
      banner,
      windowRisk,
      invoices,
      orders,
      documents,
      events: eventsFrom(record),
      notes: notesFrom(record),
      routeSettings: {
        avoidTolls: Boolean(record.routeSettings?.avoidTolls),
        avoidHighways: Boolean(record.routeSettings?.avoidHighways),
        avoidFerries: Boolean(record.routeSettings?.avoidFerries),
      },
      routeSnapshot: googleSnapshot,
      routeNeedsRecalc: Boolean(record.routeNeedsRecalc),
      prevId: index > 0 ? neighbors[index - 1].id : null,
      nextId: index >= 0 && index < neighbors.length - 1 ? neighbors[index + 1].id : null,
      record,
      linkedPlan,
    },
  }
}

function groupCargoByCustomer(cargo) {
  const map = new Map()
  cargo.forEach((item) => {
    const key = item.customerId || item.customerLabel || 'Diğer'
    const current = map.get(key) || {
      customerId: item.customerId,
      label: item.customerLabel || 'Müşteri',
      pallets: 0,
      kg: 0,
      boxes: 0,
    }
    current.pallets += Number(item.pallets) || 0
    current.kg += Number(item.kg) || 0
    current.boxes += Number(item.boxes) || 0
    map.set(key, current)
  })
  return [...map.values()]
}

function audit(action, detail) {
  try {
    appendOrgLog(action, detail)
  } catch {
    // org log optional
  }
  try {
    appendActivityEntry({
      action: 'update',
      module: 'workflow',
      entityType: 'shipment',
      entityId: detail.id,
      entityLabel: detail.code || detail.plate || detail.id,
      description: action,
    })
  } catch {
    // archive optional
  }
}

export function saveTruckRouteSnapshot(id, snapshot, orgScope = {}) {
  const source = resolveSource(id)
  if (!source || assertScope(source.record, orgScope)) return null
  const next = persistTarget(source.kind, {
    ...source.record,
    routeSnapshot: snapshot,
    routeNeedsRecalc: false,
    route: {
      ...(source.record.route || {}),
      distanceKm:
        snapshot?.primary?.distanceMeters != null
          ? snapshot.primary.distanceMeters / 1000
          : source.record.route?.distanceKm,
      durationMin:
        snapshot?.primary?.durationSec != null
          ? Math.round(snapshot.primary.durationSec / 60)
          : source.record.route?.durationMin,
      calculatedAt: snapshot?.computedAt || new Date().toISOString(),
      source: 'google-routes',
    },
  })
  audit('Rota hesaplandı', { id, code: source.record.code })
  return next
}

export function saveTruckRouteSettings(id, settings, orgScope = {}) {
  const source = resolveSource(id)
  if (!source || assertScope(source.record, orgScope)) return null
  const next = persistTarget(source.kind, {
    ...source.record,
    routeSettings: {
      avoidTolls: Boolean(settings.avoidTolls),
      avoidHighways: Boolean(settings.avoidHighways),
      avoidFerries: Boolean(settings.avoidFerries),
    },
    routeNeedsRecalc: true,
  })
  audit('Rota ayarları değişti', { id, ...settings })
  return next
}

export function reorderTruckStops(id, orderedIds, orgScope = {}) {
  const source = resolveSource(id)
  if (!source || assertScope(source.record, orgScope)) return null
  const current = source.record.stops || []
  const byId = new Map(current.map((stop) => [stop.id, stop]))
  const stops = orderedIds
    .map((stopId) => byId.get(stopId))
    .filter(Boolean)
    .map((stop, index) => ({ ...stop, seq: index + 1 }))
  const next = persistTarget(source.kind, {
    ...source.record,
    stops,
    routeNeedsRecalc: true,
  })
  audit('Teslimat sırası değişti', { id })
  return next
}

export function appendTruckNote(id, text, orgScope = {}) {
  const source = resolveSource(id)
  const body = typeof text === 'string' ? text : text?.text
  if (!source || assertScope(source.record, orgScope) || !String(body || '').trim()) return null
  const notesList = [
    {
      id: `note-${Date.now()}`,
      author: 'Lojistik sorumlusu',
      text: String(body).trim(),
      at: new Date().toISOString(),
    },
    ...(Array.isArray(source.record.notesList) ? source.record.notesList : []),
  ]
  const next = persistTarget(source.kind, { ...source.record, notesList })
  audit('Not eklendi', { id })
  return next
}

export function selectTruckAlternateRoute(id, route, orgScope = {}) {
  const source = resolveSource(id)
  if (!source || assertScope(source.record, orgScope) || !route) return null
  const snapshot = {
    ...(source.record.routeSnapshot || {}),
    primary: route,
    selectedIndex: route.index,
    computedAt: source.record.routeSnapshot?.computedAt || new Date().toISOString(),
    source: 'google-routes',
  }
  const next = persistTarget(source.kind, {
    ...source.record,
    routeSnapshot: snapshot,
    routeNeedsRecalc: false,
  })
  audit('Alternatif rota seçildi', { id, label: route.label })
  return next
}

export function filterGpsHistory(points, hours) {
  if (!hours) return points
  const from = Date.now() - hours * 3600 * 1000
  return points.filter((point) => {
    const t = new Date(point.at).getTime()
    return Number.isFinite(t) && t >= from
  })
}

export function formatClock(value) {
  return formatWhen(value)
}

export function headingToLabel(deg) {
  return headingLabel(deg)
}

export function unpaidInvoiceCount(invoices) {
  return invoices.filter((row) => Number(row.remainingAmount) > 0).length
}

export const tirSevkiyatDetailPath = TRUCK_CONTROL_DETAIL_PATH
export const TIR_SEVKIYAT_LIST_PATH = TRUCK_CONTROL_LIST_PATH
export const STOP_STATUS = STOP_STATUS_META

export function tripStatusLabel(status) {
  return normalizeShipmentStatus(status).label
}

export function logTruckControlAudit(entry = {}) {
  audit(entry.description || entry.action || 'update', {
    id: entry.entityId,
    code: entry.entityLabel,
    ...entry,
  })
}

export function stopStatusMeta(status) {
  return normalizeStopStatus(status)
}

export { headingLabel, formatWhen }

export const waHref = whatsappHref
