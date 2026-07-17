/** Truck&Co tarzı slot / kapasite hesaplama (cm birimi) */

export const TRUCK_PRESETS = {
  panelvan: { key: 'panelvan', name: 'Kamyonet (Panelvan)', L: 300, W: 170, H: 170, maxWeight: 1000 },
  kamyon_kucuk: { key: 'kamyon_kucuk', name: 'Kamyon (Küçük, 7.2m)', L: 720, W: 240, H: 240, maxWeight: 4000 },
  kamyon_buyuk: { key: 'kamyon_buyuk', name: 'Kamyon (Büyük, 9m)', L: 900, W: 245, H: 245, maxWeight: 10000 },
  tir: { key: 'tir', name: 'Standart Tır (Tenteli, 13.6m)', L: 1360, W: 245, H: 270, maxWeight: 24000 },
  mega: { key: 'mega', name: 'Mega Trailer (13.6m × 3.0m)', L: 1362, W: 248, H: 300, maxWeight: 24500 },
  konteyner20: { key: 'konteyner20', name: 'Konteyner 20ft', L: 590, W: 235, H: 239, maxWeight: 21500 },
  konteyner40: { key: 'konteyner40', name: 'Konteyner 40ft', L: 1203, W: 235, H: 239, maxWeight: 26000 },
  konteyner40hc: { key: 'konteyner40hc', name: 'Konteyner 40ft HC', L: 1203, W: 235, H: 270, maxWeight: 26500 },
}

export const GRID_MODULES = {
  euro: { key: 'euro', name: 'Europalet (80×120 cm)', L: 120, W: 80 },
  industrial: { key: 'industrial', name: 'Endüstriyel Palet (100×120 cm)', L: 120, W: 100 },
  half: { key: 'half', name: 'Yarım Europalet (60×80 cm)', L: 80, W: 60 },
}

export const LOAD_PRESETS = [
  { name: 'Europalet', L: 120, W: 80, H: 150, weight: 500, stackable: false, icon: 'square' },
  { name: 'Endüstriyel Palet', L: 120, W: 100, H: 150, weight: 600, stackable: false, icon: 'square' },
  { name: 'Koli — Küçük', L: 40, W: 30, H: 30, weight: 8, stackable: true, icon: 'package' },
  { name: 'Koli — Orta', L: 60, W: 40, H: 40, weight: 15, stackable: true, icon: 'package' },
  { name: 'Koli — Büyük', L: 80, W: 60, H: 60, weight: 25, stackable: true, icon: 'package' },
  { name: 'Özel Ölçü', L: 100, W: 100, H: 100, weight: 50, stackable: false, icon: 'box' },
]

export const SLOT_COLORS = [
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#D1FAE5', fg: '#047857' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#E0E7FF', fg: '#4338CA' },
  { bg: '#CFFAFE', fg: '#0E7490' },
  { bg: '#FFEDD5', fg: '#C2410C' },
  { bg: '#EDE9FE', fg: '#6D28D9' },
]

/** Taban yerleşiminde en iyi yön (döndürmeli) */
export function bestFloorCount(truckL, truckW, itemL, itemW) {
  const a = Math.floor(truckL / itemL) * Math.floor(truckW / itemW)
  const b = Math.floor(truckL / itemW) * Math.floor(truckW / itemL)
  return Math.max(a, b)
}

export function standaloneCapacity(item, truck) {
  const floorCount = bestFloorCount(truck.L, truck.W, item.L, item.W)
  if (floorCount <= 0) return 0
  const layers = item.stackable ? Math.max(1, Math.floor(truck.H / item.H)) : 1
  return floorCount * layers
}

export function totalTruckSlots(truck, module) {
  return bestFloorCount(truck.L, truck.W, module.L, module.W)
}

export function computeLoadPlan(truck, module, items = []) {
  const totalSlots = totalTruckSlots(truck, module)
  let totalWeight = 0
  let totalSlotsUsedRaw = 0
  const warnings = []

  const results = items.map((item) => {
    const cap = standaloneCapacity(item, truck)
    const weight = Number(item.weight || 0) * Number(item.qty || 0)
    totalWeight += weight
    let slotsUsed = 0
    if (cap <= 0) {
      warnings.push(`“${item.name}” aracın ölçülerine sığmıyor.`)
    } else {
      slotsUsed = Math.ceil((item.qty / cap) * totalSlots)
    }
    totalSlotsUsedRaw += slotsUsed
    return { ...item, cap, slotsUsed, weight }
  })

  const totalSlotsUsed = Math.min(totalSlotsUsedRaw, totalSlots)
  if (totalSlotsUsedRaw > totalSlots) {
    warnings.push(`Taban kapasitesi aşıldı: ${totalSlotsUsedRaw} slot gerekiyor, araçta ${totalSlots} slot var.`)
  }
  if (totalWeight > truck.maxWeight) {
    warnings.push(
      `Ağırlık limiti aşıldı: ${Math.round(totalWeight).toLocaleString('tr-TR')} kg > ${truck.maxWeight.toLocaleString('tr-TR')} kg.`,
    )
  }

  const weightPct = truck.maxWeight ? Math.round((totalWeight / truck.maxWeight) * 100) : 0
  const slotPct = totalSlots ? Math.round((totalSlotsUsed / totalSlots) * 100) : 0
  const fillPct = Math.max(weightPct, slotPct)

  // slot ownership for grid
  const slotOwner = new Array(totalSlots).fill(null)
  let cursor = 0
  results.forEach((item, idx) => {
    for (let s = 0; s < item.slotsUsed && cursor < totalSlots; s += 1, cursor += 1) {
      slotOwner[cursor] = idx
    }
  })

  const colsAcrossWidth = Math.max(1, Math.floor(truck.W / module.W))
  const rowsAlongLength = Math.max(1, Math.ceil(totalSlots / colsAcrossWidth))

  return {
    truck,
    module,
    totalSlots,
    totalWeight,
    totalSlotsUsedRaw,
    totalSlotsUsed,
    results,
    warnings,
    weightPct,
    slotPct,
    fillPct,
    slotOwner,
    colsAcrossWidth,
    rowsAlongLength,
  }
}

export function itemInitials(name) {
  return String(name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
}

export function fmtKg(n) {
  return Math.round(Number(n) || 0).toLocaleString('tr-TR')
}
