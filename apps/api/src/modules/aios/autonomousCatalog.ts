/** AI Autonomous Company catalogs — AC-0 foundation. */

export const MONITOR_DOMAINS = [
  'sales',
  'crm',
  'finance',
  'production',
  'warehouse',
  'logistics',
  'purchasing',
  'hr',
  'support',
  'quality',
  'analytics',
] as const

export const SYSTEM_HEALTH_CHECKS = [
  { id: 'api', label: 'API' },
  { id: 'database', label: 'Database' },
  { id: 'queue', label: 'Queue' },
  { id: 'ai_gateway', label: 'AI Gateway' },
  { id: 'mail', label: 'Mail' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'sms', label: 'SMS' },
  { id: 'maps', label: 'Google Maps' },
  { id: 'backup', label: 'Yedekleme' },
  { id: 'disk', label: 'Disk' },
  { id: 'cpu', label: 'CPU' },
  { id: 'ram', label: 'RAM' },
] as const

export const RISK_CATALOG = [
  { id: 'stockout', label: 'Stok Tükenmesi', domain: 'warehouse' },
  { id: 'delivery_delay', label: 'Teslimat Gecikmesi', domain: 'logistics' },
  { id: 'cash_gap', label: 'Nakit Problemi', domain: 'finance' },
  { id: 'machine_fail', label: 'Makine Arızası', domain: 'production' },
  { id: 'staff_load', label: 'Personel Yoğunluğu', domain: 'hr' },
  { id: 'scrap_up', label: 'Fire Artışı', domain: 'quality' },
  { id: 'churn', label: 'Müşteri Kaybı', domain: 'crm' },
  { id: 'supply', label: 'Tedarik Sorunu', domain: 'purchasing' },
] as const

export const OPTIMIZATION_AREAS = [
  { id: 'production_plan', label: 'Üretim Planı', to: '/uretim' },
  { id: 'warehouse_layout', label: 'Depo Yerleşimi', to: '/stok/depolar' },
  { id: 'pallet', label: 'Palet Dizilimi', to: '/lojistik' },
  { id: 'truck_fill', label: 'Tır Doluluğu', to: '/lojistik' },
  { id: 'purchasing', label: 'Satın Alma', to: '/tedarikciler' },
  { id: 'route', label: 'Rota', to: '/lojistik' },
  { id: 'pricing', label: 'Fiyatlandırma', to: '/stok/urunler' },
  { id: 'campaign', label: 'Kampanya', to: '/ai-buyume' },
] as const

export const SCENARIO_PRESETS = [
  {
    id: 'fx_up_10',
    title: 'Kur %10 artarsa?',
    params: { fxDeltaPct: 10 },
    summary: 'İthal girdi maliyeti ↑ · marj baskısı · fiyat revizyon önerisi',
  },
  {
    id: 'new_machine',
    title: 'Yeni makine alınırsa?',
    params: { capacityDeltaPct: 18 },
    summary: 'Kapasite ↑ · iş emri gecikmesi ↓ · amortisman / nakit etkisi',
  },
  {
    id: 'new_shift',
    title: 'Yeni vardiya açılırsa?',
    params: { shift: 1 },
    summary: 'Çıktı ↑ · personel maliyeti ↑ · OEE fırsatı',
  },
  {
    id: 'new_warehouse',
    title: 'Yeni depo açılırsa?',
    params: { warehouses: 1 },
    summary: 'Stok dağılımı · taşıma maliyeti · hizmet seviyesi ↑',
  },
] as const

export type SuggestionSeed = {
  id: string
  title: string
  domain: string
  riskLevel: 'low' | 'medium' | 'high'
  why: string
  benefit: string
  risk: string
  alternatives: string[]
  confidence: number
  safeAuto: boolean
  to: string
}

