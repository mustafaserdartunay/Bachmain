export const STATUS_COLORS = {
  Bekliyor: '#94a3b8',
  Çalışıyor: '#22c55e',
  'Kalite Kontrol': '#a855f7',
  Paketleniyor: '#0ea5e9',
  Tamamlandı: '#10b981',
  Durduruldu: '#f59e0b',
  Arızalı: '#ef4444',
  Boşta: '#64748b',
  Bakımda: '#f97316',
}

export const FACTORY_LINES = [
  { id: 'L1', name: 'Hat 1 · Çikolata', status: 'Çalışıyor', orderNo: 'SIP-24018', oee: 82 },
  { id: 'L2', name: 'Hat 2 · Ambalaj', status: 'Paketleniyor', orderNo: 'SIP-24021', oee: 74 },
  { id: 'L3', name: 'Hat 3 · Kalıp', status: 'Kalite Kontrol', orderNo: 'SIP-24015', oee: 61 },
  { id: 'L4', name: 'Hat 4 · Dolum', status: 'Arızalı', orderNo: 'SIP-24009', oee: 0 },
  { id: 'L5', name: 'Hat 5 · Etiket', status: 'Bekliyor', orderNo: '—', oee: 0 },
]

export const MACHINES = [
  { id: 'M1', name: 'Dolum A', status: 'Çalışıyor', speed: 120, energy: 42 },
  { id: 'M2', name: 'Paket B', status: 'Boşta', speed: 0, energy: 8 },
  { id: 'M3', name: 'Kalıp C', status: 'Bakımda', speed: 0, energy: 5 },
  { id: 'M4', name: 'Dolum D', status: 'Arızalı', speed: 0, energy: 0 },
]

export const FLOW_STAGES = [
  'Sipariş',
  'Üretim',
  'Kalite',
  'Paketleme',
  'Depo',
  'Palet',
  'Yükleme',
  'Araç',
  'Teslimat',
]

export const PALLETS = [
  {
    id: 'PL-1001',
    customer: 'Nordic Foods GmbH',
    weightKg: 780,
    heightMm: 1600,
    volumeM3: 1.9,
    invoice: 'FAT-8891',
    waybill: 'IRS-4412',
    delivery: 'Hamburg',
    skuCount: 24,
  },
  {
    id: 'PL-1002',
    customer: 'Anadolu Market',
    weightKg: 640,
    heightMm: 1400,
    volumeM3: 1.5,
    invoice: 'FAT-8892',
    waybill: 'IRS-4413',
    delivery: 'Ankara',
    skuCount: 18,
  },
]

export const VEHICLE_TYPES = [
  '13.60 TIR',
  'Kamyon',
  'Kamyonet',
  '40 HC Konteyner',
  '20 HC',
  'Minivan',
]

export function buildWarehouseZones() {
  const zones = []
  for (let aisle = 1; aisle <= 4; aisle += 1) {
    for (let rack = 1; rack <= 6; rack += 1) {
      const fill = Math.round(20 + ((aisle * 17 + rack * 11) % 80))
      zones.push({
        id: `A${aisle}-R${rack}`,
        aisle,
        rack,
        fill,
        heat: fill > 75 ? 'hot' : fill > 45 ? 'warm' : 'cool',
      })
    }
  }
  return zones
}

export const TWIN_KPIS = {
  ordersOpen: 48,
  productionRunning: 3,
  warehouseFillPct: 67,
  palletsReady: 126,
  trucksLoading: 2,
  deliveriesToday: 19,
  collectionsPending: 7,
  aiAlerts: 3,
}

export const BOTTLENECKS = [
  { entity: 'Makine 4', waitMinutes: 120, cause: 'Operatör eksikliği' },
  { entity: 'Koridor A2', waitMinutes: 45, cause: 'Pick yoğunluğu' },
]

export const FORECASTS = [
  { kind: 'Teslim gecikmesi', detail: 'SIP-24015 · +6 saat risk', confidence: 0.72 },
  { kind: 'Stok tükenmesi', detail: 'SKU-RED-BOX · 3 gün', confidence: 0.81 },
  { kind: 'Kapasite', detail: 'Hat 1 · %92 yük', confidence: 0.66 },
]

const PREF_KEY = 'bach-twin-prefs-v1'

export function readTwinPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
  } catch {
    return {}
  }
}

export function writeTwinPrefs(patch) {
  const next = { ...readTwinPrefs(), ...patch }
  localStorage.setItem(PREF_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:twin-prefs-updated'))
  return next
}
