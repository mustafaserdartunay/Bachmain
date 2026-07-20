/** AC-0 Autonomous Company local projection + learning loop. */

const KEY = 'bach_autonomous_company_v1'
const EVT = 'bach:autonomous-updated'

export const AUTONOMOUS_UPDATED_EVENT = EVT

export const SUGGESTION_SEEDS = [
  {
    id: 'sug_price',
    title: 'Bu ürün grubunun fiyatını artır',
    domain: 'sales',
    riskLevel: 'medium',
    why: 'Marj medyanın altında ve talep elastikiyeti düşük görünüyor.',
    benefit: 'Brüt marj +2–4 puan potansiyeli',
    risk: 'Sipariş kaybı / rekabet tepkisi',
    alternatives: ['Kampanya ile hacim koru', 'Sadece VIP dışı artır'],
    confidence: 0.72,
    safeAuto: false,
    to: '/stok/urunler',
  },
  {
    id: 'sug_stock',
    title: 'Bu stok fazla — transfer / kampanya',
    domain: 'warehouse',
    riskLevel: 'low',
    why: 'ABC C sınıfında aşırı stok ve düşük dönüş hızı.',
    benefit: 'Bağlı nakit serbestleşmesi',
    risk: 'Stok kırığı riski düşük',
    alternatives: ['Tedarikçi iade', 'Bundle kampanya'],
    confidence: 0.81,
    safeAuto: true,
    to: '/stok',
  },
  {
    id: 'sug_risk_cust',
    title: 'Bu müşteri riskli — tahsilat sıkılaştır',
    domain: 'crm',
    riskLevel: 'high',
    why: 'Gecikme skoru ve açık bakiye eşiği aşıldı.',
    benefit: 'Tahsilat süresi ↓ · kötü alacak riski ↓',
    risk: 'İlişki gerilimi',
    alternatives: ['Kısmi peşin', 'Limit düşür'],
    confidence: 0.78,
    safeAuto: false,
    to: '/musteri-deneyimi',
  },
  {
    id: 'sug_route',
    title: 'Bu rotayı değiştir',
    domain: 'logistics',
    riskLevel: 'medium',
    why: 'Doluluk düşük ve teslim SLA riski yüksek.',
    benefit: 'Yakıt / süre tasarrufu',
    risk: 'Müşteri slot çakışması',
    alternatives: ['Sevkiyat birleştir', 'Ertele'],
    confidence: 0.69,
    safeAuto: false,
    to: '/lojistik',
  },
  {
    id: 'sug_maint',
    title: 'Bu makinenin bakım zamanı geldi',
    domain: 'production',
    riskLevel: 'high',
    why: 'Çalışma saati eşiği ve scrap trendi yükseliyor.',
    benefit: 'Plansız duruş riski ↓',
    risk: 'Planlı duruş kapasite kaybı',
    alternatives: ['Hafta sonu bakım', 'Paralel hücre'],
    confidence: 0.84,
    safeAuto: false,
    to: '/mes',
  },
]

export const SCENARIO_PRESETS = [
  { id: 'fx_up_10', title: 'Kur %10 artarsa?', summary: 'İthal maliyet ↑ · marj baskısı' },
  { id: 'new_machine', title: 'Yeni makine alınırsa?', summary: 'Kapasite ↑ · nakit çıkışı' },
  { id: 'new_shift', title: 'Yeni vardiya açılırsa?', summary: 'Çıktı ↑ · personel maliyeti ↑' },
  {
    id: 'new_warehouse',
    title: 'Yeni depo açılırsa?',
    summary: 'Hizmet seviyesi ↑ · taşıma maliyeti',
  },
]

export const OPTIMIZATION_AREAS = [
  { id: 'production_plan', label: 'Üretim Planı', to: '/uretim' },
  { id: 'warehouse_layout', label: 'Depo Yerleşimi', to: '/stok/depolar' },
  { id: 'pallet', label: 'Palet Dizilimi', to: '/lojistik' },
  { id: 'truck_fill', label: 'Tır Doluluğu', to: '/lojistik' },
  { id: 'purchasing', label: 'Satın Alma', to: '/tedarikciler' },
  { id: 'route', label: 'Rota', to: '/lojistik' },
  { id: 'pricing', label: 'Fiyatlandırma', to: '/stok/urunler' },
  { id: 'campaign', label: 'Kampanya', to: '/ai-buyume' },
]

