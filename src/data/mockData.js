export const stats = [
  { title: 'Yeni Siparişler', value: 0, trend: '0', icon: 'cart', color: 'blue', sparkline: [] },
  { title: 'Üretimdeki İşler', value: 0, trend: '0', icon: 'gear', color: 'green', sparkline: [] },
  { title: 'Bekleyen Teklifler', value: 0, trend: '0', icon: 'document', color: 'orange', sparkline: [] },
  { title: 'Stok Uyarıları', value: 0, trend: '0', icon: 'warning', color: 'purple', sparkline: [] },
]

export const orderStatusData = []
export const salesData = []
export const orders = []
export const productionOrders = []
export const productionSteps = []
export const criticalStocks = []

export const customers = {
  summary: { total: 0, active: 0, passive: 0, revenue: '0₺' },
  list: [],
}

export const quotes = {
  summary: { total: 0, pending: 0, accepted: 0, rejected: 0 },
  list: [],
}

export const stocks = []
export const whatsappMessages = []
export const invoices = []

export const dealers = {
  summary: { total: 0, active: 0, applicant: 0, passive: 0 },
  list: [],
  performance: [],
  mapPins: [],
}

export const statusBadgeMap = {
  'Yeni': 'badge-blue',
  'Üretimde': 'badge-green',
  'Paketlemede': 'badge-orange',
  'Kargoda': 'badge-purple',
  'Tamamlandı': 'badge-gray',
  'Bekliyor': 'badge-orange',
  'Kabul Edildi': 'badge-green',
  'Reddedildi': 'badge-red',
  'Gönderildi': 'badge-green',
  'Cevaplandı': 'badge-green',
  'Aktif': 'badge-green',
  'Pasif': 'badge-red',
  'Beklemede': 'badge-orange',
  'Kritik': 'badge-red',
  'Devam Ediyor': 'badge-blue',
  'İptal': 'badge-red',
}

export function formatCurrency(value) {
  const amount = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
  return `${amount}₺`
}
