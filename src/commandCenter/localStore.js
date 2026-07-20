/** CC-0 AI Command Center — personal workspace prefs + seeded alerts/recs. */

const KEY = 'bach_command_center_v1'
const EVT = 'bach:command-center-updated'

export const COMMAND_CENTER_UPDATED_EVENT = EVT

export const PERSONAS = [
  { id: 'ceo', label: 'CEO / Executive' },
  { id: 'sales', label: 'Satış' },
  { id: 'production', label: 'Üretim' },
  { id: 'finance', label: 'Muhasebe / Finans' },
  { id: 'warehouse', label: 'Depo' },
]

export const QUICK_ACTIONS = [
  { id: 'quote', label: 'Yeni Teklif', to: '/teklifler' },
  { id: 'order', label: 'Yeni Sipariş', to: '/siparisler' },
  { id: 'customer', label: 'Yeni Müşteri', to: '/musteriler' },
  { id: 'task', label: 'Yeni Görev', to: '/gorevler' },
  { id: 'invoice', label: 'Yeni Fatura', to: '/satis-faturalari' },
  { id: 'shipment', label: 'Yeni Sevkiyat', to: '/lojistik' },
  { id: 'production', label: 'Yeni Üretim', to: '/uretim' },
  { id: 'project', label: 'Yeni Proje', to: '/projeler' },
  { id: 'purchase', label: 'Yeni Satın Alma', to: '/tedarikciler' },
]

export const TODAY_LANES = [
  { id: 'priorities', label: 'Öncelikler' },
  { id: 'deliveries', label: 'Teslimatlar' },
  { id: 'production', label: 'Üretimler' },
  { id: 'collections', label: 'Tahsilatlar' },
  { id: 'meetings', label: 'Toplantılar' },
  { id: 'tasks', label: 'Görevler' },
  { id: 'routes', label: 'Rotalar' },
  { id: 'shipments', label: 'Sevkiyatlar' },
  { id: 'risks', label: 'Riskler' },
]

function blank() {
  return {
    persona: 'ceo',
    dismissedAlertIds: [],
    recommendations: [
      { id: 'r1', text: 'Ali firmasını bugün ara.', to: '/musteriler', persona: ['sales', 'ceo'] },
      {
        id: 'r2',
        text: 'Açık teklifleri gözden geçir ve gönder.',
        to: '/teklifler',
        persona: ['sales', 'ceo'],
      },
      { id: 'r3', text: 'Geciken üretimi öne çek.', to: '/uretim', persona: ['production', 'ceo'] },
      {
        id: 'r4',
        text: 'Sevkiyatları birleştirme fırsatını kontrol et.',
        to: '/lojistik',
        persona: ['warehouse', 'ceo'],
      },
      {
        id: 'r5',
        text: 'Tahsilatı geciken müşterileri ara.',
        to: '/finans',
        persona: ['finance', 'ceo'],
      },
      {
        id: 'r6',
        text: 'Kritik stok SKU’larını kampanyaya alma.',
        to: '/stok',
        persona: ['warehouse', 'sales', 'ceo'],
      },
    ],
    insights: {
      developments: [
        'Açık sipariş hacmi izleniyor',
        'Teklif pipeline aktif',
        'Üretim kuyruğu güncellendi',
        'Nakit pozisyonu tazelendi',
        'CRM görevleri senkron',
        'Sevkiyat planı hazır',
        'Kritik stok uyarıları üretildi',
        'Onay kuyruğu kontrol edildi',
        'AIOS ajanları hazır',
        'Günlük risk taraması tamamlandı',
      ],
      risks: [
        'Gecikebilecek teslimatlar',
        'Kritik stok seviyeleri',
        'Tahsilat gecikmeleri',
        'Üretimde bekleyen işler',
        'Onaysız riskli AI işlemleri',
      ],
      opportunities: [
        'Yüksek tutarlı açık teklifler',
        'Sevkiyat birleştirme',
        'Kampanya adayı ürünler',
        'VIP müşteri takip',
        'Kapasite boşluğu değerlendirme',
      ],
    },
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function ensureCommandCenterSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function getPersonaLocal() {
  return read().persona || 'ceo'
}

export function setPersonaLocal(persona) {
  const s = read()
  s.persona = persona
  write(s)
  return s.persona
}

export function listRecommendationsLocal(persona) {
  const p = persona || read().persona
  return read().recommendations.filter((r) => !r.persona || r.persona.includes(p))
}

export function getInsightsLocal() {
  return read().insights
}

export function listDismissedAlertsLocal() {
  return new Set(read().dismissedAlertIds || [])
}

export function dismissAlertLocal(id) {
  const s = read()
  s.dismissedAlertIds = [...new Set([...(s.dismissedAlertIds || []), id])]
  write(s)
}
