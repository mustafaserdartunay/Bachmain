import {
  PALLET_TEMPLATES,
  PACKAGE_TEMPLATES,
  TRAILER_TEMPLATES,
  volumeM3,
} from './logisticsCatalogs'
import { scheduleTenantPush } from './tenantSync'

const KEYS = {
  vehicles: 'bach-logistics-vehicles',
  trailers: 'bach-logistics-trailers',
  pallets: 'bach-logistics-pallets',
  boxes: 'bach-logistics-boxes',
  packages: 'bach-logistics-packages',
  shipments: 'bach-logistics-shipments',
  loadPlans: 'bach-logistics-load-plans',
  routes: 'bach-logistics-routes',
  deliveries: 'bach-logistics-deliveries',
  documents: 'bach-logistics-documents',
}

const EVENT = 'bach:logistics-updated'

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function read(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function write(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows))
  try {
    scheduleTenantPush(key, rows)
  } catch {
    // tenant sync optional
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
  return rows
}

function ensureSeed(key, seedFn) {
  const current = read(key, null)
  if (current && current.length) return current
  const seeded = seedFn()
  write(key, seeded)
  return seeded
}

function seedTrailers() {
  return TRAILER_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    innerLengthMm: t.innerLengthMm,
    innerWidthMm: t.innerWidthMm,
    innerHeightMm: t.innerHeightMm,
    maxWeightKg: t.maxWeightKg,
    maxPallets: t.maxPallets,
    maxVolumeM3: t.maxVolumeM3 || volumeM3(t.innerLengthMm, t.innerWidthMm, t.innerHeightMm),
    system: true,
    createdAt: new Date().toISOString(),
  }))
}

function seedPallets() {
  return PALLET_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    lengthMm: t.lengthMm,
    widthMm: t.widthMm,
    heightMm: t.heightMm,
    tareKg: t.tareKg,
    maxHeightMm: t.maxHeightMm,
    maxKg: t.maxKg,
    system: t.id !== 'custom',
    createdAt: new Date().toISOString(),
  }))
}

function seedPackages() {
  return PACKAGE_TEMPLATES.map((t) => ({
    id: t.id,
    label: t.label,
    units: t.units,
    system: t.id !== 'custom',
    createdAt: new Date().toISOString(),
  }))
}

function seedBoxes() {
  return [
    {
      id: 'box-std-400',
      label: 'Standart Koli 400',
      lengthMm: 400,
      widthMm: 300,
      heightMm: 300,
      grossKg: 0.4,
      netKg: 0.35,
      stackable: true,
      maxStack: 6,
      system: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'box-std-600',
      label: 'Standart Koli 600',
      lengthMm: 600,
      widthMm: 400,
      heightMm: 400,
      grossKg: 0.7,
      netKg: 0.6,
      stackable: true,
      maxStack: 4,
      system: true,
      createdAt: new Date().toISOString(),
    },
  ].map((b) => ({
    ...b,
    volumeM3: volumeM3(b.lengthMm, b.widthMm, b.heightMm),
  }))
}

function seedVehicles() {
  const eu = TRAILER_TEMPLATES[0]
  return [
    {
      id: uid('veh'),
      type: 'truck',
      brand: 'Mercedes-Benz',
      model: 'Actros',
      plate: '34 BM 0101',
      driver: 'Ahmet Yılmaz',
      phone: '+90 532 000 00 00',
      company: 'BachMain Lojistik',
      weightKg: 7500,
      volumeM3: eu.maxVolumeM3,
      innerLengthMm: eu.innerLengthMm,
      innerWidthMm: eu.innerWidthMm,
      innerHeightMm: eu.innerHeightMm,
      maxPallets: eu.maxPallets,
      maxWeightKg: eu.maxWeightKg,
      maxVolumeM3: eu.maxVolumeM3,
      doorType: 'rear',
      refrigerated: false,
      gps: true,
      trackingNo: 'TRK-DEMO-001',
      trailerTemplateId: 'eu-standard',
      createdAt: new Date().toISOString(),
    },
  ]
}

