/** Standart dorse / konteyner şablonları — iç ölçüler mm, kg, m³ */

export const VEHICLE_TYPES = [
  { id: 'truck', label: 'Tır' },
  { id: 'trailer', label: 'Dorse' },
  { id: 'lorry', label: 'Kamyon' },
  { id: 'van', label: 'Kamyonet' },
  { id: 'container', label: 'Konteyner' },
  { id: 'minivan', label: 'Minivan' },
]

export const DOOR_TYPES = [
  { id: 'rear', label: 'Arka kapı' },
  { id: 'side', label: 'Yan kapı' },
  { id: 'both', label: 'Arka + Yan' },
  { id: 'curtain', label: 'Tenteli' },
  { id: 'open', label: 'Açık kasa' },
]

/** Avrupa / denizcilik standartları */
export const TRAILER_TEMPLATES = [
  {
    id: 'eu-standard',
    label: 'Standart Avrupa Tır',
    innerLengthMm: 13600,
    innerWidthMm: 2450,
    innerHeightMm: 2700,
    maxWeightKg: 24000,
    maxPallets: 33,
    maxVolumeM3: 90,
  },
  {
    id: 'mega',
    label: 'Mega Trailer',
    innerLengthMm: 13620,
    innerWidthMm: 2480,
    innerHeightMm: 3000,
    maxWeightKg: 24500,
    maxPallets: 34,
    maxVolumeM3: 100,
  },
  {
    id: 'jumbo',
    label: 'Jumbo',
    innerLengthMm: 8000,
    innerWidthMm: 2480,
    innerHeightMm: 3100,
    maxWeightKg: 18000,
    maxPallets: 20,
    maxVolumeM3: 60,
  },
  {
    id: '40hc',
    label: '40 HC',
    innerLengthMm: 12032,
    innerWidthMm: 2352,
    innerHeightMm: 2698,
    maxWeightKg: 26500,
    maxPallets: 21,
    maxVolumeM3: 76,
  },
  {
    id: '20dc',
    label: '20 DC',
    innerLengthMm: 5898,
    innerWidthMm: 2352,
    innerHeightMm: 2393,
    maxWeightKg: 21770,
    maxPallets: 11,
    maxVolumeM3: 33,
  },
  {
    id: '45hc',
    label: '45 HC',
    innerLengthMm: 13556,
    innerWidthMm: 2352,
    innerHeightMm: 2698,
    maxWeightKg: 27700,
    maxPallets: 24,
    maxVolumeM3: 86,
  },
  {
    id: 'lowbed',
    label: 'Low Bed',
    innerLengthMm: 12000,
    innerWidthMm: 2550,
    innerHeightMm: 1200,
    maxWeightKg: 40000,
    maxPallets: 18,
    maxVolumeM3: 36,
  },
  {
    id: 'open',
    label: 'Açık Kasa',
    innerLengthMm: 13600,
    innerWidthMm: 2450,
    innerHeightMm: 2500,
    maxWeightKg: 24000,
    maxPallets: 33,
    maxVolumeM3: 83,
  },
]

/** Palet standartları mm / kg */
export const PALLET_TEMPLATES = [
  { id: 'euro', label: 'EURO Palet', lengthMm: 1200, widthMm: 800, heightMm: 144, tareKg: 25, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp1', label: 'CP1', lengthMm: 1200, widthMm: 1000, heightMm: 144, tareKg: 30, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp2', label: 'CP2', lengthMm: 1200, widthMm: 800, heightMm: 144, tareKg: 28, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp3', label: 'CP3', lengthMm: 1140, widthMm: 1140, heightMm: 144, tareKg: 32, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp4', label: 'CP4', lengthMm: 1100, widthMm: 1300, heightMm: 150, tareKg: 35, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp5', label: 'CP5', lengthMm: 760, widthMm: 1140, heightMm: 144, tareKg: 22, maxHeightMm: 2200, maxKg: 1200 },
  { id: 'cp6', label: 'CP6', lengthMm: 1200, widthMm: 1000, heightMm: 144, tareKg: 30, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp7', label: 'CP7', lengthMm: 1300, widthMm: 1100, heightMm: 150, tareKg: 36, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'cp8', label: 'CP8', lengthMm: 1140, widthMm: 1140, heightMm: 144, tareKg: 32, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'us', label: 'Amerikan Palet', lengthMm: 1219, widthMm: 1016, heightMm: 140, tareKg: 20, maxHeightMm: 2200, maxKg: 1500 },
  { id: 'custom', label: 'Özel Palet', lengthMm: 1200, widthMm: 800, heightMm: 144, tareKg: 25, maxHeightMm: 2200, maxKg: 1500 },
]

export const PACKAGE_TEMPLATES = [
  { id: '1', label: 'Tekli Paket', units: 1 },
  { id: '2', label: 'İkili Paket', units: 2 },
  { id: '4', label: "4'lü", units: 4 },
  { id: '6', label: "6'lı", units: 6 },
  { id: '8', label: "8'li", units: 8 },
  { id: '10', label: "10'lu", units: 10 },
  { id: '12', label: "12'li", units: 12 },
  { id: 'custom', label: 'Özel Paket', units: 1 },
]

export const DOCUMENT_TYPES = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'packing_list', label: 'Packing List' },
  { id: 'waybill', label: 'İrsaliye' },
  { id: 'cmr', label: 'CMR' },
  { id: 'proforma', label: 'Proforma' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'msds', label: 'MSDS' },
  { id: 'coo', label: 'COO' },
]

export const DOC_LANGUAGES = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'İngilizce' },
  { id: 'de', label: 'Almanca' },
  { id: 'fr', label: 'Fransızca' },
  { id: 'it', label: 'İtalyanca' },
  { id: 'es', label: 'İspanyolca' },
  { id: 'ar', label: 'Arapça' },
]

export function mmToM(mm) {
  return Number(mm || 0) / 1000
}

export function volumeM3(lengthMm, widthMm, heightMm) {
  return (mmToM(lengthMm) * mmToM(widthMm) * mmToM(heightMm)) || 0
}

export function formatMm(mm) {
  return `${Number(mm || 0).toLocaleString('tr-TR')} mm`
}
