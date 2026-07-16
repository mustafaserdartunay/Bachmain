/** BachMain Process Workspace 2.0 — module stage catalogs */

export const PROCESS_VIEWS = [
  { id: 'list', label: 'Liste', icon: 'list' },
  { id: 'kanban', label: 'Kanban', icon: 'kanban' },
  { id: 'calendar', label: 'Takvim', icon: 'calendar' },
  { id: 'gantt', label: 'Gantt', icon: 'gantt' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'card', label: 'Kart', icon: 'card' },
]

export const MODULE_STAGE_CATALOGS = {
  tasks: {
    id: 'tasks',
    label: 'Görevler',
    stages: [
      { id: 'todo', label: 'Yapılacak' },
      { id: 'today', label: 'Bugün' },
      { id: 'in_progress', label: 'Devam Ediyor' },
      { id: 'waiting', label: 'Bekliyor' },
      { id: 'review', label: 'Kontrol' },
      { id: 'done', label: 'Tamamlandı' },
      { id: 'cancelled', label: 'İptal' },
    ],
  },
  notes: {
    id: 'notes',
    label: 'Not Defteri',
    stages: [
      { id: 'ideas', label: 'Fikirler' },
      { id: 'meetings', label: 'Toplantılar' },
      { id: 'phone', label: 'Telefon' },
      { id: 'customer', label: 'Müşteri' },
      { id: 'production', label: 'Üretim' },
      { id: 'sales', label: 'Satış' },
      { id: 'accounting', label: 'Muhasebe' },
      { id: 'archive', label: 'Arşiv' },
    ],
  },
  appointments: {
    id: 'appointments',
    label: 'Randevular',
    stages: [
      { id: 'planned', label: 'Planlandı' },
      { id: 'upcoming', label: 'Yaklaşıyor' },
      { id: 'today', label: 'Bugün' },
      { id: 'done', label: 'Tamamlandı' },
      { id: 'postponed', label: 'Ertelendi' },
      { id: 'cancelled', label: 'İptal' },
    ],
  },
  crm: {
    id: 'crm',
    label: 'CRM',
    stages: [
      { id: 'lead', label: 'Lead' },
      { id: 'first_meeting', label: 'İlk Görüşme' },
      { id: 'quote', label: 'Teklif' },
      { id: 'follow_up', label: 'Takip' },
      { id: 'order', label: 'Sipariş' },
      { id: 'won', label: 'Kazanıldı' },
      { id: 'lost', label: 'Kaybedildi' },
    ],
  },
  quotes: {
    id: 'quotes',
    label: 'Teklifler',
    stages: [
      { id: 'draft', label: 'Taslak' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'sent', label: 'Gönderildi' },
      { id: 'revise', label: 'Revize' },
      { id: 'approved', label: 'Onaylandı' },
      { id: 'converted', label: 'Siparişe Dönüştü' },
      { id: 'cancelled', label: 'İptal' },
    ],
  },
  orders: {
    id: 'orders',
    label: 'Siparişler',
    stages: [
      { id: 'new', label: 'Yeni' },
      { id: 'approved', label: 'Onaylandı' },
      { id: 'production', label: 'Üretimde' },
      { id: 'quality', label: 'Kalite' },
      { id: 'packing', label: 'Paketleme' },
      { id: 'warehouse', label: 'Depoda' },
      { id: 'shipping', label: 'Sevkiyat' },
      { id: 'delivered', label: 'Teslim' },
      { id: 'done', label: 'Tamamlandı' },
    ],
  },
  production: {
    id: 'production',
    label: 'Üretim',
    stages: [
      { id: 'planning', label: 'Planlama' },
      { id: 'cutting', label: 'Kesim' },
      { id: 'print', label: 'Baskı' },
      { id: 'assembly', label: 'Montaj' },
      { id: 'quality', label: 'Kalite' },
      { id: 'packing', label: 'Paketleme' },
      { id: 'done', label: 'Tamamlandı' },
    ],
  },
  warehouse: {
    id: 'warehouse',
    label: 'Depo',
    stages: [
      { id: 'receiving', label: 'Mal Kabul' },
      { id: 'placed', label: 'Yerleştirildi' },
      { id: 'picking', label: 'Toplanıyor' },
      { id: 'preparing', label: 'Hazırlanıyor' },
      { id: 'shipping', label: 'Sevkiyat' },
      { id: 'done', label: 'Tamamlandı' },
    ],
  },
  logistics: {
    id: 'logistics',
    label: 'Lojistik',
    stages: [
      { id: 'ready', label: 'Hazır' },
      { id: 'loaded', label: 'Yüklendi' },
      { id: 'on_road', label: 'Yolda' },
      { id: 'delivery', label: 'Dağıtım' },
      { id: 'delivered', label: 'Teslim' },
      { id: 'return', label: 'İade' },
    ],
  },
  field_sales: {
    id: 'field_sales',
    label: 'Saha Satış',
    stages: [
      { id: 'planned', label: 'Planlandı' },
      { id: 'on_road', label: 'Yolda' },
      { id: 'at_customer', label: 'Müşteride' },
      { id: 'quote', label: 'Teklif' },
      { id: 'order', label: 'Sipariş' },
      { id: 'done', label: 'Tamamlandı' },
    ],
  },
  projects: {
    id: 'projects',
    label: 'Proje',
    stages: [
      { id: 'planning', label: 'Planlama' },
      { id: 'design', label: 'Tasarım' },
      { id: 'sample', label: 'Numune' },
      { id: 'revision', label: 'Revizyon' },
      { id: 'approved', label: 'Onay' },
      { id: 'production', label: 'Üretim' },
      { id: 'packing', label: 'Paketleme' },
      { id: 'delivery', label: 'Teslim' },
      { id: 'archive', label: 'Arşiv' },
    ],
  },
  tickets: {
    id: 'tickets',
    label: 'Ticket',
    stages: [
      { id: 'new', label: 'Yeni' },
      { id: 'assigned', label: 'Atandı' },
      { id: 'in_progress', label: 'İşlemde' },
      { id: 'waiting_customer', label: 'Müşteri Bekliyor' },
      { id: 'resolved', label: 'Çözüldü' },
      { id: 'closed', label: 'Kapandı' },
    ],
  },
  hr: {
    id: 'hr',
    label: 'İnsan Kaynakları',
    stages: [
      { id: 'application', label: 'Başvuru' },
      { id: 'interview', label: 'Mülakat' },
      { id: 'offer', label: 'Teklif' },
      { id: 'approved', label: 'Onaylandı' },
      { id: 'started', label: 'Başladı' },
      { id: 'inactive', label: 'Pasif' },
    ],
  },
  purchasing: {
    id: 'purchasing',
    label: 'Satın Alma',
    stages: [
      { id: 'request', label: 'Talep' },
      { id: 'approval', label: 'Onay' },
      { id: 'ordered', label: 'Sipariş Verildi' },
      { id: 'receiving', label: 'Mal Kabul' },
      { id: 'done', label: 'Tamamlandı' },
      { id: 'cancelled', label: 'İptal' },
    ],
  },
}

export function getModuleCatalog(moduleId) {
  return MODULE_STAGE_CATALOGS[moduleId] || MODULE_STAGE_CATALOGS.crm
}