export function loadVehicles() {
  return ensureSeed(KEYS.vehicles, seedVehicles)
}
export function saveVehicles(rows) {
  return write(KEYS.vehicles, rows)
}
export function upsertVehicle(row) {
  const rows = loadVehicles()
  const next = { ...row, id: row.id || uid('veh'), updatedAt: new Date().toISOString() }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveVehicles(rows)
}
export function deleteVehicle(id) {
  return saveVehicles(loadVehicles().filter((r) => r.id !== id))
}

export function loadTrailers() {
  return ensureSeed(KEYS.trailers, seedTrailers)
}
export function saveTrailers(rows) {
  return write(KEYS.trailers, rows)
}
export function upsertTrailer(row) {
  const rows = loadTrailers()
  const next = {
    ...row,
    id: row.id || uid('trl'),
    maxVolumeM3: row.maxVolumeM3 || volumeM3(row.innerLengthMm, row.innerWidthMm, row.innerHeightMm),
    updatedAt: new Date().toISOString(),
  }
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveTrailers(rows)
}
export function deleteTrailer(id) {
  const rows = loadTrailers()
  const target = rows.find((r) => r.id === id)
  if (target?.system) return rows
  return saveTrailers(rows.filter((r) => r.id !== id))
}

export function loadPalletTypes() {
  return ensureSeed(KEYS.pallets, seedPallets)
}
export function savePalletTypes(rows) {
  return write(KEYS.pallets, rows)
}
export function upsertPalletType(row) {
  const rows = loadPalletTypes()
  const next = { ...row, id: row.id || uid('pal'), updatedAt: new Date().toISOString() }
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return savePalletTypes(rows)
}
export function deletePalletType(id) {
  const rows = loadPalletTypes()
  const target = rows.find((r) => r.id === id)
  if (target?.system) return rows
  return savePalletTypes(rows.filter((r) => r.id !== id))
}

export function loadBoxTypes() {
  return ensureSeed(KEYS.boxes, seedBoxes)
}
export function saveBoxTypes(rows) {
  return write(KEYS.boxes, rows)
}
export function upsertBoxType(row) {
  const rows = loadBoxTypes()
  const next = {
    ...row,
    id: row.id || uid('box'),
    volumeM3: volumeM3(row.lengthMm, row.widthMm, row.heightMm),
    updatedAt: new Date().toISOString(),
  }
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveBoxTypes(rows)
}
export function deleteBoxType(id) {
  const rows = loadBoxTypes()
  const target = rows.find((r) => r.id === id)
  if (target?.system) return rows
  return saveBoxTypes(rows.filter((r) => r.id !== id))
}

export function loadPackageTypes() {
  return ensureSeed(KEYS.packages, seedPackages)
}
export function savePackageTypes(rows) {
  return write(KEYS.packages, rows)
}
export function upsertPackageType(row) {
  const rows = loadPackageTypes()
  const next = { ...row, id: row.id || uid('pkg'), updatedAt: new Date().toISOString() }
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return savePackageTypes(rows)
}
export function deletePackageType(id) {
  const rows = loadPackageTypes()
  const target = rows.find((r) => r.id === id)
  if (target?.system) return rows
  return savePackageTypes(rows.filter((r) => r.id !== id))
}

export function loadShipments() {
  return read(KEYS.shipments, [])
}
export function saveShipments(rows) {
  return write(KEYS.shipments, rows)
}
export function upsertShipment(row) {
  const rows = loadShipments()
  const next = {
    ...row,
    id: row.id || uid('shp'),
    code: row.code || `SVK-${String(rows.length + 1).padStart(4, '0')}`,
    status: row.status || 'draft',
    updatedAt: new Date().toISOString(),
  }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveShipments(rows)
}
export function deleteShipment(id) {
  return saveShipments(loadShipments().filter((r) => r.id !== id))
}

