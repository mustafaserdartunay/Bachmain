/** Yük planı araç / koli görselleri — public/load-visuals */

const VAN = {
  rear: '/load-visuals/van-rear.png',
  side: '/load-visuals/van-side.png',
  top: '/load-visuals/van-top.png',
}

const TRUCK = {
  rear: '/load-visuals/truck-rear.png',
  side: '/load-visuals/truck-side.png',
  top: '/load-visuals/truck-top.png',
}

export const VEHICLE_VIEW_SETS = {
  panelvan: VAN,
  kamyon_kucuk: VAN,
  kamyon_buyuk: TRUCK,
  tir: TRUCK,
  mega: TRUCK,
  konteyner20: TRUCK,
  konteyner40: TRUCK,
  konteyner40hc: TRUCK,
}

export function resolveVehicleViews(truckKey = '') {
  const key = String(truckKey || '')
  if (VEHICLE_VIEW_SETS[key]) return VEHICLE_VIEW_SETS[key]
  if (key.includes('panel') || key.includes('kamyonet') || key.includes('kucuk')) return VAN
  return TRUCK
}

export const CARGO_VISUALS = {
  europalet: '/load-visuals/cargo-europalet.png',
  industrial: '/load-visuals/cargo-industrial.png',
  koli_kucuk: '/load-visuals/cargo-koli-small.png',
  koli_orta: '/load-visuals/cargo-koli-medium.png',
  koli_buyuk: '/load-visuals/cargo-koli-large.png',
  default: '/load-visuals/cargo-koli-medium.png',
}

export function resolveCargoVisual(item = {}) {
  const name = String(item.name || item.label || '').toLocaleLowerCase('tr-TR')
  if (name.includes('europalet') || name.includes('euro palet')) return CARGO_VISUALS.europalet
  if (name.includes('endüstriyel') || name.includes('endustriyel') || name.includes('industrial')) {
    return CARGO_VISUALS.industrial
  }
  if (name.includes('küçük') || name.includes('kucuk') || name.includes('small')) {
    return CARGO_VISUALS.koli_kucuk
  }
  if (name.includes('büyük') || name.includes('buyuk') || name.includes('large')) {
    return CARGO_VISUALS.koli_buyuk
  }
  if (name.includes('koli') || name.includes('paket') || name.includes('carton')) {
    return CARGO_VISUALS.koli_orta
  }
  if (name.includes('palet')) return CARGO_VISUALS.europalet
  return CARGO_VISUALS.default
}
