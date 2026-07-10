import { CARGO_UNIT_TYPES, SHIPPING_VEHICLE_MODELS } from './shippingConstants'

export function getVehicleById(vehicleId) {
  return SHIPPING_VEHICLE_MODELS.find((vehicle) => vehicle.id === vehicleId) || SHIPPING_VEHICLE_MODELS[0]
}

export function getUnitType(unitId) {
  return CARGO_UNIT_TYPES.find((unit) => unit.id === unitId) || CARGO_UNIT_TYPES[0]
}

function itemVolumeM3(item) {
  const w = Number(item.widthCm) / 100
  const l = Number(item.lengthCm) / 100
  const h = Number(item.heightCm) / 100
  const qty = Math.max(1, Number(item.quantity) || 1)
  if (item.loadMode === 'palet') return 1.2 * 0.8 * 1.45 * qty
  return w * l * h * qty
}

function itemWeightKg(item) {
  return Math.max(1, Number(item.weightKg) || 1) * Math.max(1, Number(item.quantity) || 1)
}

export function buildCargoPlacements(items = [], vehicle) {
  const lengthM = vehicle?.lengthM || 13.6
  const widthM = vehicle?.widthM || 2.45
  const heightM = vehicle?.heightM || 2.7
  const placements = []
  let cursorX = 0
  let cursorY = 0
  let rowHeight = 0

  items.forEach((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1)
    const pieceLength = item.loadMode === 'palet' ? 1.2 : Number(item.widthCm) / 100
    const pieceWidth = item.loadMode === 'palet' ? 0.8 : Number(item.lengthCm) / 100
    const pieceHeight = item.loadMode === 'palet' ? 1.45 : Number(item.heightCm) / 100
    const color = item.loadMode === 'palet' ? '#8B6914' : '#c4a574'

    for (let index = 0; index < Math.min(qty, 120); index += 1) {
      if (cursorX + pieceLength > lengthM) {
        cursorX = 0
        cursorY += rowHeight + 0.05
        rowHeight = 0
      }
      if (cursorY + pieceWidth > widthM) break

      placements.push({
        id: `${item.id}-${index}`,
        itemId: item.id,
        name: item.name,
        loadMode: item.loadMode,
        x: cursorX / lengthM,
        y: cursorY / widthM,
        w: pieceLength / lengthM,
        h: pieceWidth / widthM,
        color,
        xM: cursorX + pieceLength / 2 - lengthM / 2,
        yM: pieceHeight / 2,
        zM: cursorY + pieceWidth / 2 - widthM / 2,
        lengthM: pieceLength,
        widthM: pieceWidth,
        heightM: pieceHeight,
      })
      cursorX += pieceLength + 0.04
      rowHeight = Math.max(rowHeight, pieceWidth)
    }
  })

  return { placements, lengthM, widthM, heightM }
}

export function summarizeLoading({ vehicleId, distanceKm = 0, items = [], cargoCalculated = true }) {
  const vehicle = getVehicleById(vehicleId)
  const totalVolume = items.reduce((sum, item) => sum + itemVolumeM3(item), 0)
  const totalWeight = items.reduce((sum, item) => sum + itemWeightKg(item), 0)
  const volumeM3 = vehicle.volumeM3 || 90
  const volumeRatio = volumeM3 > 0 ? totalVolume / volumeM3 : 0
  const weightRatio = vehicle.maxWeightKg > 0 ? totalWeight / vehicle.maxWeightKg : 0
  const ratio = Math.max(volumeRatio, weightRatio)
  const capacityStatus = !cargoCalculated ? 'ok' : ratio > 1 ? 'over' : ratio > 0.88 ? 'warn' : 'ok'
  const freight = Math.round((vehicle.pricePerKm * Math.max(0, Number(distanceKm) || 0) + totalVolume * 42) * 100) / 100
  const usedPercent = Math.min(100, Math.round(volumeRatio * 1000) / 10)
  const weightPercent = Math.min(100, Math.round(weightRatio * 1000) / 10)

  const barcodeSlips = []
  items.forEach((item) => {
    const unitType = item.loadMode === 'palet' ? 'palet' : 'koli'
    const qty = Math.max(1, Number(item.quantity) || 1)
    for (let index = 0; index < qty; index += 1) {
      barcodeSlips.push({
        id: `${item.id}-${unitType}-${index + 1}`,
        unitType,
        productName: item.name,
        sequence: index + 1,
        barcode: `SHP-${unitType.toUpperCase()}-${Date.now().toString().slice(-6)}-${String(index + 1).padStart(3, '0')}`,
        weightKg: Number(item.weightKg) || 1,
        volumeM3: itemVolumeM3({ ...item, quantity: 1 }),
      })
    }
  })

  const unitTotals = ['koli', 'palet'].map((unitType) => {
    const lines = items.filter((item) => (item.loadMode === 'palet' ? 'palet' : 'koli') === unitType)
    const quantity = lines.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
    return {
      unitType,
      quantity,
      weightKg: lines.reduce((sum, item) => sum + itemWeightKg(item), 0),
      volumeM3: lines.reduce((sum, item) => sum + itemVolumeM3(item), 0),
    }
  }).filter((row) => row.quantity > 0)

  return {
    vehicle,
    usedVolume: Math.round(totalVolume * 100) / 100,
    remainingVolume: Math.max(0, Math.round((volumeM3 - totalVolume) * 100) / 100),
    totalVolumeM3: volumeM3,
    totalWeight: Math.round(totalWeight),
    volumeRatio,
    weightRatio,
    usedPercent,
    weightPercent,
    capacityStatus,
    freight,
    barcodeSlips,
    unitTotals,
    pieceCount: barcodeSlips.length,
    cargoCalculated,
  }
}

export function createLoadingId() {
  return `YUK-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function createInvoiceNo() {
  return `NF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.random().toString().slice(2, 6).toUpperCase()}`
}

export function itemsFromLegacyForm(form) {
  if (form.items?.[0]?.widthCm) return form.items
  return (form.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    loadMode: item.unitType === 'palet' ? 'palet' : 'koli',
    widthCm: 50,
    lengthCm: 60,
    heightCm: 40,
    weightKg: item.unitType === 'palet' ? 800 : 20,
    quantity: item.quantity || 1,
  }))
}