export function loadLoadPlans() {
  return read(KEYS.loadPlans, [])
}
export function saveLoadPlans(rows) {
  return write(KEYS.loadPlans, rows)
}
export function upsertLoadPlan(row) {
  const rows = loadLoadPlans()
  const next = {
    ...row,
    id: row.id || uid('load'),
    code: row.code || `YUK-${String(rows.length + 1).padStart(4, '0')}`,
    status: row.status || 'draft',
    pallets: Array.isArray(row.pallets) ? row.pallets : [],
    placements: Array.isArray(row.placements) ? row.placements : [],
    updatedAt: new Date().toISOString(),
  }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveLoadPlans(rows)
}
export function deleteLoadPlan(id) {
  return saveLoadPlans(loadLoadPlans().filter((r) => r.id !== id))
}

export function loadRoutes() {
  return read(KEYS.routes, [])
}
export function saveRoutes(rows) {
  return write(KEYS.routes, rows)
}
export function upsertRoute(row) {
  const rows = loadRoutes()
  const next = {
    ...row,
    id: row.id || uid('rte'),
    code: row.code || `RTA-${String(rows.length + 1).padStart(4, '0')}`,
    stops: Array.isArray(row.stops) ? row.stops : [],
    updatedAt: new Date().toISOString(),
  }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveRoutes(rows)
}
export function deleteRoute(id) {
  return saveRoutes(loadRoutes().filter((r) => r.id !== id))
}

export function loadDeliveries() {
  return read(KEYS.deliveries, [])
}
export function saveDeliveries(rows) {
  return write(KEYS.deliveries, rows)
}
export function upsertDelivery(row) {
  const rows = loadDeliveries()
  const next = {
    ...row,
    id: row.id || uid('dlv'),
    status: row.status || 'pending',
    updatedAt: new Date().toISOString(),
  }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveDeliveries(rows)
}

export function loadLogisticsDocuments() {
  return read(KEYS.documents, [])
}
export function saveLogisticsDocuments(rows) {
  return write(KEYS.documents, rows)
}
export function upsertLogisticsDocument(row) {
  const rows = loadLogisticsDocuments()
  const next = {
    ...row,
    id: row.id || uid('doc'),
    language: row.language || 'tr',
    updatedAt: new Date().toISOString(),
  }
  if (!row.id) next.createdAt = new Date().toISOString()
  const idx = rows.findIndex((r) => r.id === next.id)
  if (idx >= 0) rows[idx] = { ...rows[idx], ...next }
  else rows.unshift(next)
  return saveLogisticsDocuments(rows)
}

export function getLogisticsSummary() {
  const vehicles = loadVehicles()
  const plans = loadLoadPlans()
  const shipments = loadShipments()
  const deliveries = loadDeliveries()
  const activePlan = plans.find((p) => p.status === 'active' || p.status === 'draft')
  const placements = activePlan?.placements || []
  const pallets = activePlan?.pallets || []
  const vehicle = vehicles.find((v) => v.id === activePlan?.vehicleId) || vehicles[0]
  const usedVolume = pallets.reduce((s, p) => s + Number(p.volumeM3 || 0), 0)
  const usedKg = pallets.reduce((s, p) => s + Number(p.weightKg || 0), 0)
  const capacityM3 = Number(vehicle?.maxVolumeM3 || 90)
  const capacityKg = Number(vehicle?.maxWeightKg || 24000)
  return {
    vehicles: vehicles.length,
    shipments: shipments.length,
    loadPlans: plans.length,
    deliveriesPending: deliveries.filter((d) => d.status !== 'delivered').length,
    deliveriesDone: deliveries.filter((d) => d.status === 'delivered').length,
    placedPallets: placements.length,
    fillVolumePct: capacityM3 ? Math.min(100, Math.round((usedVolume / capacityM3) * 100)) : 0,
    fillWeightPct: capacityKg ? Math.min(100, Math.round((usedKg / capacityKg) * 100)) : 0,
    emptyVolumeM3: Math.max(0, capacityM3 - usedVolume),
    totalKg: usedKg,
    totalM3: usedVolume,
  }
}

export const LOGISTICS_STORAGE_KEYS = Object.values(KEYS)
export const LOGISTICS_EVENT = EVENT
