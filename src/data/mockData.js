export const stats = [
  { title: 'Yeni Siparişler', value: 32, trend: '+%32', icon: 'cart', color: 'blue', sparkline: [12, 18, 15, 22, 28, 32] },
  { title: 'Üretimdeki İşler', value: 18, trend: '+%18', icon: 'gear', color: 'green', sparkline: [10, 12, 14, 15, 17, 18] },
  { title: 'Bekleyen Teklifler', value: 24, trend: '-%8', icon: 'document', color: 'orange', sparkline: [30, 28, 27, 26, 25, 24] },
  { title: 'Stok Uyarıları', value: 7, trend: 'Kritik', icon: 'warning', color: 'purple', sparkline: [3, 4, 5, 5, 6, 7] },
]

export const orderStatusData = [
  { name: 'Yeni', value: 32, color: '#3b82f6' },
  { name: 'Üretimde', value: 18, color: '#10b981' },
  { name: 'Paketlemede', value: 12, color: '#f59e0b' },
  { name: 'Kargoda', value: 20, color: '#8b5cf6' },
  { name: 'Tamamlandı', value: 45, color: '#6b7280' },
]

export const salesData = [
  { month: 'Oca', sales: 1200000 },
  { month: 'Şub', sales: 980000 },
  { month: 'Mar', sales: 1450000 },
  { month: 'Nis', sales: 1680000 },
  { month: 'May', sales: 2100000 },
  { month: 'Haz', sales: 1950000 },
  { month: 'Tem', sales: 1780000 },
  { month: 'Ağu', sales: 2200000 },
  { month: 'Eyl', sales: 2450000 },
  { month: 'Eki', sales: 2100000 },
  { month: 'Kas', sales: 2800000 },
  { month: 'Ara', sales: 3200000 },
]

export const orders = [
  { id: '10001', customer: 'ABC Ambalaj Ltd.', amount: 45000, status: 'Yeni', date: '28.05.2026', delivery: '05.06.2026' },
  { id: '10005', customer: 'XYZ Gıda A.Ş.', amount: 78500, status: 'Üretimde', date: '27.05.2026', delivery: '03.06.2026' },
  { id: '10006', customer: 'Delta Kozmetik', amount: 32000, status: 'Paketlemede', date: '26.05.2026', delivery: '02.06.2026' },
  { id: '10007', customer: 'Mega Tekstil', amount: 125000, status: 'Kargoda', date: '25.05.2026', delivery: '01.06.2026' },
  { id: '10008', customer: 'Nova Elektronik', amount: 56000, status: 'Tamamlandı', date: '24.05.2026', delivery: '30.05.2026' },
  { id: '10009', customer: 'Prime Lojistik', amount: 89000, status: 'Yeni', date: '28.05.2026', delivery: '06.06.2026' },
]

export const productionOrders = [
  { workOrder: '10016', orderId: '10005', product: 'Kraft Kutu 30x20', quantity: 5000, stage: 'Baskı', status: 'Devam Ediyor', endDate: '03.06.2026' },
  { workOrder: '10017', orderId: '10006', product: 'Oluklu Kutu 40x30', quantity: 3000, stage: 'Montaj', status: 'Devam Ediyor', endDate: '02.06.2026' },
  { workOrder: '10018', orderId: '10011', product: 'Premium Hediye Kutusu', quantity: 1500, stage: 'Kesim', status: 'Bekliyor', endDate: '04.06.2026' },
  { workOrder: '10019', orderId: '10012', product: 'E-Ticaret Kutusu', quantity: 8000, stage: 'Kalite Kontrol', status: 'Devam Ediyor', endDate: '01.06.2026' },
]

export const productionSteps = [
  { name: 'Planlama', active: true, completed: true },
  { name: 'Kesim', active: true, completed: true },
  { name: 'Baskı', active: true, completed: false },
  { name: 'Montaj', active: false, completed: false },
  { name: 'Paketleme', active: false, completed: false },
  { name: 'Kalite Kontrol', active: false, completed: false },
  { name: 'Sevkiyat', active: false, completed: false },
]

export const criticalStocks = [
  { product: 'Kraft Kutu 30x20', current: 120, min: 500, status: 'Kritik' },
  { product: 'Oluklu Sıva 40x30', current: 85, min: 300, status: 'Kritik' },
  { product: 'Premium Hediye Kutusu', current: 45, min: 200, status: 'Kritik' },
  { product: 'E-Ticaret Kutusu S', current: 210, min: 400, status: 'Kritik' },
  { product: 'Baskılı Kutu A4', current: 95, min: 250, status: 'Kritik' },
]

export const customers = {
  summary: { total: 156, active: 128, passive: 28, revenue: '4.850.000₺' },
  list: [
    { company: 'ABC Ambalaj Ltd.', contact: 'Ahmet Yılmaz', email: 'ahmet@abc.com', lastMeeting: '28.05.2026' },
    { company: 'XYZ Gıda A.Ş.', contact: 'Mehmet Kaya', email: 'mehmet@xyz.com', lastMeeting: '27.05.2026' },
    { company: 'Delta Kozmetik', contact: 'Ayşe Demir', email: 'ayse@delta.com', lastMeeting: '26.05.2026' },
    { company: 'Mega Tekstil', contact: 'Fatma Öztürk', email: 'fatma@mega.com', lastMeeting: '25.05.2026' },
    { company: 'Nova Elektronik', contact: 'Ali Çelik', email: 'ali@nova.com', lastMeeting: '24.05.2026' },
  ],
}

