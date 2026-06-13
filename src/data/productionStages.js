export const productionStageOptions = [
  { label: 'Kesim', color: 'bg-blue-500' },
  { label: 'Baskı', color: 'bg-purple-500' },
  { label: 'Montaj', color: 'bg-orange-500' },
  { label: 'Kalite Kontrol', color: 'bg-cyan-500' },
  { label: 'Sevkiyat', color: 'bg-emerald-500' },
]

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

export const defaultProductionStages = productionStageOptions.map((option) => ({
  id: productionStageId(option.label),
  label: option.label,
  color: option.color,
  note: `${option.label} aşaması`,
}))
