import type { ModuleConfig } from '@/types'
import { customers, supportTickets } from '@/data/mock'
import { formatCurrency } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  active: 'Aktif', trial: 'Deneme', suspended: 'Askıda', churned: 'İptal',
  open: 'Açık', in_progress: 'İşlemde', waiting: 'Bekliyor', resolved: 'Çözüldü', closed: 'Kapalı',
  paid: 'Ödendi', pending: 'Bekleyen', overdue: 'Gecikmiş',
  low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik',
  healthy: 'Sağlıklı', warning: 'Uyarı', critical_sys: 'Kritik',
}

function genRows(moduleId: string) {
  const templates: Record<string, () => Record<string, unknown>[]> = {
    customers: () => customers.map((c) => ({
      id: c.id, company: c.company, contact: c.contact, city: c.city,
      plan: c.plan, mrr: formatCurrency(c.mrr), status: statusLabels[c.status],
      licenseExpiry: c.licenseExpiry,
    })),
    subscriptions: () => customers.filter((c: typeof customers[0]) => c.status !== 'churned').map((c: typeof customers[0], i: number) => ({
      id: `sub${i}`, customer: c.company, plan: c.plan,
      startDate: c.createdAt, expiry: c.licenseExpiry,
      users: c.users, status: statusLabels[c.status], mrr: formatCurrency(c.mrr),
    })),
    dealers: () => Array.from({ length: 8 }, (_, i) => ({
      id: `d${i + 1}`, name: ['Anadolu Bilişim', 'Marmara ERP', 'Ege Yazılım', 'Akdeniz Tek', 'Karadeniz BT', 'İç Anadolu Soft', 'Güneydoğu Dijital', 'Trakya Sistem'][i],
      city: ['Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Trabzon', 'Konya', 'Gaziantep', 'Edirne'][i],
      customers: [24, 18, 15, 12, 8, 10, 6, 5][i], commission: `%${[15, 12, 10, 12, 8, 10, 8, 8][i]}`,
      status: 'Aktif', contact: `Yetkili ${i + 1}`,
    })),
    accounts: () => customers.map((c: typeof customers[0], i: number) => ({
      id: `acc${i}`, customer: c.company, debit: formatCurrency(c.balance > 0 ? c.balance : 0),
      credit: formatCurrency(c.balance < 0 ? Math.abs(c.balance) : 0),
      balance: formatCurrency(Math.abs(c.balance)), lastTransaction: '2026-07-08',
    })),
    payments: () => [
      { id: 'pay1', customer: 'Erlenbox Teknoloji', amount: formatCurrency(45000), method: 'Havale', date: '2026-07-02', status: 'Ödendi' },
      { id: 'pay2', customer: 'Atlas İnşaat', amount: formatCurrency(62000), method: 'EFT', date: '2026-07-05', status: 'Gecikmiş' },
      { id: 'pay3', customer: 'Delta Lojistik', amount: formatCurrency(18500), method: 'Kredi Kartı', date: '2026-07-01', status: 'Ödendi' },
      { id: 'pay4', customer: 'Penta Otomotiv', amount: formatCurrency(22000), method: 'Havale', date: '2026-06-28', status: 'Ödendi' },
      { id: 'pay5', customer: 'Titan Makine', amount: formatCurrency(19500), method: 'EFT', date: '2026-07-12', status: 'Bekleyen' },
      { id: 'pay6', customer: 'Meridian Yazılım', amount: formatCurrency(38000), method: 'Havale', date: '2026-06-25', status: 'Ödendi' },
      { id: 'pay7', customer: 'Kervan Tekstil', amount: formatCurrency(8500), method: 'Kredi Kartı', date: '2026-07-15', status: 'Bekleyen' },
      { id: 'pay8', customer: 'Zenith Medikal', amount: formatCurrency(18500), method: 'EFT', date: '2026-07-10', status: 'Bekleyen' },
    ],
    invoices: () => Array.from({ length: 10 }, (_, i) => ({
      id: `inv${i}`, number: `FTR-2026-${String(150 - i).padStart(4, '0')}`,
      customer: customers[i % customers.length].company,
      date: `2026-0${7 - Math.floor(i / 3)}-${String(28 - i * 2).padStart(2, '0')}`,
      amount: formatCurrency([45000, 62000, 18500, 22000, 38000, 8500, 19500, 7500][i % 8]),
      status: ['Ödendi', 'Bekleyen', 'Gecikmiş', 'Ödendi'][i % 4],
    })),
    packages: () => [
      { id: 'pkg1', name: 'Starter', price: formatCurrency(7500), users: '5', modules: '12', customers: '48', status: 'Aktif' },
      { id: 'pkg2', name: 'Pro', price: formatCurrency(18500), users: '20', modules: '22', customers: '142', status: 'Aktif' },
      { id: 'pkg3', name: 'Enterprise', price: formatCurrency(45000), users: 'Sınırsız', modules: '27', customers: '58', status: 'Aktif' },
      { id: 'pkg4', name: 'Trial', price: 'Ücretsiz', users: '3', modules: '8', customers: '24', status: 'Aktif' },
    ],
    support: () => supportTickets.map((t: typeof supportTickets[0]) => ({
      id: t.id, subject: t.subject, customer: t.customer,
      priority: statusLabels[t.priority], status: statusLabels[t.status],
      assignee: t.assignee, createdAt: t.createdAt.split('T')[0],
    })),
    'live-support': () => [
      { id: 'ls1', customer: 'Nova Gıda San.', agent: 'Emre K.', waitTime: '2dk', topic: 'Kurulum yardımı', status: 'Aktif' },
      { id: 'ls2', customer: 'Vega Perakende', agent: 'Aylin D.', waitTime: '5dk', topic: 'Fatura sorunu', status: 'Bekliyor' },
      { id: 'ls3', customer: 'Sirius Danışmanlık', agent: 'Can B.', waitTime: '0dk', topic: 'API entegrasyon', status: 'Aktif' },
    ],
    notifications: () => Array.from({ length: 10 }, (_, i) => ({
      id: `not${i}`, title: ['Sistem güncellemesi', 'Yeni özellik: AI Rapor', 'Bakım bildirimi', 'Güvenlik uyarısı', 'Lisans hatırlatma'][i % 5],
      type: ['Sistem', 'Özellik', 'Bakım', 'Güvenlik', 'Lisans'][i % 5],
      sent: `${10 - i} Tem 2026`, recipients: `${[248, 142, 248, 58, 12][i % 5]}`, status: ['Gönderildi', 'Taslak', 'Planlandı'][i % 3],
    })),
    ai: () => [
      { id: 'ai1', feature: 'Fatura Analizi', queries: '12.4K', tokens: '8.2M', cost: formatCurrency(4100), status: 'Aktif' },
      { id: 'ai2', feature: 'Stok Tahmini', queries: '8.7K', tokens: '5.1M', cost: formatCurrency(2550), status: 'Aktif' },
      { id: 'ai3', feature: 'Müşteri Segmentasyonu', queries: '3.2K', tokens: '2.8M', cost: formatCurrency(1400), status: 'Aktif' },
      { id: 'ai4', feature: 'Doğal Dil Sorgu', queries: '15.1K', tokens: '12.4M', cost: formatCurrency(6200), status: 'Aktif' },
      { id: 'ai5', feature: 'Belge OCR', queries: '6.8K', tokens: '4.2M', cost: formatCurrency(2100), status: 'Beta' },
    ],
    analytics: () => [
      { id: 'an1', metric: 'Günlük Aktif Kullanıcı', value: '1,842', change: '+5.2%', period: 'Son 7 gün' },
      { id: 'an2', metric: 'Ortalama Oturum Süresi', value: '24dk', change: '+2.1%', period: 'Son 7 gün' },
      { id: 'an3', metric: 'En Çok Kullanılan Modül', value: 'Stok', change: '—', period: 'Son 30 gün' },
      { id: 'an4', metric: 'Mobil Kullanım Oranı', value: '%34', change: '+8%', period: 'Son 30 gün' },
    ],
    server: () => [
      { id: 'srv1', name: 'API Gateway', cpu: '%32', memory: '%48', disk: '%62', status: 'Sağlıklı' },
      { id: 'srv2', name: 'DB Primary', cpu: '%58', memory: '%72', disk: '%45', status: 'Sağlıklı' },
      { id: 'srv3', name: 'DB Replica', cpu: '%42', memory: '%65', disk: '%45', status: 'Uyarı' },
      { id: 'srv4', name: 'Redis', cpu: '%12', memory: '%35', disk: '—', status: 'Sağlıklı' },
      { id: 'srv5', name: 'AI Engine', cpu: '%68', memory: '%81', disk: '%55', status: 'Sağlıklı' },
      { id: 'srv6', name: 'E-Fatura', cpu: '%25', memory: '%40', disk: '%30', status: 'Uyarı' },
    ],
    updates: () => [
      { id: 'up1', version: 'v2.5.0', title: 'AI Rapor Motoru', releaseDate: '2026-07-15', status: 'Planlandı', adoption: '—' },
      { id: 'up2', version: 'v2.4.1', title: 'Rapor Export Düzeltmesi', releaseDate: '2026-07-08', status: 'Yayında', adoption: '%78' },
      { id: 'up3', version: 'v2.4.0', title: 'Mobil Dashboard', releaseDate: '2026-06-20', status: 'Yayında', adoption: '%92' },
      { id: 'up4', version: 'v2.3.2', title: 'Güvenlik Yamaları', releaseDate: '2026-06-01', status: 'Yayında', adoption: '%98' },
    ],
    security: () => [
      { id: 'sec1', event: 'Başarısız giriş denemesi', source: '185.27.xxx.89', severity: 'Orta', date: '2026-07-09 16:45', status: 'İzleniyor' },
      { id: 'sec2', event: 'API key rotasyonu', source: 'Sistem', severity: 'Düşük', date: '2026-07-09 12:00', status: 'Tamamlandı' },
      { id: 'sec3', event: 'Şüpheli IP engellendi', source: '45.33.xxx.12', severity: 'Yüksek', date: '2026-07-08 23:15', status: 'Engellendi' },
      { id: 'sec4', event: '2FA zorunluluğu ihlali', source: 'Zenith Medikal', severity: 'Orta', date: '2026-07-08 14:30', status: 'Uyarı gönderildi' },
    ],
    staff: () => [
      { id: 'st1', name: 'Emre Korkmaz', role: 'Destek Uzmanı', department: 'Destek', email: 'emre@bachmain.com', status: 'Aktif' },
      { id: 'st2', name: 'Aylin Demir', role: 'Destek Uzmanı', department: 'Destek', email: 'aylin@bachmain.com', status: 'Aktif' },
      { id: 'st3', name: 'Can Başaran', role: 'DevOps Mühendisi', department: 'Teknik', email: 'can@bachmain.com', status: 'Aktif' },
      { id: 'st4', name: 'Selin Arslan', role: 'Satış Müdürü', department: 'Satış', email: 'selin@bachmain.com', status: 'Aktif' },
      { id: 'st5', name: 'Burak Yıldız', role: 'Finans Uzmanı', department: 'Finans', email: 'burak@bachmain.com', status: 'İzinli' },
    ],
    website: () => [
      { id: 'ws1', page: 'Ana Sayfa', url: '/', visits: '12.4K', bounce: '%32', status: 'Yayında' },
      { id: 'ws2', page: 'Fiyatlandırma', url: '/fiyatlandirma', visits: '4.8K', bounce: '%28', status: 'Yayında' },
      { id: 'ws3', page: 'Ürünler', url: '/urunler', visits: '3.2K', bounce: '%35', status: 'Yayında' },
      { id: 'ws4', page: 'Blog', url: '/blog', visits: '1.8K', bounce: '%42', status: 'Yayında' },
      { id: 'ws5', page: 'Yeni Landing', url: '/kampanya-2026', visits: '—', bounce: '—', status: 'Taslak' },
    ],
    api: () => [
      { id: 'api1', name: 'REST API v2', endpoint: 'api.bachmain.com/v2', calls: '2.4M/ay', status: 'Aktif', version: '2.4' },
      { id: 'api2', name: 'Webhook Servisi', endpoint: 'hooks.bachmain.com', calls: '180K/ay', status: 'Aktif', version: '1.2' },
      { id: 'api3', name: 'E-Fatura API', endpoint: 'efatura.bachmain.com', calls: '95K/ay', status: 'Uyarı', version: '3.1' },
      { id: 'api4', name: 'AI API', endpoint: 'ai.bachmain.com', calls: '45K/ay', status: 'Aktif', version: '1.0' },
      { id: 'api5', name: 'Eski REST API', endpoint: 'api.bachmain.com/v1', calls: '12K/ay', status: 'Kullanımdan Kaldırılıyor', version: '1.0' },
    ],
    settings: () => [
      { id: 'set1', key: 'platform.name', value: 'BACHMAIN', group: 'Genel', updated: '2026-01-01' },
      { id: 'set2', key: 'billing.currency', value: 'TRY', group: 'Finans', updated: '2026-01-01' },
      { id: 'set3', key: 'support.sla_hours', value: '24', group: 'Destek', updated: '2026-03-15' },
      { id: 'set4', key: 'ai.max_tokens', value: '100000', group: 'AI', updated: '2026-05-01' },
      { id: 'set5', key: 'security.2fa_required', value: 'true', group: 'Güvenlik', updated: '2026-06-01' },
    ],
  }

  return templates[moduleId]?.() ?? []
}