export const quotes = {
  summary: { total: 48, pending: 24, accepted: 18, rejected: 6 },
  list: [
    { id: 'TK-2024-001', customer: 'ABC Ambalaj Ltd.', amount: 45000, date: '28.05.2026', status: 'Bekliyor', expiry: '05.06.2026' },
    { id: 'TK-2024-002', customer: 'Prime Lojistik', amount: 89000, date: '27.05.2026', status: 'Kabul Edildi', expiry: '04.06.2026' },
    { id: 'TK-2024-003', customer: 'Star Gıda', amount: 67000, date: '26.05.2026', status: 'Bekliyor', expiry: '03.06.2026' },
    { id: 'TK-2024-004', customer: 'Elit Kozmetik', amount: 34000, date: '25.05.2026', status: 'Reddedildi', expiry: '02.06.2026' },
    { id: 'TK-2024-005', customer: 'Global Tekstil', amount: 112000, date: '24.05.2026', status: 'Kabul Edildi', expiry: '01.06.2026' },
  ],
}

export const stocks = [
  { product: 'Kraft Kutu 30x20', category: 'Kraft', current: 120, min: 500, max: 2000, status: 'critical', supplier: 'Kağıt A.Ş.', updated: '28.05.2026' },
  { product: 'Oluklu Kutu 40x30', category: 'Oluklu', current: 850, min: 300, max: 1500, status: 'normal', supplier: 'Ambalaj Ltd.', updated: '28.05.2026' },
  { product: 'Premium Hediye Kutusu', category: 'Premium', current: 45, min: 200, max: 800, status: 'critical', supplier: 'Lüks Ambalaj', updated: '27.05.2026' },
  { product: 'E-Ticaret Kutusu S', category: 'E-Ticaret', current: 210, min: 400, max: 2000, status: 'warning', supplier: 'Kargo Kutu', updated: '27.05.2026' },
  { product: 'Baskılı Kutu A4', category: 'Baskılı', current: 1200, min: 250, max: 3000, status: 'normal', supplier: 'Baskı Merkezi', updated: '26.05.2026' },
]

export const whatsappMessages = [
  { sender: 'Ahmet Yılmaz', message: 'Sipariş durumu hakkında bilgi alabilir miyim?', date: '28.05.2026', status: 'Cevaplandı' },
  { sender: 'Mehmet Kaya', message: 'Yeni teklif talep ediyorum, 5000 adet kraft kutu', date: '28.05.2026', status: 'Bekliyor' },
  { sender: 'Ayşe Demir', message: 'Fatura gönderildi mi?', date: '27.05.2026', status: 'Cevaplandı' },
  { sender: 'Fatma Öztürk', message: 'Teslimat tarihi değişikliği talebi', date: '27.05.2026', status: 'Cevaplandı' },
  { sender: 'Ali Çelik', message: 'Numune onayı bekliyoruz', date: '26.05.2026', status: 'Bekliyor' },
]

export const invoices = [
  { id: 'EF-2024-001', customer: 'ABC Ambalaj Ltd.', amount: 45000, date: '28.05.2026', status: 'Gönderildi' },
  { id: 'EF-2024-002', customer: 'XYZ Gıda A.Ş.', amount: 78500, date: '27.05.2026', status: 'Gönderildi' },
  { id: 'EF-2024-003', customer: 'Delta Kozmetik', amount: 32000, date: '26.05.2026', status: 'Gönderildi' },
  { id: 'EF-2024-004', customer: 'Mega Tekstil', amount: 125000, date: '25.05.2026', status: 'Bekliyor' },
  { id: 'EF-2024-005', customer: 'Nova Elektronik', amount: 56000, date: '24.05.2026', status: 'Gönderildi' },
]

export const dealers = {
  summary: { total: 42, active: 35, applicant: 4, passive: 3 },
  list: [
    { name: 'İstanbul Bayi', city: 'İstanbul', contact: 'Hasan Arslan', status: 'Aktif', lastOrder: '28.05.2026' },
    { name: 'Ankara Bayi', city: 'Ankara', contact: 'Kemal Yıldız', status: 'Aktif', lastOrder: '27.05.2026' },
    { name: 'İzmir Bayi', city: 'İzmir', contact: 'Selin Aktaş', status: 'Aktif', lastOrder: '26.05.2026' },
    { name: 'Bursa Bayi', city: 'Bursa', contact: 'Emre Koç', status: 'Beklemede', lastOrder: '20.05.2026' },
    { name: 'Antalya Bayi', city: 'Antalya', contact: 'Deniz Kara', status: 'Pasif', lastOrder: '15.04.2026' },
  ],
  performance: [
    { city: 'İstanbul', orders: 45, revenue: '1.250.000₺' },
    { city: 'Ankara', orders: 32, revenue: '890.000₺' },
    { city: 'İzmir', orders: 28, revenue: '720.000₺' },
    { city: 'Bursa', orders: 18, revenue: '480.000₺' },
  ],
  mapPins: [
    { city: 'İstanbul', x: 22, y: 28, color: '#3b82f6' },
    { city: 'Ankara', x: 42, y: 38, color: '#10b981' },
    { city: 'İzmir', x: 12, y: 48, color: '#f59e0b' },
    { city: 'Bursa', x: 20, y: 35, color: '#8b5cf6' },
    { city: 'Antalya', x: 30, y: 62, color: '#ef4444' },
    { city: 'Adana', x: 52, y: 58, color: '#3b82f6' },
    { city: 'Trabzon', x: 68, y: 25, color: '#10b981' },
  ],
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
