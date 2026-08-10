/** Truck&Co tarzı slot / kapasite hesaplama (cm birimi) — yönlendirme + gerçek grid yerleşimi */

export const TRUCK_PRESETS = {
  panelvan: {
    key: 'panelvan',
    name: 'Kamyonet (Panelvan)',
    L: 400,
    W: 175,
    H: 190,
    maxWeight: 1000,
  },
  kamyon_kisa: {
    key: 'kamyon_kisa',
    name: 'Kamyon (Kısa Şasi)',
    L: 430,
    W: 210,
    H: 210,
    maxWeight: 1500,
  },
  kamyon_kucuk: {
    key: 'kamyon_kucuk',
    name: 'Kamyon (Küçük, 7.2m)',
    L: 720,
    W: 240,
    H: 240,
    maxWeight: 4000,
  },
  kamyon_uzun: {
    key: 'kamyon_uzun',
    name: 'Kamyon (Uzun Şasi)',
    L: 620,
    W: 240,
    H: 240,
    maxWeight: 3500,
  },
  kamyon_buyuk: {
    key: 'kamyon_buyuk',
    name: 'Kamyon (Büyük, 9m)',
    L: 900,
    W: 245,
    H: 245,
    maxWeight: 10000,
  },
  kamyon_10t: {
    key: 'kamyon_10t',
    name: 'Kamyon (10 Ton Kasa)',
    L: 720,
    W: 245,
    H: 245,
    maxWeight: 5000,
  },
  tir: {
    key: 'tir',
    name: 'Standart Tır (Tenteli, 13.6m)',
    L: 1360,
    W: 245,
    H: 270,
    maxWeight: 22000,
  },
  mega: {
    key: 'mega',
    name: 'Mega Trailer (13.6m × 3.0m)',
    L: 1360,
    W: 245,
    H: 300,
    maxWeight: 24000,
  },
  frigo: { key: 'frigo', name: 'Frigorifik', L: 1320, W: 245, H: 260, maxWeight: 20000 },
  konteyner20: {
    key: 'konteyner20',
    name: 'Konteyner 20ft',
    L: 590,
    W: 235,
    H: 239,
    maxWeight: 21500,
  },
  konteyner40: {
    key: 'konteyner40',
    name: 'Konteyner 40ft',
    L: 1203,
    W: 235,
    H: 239,
    maxWeight: 26000,
  },
  konteyner40hc: {
    key: 'konteyner40hc',
    name: 'Konteyner 40ft HC',
    L: 1203,
    W: 235,
    H: 270,
    maxWeight: 26500,
  },
}

export const GRID_MODULES = {
  euro: { key: 'euro', name: 'Europalet (80×120 cm)', L: 120, W: 80 },
  industrial: { key: 'industrial', name: 'Endüstriyel Palet (100×120 cm)', L: 120, W: 100 },
  half: { key: 'half', name: 'Yarım Europalet (60×80 cm)', L: 80, W: 60 },
  free: { key: 'free', name: 'Serbest / Koli bazlı (40×30 cm)', L: 40, W: 30 },
}

