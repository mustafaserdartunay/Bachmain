import type { ModuleConfig } from '@/types'

function genRows(moduleId: string) {
  // Rows are loaded from the live API; keep empty placeholders for config bootstrap only.
  void moduleId
  return [] as Record<string, unknown>[]
}

const moduleDefinitions: Omit<ModuleConfig, 'metrics'>[] = [
  {
    id: 'customers',
    title: 'Müşteri Yönetimi',
    subtitle: 'Web üyelikleri ve tüm müşteri hesapları',
    singularName: 'Müşteri',
    path: '/musteriler',
    columns: [
      { key: 'company', label: 'Firma', sortable: true },
      { key: 'contact', label: 'Yetkili', sortable: true },
      { key: 'email', label: 'E-posta', sortable: true },
      { key: 'gsm', label: 'GSM' },
      { key: 'taxNo', label: 'Vergi No' },
      { key: 'city', label: 'Şehir' },
      { key: 'plan', label: 'Plan' },
      { key: 'mrr', label: 'MRR' },
      { key: 'status', label: 'Durum' },
      { key: 'source', label: 'Kaynak' },
      { key: 'licenseExpiry', label: 'Lisans Bitiş', sortable: true },
    ],
    formFields: [
      { name: 'company', label: 'Firma Adı', type: 'text', required: true },
      { name: 'contact', label: 'Yetkili Kişi', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'phone', label: 'Telefon', type: 'tel' },
      { name: 'gsm', label: 'GSM', type: 'tel' },
      { name: 'taxNo', label: 'Vergi No', type: 'text' },
      { name: 'taxOffice', label: 'Vergi Dairesi', type: 'text' },
      { name: 'address', label: 'Adres', type: 'text' },
      { name: 'city', label: 'Şehir', type: 'text' },
      {
        name: 'plan',
        label: 'Plan',
        type: 'select',
        options: [
          { label: 'Starter', value: 'starter' },
          { label: 'Pro', value: 'pro' },
          { label: 'Enterprise', value: 'enterprise' },
        ],
      },
      {
        name: 'status',
        label: 'Durum',
        type: 'select',
        options: [
          { label: 'Aktif', value: 'active' },
          { label: 'Deneme', value: 'trial' },
          { label: 'Askıda', value: 'suspended' },
        ],
      },
    ],
  },
  {
    id: 'memberships',
    title: 'Üye Hesapları',
    subtitle: 'bachmain.com demo talepleri ve kayıtlı kullanıcılar',
    singularName: 'Üye',
    path: '/uyeler',
    columns: [
      { key: 'fullName', label: 'Ad Soyad', sortable: true },
      { key: 'email', label: 'E-posta', sortable: true },
      { key: 'company', label: 'Firma', sortable: true },
      { key: 'taxNo', label: 'Vergi No' },
      { key: 'gsm', label: 'GSM' },
      { key: 'city', label: 'Şehir' },
      { key: 'source', label: 'Kaynak' },
      { key: 'status', label: 'Durum' },
      { key: 'licenseExpiry', label: 'Bitiş', sortable: true },
      { key: 'plan', label: 'Plan' },
      { key: 'companySize', label: 'Çalışan' },
      { key: 'createdAt', label: 'Kayıt', sortable: true },
      { key: 'lastLoginAt', label: 'Son Aktivite', sortable: true },
    ],
    formFields: [
      { name: 'fullName', label: 'Ad Soyad', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'company', label: 'Firma', type: 'text' },
      { name: 'taxNo', label: 'Vergi No', type: 'text' },
      { name: 'gsm', label: 'GSM', type: 'tel' },
      { name: 'address', label: 'Adres', type: 'text' },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Abonelik ve Lisanslar',
    subtitle: 'Aktif abonelikleri ve lisansları yönetin',
    singularName: 'Abonelik',
    path: '/abonelikler',
    columns: [
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'plan', label: 'Plan' },
      { key: 'startDate', label: 'Başlangıç', sortable: true },
      { key: 'expiry', label: 'Bitiş', sortable: true },
      { key: 'source', label: 'Kaynak' },
      { key: 'mrr', label: 'MRR' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      {
        name: 'customer',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [],
      },
      {
        name: 'plan',
        label: 'Plan',
        type: 'select',
        required: true,
        options: [
          { label: 'Starter', value: 'starter' },
          { label: 'Pro', value: 'pro' },
          { label: 'Enterprise', value: 'enterprise' },
        ],
      },
      { name: 'startDate', label: 'Başlangıç', type: 'date', required: true },
      { name: 'expiry', label: 'Bitiş', type: 'date', required: true },
    ],
  },
  {
    id: 'dealers',
    title: 'Bayi Yönetimi',
    subtitle: 'Bayi ağını yönetin',
    singularName: 'Bayi',
    path: '/bayiler',
    columns: [
      { key: 'name', label: 'Bayi', sortable: true },
      { key: 'city', label: 'Şehir' },
      { key: 'contact', label: 'Yetkili' },
      { key: 'customers', label: 'Müşteri', sortable: true },
      { key: 'commission', label: 'Komisyon' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'name', label: 'Bayi Adı', type: 'text', required: true },
      { name: 'city', label: 'Şehir', type: 'text' },
      { name: 'contact', label: 'Yetkili', type: 'text' },
      { name: 'commission', label: 'Komisyon (%)', type: 'number' },
    ],
  },
  {
    id: 'accounts',
    title: 'Cari Hesaplar',
    subtitle: 'Müşteri cari hesaplarını takip edin',
    singularName: 'Cari Hesap',
    path: '/cari-hesaplar',
    columns: [
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'debit', label: 'Borç' },
      { key: 'credit', label: 'Alacak' },
      { key: 'balance', label: 'Bakiye', sortable: true },
      { key: 'lastTransaction', label: 'Son İşlem' },
    ],
    formFields: [
      {
        name: 'customer',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Tahsilatlar ve Ödemeler',
    subtitle: 'Tahsilat kayıtları ve web ödeme talepleri',
    singularName: 'Tahsilat',
    path: '/tahsilatlar',
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
      {
        name: 'customer',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [],
      },
      { name: 'amount', label: 'Tutar', type: 'number', required: true },
      {
        name: 'method',
        label: 'Ödeme Yöntemi',
        type: 'select',
        options: [
          { label: 'Havale', value: 'havale' },
          { label: 'EFT', value: 'eft' },
          { label: 'Kredi Kartı', value: 'card' },
        ],
      },
      { name: 'date', label: 'Tarih', type: 'date', required: true },
    ],
  },
  {
    id: 'payment-requests',
    title: 'Ödeme Talepleri',
    subtitle: 'Web / uygulama üzerinden gelen plan yükseltme talepleri',
    singularName: 'Talep',
    path: '/odeme-talepleri',
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
      {
        name: 'status',
        label: 'Durum',
        type: 'select',
        options: [
          { label: 'Bekleyen', value: 'pending' },
          { label: 'Ödendi', value: 'paid' },
        ],
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Faturalar',
    subtitle: 'Fatura yönetimi',
    singularName: 'Fatura',
    path: '/faturalar',
    columns: [
      { key: 'number', label: 'Fatura No', sortable: true },
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'date', label: 'Tarih', sortable: true },
      { key: 'amount', label: 'Tutar', sortable: true },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      {
        name: 'customer',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [],
      },
      { name: 'amount', label: 'Tutar', type: 'number', required: true },
      { name: 'date', label: 'Tarih', type: 'date', required: true },
    ],
  },
  {
    id: 'packages',
    title: 'Paket Yönetimi',
    subtitle: 'Abonelik paketlerini yönetin',
    singularName: 'Paket',
    path: '/paketler',
    columns: [
      { key: 'name', label: 'Paket', sortable: true },
      { key: 'price', label: 'Fiyat' },
      { key: 'users', label: 'Kullanıcı Limiti' },
      { key: 'modules', label: 'Modül' },
      { key: 'customers', label: 'Müşteri', sortable: true },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'name', label: 'Paket Adı', type: 'text', required: true },
      { name: 'price', label: 'Aylık Fiyat', type: 'number', required: true },
      { name: 'users', label: 'Kullanıcı Limiti', type: 'number' },
    ],
  },
  {
    id: 'support',
    title: 'Destek / Ticket Sistemi',
    subtitle: 'Müşteri destek taleplerini yönetin',
    singularName: 'Ticket',
    path: '/destek',
    columns: [
      { key: 'subject', label: 'Konu', sortable: true },
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'category', label: 'Kategori' },
      { key: 'priority', label: 'Öncelik' },
      { key: 'status', label: 'Durum' },
      { key: 'assignee', label: 'Atanan' },
      { key: 'createdAt', label: 'Tarih', sortable: true },
    ],
    formFields: [
      { name: 'subject', label: 'Konu', type: 'text', required: true },
      {
        name: 'customer',
        label: 'Müşteri',
        type: 'select',
        required: true,
        options: [],
      },
      {
        name: 'priority',
        label: 'Öncelik',
        type: 'select',
        options: [
          { label: 'Düşük', value: 'low' },
          { label: 'Orta', value: 'medium' },
          { label: 'Yüksek', value: 'high' },
          { label: 'Kritik', value: 'critical' },
        ],
      },
      { name: 'description', label: 'Açıklama', type: 'textarea', colSpan: 2 },
    ],
  },
  {
    id: 'live-support',
    title: 'Canlı Destek',
    subtitle: 'Aktif canlı destek oturumları',
    singularName: 'Oturum',
    path: '/canli-destek',
    columns: [
      { key: 'customer', label: 'Müşteri', sortable: true },
      { key: 'agent', label: 'Temsilci' },
      { key: 'topic', label: 'Konu' },
      { key: 'waitTime', label: 'Bekleme' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [],
  },
  {
    id: 'notifications',
    title: 'Bildirim Merkezi',
    subtitle: 'Platform bildirimlerini yönetin',
    singularName: 'Bildirim',
    path: '/bildirimler',
    columns: [
      { key: 'title', label: 'Başlık', sortable: true },
      { key: 'type', label: 'Tür' },
      { key: 'sent', label: 'Tarih', sortable: true },
      { key: 'recipients', label: 'Alıcı' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      {
        name: 'type',
        label: 'Tür',
        type: 'select',
        options: [
          { label: 'Sistem', value: 'system' },
          { label: 'Özellik', value: 'feature' },
          { label: 'Bakım', value: 'maintenance' },
        ],
      },
      { name: 'content', label: 'İçerik', type: 'textarea', colSpan: 2 },
    ],
  },
  {
    id: 'ai',
    title: 'AI Yönetimi',
    subtitle: 'Yapay zeka özelliklerini yönetin',
    singularName: 'AI Özelliği',
    path: '/ai-yonetimi',
    columns: [
      { key: 'feature', label: 'Özellik', sortable: true },
      { key: 'queries', label: 'Sorgu' },
      { key: 'tokens', label: 'Token' },
      { key: 'cost', label: 'Maliyet' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [{ name: 'feature', label: 'Özellik Adı', type: 'text', required: true }],
  },
  {
    id: 'analytics',
    title: 'Kullanım Analitikleri',
    subtitle: 'Platform kullanım metrikleri',
    singularName: 'Metrik',
    path: '/analitik',
    columns: [
      { key: 'metric', label: 'Metrik', sortable: true },
      { key: 'value', label: 'Değer' },
      { key: 'change', label: 'Değişim' },
      { key: 'period', label: 'Dönem' },
    ],
    formFields: [],
  },
  {
    id: 'server',
    title: 'Sunucu İzleme',
    subtitle: 'Altyapı sağlık durumu',
    singularName: 'Sunucu',
    path: '/sunucu-izleme',
    columns: [
      { key: 'name', label: 'Sunucu', sortable: true },
      { key: 'cpu', label: 'CPU' },
      { key: 'memory', label: 'Bellek' },
      { key: 'disk', label: 'Disk' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [],
  },
  {
    id: 'updates',
    title: 'Güncelleme Yönetimi',
    subtitle: 'Platform güncellemeleri',
    singularName: 'Güncelleme',
    path: '/guncellemeler',
    columns: [
      { key: 'version', label: 'Versiyon', sortable: true },
      { key: 'title', label: 'Başlık' },
      { key: 'releaseDate', label: 'Tarih', sortable: true },
      { key: 'adoption', label: 'Adaptasyon' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'version', label: 'Versiyon', type: 'text', required: true },
      { name: 'title', label: 'Başlık', type: 'text', required: true },
      { name: 'releaseDate', label: 'Yayın Tarihi', type: 'date' },
    ],
  },
  {
    id: 'security',
    title: 'Güvenlik Merkezi',
    subtitle: 'Güvenlik olayları ve politikalar',
    singularName: 'Olay',
    path: '/guvenlik',
    columns: [
      { key: 'event', label: 'Olay', sortable: true },
      { key: 'source', label: 'Kaynak' },
      { key: 'severity', label: 'Önem' },
      { key: 'date', label: 'Tarih', sortable: true },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [],
  },
  {
    id: 'staff',
    title: 'Personel Yönetimi',
    subtitle: 'Ekip üyelerini yönetin',
    singularName: 'Personel',
    path: '/personel',
    columns: [
      { key: 'name', label: 'Ad Soyad', sortable: true },
      { key: 'role', label: 'Rol' },
      { key: 'department', label: 'Departman' },
      { key: 'email', label: 'E-posta' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'name', label: 'Ad Soyad', type: 'text', required: true },
      { name: 'email', label: 'E-posta', type: 'email', required: true },
      { name: 'role', label: 'Rol', type: 'text', required: true },
      {
        name: 'department',
        label: 'Departman',
        type: 'select',
        options: [
          { label: 'Destek', value: 'support' },
          { label: 'Satış', value: 'sales' },
          { label: 'Teknik', value: 'tech' },
          { label: 'Finans', value: 'finance' },
        ],
      },
    ],
  },
  {
    id: 'website',
    title: 'Web Sitesi Yönetimi',
    subtitle: 'Web sitesi sayfalarını yönetin',
    singularName: 'Sayfa',
    path: '/website',
    columns: [
      { key: 'page', label: 'Sayfa', sortable: true },
      { key: 'url', label: 'URL' },
      { key: 'visits', label: 'Ziyaret' },
      { key: 'bounce', label: 'Bounce' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'page', label: 'Sayfa Adı', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'text', required: true },
    ],
  },
  {
    id: 'api',
    title: 'API ve Entegrasyonlar',
    subtitle: 'API servislerini yönetin',
    singularName: 'API',
    path: '/api',
    columns: [
      { key: 'name', label: 'Servis', sortable: true },
      { key: 'endpoint', label: 'Endpoint' },
      { key: 'calls', label: 'Çağrı/ay' },
      { key: 'version', label: 'Versiyon' },
      { key: 'status', label: 'Durum' },
    ],
    formFields: [
      { name: 'name', label: 'Servis Adı', type: 'text', required: true },
      { name: 'endpoint', label: 'Endpoint', type: 'text', required: true },
    ],
  },
  {
    id: 'settings',
    title: 'Genel Ayarlar',
    subtitle: 'Platform yapılandırması',
    singularName: 'Ayar',
    path: '/ayarlar',
    columns: [
      { key: 'key', label: 'Anahtar', sortable: true },
      { key: 'value', label: 'Değer' },
      { key: 'group', label: 'Grup' },
      { key: 'updated', label: 'Güncelleme', sortable: true },
    ],
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
      {
        label: 'Aktif',
        value: String(
          rows.filter(
            (r) =>
              r.status === 'Aktif' ||
              r.status === 'Ödendi' ||
              r.status === 'Sağlıklı' ||
              r.status === 'Yayında' ||
              r.status === 'Gönderildi',
          ).length,
        ),
        change: '—',
        trend: 'neutral',
      },
      {
        label: 'Bekleyen',
        value: String(
          rows.filter(
            (r) =>
              r.status === 'Bekleyen' ||
              r.status === 'Bekliyor' ||
              r.status === 'Taslak' ||
              r.status === 'Planlandı' ||
              r.status === 'Açık',
          ).length,
        ),
        change: '—',
        trend: 'neutral',
      },
      {
        label: 'Bu Ay',
        value: '0',
        change: 'Yeni',
        trend: 'neutral',
      },
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
