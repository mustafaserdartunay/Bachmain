import type { Customer, SupportTicket, TimelineEvent } from '@/types'

export const customers: Customer[] = [
  { id: 'c1', company: 'Erlenbox Teknoloji A.Ş.', contact: 'Ahmet Yılmaz', email: 'ahmet@erlenbox.com', phone: '0532 111 2233', taxNo: '1234567890', city: 'İstanbul', status: 'active', plan: 'Enterprise', mrr: 45000, users: 28, createdAt: '2023-03-15', licenseExpiry: '2026-12-31', balance: 12500 },
  { id: 'c2', company: 'Delta Lojistik Ltd.', contact: 'Mehmet Kaya', email: 'mehmet@deltalojistik.com', phone: '0533 222 3344', taxNo: '2345678901', city: 'Ankara', status: 'active', plan: 'Pro', mrr: 18500, users: 12, createdAt: '2023-06-20', licenseExpiry: '2026-08-15', balance: 0 },
  { id: 'c3', company: 'Nova Gıda San.', contact: 'Ayşe Demir', email: 'ayse@novagida.com', phone: '0534 333 4455', taxNo: '3456789012', city: 'İzmir', status: 'trial', plan: 'Starter', mrr: 0, users: 5, createdAt: '2025-11-01', licenseExpiry: '2026-02-01', balance: 0 },
  { id: 'c4', company: 'Atlas İnşaat A.Ş.', contact: 'Fatma Öztürk', email: 'fatma@atlasinsaat.com', phone: '0535 444 5566', taxNo: '4567890123', city: 'Bursa', status: 'active', plan: 'Enterprise', mrr: 62000, users: 45, createdAt: '2022-01-10', licenseExpiry: '2026-06-30', balance: -8200 },
  { id: 'c5', company: 'Zenith Medikal', contact: 'Ali Çelik', email: 'ali@zenithmedikal.com', phone: '0536 555 6677', taxNo: '5678901234', city: 'Antalya', status: 'suspended', plan: 'Pro', mrr: 0, users: 8, createdAt: '2024-02-28', licenseExpiry: '2025-12-01', balance: 15600 },
  { id: 'c6', company: 'Penta Otomotiv', contact: 'Zeynep Arslan', email: 'zeynep@pentaoto.com', phone: '0537 666 7788', taxNo: '6789012345', city: 'Kocaeli', status: 'active', plan: 'Pro', mrr: 22000, users: 15, createdAt: '2024-05-12', licenseExpiry: '2026-03-20', balance: 3400 },
  { id: 'c7', company: 'Kervan Tekstil', contact: 'Hasan Yıldız', email: 'hasan@kervantekstil.com', phone: '0538 777 8899', taxNo: '7890123456', city: 'Gaziantep', status: 'active', plan: 'Starter', mrr: 8500, users: 6, createdAt: '2024-08-03', licenseExpiry: '2026-01-15', balance: 0 },
  { id: 'c8', company: 'Orion Enerji A.Ş.', contact: 'Selin Aktaş', email: 'selin@orionenerji.com', phone: '0539 888 9900', taxNo: '8901234567', city: 'İstanbul', status: 'churned', plan: 'Pro', mrr: 0, users: 0, createdAt: '2023-09-18', licenseExpiry: '2025-09-18', balance: 0 },
  { id: 'c9', company: 'Meridian Yazılım', contact: 'Burak Koç', email: 'burak@meridian.com', phone: '0541 999 0011', taxNo: '9012345678', city: 'Ankara', status: 'active', plan: 'Enterprise', mrr: 38000, users: 22, createdAt: '2023-11-25', licenseExpiry: '2026-11-25', balance: 0 },
  { id: 'c10', company: 'Vega Perakende', contact: 'Elif Şahin', email: 'elif@vegaperakende.com', phone: '0542 000 1122', taxNo: '0123456789', city: 'İstanbul', status: 'trial', plan: 'Starter', mrr: 0, users: 3, createdAt: '2025-12-10', licenseExpiry: '2026-03-10', balance: 0 },
  { id: 'c11', company: 'Titan Makine', contact: 'Oğuz Güneş', email: 'oguz@titanmakine.com', phone: '0543 111 2233', taxNo: '1122334455', city: 'Konya', status: 'active', plan: 'Pro', mrr: 19500, users: 10, createdAt: '2024-04-07', licenseExpiry: '2026-04-07', balance: 5600 },
  { id: 'c12', company: 'Sirius Danışmanlık', contact: 'Deniz Kara', email: 'deniz@siriusdan.com', phone: '0544 222 3344', taxNo: '2233445566', city: 'İstanbul', status: 'active', plan: 'Starter', mrr: 7500, users: 4, createdAt: '2025-01-20', licenseExpiry: '2026-07-20', balance: 0 },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 't1', subject: 'E-Fatura entegrasyonu hata veriyor', customer: 'Erlenbox Teknoloji A.Ş.', customerId: 'c1',
    priority: 'high', status: 'in_progress', assignee: 'Emre K.', tags: ['e-fatura', 'entegrasyon', 'acil'],
    slaDeadline: '2026-07-10T14:00:00', createdAt: '2026-07-09T09:15:00', updatedAt: '2026-07-09T16:30:00',
    description: 'E-Fatura gönderiminde 500 hatası alınıyor. Son 3 gündür devam ediyor.',
    internalNotes: [
      { id: 'n1', author: 'Emre K.', content: 'GİB servisinde bakım var, müşteriye bilgi verildi.', date: '2026-07-09T10:00:00' },
      { id: 'n2', author: 'Sistem', content: 'Otomatik yeniden deneme 3 kez başarısız.', date: '2026-07-09T11:30:00' },
    ],
    attachments: [
      { id: 'a1', name: 'hata-ekran-goruntusu.png', size: '245 KB' },
      { id: 'a2', name: 'log-dosyasi.txt', size: '12 KB' },
    ],
    timeline: [
      { id: 'tl1', title: 'Ticket oluşturuldu', date: '2026-07-09T09:15:00', type: 'info', user: 'Ahmet Yılmaz' },
      { id: 'tl2', title: 'Emre K. atandı', date: '2026-07-09T09:30:00', type: 'info', user: 'Sistem' },
      { id: 'tl3', title: 'İç not eklendi', description: 'GİB servisinde bakım var', date: '2026-07-09T10:00:00', type: 'warning', user: 'Emre K.' },
      { id: 'tl4', title: 'Durum: İşlemde', date: '2026-07-09T16:30:00', type: 'success', user: 'Emre K.' },
    ],
  },
  {
    id: 't2', subject: 'Stok modülünde sayım farkı', customer: 'Delta Lojistik Ltd.', customerId: 'c2',
    priority: 'medium', status: 'open', assignee: 'Aylin D.', tags: ['stok', 'sayım'],
    slaDeadline: '2026-07-11T17:00:00', createdAt: '2026-07-09T11:00:00', updatedAt: '2026-07-09T11:00:00',
    description: 'Depo sayımı sonrası 47 kalemde fark görülüyor.',
    internalNotes: [], attachments: [],
    timeline: [
      { id: 'tl5', title: 'Ticket oluşturuldu', date: '2026-07-09T11:00:00', type: 'info', user: 'Mehmet Kaya' },
    ],
  },
  {
    id: 't3', subject: 'Yeni kullanıcı ekleme yetkisi', customer: 'Nova Gıda San.', customerId: 'c3',
    priority: 'low', status: 'waiting', assignee: 'Emre K.', tags: ['yetki', 'kullanıcı'],
    slaDeadline: '2026-07-12T17:00:00', createdAt: '2026-07-08T14:20:00', updatedAt: '2026-07-09T08:00:00',
    description: 'Admin panelinden yeni kullanıcı ekleyemiyoruz.',
    internalNotes: [
      { id: 'n3', author: 'Emre K.', content: 'Trial hesapta kullanıcı limiti dolmuş, upgrade önerildi.', date: '2026-07-09T08:00:00' },
    ],
    attachments: [], timeline: [
      { id: 'tl6', title: 'Ticket oluşturuldu', date: '2026-07-08T14:20:00', type: 'info', user: 'Ayşe Demir' },
      { id: 'tl7', title: 'Müşteri yanıtı bekleniyor', date: '2026-07-09T08:00:00', type: 'warning', user: 'Emre K.' },
    ],
  },
  {
    id: 't4', subject: 'API rate limit aşımı', customer: 'Meridian Yazılım', customerId: 'c9',
    priority: 'critical', status: 'open', assignee: 'Can B.', tags: ['api', 'kritik'],
    slaDeadline: '2026-07-09T20:00:00', createdAt: '2026-07-09T15:45:00', updatedAt: '2026-07-09T15:45:00',
    description: 'Production API 429 hatası veriyor, entegrasyonlar durdu.',
    internalNotes: [], attachments: [
      { id: 'a3', name: 'api-metrics.json', size: '8 KB' },
    ],
    timeline: [
      { id: 'tl8', title: 'Kritik ticket oluşturuldu', date: '2026-07-09T15:45:00', type: 'danger', user: 'Burak Koç' },
    ],
  },
  {
    id: 't5', subject: 'Rapor export sorunu', customer: 'Atlas İnşaat A.Ş.', customerId: 'c4',
    priority: 'medium', status: 'resolved', assignee: 'Aylin D.', tags: ['rapor', 'export'],
    slaDeadline: '2026-07-08T17:00:00', createdAt: '2026-07-07T10:00:00', updatedAt: '2026-07-08T16:00:00',
    description: 'Excel export boş dosya indiriyor.',
    internalNotes: [
      { id: 'n4', author: 'Aylin D.', content: 'v2.4.1 patch ile düzeltildi.', date: '2026-07-08T16:00:00' },
    ],
    attachments: [], timeline: [
      { id: 'tl9', title: 'Ticket oluşturuldu', date: '2026-07-07T10:00:00', type: 'info', user: 'Fatma Öztürk' },
      { id: 'tl10', title: 'Çözüldü', date: '2026-07-08T16:00:00', type: 'success', user: 'Aylin D.' },
    ],
  },
]