function blank() {
  return {
    feedback: {},
    scenarioRuns: [],
    lastHealthAt: null,
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

export function ensureAutonomousSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listSuggestionsLocal() {
  const fb = read().feedback || {}
  return SUGGESTION_SEEDS.map((s) => ({
    ...s,
    status: fb[s.id]?.decision || 'open',
    feedback: fb[s.id] || null,
  })).filter((s) => s.status !== 'reject')
}

export function feedbackSuggestionLocal(id, decision, note) {
  const s = read()
  s.feedback = {
    ...(s.feedback || {}),
    [id]: { decision, note: note || '', at: new Date().toISOString() },
  }
  write(s)
  return s.feedback[id]
}

export function runScenarioLocal(scenarioId) {
  const preset = SCENARIO_PRESETS.find((p) => p.id === scenarioId)
  if (!preset) return null
  const s = read()
  const run = {
    id: `sim_${Date.now()}`,
    ...preset,
    mutatedProductionData: false,
    projected: {
      marginDeltaPct: scenarioId === 'fx_up_10' ? -3.2 : 1.4,
      capacityDeltaPct: scenarioId === 'new_machine' || scenarioId === 'new_shift' ? 12 : 0,
    },
    at: new Date().toISOString(),
  }
  s.scenarioRuns = [run, ...(s.scenarioRuns || [])].slice(0, 20)
  write(s)
  return run
}

export function listScenarioRunsLocal() {
  return read().scenarioRuns || []
}

export function buildScoresLocal(live) {
  const orders = live?.orders ?? 10
  const jobs = live?.jobs ?? 6
  const cash = live?.cash ?? 50000
  const overdue = live?.overdue ?? 1
  const finance = Math.max(40, Math.min(98, 70 + Math.round(cash / 50000) - overdue * 3))
  const operations = Math.max(40, Math.min(98, 75 - Math.max(0, jobs - 10)))
  const production = Math.max(40, Math.min(98, 72 + Math.min(10, jobs)))
  const warehouse = Math.max(45, Math.min(98, 78 - overdue))
  const logistics = Math.max(45, Math.min(98, 74))
  const customer = Math.max(40, Math.min(98, 80 - overdue * 2 + Math.min(8, orders)))
  const people = Math.max(50, Math.min(98, 82 - overdue))
  const overall = Math.round(
    (finance + operations + production + warehouse + logistics + customer + people) / 7,
  )
  return { overall, finance, operations, production, warehouse, logistics, customer, people }
}

export function systemHealthLocal() {
  const checks = [
    'API',
    'Database',
    'Queue',
    'AI Gateway',
    'Mail',
    'WhatsApp',
    'SMS',
    'Google Maps',
    'Yedekleme',
    'Disk',
    'CPU',
    'RAM',
  ].map((label, i) => ({
    id: label.toLowerCase().replace(/\s/g, '_'),
    label,
    status: i === 7 ? 'degraded' : 'ok',
  }))
  return { intervalMinutes: 5, checkedAt: new Date().toISOString(), checks }
}

export function risksLocal() {
  return [
    { id: 'stockout', label: 'Stok Tükenmesi', severity: 'medium', probability: 0.35 },
    { id: 'delivery_delay', label: 'Teslimat Gecikmesi', severity: 'high', probability: 0.45 },
    { id: 'cash_gap', label: 'Nakit Problemi', severity: 'medium', probability: 0.28 },
    { id: 'machine_fail', label: 'Makine Arızası', severity: 'high', probability: 0.22 },
    { id: 'staff_load', label: 'Personel Yoğunluğu', severity: 'low', probability: 0.31 },
    { id: 'scrap_up', label: 'Fire Artışı', severity: 'medium', probability: 0.27 },
    { id: 'churn', label: 'Müşteri Kaybı', severity: 'high', probability: 0.33 },
    { id: 'supply', label: 'Tedarik Sorunu', severity: 'medium', probability: 0.29 },
  ]
}

export function morningReportLocal() {
  return {
    priorities: ['Kritik stok', 'Geciken sevkiyat', 'Açık teklif'],
    risks: ['Teslimat gecikmesi', 'Makine bakım', 'Tahsilat riski'],
    opportunities: ['VIP teklif', 'Kampanya SKU', 'Kapasite boşluğu'],
  }
}

export function eveningReportLocal() {
  return {
    completed: ['Health check', 'Risk tarama', 'Öneri üretimi'],
    pending: ['Yüksek risk onayları'],
    aiSuccess: 'Düşük risk safe-auto adayları işaretlendi',
  }
}