const moduleDefinitions: Omit<ModuleConfig, 'metrics'>[] = [
  { id: 'customers', title: 'Müşteri Yönetimi', subtitle: 'Web üyelikleri ve tüm müşteri hesapları', singularName: 'Müşteri', path: '/musteriler',
    columns: [
      { key: 'company', label: 'Firma', sortable: true }, { key: 'contact', label: 'Yetkili', sortable: true },
      { key: 'email', label: 'E-posta', sortable: true },
      { key: 'plan', label: 'Plan' }, { key: 'mrr', label: 'MRR' },
      { key: 'status', label: 'Durum' }, { key: 'source', label: 'Kaynak' },
      { key: 'licenseExpiry', label: 'Lisans Bitiş', sortable: true },
    ],
    formFields: [
      { name: 'company', label: 'Firma Adı', type: 'text', required: true },
      { name: 'contact', label: 'Yetkili Kişi', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'phone', label: 'Telefon', type: 'tel' },
      { name: 'taxNo', label: 'Vergi No', type: 'text' },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'plan', label: 'Plan', type: 'select', options: [{ label: 'Starter', value: 'starter' }, { label: 'Pro', value: 'pro' }, { label: 'Enterprise', value: 'enterprise' }] },
      { name: 'status', label: 'Durum', type: 'select', options: [{ label: 'Aktif', value: 'active' }, { label: 'Deneme', value: 'trial' }, { label: 'Askıda', value: 'suspended' }] },
    ],
  },
  { id: 'memberships', title: 'Üye Hesapları', subtitle: 'bachmain.com demo talepleri ve kayıtlı kullanıcılar', singularName: 'Üye', path: '/uyeler',
    columns: [
      { key: 'fullName', label: 'Ad Soyad', sortable: true },
      { key: 'email', label: 'E-posta', sortable: true },
      { key: 'company', label: 'Firma', sortable: true },
      { key: 'phone', label: 'Telefon' },
      { key: 'source', label: 'Kaynak' },
      { key: 'status', label: 'Durum' },
      { key: 'companySize', label: 'Çalışan' },
      { key: 'createdAt', label: 'Kayıt', sortable: true },
      { key: 'lastLoginAt', label: 'Son Aktivite', sortable: true },
    ],
    formFields: [
      { name: 'fullName', label: 'Ad Soyad', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'company', label: 'Firma', type: 'text' },
    ],
  },
  { id: 'subscriptions', title: 'Abonelik ve Lisanslar', subtitle: 'Aktif abonelikleri ve lisansları yönetin', singularName: 'Abonelik', path: '/abonelikler',
    columns: [{ key: 'customer', label: 'Müşteri', sortable: true }, { key: 'plan', label: 'Plan' }, { key: 'startDate', label: 'Başlangıç', sortable: true }, { key: 'expiry', label: 'Bitiş', sortable: true }, { key: 'source', label: 'Kaynak' }, { key: 'mrr', label: 'MRR' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'customer', label: 'Müşteri', type: 'select', required: true, options: customers.map((c: typeof customers[0]) => ({ label: c.company, value: c.id })) },
      { name: 'plan', label: 'Plan', type: 'select', required: true, options: [{ label: 'Starter', value: 'starter' }, { label: 'Pro', value: 'pro' }, { label: 'Enterprise', value: 'enterprise' }] },
      { name: 'startDate', label: 'Başlangıç', type: 'date', required: true },
      { name: 'expiry', label: 'Bitiş', type: 'date', required: true },
    ],
  },
  { id: 'dealers', title: 'Bayi Yönetimi', subtitle: 'Bayi ağını yönetin', singularName: 'Bayi', path: '/bayiler',
    columns: [{ key: 'name', label: 'Bayi', sortable: true }, { key: 'city', label: 'Şehir' }, { key: 'contact', label: 'Yetkili' }, { key: 'customers', label: 'Müşteri', sortable: true }, { key: 'commission', label: 'Komisyon' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'name', label: 'Bayi Adı', type: 'text', required: true },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'contact', label: 'Yetkili', type: 'text' },
      { name: 'commission', label: 'Komisyon (%)', type: 'number' },
    ],
  },
  { id: 'accounts', title: 'Cari Hesaplar', subtitle: 'Müşteri cari hesaplarını takip edin', singularName: 'Cari Hesap', path: '/cari-hesaplar',
    columns: [{ key: 'customer', label: 'Müşteri', sortable: true }, { key: 'debit', label: 'Borç' }, { key: 'credit', label: 'Alacak' }, { key: 'balance', label: 'Bakiye', sortable: true }, { key: 'lastTransaction', label: 'Son İşlem' }],
    formFields: [{ name: 'customer', label: 'Müşteri', type: 'select', required: true, options: customers.map((c: typeof customers[0]) => ({ label: c.company, value: c.id })) }],
  },
  { id: 'payments', title: 'Tahsilatlar ve Ödemeler', subtitle: 'Tahsilat kayıtları ve web ödeme talepleri', singularName: 'Tahsilat', path: '/tahsilatlar',
    columns: [
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'company', label: 'Firma', sortable: true },
      { key: 'email', label: 'E-posta' },
      { key: 'plan', label: 'Plan' },
      { key: 'amount', label: 'Tutar', sortable: true },
      { key: 'method', label: 'Yöntem' },
      { key: 'date', label: 'Tarih', sortable: true },
      { key: 'createdAt', label: 'Oluşturma', sortable: true },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'customer', label: 'Müşteri', type: 'select', required: true, options: customers.map((c: typeof customers[0]) => ({ label: c.company, value: c.id })) },
      { name: 'amount', label: 'Tutar', type: 'number', required: true },
      { name: 'method', label: 'Ödeme Yöntemi', type: 'select', options: [{ label: 'Havale', value: 'havale' }, { label: 'EFT', value: 'eft' }, { label: 'Kredi Kartı', value: 'card' }] },
      { name: 'date', label: 'Tarih', type: 'date', required: true },
    ],
  },
  { id: 'payment-requests', title: 'Ödeme Talepleri', subtitle: 'Web / uygulama üzerinden gelen plan yükseltme talepleri', singularName: 'Talep', path: '/odeme-talepleri',
    columns: [
      { key: 'company', label: 'Firma', sortable: true },
      { key: 'email', label: 'E-posta', sortable: true },
      { key: 'phone', label: 'Telefon' },
      { key: 'plan', label: 'Plan' },
      { key: 'status', label: 'Durum' },
      { key: 'source', label: 'Kaynak' },
      { key: 'createdAt', label: 'Tarih', sortable: true },
    ],
    formFields: [
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'plan', label: 'Plan', type: 'text', required: true },
      { name: 'status', label: 'Durum', type: 'select', options: [{ label: 'Bekleyen', value: 'pending' }, { label: 'Ödendi', value: 'paid' }] },
    ],
  },
  { id: 'invoices', title: 'Faturalar', subtitle: 'Fatura yönetimi', singularName: 'Fatura', path: '/faturalar',
    columns: [{ key: 'number', label: 'Fatura No', sortable: true }, { key: 'customer', label: 'Müşteri', sortable: true }, { key: 'date', label: 'Tarih', sortable: true }, { key: 'amount', label: 'Tutar', sortable: true }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'customer', label: 'Müşteri', type: 'select', required: true, options: customers.map((c: typeof customers[0]) => ({ label: c.company, value: c.id })) },
      { name: 'amount', label: 'Tutar', type: 'number', required: true },
      { name: 'date', label: 'Tarih', type: 'date', required: true },
    ],
  },
  { id: 'packages', title: 'Paket Yönetimi', subtitle: 'Abonelik paketlerini yönetin', singularName: 'Paket', path: '/paketler',
    columns: [{ key: 'name', label: 'Paket', sortable: true }, { key: 'price', label: 'Fiyat' }, { key: 'users', label: 'Kullanıcı Limiti' }, { key: 'modules', label: 'Modül' }, { key: 'customers', label: 'Müşteri', sortable: true }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'name', label: 'Paket Adı', type: 'text', required: true },
      { name: 'price', label: 'Aylık Fiyat', type: 'number', required: true },
      { name: 'users', label: 'Kullanıcı Limiti', type: 'number' },
    ],
  },
  { id: 'support', title: 'Destek / Ticket Sistemi', subtitle: 'Müşteri destek taleplerini yönetin', singularName: 'Ticket', path: '/destek',
    columns: [{ key: 'subject', label: 'Konu', sortable: true }, { key: 'customer', label: 'Müşteri', sortable: true }, { key: 'priority', label: 'Öncelik' }, { key: 'status', label: 'Durum' }, { key: 'assignee', label: 'Atanan' }, { key: 'createdAt', label: 'Tarih', sortable: true }],
    formFields: [
      { name: 'subject', label: 'Konu', type: 'text', required: true },
      { name: 'customer', label: 'Müşteri', type: 'select', required: true, options: customers.map((c: typeof customers[0]) => ({ label: c.company, value: c.id })) },
      { name: 'priority', label: 'Öncelik', type: 'select', options: [{ label: 'Düşük', value: 'low' }, { label: 'Orta', value: 'medium' }, { label: 'Yüksek', value: 'high' }, { label: 'Kritik', value: 'critical' }] },
      { name: 'description', label: 'Açıklama', type: 'textarea', colSpan: 2 },
    ],
  },
  { id: 'live-support', title: 'Canlı Destek', subtitle: 'Aktif canlı destek oturumları', singularName: 'Oturum', path: '/canli-destek',
    columns: [{ key: 'customer', label: 'Müşteri', sortable: true }, { key: 'agent', label: 'Temsilci' }, { key: 'topic', label: 'Konu' }, { key: 'waitTime', label: 'Bekleme' }, { key: 'status', label: 'Durum' }],
    formFields: [],
  },
  { id: 'notifications', title: 'Bildirim Merkezi', subtitle: 'Platform bildirimlerini yönetin', singularName: 'Bildirim', path: '/bildirimler',
    columns: [{ key: 'title', label: 'Başlık', sortable: true }, { key: 'type', label: 'Tür' }, { key: 'sent', label: 'Tarih', sortable: true }, { key: 'recipients', label: 'Alıcı' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      { name: 'type', label: 'Tür', type: 'select', options: [{ label: 'Sistem', value: 'system' }, { label: 'Özellik', value: 'feature' }, { label: 'Bakım', value: 'maintenance' }] },
      { name: 'content', label: 'İçerik', type: 'textarea', colSpan: 2 },
    ],
  },
  { id: 'ai', title: 'AI Yönetimi', subtitle: 'Yapay zeka özelliklerini yönetin', singularName: 'AI Özelliği', path: '/ai-yonetimi',
    columns: [{ key: 'feature', label: 'Özellik', sortable: true }, { key: 'queries', label: 'Sorgu' }, { key: 'tokens', label: 'Token' }, { key: 'cost', label: 'Maliyet' }, { key: 'status', label: 'Durum' }],
    formFields: [{ name: 'feature', label: 'Özellik Adı', type: 'text', required: true }],
  },
  { id: 'analytics', title: 'Kullanım Analitikleri', subtitle: 'Platform kullanım metrikleri', singularName: 'Metrik', path: '/analitik',
    columns: [{ key: 'metric', label: 'Metrik', sortable: true }, { key: 'value', label: 'Değer' }, { key: 'change', label: 'Değişim' }, { key: 'period', label: 'Dönem' }],
    formFields: [],
  },
  { id: 'server', title: 'Sunucu İzleme', subtitle: 'Altyapı sağlık durumu', singularName: 'Sunucu', path: '/sunucu-izleme',
    columns: [{ key: 'name', label: 'Sunucu', sortable: true }, { key: 'cpu', label: 'CPU' }, { key: 'memory', label: 'Bellek' }, { key: 'disk', label: 'Disk' }, { key: 'status', label: 'Durum' }],
    formFields: [],
  },
  { id: 'updates', title: 'Güncelleme Yönetimi', subtitle: 'Platform güncellemeleri', singularName: 'Güncelleme', path: '/guncellemeler',
    columns: [{ key: 'version', label: 'Versiyon', sortable: true }, { key: 'title', label: 'Başlık' }, { key: 'releaseDate', label: 'Tarih', sortable: true }, { key: 'adoption', label: 'Adaptasyon' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'version', label: 'Versiyon', type: 'text', required: true },
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      { name: 'releaseDate', label: 'Yayın Tarihi', type: 'date' },
    ],
  },
  { id: 'security', title: 'Güvenlik Merkezi', subtitle: 'Güvenlik olayları ve politikalar', singularName: 'Olay', path: '/guvenlik',
    columns: [{ key: 'event', label: 'Olay', sortable: true }, { key: 'source', label: 'Kaynak' }, { key: 'severity', label: 'Önem' }, { key: 'date', label: 'Tarih', sortable: true }, { key: 'status', label: 'Durum' }],
    formFields: [],
  },
  { id: 'staff', title: 'Personel Yönetimi', subtitle: 'Ekip üyelerini yönetin', singularName: 'Personel', path: '/personel',
    columns: [{ key: 'name', label: 'Ad Soyad', sortable: true }, { key: 'role', label: 'Rol' }, { key: 'department', label: 'Departman' }, { key: 'email', label: 'E-posta' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'role', label: 'Rol', type: 'text', required: true },
      { name: 'department', label: 'Departman', type: 'select', options: [{ label: 'Destek', value: 'support' }, { label: 'Satış', value: 'sales' }, { label: 'Teknik', value: 'tech' }, { label: 'Finans', value: 'finance' }] },
    ],
  },
  { id: 'website', title: 'Web Sitesi Yönetimi', subtitle: 'Web sitesi sayfalarını yönetin', singularName: 'Sayfa', path: '/website',
    columns: [{ key: 'page', label: 'Sayfa', sortable: true }, { key: 'url', label: 'URL' }, { key: 'visits', label: 'Ziyaret' }, { key: 'bounce', label: 'Bounce' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'page', label: 'Sayfa Adı', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'text', required: true },
    ],
  },
  { id: 'api', title: 'API ve Entegrasyonlar', subtitle: 'API servislerini yönetin', singularName: 'API', path: '/api',
    columns: [{ key: 'name', label: 'Servis', sortable: true }, { key: 'endpoint', label: 'Endpoint' }, { key: 'calls', label: 'Çağrı/ay' }, { key: 'version', label: 'Versiyon' }, { key: 'status', label: 'Durum' }],
    formFields: [
      { name: 'name', label: 'Servis Adı', type: 'text', required: true },
      { name: 'endpoint', label: 'Endpoint', type: 'text', required: true },
    ],
  },
  { id: 'settings', title: 'Genel Ayarlar', subtitle: 'Platform yapılandırması', singularName: 'Ayar', path: '/ayarlar',
    columns: [{ key: 'key', label: 'Anahtar', sortable: true }, { key: 'value', label: 'Değer' }, { key: 'group', label: 'Grup' }, { key: 'updated', label: 'Güncelleme', sortable: true }],
    formFields: [
      { name: 'key', label: 'Anahtar', type: 'text', required: true },
      { name: 'value', label: 'Değer', type: 'text', required: true },
      { name: 'group', label: 'Grup', type: 'text' },
    ],
  },
]