export const dashboardKpis = [
  { label: 'Aktif Müşteri', value: '248', change: '+12 bu ay', trend: 'up' as const },
  { label: 'Aylık Gelir (MRR)', value: '₺1.24M', change: '+8.3%', trend: 'up' as const },
  { label: 'Açık Ticket', value: '12', change: '-3 dünden', trend: 'down' as const },
  { label: 'Sistem Uptime', value: '99.97%', change: 'Son 30 gün', trend: 'neutral' as const },
]

export const revenueChart = [
  { label: 'Oca', value: 980000 },
  { label: 'Şub', value: 1020000 },
  { label: 'Mar', value: 1050000 },
  { label: 'Nis', value: 1100000 },
  { label: 'May', value: 1150000 },
  { label: 'Haz', value: 1180000 },
  { label: 'Tem', value: 1240000 },
]

export const recentActivities: TimelineEvent[] = [
  { id: 'a1', title: 'Yeni müşteri kaydı', description: 'Vega Perakende trial hesabı açtı', date: '2026-07-09T17:30:00', type: 'success', user: 'Sistem' },
  { id: 'a2', title: 'Ödeme alındı', description: 'Erlenbox Teknoloji — ₺45.000', date: '2026-07-09T16:00:00', type: 'success', user: 'Finans' },
  { id: 'a3', title: 'Lisans yenilendi', description: 'Delta Lojistik — Pro Plan', date: '2026-07-09T14:30:00', type: 'info', user: 'Sistem' },
  { id: 'a4', title: 'Kritik ticket açıldı', description: 'Meridian Yazılım — API rate limit', date: '2026-07-09T15:45:00', type: 'danger', user: 'Destek' },
  { id: 'a5', title: 'Sunucu uyarısı', description: 'DB replica lag 2.3s', date: '2026-07-09T13:00:00', type: 'warning', user: 'Monitoring' },
]

