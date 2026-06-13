import { representativeOptions } from './customerMeta'

export const LIST_PILL_CLASS =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold transition-colors hover:bg-dark-700/80'

export const priorityOptions = [
  { label: 'Acil', color: 'bg-red-500' },
  { label: 'Yüksek', color: 'bg-orange-500' },
  { label: 'Normal', color: 'bg-blue-500' },
  { label: 'Düşük', color: 'bg-gray-500' },
]

export const taskStatusOptions = [
  { label: 'Bekliyor', color: 'bg-amber-500' },
  { label: 'Devam Ediyor', color: 'bg-blue-500' },
  { label: 'Tamamlandı', color: 'bg-emerald-500' },
]

export const taskCategoryOptions = [
  { label: 'Genel', color: 'bg-gray-500' },
  { label: 'Teklif', color: 'bg-blue-500' },
  { label: 'Tahsilat', color: 'bg-emerald-500' },
  { label: 'Numune', color: 'bg-purple-500' },
  { label: 'Ziyaret', color: 'bg-cyan-500' },
  { label: 'Takip', color: 'bg-orange-500' },
]

export const appointmentTypeOptions = [
  { label: 'Toplantı', color: 'bg-blue-500' },
  { label: 'Telefon', color: 'bg-emerald-500' },
  { label: 'Ziyaret', color: 'bg-purple-500' },
  { label: 'Numune', color: 'bg-amber-500' },
  { label: 'Teklif Sunumu', color: 'bg-cyan-500' },
]

export const appointmentStatusOptions = [
  { label: 'Planlandı', color: 'bg-blue-500' },
  { label: 'Onaylandı', color: 'bg-emerald-500' },
  { label: 'Tamamlandı', color: 'bg-gray-500' },
  { label: 'İptal', color: 'bg-red-500' },
]

export const assigneeOptions = representativeOptions

export const noteColorOptions = [
  { label: 'Mavi', color: 'bg-blue-500' },
  { label: 'Turuncu', color: 'bg-orange-500' },
  { label: 'Mor', color: 'bg-purple-500' },
  { label: 'Yeşil', color: 'bg-emerald-500' },
  { label: 'Kırmızı', color: 'bg-red-500' },
]

export const priorityTone = {
  Acil: 'text-red-300 bg-red-500/15 border-red-500/30',
  Yüksek: 'text-orange-300 bg-orange-500/15 border-orange-500/30',
  Normal: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
  Düşük: 'text-gray-400 bg-gray-500/15 border-gray-500/30',
}

export const typeTone = {
  Toplantı: 'bg-blue-500',
  Telefon: 'bg-emerald-500',
  Ziyaret: 'bg-purple-500',
  Numune: 'bg-amber-500',
  'Teklif Sunumu': 'bg-cyan-500',
}

export const noteTone = {
  Mavi: 'border-blue-500/35 bg-blue-500/10',
  Turuncu: 'border-orange-500/35 bg-orange-500/10',
  Mor: 'border-purple-500/35 bg-purple-500/10',
  Yeşil: 'border-emerald-500/35 bg-emerald-500/10',
  Kırmızı: 'border-red-500/35 bg-red-500/10',
}