export const LOAD_PRESETS = [
  {
    name: 'Europalet',
    L: 120,
    W: 80,
    H: 14,
    weight: 350,
    stackable: false,
    visualH: 150,
    icon: 'square',
  },
  {
    name: 'Endüstriyel Palet',
    L: 120,
    W: 100,
    H: 15,
    weight: 450,
    stackable: false,
    visualH: 160,
    icon: 'square',
  },
  {
    name: 'Yarım Palet',
    L: 80,
    W: 60,
    H: 12,
    weight: 150,
    stackable: false,
    visualH: 120,
    icon: 'square',
  },
  { name: 'Koli — Küçük', L: 40, W: 30, H: 30, weight: 8, stackable: true, icon: 'package' },
  { name: 'Koli — Orta', L: 60, W: 40, H: 40, weight: 15, stackable: true, icon: 'package' },
  { name: 'Koli — Büyük', L: 80, W: 60, H: 60, weight: 30, stackable: true, icon: 'package' },
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

export const PLATE_REGEX = /^\d{2}\s?[A-PR-VYZ]{1,3}\s?\d{2,4}$/i

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

export function totalTruckSlots(truck, module, orientation = 'uzun') {
  return computeGridMetrics(truck, module, orientation).totalSlots
}

/**
 * Grid: cols = uzunluk boyunca hücre, rows = genişlik boyunca hücre.
 * orientation: 'uzun' → hücre = module.L × module.W, 'en' → döndürülmüş.
 */
export function computeGridMetrics(truck, module, orientation = 'uzun') {
  const cellL = orientation === 'en' ? module.W : module.L
  const cellW = orientation === 'en' ? module.L : module.W
  const cols = Math.max(0, Math.floor(Number(truck.L) / cellL))
  const rows = Math.max(0, Math.floor(Number(truck.W) / cellW))
  const leftoverL = Math.max(0, Number(truck.L) - cols * cellL)
  const leftoverW = Math.max(0, Number(truck.W) - rows * cellW)
  return {
    cellL,
    cellW,
    cols,
    rows,
    leftoverL,
    leftoverW,
    totalSlots: cols * rows,
  }
}

function isPalletLike(item) {
  if (item.stackable === false) return true
  const name = String(item.name || '').toLowerCase()
  return name.includes('palet')
}

export function perLayerCapacity(item, cellL, cellW) {
  if (isPalletLike(item)) return 1
  const L = Math.max(1, Number(item.L) || 1)
  const W = Math.max(1, Number(item.W) || 1)
  const a = Math.floor(cellL / L) * Math.floor(cellW / W)
  const b = Math.floor(cellL / W) * Math.floor(cellW / L)
  return Math.max(0, a, b)
}

export function slotCapacity(item, truck, cellL, cellW) {
  if (isPalletLike(item)) return 1
  const perLayer = perLayerCapacity(item, cellL, cellW)
  if (perLayer <= 0) return 0
  const layers = Math.floor(Number(truck.H) / Math.max(1, Number(item.H) || 1))
  return perLayer * Math.max(0, layers)
}

export function stackHeight(item, qty, truck, cellL, cellW) {
  const H = Math.max(1, Number(item.H) || 1)
  if (isPalletLike(item)) {
    const visual = Number(item.visualH) || Math.max(H, 100)
    return Math.min(visual, Number(truck.H))
  }
  const perLayer = Math.max(1, perLayerCapacity(item, cellL, cellW))
  const layersUsed = Math.ceil(Math.max(1, qty) / perLayer)
  return Math.min(Number(truck.H), layersUsed * H)
}

/**
 * Gerçek grid yerleşimi (greedy, satır-öncelikli) + ağırlık bütçesi.
 * @param {object} options
 * @param {'uzun'|'en'} [options.orientation]
 * @param {number|null} [options.preferredSlotIndex] — ilk yerleştirmede tercih edilen boş slot
 */
export function computeLoadPlan(truck, module, items = [], options = {}) {
  const orientation = options.orientation === 'en' ? 'en' : 'uzun'
  const preferredSlotIndex = Number.isFinite(options.preferredSlotIndex)
    ? Number(options.preferredSlotIndex)
    : null

  const grid = computeGridMetrics(truck, module, orientation)
  const { cellL, cellW, cols, rows, leftoverL, leftoverW, totalSlots } = grid

  const warnings = []
  const slots = Array.from({ length: totalSlots }, (_, index) => ({
    index,
    row: cols ? Math.floor(index / cols) : 0,
    col: cols ? index % cols : 0,
    itemIdx: null,
    qty: 0,
    stackH: 0,
  }))

  const results = items.map((item) => {
    const unitWeight = Math.max(0, Number(item.weight) || 0)
    const qty = Math.max(0, Number(item.qty) || 0)
    return {
      ...item,
      unitWeight,
      qty,
      cap: slotCapacity(item, truck, cellL, cellW),
      slotsUsed: 0,
      placedQty: 0,
      remainingQty: qty,
      weight: 0,
    }
  })

  let totalWeight = 0

  function remainingWeightBudget() {
    return Math.max(0, Number(truck.maxWeight) - totalWeight)
  }

  function placeIntoSlot(slotIndex, itemIdx, requestedQty) {
    const item = results[itemIdx]
    const slot = slots[slotIndex]
    if (!slot || slot.itemIdx != null || requestedQty <= 0) return 0
    const cap = slotCapacity(item, truck, cellL, cellW)
    if (cap <= 0) return 0
    const unitW = item.unitWeight
    const maxByWeight = unitW > 0 ? Math.floor(remainingWeightBudget() / unitW) : requestedQty
    const placed = Math.min(requestedQty, cap, maxByWeight)
    if (placed <= 0) return 0
    slot.itemIdx = itemIdx
    slot.qty = placed
    slot.stackH = stackHeight(item, placed, truck, cellL, cellW)
    item.placedQty += placed
    item.slotsUsed += 1
    item.remainingQty = Math.max(0, item.qty - item.placedQty)
    item.weight = item.placedQty * unitW
    totalWeight += placed * unitW
    return placed
  }

  function emptySlotIndexes(preferFirst) {
    const empties = slots.filter((s) => s.itemIdx == null).map((s) => s.index)
    if (preferFirst == null || !empties.includes(preferFirst)) return empties
    return [preferFirst, ...empties.filter((i) => i !== preferFirst)]
  }

  results.forEach((item, itemIdx) => {
    let remaining = Number(items[itemIdx].qty) || 0
    if (remaining <= 0) return

    if (item.cap <= 0) {
      warnings.push(`“${item.name}” bu grid hücresine / araç ölçüsüne sığmıyor.`)
      return
    }

    const itemPrefer = Number.isFinite(items[itemIdx].preferSlotIndex)
      ? Number(items[itemIdx].preferSlotIndex)
      : null
    const prefer =
      itemPrefer != null
        ? itemPrefer
        : preferredSlotIndex != null && itemIdx === items.length - 1
          ? preferredSlotIndex
          : null

    for (const slotIndex of emptySlotIndexes(prefer)) {
      if (remaining <= 0) break
      if (remainingWeightBudget() <= 0 && item.unitWeight > 0) break
      const placed = placeIntoSlot(slotIndex, itemIdx, remaining)
      if (placed > 0) remaining -= placed
      else if (remainingWeightBudget() < item.unitWeight) break
    }

    if (remaining > 0) {
      warnings.push(
        `“${item.name}”: ${remaining} adet sığmadı (slot veya ağırlık). Yerleşen: ${item.placedQty} adet.`,
      )
    }
  })

  const slotOwner = slots.map((s) => s.itemIdx)
  const slotMeta = slots.map((s) => ({
    index: s.index,
    row: s.row,
    col: s.col,
    itemIdx: s.itemIdx,
    qty: s.qty,
    stackH: s.stackH,
  }))

  const totalSlotsUsed = slots.filter((s) => s.itemIdx != null).length
  const totalPieces = results.reduce((sum, r) => sum + r.placedQty, 0)

  if (totalWeight > truck.maxWeight) {
    warnings.push(
      `Ağırlık limiti aşıldı: ${Math.round(totalWeight).toLocaleString('tr-TR')} kg > ${Number(truck.maxWeight).toLocaleString('tr-TR')} kg.`,
    )
  }

  const weightPct = truck.maxWeight ? Math.round((totalWeight / truck.maxWeight) * 100) : 0
  const slotPct = totalSlots ? Math.round((totalSlotsUsed / totalSlots) * 100) : 0
  const fillPct = Math.max(weightPct, slotPct)

  /** Yan görünüm: her col için max stackH */
  const envelopeByCol = Array.from({ length: cols }, (_, col) => {
    let maxH = 0
    for (let row = 0; row < rows; row += 1) {
      const slot = slots[row * cols + col]
      if (slot?.stackH) maxH = Math.max(maxH, slot.stackH)
    }
    return maxH
  })

  /** Arka görünüm: her row için max stackH */
  const envelopeByRow = Array.from({ length: rows }, (_, row) => {
    let maxH = 0
    for (let col = 0; col < cols; col += 1) {
      const slot = slots[row * cols + col]
      if (slot?.stackH) maxH = Math.max(maxH, slot.stackH)
    }
    return maxH
  })

  return {
    truck,
    module,
    orientation,
    grid,
    cellL,
    cellW,
    leftoverL,
    leftoverW,
    totalSlots,
    totalWeight,
    totalPieces,
    totalSlotsUsedRaw: totalSlotsUsed,
    totalSlotsUsed,
    results,
    warnings,
    weightPct,
    slotPct,
    fillPct,
    slotOwner,
    slotMeta,
    envelopeByCol,
    envelopeByRow,
    // geriye uyumluluk (eski grid render)
    colsAcrossWidth: Math.max(1, rows),
    rowsAlongLength: Math.max(1, cols),
    cols,
    rows,
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

export function isValidPlate(plate) {
  const value = String(plate || '').trim()
  if (!value) return true
  return PLATE_REGEX.test(value)
}

export function isPlateComplete(plate) {
  return PLATE_REGEX.test(String(plate || '').trim())
}
