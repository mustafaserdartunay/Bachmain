/** Uygulama modülleri — davet izin paneli ve menü/route kısıtları. */

export const MODULE_LEVELS = {
  none: { value: 'none', label: 'Kapalı', hint: 'Menüde görünmez' },
  view: { value: 'view', label: 'Sadece görür', hint: 'Açar, değişiklik yapamaz' },
  edit: { value: 'edit', label: 'Değişiklik yapar', hint: 'Kayıt, silme, güncelleme' },
}

export const APP_MODULES = [
  { code: 'dashboard_basic', label: 'Güncel Durum', group: 'Genel' },
  { code: 'crm', label: 'Satışlar / Müşteriler', group: 'ERP' },
  { code: 'quotes', label: 'Teklifler', group: 'ERP' },
  { code: 'orders', label: 'Siparişler', group: 'ERP' },
  { code: 'sales', label: 'Satış Faturaları', group: 'ERP' },
  { code: 'production', label: 'Üretim', group: 'ERP' },
  { code: 'mes', label: 'MES / Üretim Sahası', group: 'ERP' },
  { code: 'warehouse', label: 'Depolar', group: 'ERP' },
  { code: 'stock', label: 'Stok', group: 'ERP' },
  { code: 'expenses', label: 'Giderler', group: 'ERP' },
  { code: 'einvoice', label: 'E-Belgeler', group: 'ERP' },
  { code: 'finance', label: 'Nakit / Finans', group: 'ERP' },
  { code: 'markets', label: 'Piyasa', group: 'ERP' },
  { code: 'projects', label: 'Projeler', group: 'ERP' },
  { code: 'logistics', label: 'Lojistik', group: 'ERP' },
  { code: 'tasks', label: 'Ajanda / Görevler', group: 'CRM' },
  { code: 'notes', label: 'Not Defteri', group: 'CRM' },
  { code: 'appointments', label: 'Randevular', group: 'CRM' },
  { code: 'calendar', label: 'Takvim', group: 'CRM' },
  { code: 'whatsapp', label: 'Mesaj Merkezi', group: 'CRM' },
  { code: 'field_sales', label: 'Saha Satış', group: 'Saha' },
  { code: 'courier', label: 'Kurye', group: 'Saha' },
  { code: 'pos', label: 'POS', group: 'Ticaret' },
  { code: 'b2b', label: 'B2B Portal', group: 'Ticaret' },
  { code: 'web', label: 'Web Studio', group: 'Dijital' },
  { code: 'hr', label: 'İnsan Kaynakları', group: 'İK' },
  { code: 'ai_growth', label: 'AI / AIOS', group: 'AI' },
  { code: 'reporting', label: 'Raporlar / Analitik', group: 'Analiz' },
  { code: 'multi_company', label: 'Kurumsal Yapı', group: 'Ayarlar' },
  { code: 'settings', label: 'Firma Ayarları', group: 'Ayarlar' },
]

export const APP_MODULE_CODES = APP_MODULES.map((row) => row.code)

export const PATH_MODULE_PREFIXES = [
  ['/ayarlar/kullanicilar', 'team_users'],
  ['/ayarlar/kurumsal-yapi', 'multi_company'],
  ['/ayarlar', 'settings'],
  ['/musteri-deneyimi', 'crm'],
  ['/musteriler', 'crm'],
  ['/tedarikciler', 'expenses'],
  ['/teklifler', 'quotes'],
  ['/siparisler', 'orders'],
  ['/satis-faturalari', 'sales'],
  ['/satis', 'sales'],
  ['/uretim', 'production'],
  ['/mes', 'mes'],
  ['/stok/depolar', 'warehouse'],
  ['/depo', 'warehouse'],
  ['/stok', 'stock'],
  ['/giderler/gelen-e-faturalar', 'einvoice'],
  ['/giderler', 'expenses'],
  ['/e-belgeler', 'einvoice'],
  ['/nakit', 'finance'],
  ['/kasa', 'finance'],
  ['/finans', 'finance'],
  ['/piyasa', 'markets'],
  ['/projeler', 'projects'],
  ['/lojistik', 'logistics'],
  ['/sevkiyat', 'logistics'],
  ['/teslim-edilenler', 'logistics'],
  ['/crm/notlar', 'notes'],
  ['/crm/randevular', 'appointments'],
  ['/crm/gorevler', 'tasks'],
  ['/crm', 'tasks'],
  ['/gorevler', 'tasks'],
  ['/takvim', 'calendar'],
  ['/randevu', 'appointments'],
  ['/notlar', 'notes'],
  ['/mesajlar', 'whatsapp'],
  ['/whatsapp', 'whatsapp'],
  ['/shopping', 'pos'],
  ['/pos', 'pos'],
  ['/b2b', 'b2b'],
  ['/saha-satis', 'field_sales'],
  ['/musteri-bulucu', 'field_sales'],
  ['/kurye', 'courier'],
  ['/ik', 'hr'],
  ['/ai-buyume', 'ai_growth'],
  ['/aios', 'ai_growth'],
  ['/ai-', 'ai_growth'],
  ['/analitik', 'reporting'],
  ['/raporlar', 'reporting'],
  ['/web', 'web'],
  ['/otomasyon', 'tasks'],
  ['/', 'dashboard_basic'],
]

export function emptyModulePermissions(defaultLevel = 'none') {
  const out = {}
  for (const row of APP_MODULES) out[row.code] = defaultLevel
  return out
}

export function groupedAppModules() {
  const groups = []
  const index = new Map()
  for (const row of APP_MODULES) {
    if (!index.has(row.group)) {
      index.set(row.group, groups.length)
      groups.push({ group: row.group, modules: [] })
    }
    groups[index.get(row.group)].modules.push(row)
  }
  return groups
}
