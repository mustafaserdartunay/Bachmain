export const depoStatusFilterOptions = [
  { label: 'Tümü', color: 'bg-gray-500' },
  { label: 'Beklemede', color: 'bg-amber-500' },
  { label: 'Paketlendi', color: 'bg-cyan-500' },
  { label: 'Teslime Hazır', color: 'bg-blue-500' },
  { label: 'Araçta', color: 'bg-purple-500' },
  { label: 'Teslim Edildi', color: 'bg-emerald-500' },
]

export const depoDestinationOptions = [
  { label: 'Depo', color: 'bg-blue-500' },
]

export const DEPO_DESTINATION_BY_LABEL = {
  Depo: 'order',
}

export const DEPO_DESTINATION_LABEL_BY_KIND = {
  order: 'Depo',
}

export const DEPO_ITEM_STATUSES = ['Beklemede', 'Paketlendi', 'Teslime Hazır', 'Araçta', 'Teslim Edildi']

export const DEPO_STATUS_STEPS = [
  { key: 'Beklemede', label: 'Beklemede', color: 'bg-amber-500', text: 'text-amber-300' },
  { key: 'Paketlendi', label: 'Paket', color: 'bg-cyan-500', text: 'text-cyan-300' },
  { key: 'Teslime Hazır', label: 'Hazır', color: 'bg-blue-500', text: 'text-blue-300' },
  { key: 'Araçta', label: 'Araçta', color: 'bg-purple-500', text: 'text-purple-300' },
  { key: 'Teslim Edildi', label: 'Teslim', color: 'bg-emerald-500', text: 'text-emerald-300' },
]

export const DEFAULT_DEPO_VAT_RATE = 20

export const WAREHOUSE_KINDS = {
  order: 'Depo',
}

export const TRANSPORT_TYPES = ['Firma Kamyonu', 'Tır', 'Kargo', 'Müşteri Alım', 'Kurye']

export const depoVehicles = [
  { id: 'veh-1', label: '34 ABC 123 · Ford Transit', type: 'Firma Kamyonu' },
  { id: 'veh-2', label: '34 DEF 456 · Mercedes Actros', type: 'Tır' },
  { id: 'veh-3', label: '34 GHI 789 · Iveco Daily', type: 'Firma Kamyonu' },
  { id: 'veh-4', label: 'Kargo Entegrasyon', type: 'Kargo' },
]

export const depoDrivers = [
  { id: 'drv-1', name: 'Ahmet Yılmaz', phone: '532 111 22 33' },
  { id: 'drv-2', name: 'Mehmet Demir', phone: '533 444 55 66' },
  { id: 'drv-3', name: 'Ali Kaya', phone: '534 777 88 99' },
]

export const depoSeedWarehouses = [
  {
    id: 'wh-order-1',
    name: 'Depo',
    code: 'DEP-01',
    kind: 'order',
    city: 'İstanbul',
    district: 'Tuzla',
    status: 'Aktif',
    notes: 'Üretimden gelen ürünler burada paketlenir ve sevk edilir',
  },
]

export const depoSeedItems = []
export const depoSeedTransfers = []