export const expiringLicenses = customers
  .filter((c) => c.status === 'active' || c.status === 'trial')
  .filter((c) => new Date(c.licenseExpiry) < new Date('2026-03-01'))
  .slice(0, 5)

export const pendingPayments = [
  { id: 'p1', customer: 'Atlas İnşaat A.Ş.', amount: 62000, dueDate: '2026-07-05', status: 'overdue' },
  { id: 'p2', customer: 'Zenith Medikal', amount: 18500, dueDate: '2026-07-10', status: 'pending' },
  { id: 'p3', customer: 'Titan Makine', amount: 19500, dueDate: '2026-07-12', status: 'pending' },
  { id: 'p4', customer: 'Kervan Tekstil', amount: 8500, dueDate: '2026-07-15', status: 'pending' },
]

export const systemHealth = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.99%', latency: '45ms' },
  { name: 'Database (Primary)', status: 'healthy', uptime: '99.97%', latency: '12ms' },
  { name: 'Database (Replica)', status: 'warning', uptime: '99.95%', latency: '89ms' },
  { name: 'Redis Cache', status: 'healthy', uptime: '100%', latency: '2ms' },
  { name: 'E-Fatura Servisi', status: 'warning', uptime: '98.50%', latency: '320ms' },
  { name: 'AI Engine', status: 'healthy', uptime: '99.90%', latency: '180ms' },
]