export const moduleConfigs: Record<string, ModuleConfig & { rows: Record<string, unknown>[] }> = {}

for (const def of moduleDefinitions) {
  const rows = genRows(def.id)
  moduleConfigs[def.id] = {
    ...def,
    metrics: [
      { label: 'Toplam', value: String(rows.length), change: 'Kayıt', trend: 'neutral' },
      { label: 'Aktif', value: String(rows.filter(r => r.status === 'Aktif' || r.status === 'Ödendi' || r.status === 'Sağlıklı' || r.status === 'Yayında' || r.status === 'Gönderildi').length || Math.floor(rows.length * 0.7)), change: '—', trend: 'up' },
      { label: 'Bekleyen', value: String(rows.filter(r => r.status === 'Bekleyen' || r.status === 'Bekliyor' || r.status === 'Taslak' || r.status === 'Planlandı' || r.status === 'Açık').length), change: '—', trend: 'neutral' },
      { label: 'Bu Ay', value: String(Math.floor(rows.length * 0.3) || 1), change: 'Yeni', trend: 'up' },
    ],
    rows: rows as Record<string, unknown>[],
  }
}

export function getModuleByPath(path: string) {
  return Object.values(moduleConfigs).find((m) => m.path === path)
}

export function getModuleById(id: string) {
  return moduleConfigs[id]
}
