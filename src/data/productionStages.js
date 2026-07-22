export const productionStageOptions = []

export function productionStageId(label) {
  return `prod-${String(label || '')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')}`
}

export const defaultProductionStages = []

/** Recommended ERP production flow — UI reference when configuring stages. */
export const RECOMMENDED_PRODUCTION_FLOW = [
  'Malzeme Hazırlık',
  'Kesim',
  'Büküm',
  'Kaynak',
  'Montaj',
  'Kalite Kontrol',
  'Paketleme',
  'Sevkiyat',
]

export function buildRecommendedProductionStages() {
  return RECOMMENDED_PRODUCTION_FLOW.map((label, index) => ({
    id: productionStageId(label),
    label,
    color: index === RECOMMENDED_PRODUCTION_FLOW.length - 1 ? 'bg-emerald-500' : 'bg-blue-500',
  }))
}
