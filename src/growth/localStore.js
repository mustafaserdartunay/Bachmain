const KEY = 'bach_growth_ag0_v1'
const EVT = 'bach:growth-updated'

function blank() {
  return {
    leads: [
      {
        id: 'gl_demo1',
        source: 'web_form',
        name: 'Demo Lead',
        email: 'demo@ornek.com',
        companyName: 'Örnek A.Ş.',
        message: 'Fiyat teklifi istiyorum',
        status: 'new',
        score: 0,
        temperature: 'cold',
      },
    ],
    campaigns: [],
    funnels: [
      {
        id: 'fn_default',
        name: 'Satış Hunisi',
        status: 'draft',
        stages: [
          { id: 'lead', label: 'Lead', count: 42 },
          { id: 'mail', label: 'Mail', count: 28 },
          { id: 'quote', label: 'Teklif', count: 12 },
          { id: 'order', label: 'Sipariş', count: 5 },
          { id: 'payment', label: 'Tahsilat', count: 4 },
          { id: 'loyalty', label: 'Sadakat', count: 2 },
        ],
      },
    ],
    smsCampaigns: [],
    reports: [],
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

export function ensureGrowthSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function growthKpisLocal(libraryCount = 0, socialCount = 0) {
  const s = read()
  const scored = s.leads.filter((l) => l.status === 'scored' || l.score > 0)
  return {
    visitorsToday: 128,
    newLeads: s.leads.length,
    newCustomers: 3,
    quotes: 7,
    orders: 4,
    revenue: 186400,
    adSpend: 12400,
    roas: 2.4,
    roi: 1.8,
    cac: 4100,
    ltv: 28400,
    seoScore: 72,
    aiContents: libraryCount,
    socialPosts: socialCount,
    hotLeads: scored.filter((l) => l.temperature === 'hot').length,
    campaigns: s.campaigns.length,
  }
}

export function listLeadsLocal() {
  return read().leads
}

export function addLeadLocal(payload) {
  const s = read()
  const lead = {
    id: `gl_${Date.now().toString(36)}`,
    source: payload.source || 'web_form',
    name: payload.name || 'Lead',
    email: payload.email || '',
    phone: payload.phone || '',
    companyName: payload.companyName || '',
    message: payload.message || '',
    status: 'new',
    score: 0,
    temperature: 'cold',
  }
  s.leads.unshift(lead)
  write(s)
  return lead
}

export function scoreLeadLocal(id) {
  const s = read()
  const idx = s.leads.findIndex((l) => l.id === id)
  if (idx < 0) return null
  const lead = s.leads[idx]
  let score = 35
  if (lead.email) score += 15
  if (lead.phone) score += 10
  if (lead.companyName) score += 15
  if (lead.message?.length > 40) score += 10
  score = Math.min(98, score)
  const temperature = score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold'
  s.leads[idx] = {
    ...lead,
    score,
    temperature,
    status: 'scored',
    purchaseProbability: Math.round(score * 0.85),
    estimatedRevenue: temperature === 'hot' ? 45000 : temperature === 'warm' ? 18000 : 5000,
  }
  write(s)
  return s.leads[idx]
}

export function listCampaignsLocal() {
  return read().campaigns
}

export function addCampaignLocal(name, channel = 'multi') {
  const s = read()
  const row = {
    id: `gc_${Date.now().toString(36)}`,
    name,
    channel,
    status: 'draft',
    budget: 0,
  }
  s.campaigns.unshift(row)
  write(s)
  return row
}

export function listFunnelsLocal() {
  return read().funnels
}

export function listSmsLocal() {
  return read().smsCampaigns
}

export function addSmsLocal(title) {
  const s = read()
  const row = { id: `sms_${Date.now().toString(36)}`, title, status: 'draft', sent: 0 }
  s.smsCampaigns.unshift(row)
  write(s)
  return row
}

export { EVT as GROWTH_UPDATED_EVENT }