export function getCustomerById(id: string) {
  return customers.find((c) => c.id === id)
}

export function getTicketById(id: string) {
  return supportTickets.find((t) => t.id === id)
}

export const customerUsers = (customerId: string) => [
  { id: 'u1', name: 'Ahmet Yılmaz', email: 'ahmet@erlenbox.com', role: 'Admin', lastLogin: '2026-07-09T08:30:00', status: 'active' },
  { id: 'u2', name: 'Zeynep Korkmaz', email: 'zeynep@erlenbox.com', role: 'Muhasebe', lastLogin: '2026-07-08T17:45:00', status: 'active' },
  { id: 'u3', name: 'Murat Şen', email: 'murat@erlenbox.com', role: 'Satış', lastLogin: '2026-07-07T11:20:00', status: 'active' },
].filter(() => customerId)

export const customerInvoices = (customerId: string) => [
  { id: 'inv1', number: 'FTR-2026-0142', date: '2026-07-01', amount: 45000, status: 'paid' },
  { id: 'inv2', number: 'FTR-2026-0098', date: '2026-06-01', amount: 45000, status: 'paid' },
  { id: 'inv3', number: 'FTR-2026-0054', date: '2026-05-01', amount: 45000, status: 'paid' },
].filter(() => customerId)

export const customerPayments = (customerId: string) => [
  { id: 'pay1', date: '2026-07-02', amount: 45000, method: 'Havale', status: 'completed' },
  { id: 'pay2', date: '2026-06-03', amount: 45000, method: 'Kredi Kartı', status: 'completed' },
].filter(() => customerId)

export const customerSupport = (customerId: string) =>
  supportTickets.filter((t) => t.customerId === customerId)

export const customerAiUsage = (_customerId: string) => ({
  totalQueries: 1247,
  tokensUsed: 892000,
  costEstimate: 445,
  topFeatures: ['Fatura Analizi', 'Stok Tahmini', 'Müşteri Segmentasyonu'],
})

export const customerLoginHistory = (customerId: string) => [
  { id: 'lh1', user: 'Ahmet Yılmaz', ip: '185.27.xxx.12', device: 'Chrome / Windows', date: '2026-07-09T08:30:00' },
  { id: 'lh2', user: 'Zeynep Korkmaz', ip: '78.189.xxx.45', device: 'Safari / macOS', date: '2026-07-08T17:45:00' },
  { id: 'lh3', user: 'Ahmet Yılmaz', ip: '185.27.xxx.12', device: 'BACHMAIN Mobile', date: '2026-07-08T07:15:00' },
].filter(() => customerId)

export const customerTimeline = (_customerId: string): TimelineEvent[] => [
  { id: 'ct1', title: 'Aylık ödeme alındı', description: '₺45.000 — Havale', date: '2026-07-02T10:00:00', type: 'success' },
  { id: 'ct2', title: 'Yeni kullanıcı eklendi', description: 'Murat Şen — Satış rolü', date: '2026-06-28T14:00:00', type: 'info' },
  { id: 'ct3', title: 'Destek ticket çözüldü', description: 'Rapor export sorunu', date: '2026-06-25T16:00:00', type: 'success' },
  { id: 'ct4', title: 'Plan yükseltildi', description: 'Pro → Enterprise', date: '2026-05-15T09:00:00', type: 'info' },
  { id: 'ct5', title: 'Hesap oluşturuldu', date: '2023-03-15T11:00:00', type: 'info' },
]
