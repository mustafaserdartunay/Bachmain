import { TRUCK_PRESETS, GRID_MODULES, bestFloorCount, fmtKg } from './truckLoadCalc'

/**
 * AI-style suggestions for packaging / vehicle count (rule-based, explainable).
 */
export function buildLoadSuggestions({
  items = [],
  truckKey = 'tir',
  moduleKey = 'euro',
} = {}) {
  const truck = TRUCK_PRESETS[truckKey] || TRUCK_PRESETS.tir
  const module = GRID_MODULES[moduleKey] || GRID_MODULES.euro
  const totalWeight = items.reduce((s, it) => s + Number(it.weight || 0) * Number(it.qty || 0), 0)
  const totalUnits = items.reduce((s, it) => s + Number(it.qty || 0), 0)

  // Approximate pallet need using euro footprint for non-pallet items
  let palletSlots = 0
  for (const it of items) {
    const floor = bestFloorCount(module.L, module.W, it.L, it.W)
    const layers = it.stackable ? Math.max(1, Math.floor(150 / Math.max(1, it.H))) : 1
    const perPallet = Math.max(1, floor * layers)
    if (it.L >= 80 && it.W >= 60) {
      palletSlots += Number(it.qty || 0)
    } else {
      palletSlots += Math.ceil(Number(it.qty || 0) / perPallet)
    }
  }

  const slotsPerTruck = bestFloorCount(truck.L, truck.W, module.L, module.W) || 1
  const trucksBySlot = Math.max(1, Math.ceil(palletSlots / slotsPerTruck))
  const trucksByWeight = Math.max(1, Math.ceil(totalWeight / Math.max(1, truck.maxWeight)))
  const trucksNeeded = Math.max(trucksBySlot, trucksByWeight)

  const mega = TRUCK_PRESETS.mega
  const megaSlots = bestFloorCount(mega.L, mega.W, module.L, module.W) || 1
  const megaCount = Math.max(1, Math.ceil(palletSlots / megaSlots), Math.ceil(totalWeight / mega.maxWeight))

  const tips = []
  tips.push(`Bu yük yaklaşık ${palletSlots} ${module.name.split('(')[0].trim()} pozisyonuna sığıyor.`)
  if (trucksNeeded === 1) {
    tips.push(`1 × ${truck.name} yeterli görünüyor (doluluk tahmini %${Math.min(100, Math.round((palletSlots / slotsPerTruck) * 100))}).`)
  } else {
    tips.push(`Toplam ${trucksNeeded} × ${truck.name} öneriliyor.`)
  }
  if (megaCount < trucksNeeded) {
    tips.push(`${trucksNeeded} standart tır yerine ${megaCount} Mega Trailer daha ekonomik olabilir.`)
  } else if (trucksNeeded > 1) {
    tips.push(`1 araç yerine ${trucksNeeded} araç bölmek ağırlık/hacim güvenliği için daha iyidir.`)
  }
  if (totalWeight > truck.maxWeight * 0.9 && trucksNeeded === 1) {
    tips.push('Ağırlık limitine yaklaşılıyor — istif yüksekliğini düşürün veya ikinci araç planlayın.')
  }

  return {
    totalWeight,
    totalUnits,
    palletSlots,
    slotsPerTruck,
    trucksNeeded,
    megaCount,
    tips,
    recommendedTruckKey: trucksNeeded <= 1 ? truckKey : (megaCount < trucksNeeded ? 'mega' : truckKey),
    summary: tips[0],
    fmtWeight: fmtKg(totalWeight),
  }
}

export function estimatePackageOptions(productDims = {}) {
  const L = Number(productDims.L || productDims.length || 20)
  const W = Number(productDims.W || productDims.width || 15)
  const H = Number(productDims.H || productDims.height || 10)
  const units = [1, 2, 4, 6, 8, 10, 12]
  return units.map((n) => ({
    id: String(n),
    label: n === 1 ? 'Tekli Paket' : `${n}'li Paket`,
    units: n,
    packL: L,
    packW: W * Math.min(n, 2),
    packH: H * Math.ceil(n / 2),
  }))
}
