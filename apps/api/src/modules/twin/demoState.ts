/** Demo / adapter payloads for Digital Twin (DT-0). Live ERP adapters in DT-1. */

export const LINE_STATUSES = [
  'Bekliyor',
  'Çalışıyor',
  'Kalite Kontrol',
  'Paketleniyor',
  'Tamamlandı',
  'Durduruldu',
  'Arızalı',
] as const

export const STATUS_COLORS: Record<string, string> = {
  Bekliyor: '#94a3b8',
  Çalışıyor: '#22c55e',
  'Kalite Kontrol': '#a855f7',
  Paketleniyor: '#0ea5e9',
  Tamamlandı: '#10b981',
  Durduruldu: '#f59e0b',
  Arızalı: '#ef4444',
}

export function buildFactoryState() {
  return {
    lines: [
      { id: 'L1', name: 'Hat 1 · Çikolata', status: 'Çalışıyor', orderNo: 'SIP-24018', oee: 82 },
      { id: 'L2', name: 'Hat 2 · Ambalaj', status: 'Paketleniyor', orderNo: 'SIP-24021', oee: 74 },
      { id: 'L3', name: 'Hat 3 · Kalıp', status: 'Kalite Kontrol', orderNo: 'SIP-24015', oee: 61 },
      { id: 'L4', name: 'Hat 4 · Dolum', status: 'Arızalı', orderNo: 'SIP-24009', oee: 0 },
      { id: 'L5', name: 'Hat 5 · Etiket', status: 'Bekliyor', orderNo: '—', oee: 0 },
    ],
    machines: [
      { id: 'M1', name: 'Dolum A', status: 'Çalışıyor', speed: 120, energy: 42 },
      { id: 'M2', name: 'Paket B', status: 'Boşta', speed: 0, energy: 8 },
      { id: 'M3', name: 'Kalıp C', status: 'Bakımda', speed: 0, energy: 5 },
      { id: 'M4', name: 'Dolum D', status: 'Arızalı', speed: 0, energy: 0 },
    ],
  }
}

export function buildWarehouseState() {
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
  return {
    zones,
    hierarchy: ['Depo', 'Koridor', 'Raf', 'Kat', 'Lokasyon', 'Palet', 'Koli', 'Ürün'],
  }
}

export function buildFlowState() {
  return {
    stages: [
      'Sipariş',
      'Üretim',
      'Kalite',
      'Paketleme',
      'Depo',
      'Palet',
      'Yükleme',
      'Araç',
      'Teslimat',
    ],
    activeIndex: 4,
    sampleOrder: 'SIP-24021',
  }
}

export function buildOverviewKpis() {
  return {
    ordersOpen: 48,
    productionRunning: 3,
    warehouseFillPct: 67,
    palletsReady: 126,
    trucksLoading: 2,
    deliveriesToday: 19,
    collectionsPending: 7,
    aiAlerts: 3,
    bottlenecks: [
      {
        entity: 'Makine 4',
        waitMinutes: 120,
        cause: 'Operatör eksikliği',
      },
      {
        entity: 'Koridor A2',
        waitMinutes: 45,
        cause: 'Pick yoğunluğu',
      },
    ],
    forecasts: [
      { kind: 'Teslim gecikmesi', detail: 'SIP-24015 · +6 saat risk', confidence: 0.72 },
      { kind: 'Stok tükenmesi', detail: 'SKU-RED-BOX · 3 gün', confidence: 0.81 },
      { kind: 'Kapasite', detail: 'Hat 1 · %92 yük', confidence: 0.66 },
    ],
  }
}

export const VEHICLE_TYPES = [
  { id: 'tir_1360', label: '13.60 TIR' },
  { id: 'kamyon', label: 'Kamyon' },
  { id: 'kamyonet', label: 'Kamyonet' },
  { id: 'hc40', label: '40 HC Konteyner' },
  { id: 'hc20', label: '20 HC' },
  { id: 'minivan', label: 'Minivan' },
]
