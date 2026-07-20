/** CXC-0 local projection — Master Customer stays in customerProfiles. */

const KEY = 'bach_cxc_cxc0_v1'
const EVT = 'bach:cxc-updated'

export const CXC_UPDATED_EVENT = EVT

export const DEFAULT_PIPELINE_STAGES = [
  { code: 'new_lead', label: 'Yeni Lead', sortOrder: 10, color: '#94a3b8' },
  { code: 'contacted', label: 'İletişime Geçildi', sortOrder: 20, color: '#38bdf8' },
  { code: 'quote_prep', label: 'Teklif Hazırlanıyor', sortOrder: 30, color: '#a78bfa' },
  { code: 'quote_sent', label: 'Teklif Gönderildi', sortOrder: 40, color: '#818cf8' },
  { code: 'revision', label: 'Revizyon', sortOrder: 50, color: '#fbbf24' },
  { code: 'awaiting', label: 'Onay Bekliyor', sortOrder: 60, color: '#fb923c' },
  { code: 'won', label: 'Siparişe Dönüştü', sortOrder: 70, color: '#34d399', isWon: true },
  { code: 'lost', label: 'Kaybedildi', sortOrder: 80, color: '#f87171', isLost: true },
]

function blank() {
  return {
    stages: DEFAULT_PIPELINE_STAGES.map((s, i) => ({ id: `st${i}`, ...s })),
    opportunities: [
      {
        id: 'opp1',
        customerId: '',
        customerName: 'Demo Firma A',
        title: 'Panel siparişi',
        stageCode: 'quote_sent',
        amount: 185000,
        source: 'web',
      },
      {
        id: 'opp2',
        customerId: '',
        customerName: 'Demo Firma B',
        title: 'Yıllık bakım',
        stageCode: 'contacted',
        amount: 42000,
        source: 'whatsapp',
      },
      {
        id: 'opp3',
        customerId: '',
        customerName: 'Demo Firma C',
        title: 'Yeni hat kurulumu',
        stageCode: 'awaiting',
        amount: 960000,
        source: 'linkedin',
      },
    ],
    tickets: [
      {
        id: 'tkt1',
        customerId: '',
        customerName: 'Demo Firma A',
        subject: 'Teslimat gecikmesi',
        channel: 'whatsapp',
        priority: 'high',
        status: 'open',
        aiSummary: 'Son sipariş 3 gün gecikti; müşteri alternatif tarih istiyor.',
      },
    ],
    loyalty: [],
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

export function ensureCxcSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function cxcOverviewLocal(customerCount = 0) {
  const s = read()
  return {
    phase: 'CXC-0',
    customerCount,
    openOpportunities: s.opportunities.filter(
      (o) => o.stageCode !== 'won' && o.stageCode !== 'lost',
    ).length,
    openTickets: s.tickets.filter((t) => t.status === 'open').length,
    pipelineValue: s.opportunities.reduce((a, o) => a + (Number(o.amount) || 0), 0),
    customersAtRisk: 3,
    topCustomers: Math.min(12, customerCount || 12),
    avgHealthScore: 72,
    pendingActions: 5,
  }
}

export function listStagesLocal() {
  return read()
    .stages.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function listOpportunitiesLocal() {
  return read().opportunities
}

export function moveOpportunityLocal(id, stageCode) {
  const s = read()
  s.opportunities = s.opportunities.map((o) => (o.id === id ? { ...o, stageCode } : o))
  write(s)
  return s.opportunities.find((o) => o.id === id)
}

export function addOpportunityLocal(input) {
  const s = read()
  const row = {
    id: `opp_${Date.now().toString(36)}`,
    customerId: input.customerId || '',
    customerName: input.customerName || 'Müşteri',
    title: input.title || 'Yeni fırsat',
    stageCode: input.stageCode || 'new_lead',
    amount: Number(input.amount) || 0,
    source: input.source || 'manual',
  }
  s.opportunities = [row, ...s.opportunities]
  write(s)
  return row
}

export function listTicketsLocal() {
  return read().tickets
}

export function addTicketLocal(input) {
  const s = read()
  const row = {
    id: `tkt_${Date.now().toString(36)}`,
    customerId: input.customerId || '',
    customerName: input.customerName || 'Müşteri',
    subject: input.subject || 'Destek talebi',
    channel: input.channel || 'portal',
    priority: input.priority || 'normal',
    status: 'open',
    aiSummary: input.aiSummary || '',
  }
  s.tickets = [row, ...s.tickets]
  write(s)
  return row
}

export function healthForCustomerLocal(customerId, seed = 50) {
  const base = 45 + ((String(customerId || 'x').length * 7 + seed) % 50)
  return {
    customerId,
    score: Math.min(98, base),
    churnRisk: base < 55 ? 'high' : base < 75 ? 'medium' : 'low',
    factors: {
      orders: Math.min(100, base + 5),
      collections: Math.min(100, base - 3),
      support: Math.min(100, base + 10),
      satisfaction: Math.min(100, base + 2),
      activity: Math.min(100, base - 8),
      profitability: Math.min(100, base + 6),
    },
  }
}

export function loyaltyForCustomerLocal(customerId) {
  const score = healthForCustomerLocal(customerId).score
  const tier =
    score >= 90
      ? 'vip'
      : score >= 80
        ? 'platinum'
        : score >= 70
          ? 'gold'
          : score >= 55
            ? 'silver'
            : 'bronze'
  return {
    customerId,
    tier,
    points: score * 12,
    discountPct:
      tier === 'vip'
        ? 12
        : tier === 'platinum'
          ? 8
          : tier === 'gold'
            ? 5
            : tier === 'silver'
              ? 3
              : 0,
  }
}

export function aiInsightsLocal(customerId) {
  return [
    {
      id: 'i1',
      kind: 'purchase_habit',
      title: 'Satın alma alışkanlığı',
      payload: { avgOrderDays: 28, preferredChannel: 'WhatsApp' },
    },
    {
      id: 'i2',
      kind: 'avg_order',
      title: 'Ortalama sipariş',
      payload: { amount: 62500, currency: 'TRY' },
    },
    {
      id: 'i3',
      kind: 'profitability',
      title: 'Karlılık',
      payload: { marginPct: 24 },
    },
    {
      id: 'i4',
      kind: 'risk',
      title: 'Risk',
      payload: { level: healthForCustomerLocal(customerId).churnRisk },
    },
    {
      id: 'i5',
      kind: 'collection',
      title: 'Tahsilat performansı',
      payload: { onTimePct: 81 },
    },
    {
      id: 'i6',
      kind: 'satisfaction',
      title: 'Memnuniyet',
      payload: { nps: 42 },
    },
    {
      id: 'i7',
      kind: 'complaint',
      title: 'Şikayet oranı',
      payload: { pct: 4.2 },
    },
    {
      id: 'i8',
      kind: 'delivery',
      title: 'Teslimat başarısı',
      payload: { onTimePct: 93 },
    },
    {
      id: 'i9',
      kind: 'repurchase',
      title: 'Tekrar satın alma olasılığı',
      payload: { probability: 0.71 },
    },
    {
      id: 'i10',
      kind: 'churn',
      title: 'Churn ihtimali',
      payload: { probability: 0.18 },
    },
  ]
}

export function nextActionsLocal(customerId) {
  return [
    {
      id: 'a1',
      customerId,
      action: 'Bu müşteriyi ara.',
      reason: 'Son görüşme 12 gün önce',
      priority: 90,
    },
    {
      id: 'a2',
      customerId,
      action: 'Fiyat güncelle.',
      reason: 'Liste fiyatı değişti',
      priority: 75,
    },
    {
      id: 'a3',
      customerId,
      action: 'Yeni teklif gönder.',
      reason: 'Pipeline bekleyen fırsat',
      priority: 80,
    },
    {
      id: 'a4',
      customerId,
      action: 'Tahsilatı hatırlat.',
      reason: 'Vadesi geçmiş bakiye',
      priority: 85,
    },
    {
      id: 'a5',
      customerId,
      action: 'Ziyaret planla.',
      reason: 'Saha rotası önerisi',
      priority: 70,
    },
  ]
}

const TIMELINE_KINDS = [
  'call',
  'whatsapp',
  'email',
  'quote',
  'order',
  'task',
  'note',
  'meeting',
  'support',
  'invoice',
  'payment',
  'production',
  'warehouse',
  'delivery',
  'visit',
]

export function buildTimelineLocal(
  customerId,
  { activities = [], tasks = [], appointments = [], notes = [] } = {},
) {
  const events = []
  for (const a of activities) {
    events.push({
      id: a.id || `act_${events.length}`,
      kind: 'note',
      title: a.action || 'Aktivite',
      summary: a.detail || '',
      occurredAt: a.at || new Date().toISOString(),
      sourceModule: 'customerActivity',
    })
  }
  for (const t of tasks) {
    const match =
      !customerId ||
      t.customerId === customerId ||
      t.relatedCustomerId === customerId ||
      (t.customer && String(t.customer).includes(customerId))
    if (!match && customerId) continue
    events.push({
      id: t.id,
      kind: 'task',
      title: t.title || 'Görev',
      summary: t.status || '',
      occurredAt: t.createdAt || t.dueDate || new Date().toISOString(),
      sourceModule: 'crm',
    })
  }
  for (const a of appointments) {
    const match = !customerId || a.customerId === customerId || a.relatedCustomerId === customerId
    if (!match && customerId) continue
    events.push({
      id: a.id,
      kind: 'meeting',
      title: a.title || 'Toplantı',
      summary: a.location || '',
      occurredAt: a.startAt || a.createdAt || new Date().toISOString(),
      sourceModule: 'crm',
    })
  }
  for (const n of notes) {
    events.push({
      id: n.id,
      kind: 'note',
      title: n.title || 'Not',
      summary: (n.body || n.content || '').slice(0, 120),
      occurredAt: n.createdAt || new Date().toISOString(),
      sourceModule: 'crm',
    })
  }
  if (events.length < 4 && customerId) {
    const now = Date.now()
    TIMELINE_KINDS.slice(0, 8).forEach((kind, i) => {
      events.push({
        id: `demo_${kind}_${i}`,
        kind,
        title: kindLabel(kind),
        summary: 'CXC timeline projeksiyonu',
        occurredAt: new Date(now - (i + 1) * 36e5 * 6).toISOString(),
        sourceModule: 'cxc-demo',
      })
    })
  }
  return events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
}

export function kindLabel(kind) {
  const map = {
    call: 'Telefon',
    whatsapp: 'WhatsApp',
    email: 'E-posta',
    quote: 'Teklif',
    order: 'Sipariş',
    task: 'Görev',
    note: 'Not',
    meeting: 'Toplantı',
    support: 'Destek',
    invoice: 'Fatura',
    payment: 'Tahsilat',
    production: 'Üretim',
    warehouse: 'Depo',
    delivery: 'Teslimat',
    visit: 'Ziyaret',
  }
  return map[kind] || kind
}

export { TIMELINE_KINDS }