export const SUGGESTION_SEEDS: SuggestionSeed[] = [
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

export function buildSystemHealthSnapshot() {
  const now = new Date().toISOString()
  return {
    intervalMinutes: 5,
    checkedAt: now,
    checks: SYSTEM_HEALTH_CHECKS.map((c, i) => ({
      ...c,
      status: i % 11 === 7 ? 'degraded' : 'ok',
      latencyMs: 20 + i * 7,
    })),
  }
}

export function buildBusinessHealthScores(input?: {
  orderCount?: number
  jobCount?: number
  cash?: number
  overdueTasks?: number
}) {
  const orders = input?.orderCount ?? 12
  const jobs = input?.jobCount ?? 8
  const cash = input?.cash ?? 100000
  const overdue = input?.overdueTasks ?? 2

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

  return {
    overall,
    finance,
    operations,
    production,
    warehouse,
    logistics,
    customer,
    people,
    domains: MONITOR_DOMAINS,
  }
}

export function buildPredictiveRisks() {
  return RISK_CATALOG.map((r, i) => ({
    ...r,
    probability: Number((0.25 + (i % 5) * 0.1).toFixed(2)),
    horizonDays: 3 + (i % 10),
    severity: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
    explainWhy: `${r.label} sinyali domain metriklerinden türetildi (AC-0 stub).`,
  }))
}

export function buildMorningReport() {
  return {
    type: 'morning',
    title: 'Executive Morning Report',
    sections: {
      priorities: [
        'Kritik stokları kontrol et',
        'Geciken sevkiyatları birleştir',
        'Açık teklifleri kapat',
      ],
      risks: buildPredictiveRisks()
        .filter((r) => r.severity === 'high')
        .map((r) => r.label),
      opportunities: ['VIP teklifleri', 'Kampanya adayı SKU’lar', 'Kapasite boşluğu'],
      production: 'İş emri kuyruğu izleniyor',
      sales: 'Açık pipeline aktif',
      finance: 'Nakit / tahsilat özeti hazır',
      logistics: 'SLA riskleri tarandı',
      criticalAlerts: ['Yüksek riskli tahsilat', 'Bakım eşiği yaklaşan makine'],
    },
    generatedAt: new Date().toISOString(),
  }
}

export function buildEveningReport() {
  return {
    type: 'evening',
    title: 'Evening Summary',
    sections: {
      completed: ['Günlük health check', 'Risk taraması', 'Öneri üretimi'],
      pending: ['Yüksek risk onayları', 'Sevkiyat birleştirme'],
      performance: 'Operasyon skoru güncellendi',
      collections: 'Tahsilat takibi',
      deliveries: 'Teslimat özeti',
      aiSuccess: 'Safe automation (düşük risk) adayları işaretlendi',
    },
    generatedAt: new Date().toISOString(),
  }
}

export function runScenarioSandbox(scenarioId: string) {
  const preset = SCENARIO_PRESETS.find((s) => s.id === scenarioId)
  if (!preset) return null
  return {
    scenarioId: preset.id,
    title: preset.title,
    params: preset.params,
    mutatedProductionData: false,
    summary: preset.summary,
    projected: {
      marginDeltaPct: scenarioId === 'fx_up_10' ? -3.2 : 1.4,
      capacityDeltaPct: scenarioId === 'new_machine' || scenarioId === 'new_shift' ? 12 : 0,
      cashImpactUsd:
        scenarioId === 'new_warehouse' ? -85000 : scenarioId === 'new_machine' ? -120000 : 0,
    },
    explainWhy: 'Simülasyon sandbox — gerçek SoT yazılmaz (Digital Twin / AC-0).',
    ranAt: new Date().toISOString(),
  }
}

export function getAutonomousCatalog() {
  return {
    version: 'AC-0',
    monitorDomains: MONITOR_DOMAINS,
    systemHealthChecks: SYSTEM_HEALTH_CHECKS,
    risks: RISK_CATALOG,
    optimizations: OPTIMIZATION_AREAS,
    scenarios: SCENARIO_PRESETS,
    suggestionSeeds: SUGGESTION_SEEDS,
  }
}
