const fmt = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

const statusLabels = {
  active: 'Aktif', trial: 'Deneme', suspended: 'Askıda', churned: 'İptal',
  open: 'Açık', in_progress: 'İşlemde', waiting: 'Bekliyor', resolved: 'Çözüldü', closed: 'Kapalı',
  low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik',
}

export const customers = [
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

export const supportTickets = [
  { id: 't1', subject: 'E-Fatura entegrasyonu hata veriyor', customer: 'Erlenbox Teknoloji A.Ş.', customerId: 'c1', priority: 'high', status: 'in_progress', assignee: 'Emre K.', tags: ['e-fatura', 'entegrasyon', 'acil'], slaDeadline: '2026-07-10T14:00:00', createdAt: '2026-07-09T09:15:00', updatedAt: '2026-07-09T16:30:00', description: 'E-Fatura gönderiminde 500 hatası alınıyor.', internalNotes: [{ id: 'n1', author: 'Emre K.', content: 'GİB servisinde bakım var.', date: '2026-07-09T10:00:00' }], attachments: [{ id: 'a1', name: 'hata-ekran-goruntusu.png', size: '245 KB' }], timeline: [{ id: 'tl1', title: 'Ticket oluşturuldu', date: '2026-07-09T09:15:00', type: 'info', user: 'Ahmet Yılmaz' }] },
  { id: 't2', subject: 'Stok modülünde sayım farkı', customer: 'Delta Lojistik Ltd.', customerId: 'c2', priority: 'medium', status: 'open', assignee: 'Aylin D.', tags: ['stok'], slaDeadline: '2026-07-11T17:00:00', createdAt: '2026-07-09T11:00:00', updatedAt: '2026-07-09T11:00:00', description: 'Depo sayımı sonrası 47 kalemde fark görülüyor.', internalNotes: [], attachments: [], timeline: [{ id: 'tl5', title: 'Ticket oluşturuldu', date: '2026-07-09T11:00:00', type: 'info', user: 'Mehmet Kaya' }] },
  { id: 't3', subject: 'Yeni kullanıcı ekleme yetkisi', customer: 'Nova Gıda San.', customerId: 'c3', priority: 'low', status: 'waiting', assignee: 'Emre K.', tags: ['yetki'], slaDeadline: '2026-07-12T17:00:00', createdAt: '2026-07-08T14:20:00', updatedAt: '2026-07-09T08:00:00', description: 'Admin panelinden yeni kullanıcı ekleyemiyoruz.', internalNotes: [], attachments: [], timeline: [] },
  { id: 't4', subject: 'API rate limit aşımı', customer: 'Meridian Yazılım', customerId: 'c9', priority: 'critical', status: 'open', assignee: 'Can B.', tags: ['api'], slaDeadline: '2026-07-09T20:00:00', createdAt: '2026-07-09T15:45:00', updatedAt: '2026-07-09T15:45:00', description: 'Production API 429 hatası veriyor.', internalNotes: [], attachments: [], timeline: [] },
  { id: 't5', subject: 'Rapor export sorunu', customer: 'Atlas İnşaat A.Ş.', customerId: 'c4', priority: 'medium', status: 'resolved', assignee: 'Aylin D.', tags: ['rapor'], slaDeadline: '2026-07-08T17:00:00', createdAt: '2026-07-07T10:00:00', updatedAt: '2026-07-08T16:00:00', description: 'Excel export boş dosya indiriyor.', internalNotes: [], attachments: [], timeline: [] },
]

function genModuleRows() {
  return {
    customers: customers.map((c) => ({ id: c.id, company: c.company, contact: c.contact, city: c.city, plan: c.plan, mrr: fmt(c.mrr), status: statusLabels[c.status], licenseExpiry: c.licenseExpiry })),
    subscriptions: customers.filter((c) => c.status !== 'churned').map((c, i) => ({ id: `sub${i}`, customer: c.company, plan: c.plan, startDate: c.createdAt, expiry: c.licenseExpiry, users: c.users, status: statusLabels[c.status], mrr: fmt(c.mrr) })),
    dealers: Array.from({ length: 8 }, (_, i) => ({ id: `d${i + 1}`, name: ['Anadolu Bilişim', 'Marmara ERP', 'Ege Yazılım', 'Akdeniz Tek', 'Karadeniz BT', 'İç Anadolu Soft', 'Güneydoğu Dijital', 'Trakya Sistem'][i], city: ['Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Trabzon', 'Konya', 'Gaziantep', 'Edirne'][i], customers: [24, 18, 15, 12, 8, 10, 6, 5][i], commission: `%${[15, 12, 10, 12, 8, 10, 8, 8][i]}`, status: 'Aktif', contact: `Yetkili ${i + 1}` })),
    accounts: customers.map((c, i) => ({ id: `acc${i}`, customer: c.company, debit: fmt(c.balance > 0 ? c.balance : 0), credit: fmt(c.balance < 0 ? Math.abs(c.balance) : 0), balance: fmt(Math.abs(c.balance)), lastTransaction: '2026-07-08' })),
    payments: [
      { id: 'pay1', customer: 'Erlenbox Teknoloji', amount: fmt(45000), method: 'Havale', date: '2026-07-02', status: 'Ödendi' },
      { id: 'pay2', customer: 'Atlas İnşaat', amount: fmt(62000), method: 'EFT', date: '2026-07-05', status: 'Gecikmiş' },
      { id: 'pay3', customer: 'Delta Lojistik', amount: fmt(18500), method: 'Kredi Kartı', date: '2026-07-01', status: 'Ödendi' },
    ],
    invoices: Array.from({ length: 8 }, (_, i) => ({ id: `inv${i}`, number: `FTR-2026-${String(150 - i).padStart(4, '0')}`, customer: customers[i % customers.length].company, date: '2026-07-01', amount: fmt(45000), status: 'Ödendi' })),
    packages: [
      { id: 'pkg1', name: 'Starter', price: fmt(7500), users: '5', modules: '12', customers: '48', status: 'Aktif' },
      { id: 'pkg2', name: 'Pro', price: fmt(18500), users: '20', modules: '22', customers: '142', status: 'Aktif' },
      { id: 'pkg3', name: 'Enterprise', price: fmt(45000), users: 'Sınırsız', modules: '27', customers: '58', status: 'Aktif' },
    ],
    support: supportTickets.map((t) => ({ id: t.id, subject: t.subject, customer: t.customer, priority: statusLabels[t.priority], status: statusLabels[t.status], assignee: t.assignee, createdAt: t.createdAt.split('T')[0] })),
    'live-support': [{ id: 'ls1', customer: 'Nova Gıda San.', agent: 'Emre K.', waitTime: '2dk', topic: 'Kurulum', status: 'Aktif' }],
    notifications: [{ id: 'not1', title: 'Sistem güncellemesi', type: 'Sistem', sent: '9 Tem 2026', recipients: '248', status: 'Gönderildi' }],
    ai: [{ id: 'ai1', feature: 'Fatura Analizi', queries: '12.4K', tokens: '8.2M', cost: fmt(4100), status: 'Aktif' }],
    analytics: [{ id: 'an1', metric: 'Günlük Aktif Kullanıcı', value: '1,842', change: '+5.2%', period: 'Son 7 gün' }],
    server: [{ id: 'srv1', name: 'API Gateway', cpu: '%32', memory: '%48', disk: '%62', status: 'Sağlıklı' }],
    updates: [{ id: 'up1', version: 'v2.5.0', title: 'AI Rapor Motoru', releaseDate: '2026-07-15', status: 'Planlandı', adoption: '—' }],
    security: [{ id: 'sec1', event: 'Başarısız giriş', source: '185.27.xxx.89', severity: 'Orta', date: '2026-07-09', status: 'İzleniyor' }],
    staff: [{ id: 'st1', name: 'Emre Korkmaz', role: 'Destek Uzmanı', department: 'Destek', email: 'emre@bachmain.com', status: 'Aktif' }],
    website: [{ id: 'ws1', page: 'Ana Sayfa', url: '/', visits: '12.4K', bounce: '%32', status: 'Yayında' }],
    api: [{ id: 'api1', name: 'REST API v2', endpoint: 'api.bachmain.com/v2', calls: '2.4M/ay', status: 'Aktif', version: '2.4' }],
    settings: [{ id: 'set1', key: 'platform.name', value: 'BACHMAIN', group: 'Genel', updated: '2026-01-01' }],
  }
}

export const seedData = {
  customers,
  supportTickets,
  customerExtras: {
    users: [{ id: 'u1', name: 'Ahmet Yılmaz', email: 'ahmet@erlenbox.com', role: 'Admin', lastLogin: '2026-07-09T08:30:00', status: 'active' }],
    invoices: [{ id: 'inv1', number: 'FTR-2026-0142', date: '2026-07-01', amount: 45000, status: 'paid' }],
    payments: [{ id: 'pay1', date: '2026-07-02', amount: 45000, method: 'Havale', status: 'completed' }],
    aiUsage: { totalQueries: 1247, tokensUsed: 892000, costEstimate: 445, topFeatures: ['Fatura Analizi', 'Stok Tahmini'] },
    loginHistory: [{ id: 'lh1', user: 'Ahmet Yılmaz', ip: '185.27.xxx.12', device: 'Chrome / Windows', date: '2026-07-09T08:30:00' }],
    timeline: [{ id: 'ct1', title: 'Aylık ödeme alındı', description: '₺45.000', date: '2026-07-02T10:00:00', type: 'success' }],
  },
  dashboard: {
    kpis: [
      { label: 'Aktif Müşteri', value: '248', change: '+12 bu ay', trend: 'up' },
      { label: 'Aylık Gelir (MRR)', value: '₺1.24M', change: '+8.3%', trend: 'up' },
      { label: 'Açık Ticket', value: '12', change: '-3 dünden', trend: 'down' },
      { label: 'Sistem Uptime', value: '99.97%', change: 'Son 30 gün', trend: 'neutral' },
    ],
    revenueChart: [
      { label: 'Oca', value: 980000 }, { label: 'Şub', value: 1020000 }, { label: 'Mar', value: 1050000 },
      { label: 'Nis', value: 1100000 }, { label: 'May', value: 1150000 }, { label: 'Haz', value: 1180000 }, { label: 'Tem', value: 1240000 },
    ],
    recentActivities: [
      { id: 'a1', title: 'Yeni müşteri kaydı', description: 'Vega Perakende trial', date: '2026-07-09T17:30:00', type: 'success', user: 'Sistem' },
      { id: 'a2', title: 'Ödeme alındı', description: 'Erlenbox — ₺45.000', date: '2026-07-09T16:00:00', type: 'success', user: 'Finans' },
    ],
    pendingPayments: [
      { id: 'p1', customer: 'Atlas İnşaat A.Ş.', amount: 62000, dueDate: '2026-07-05', status: 'overdue' },
      { id: 'p2', customer: 'Zenith Medikal', amount: 18500, dueDate: '2026-07-10', status: 'pending' },
    ],
    systemHealth: [
      { name: 'API Gateway', status: 'healthy', uptime: '99.99%', latency: '45ms' },
      { name: 'Database (Primary)', status: 'healthy', uptime: '99.97%', latency: '12ms' },
      { name: 'E-Fatura Servisi', status: 'warning', uptime: '98.50%', latency: '320ms' },
    ],
  },
  modules: genModuleRows(),
}
