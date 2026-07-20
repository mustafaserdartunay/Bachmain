/** AIOS-0.5 Enterprise AI Brain local projection — gateway remains SoT when session+API available. */

const KEY = 'bach_aios_brain_v1'
const EVT = 'bach:aios-updated'

export const AIOS_UPDATED_EVENT = EVT

export const AIOS_AGENTS_SEED = [
  { id: 'ai.ceo', name: 'AI CEO', role: 'executive', enabled: true },
  { id: 'ai.ops_director', name: 'AI COO', role: 'operations', enabled: true },
  { id: 'ai.cfo', name: 'AI CFO', role: 'finance_executive', enabled: true },
  { id: 'ai.cmo', name: 'AI CMO', role: 'marketing_executive', enabled: true },
  { id: 'ai.cto', name: 'AI CTO', role: 'technology_executive', enabled: true },
  { id: 'ai.chro', name: 'AI CHRO', role: 'hr_executive', enabled: true },
  { id: 'ai.sales_manager', name: 'AI Sales Director', role: 'sales', enabled: true },
  { id: 'ai.crm_specialist', name: 'AI CRM Director', role: 'crm', enabled: true },
  {
    id: 'ai.production_planner',
    name: 'AI Production Director',
    role: 'production',
    enabled: true,
  },
  { id: 'ai.quality', name: 'AI Quality Director', role: 'quality', enabled: true },
  { id: 'ai.warehouse', name: 'AI Warehouse Director', role: 'warehouse', enabled: true },
  { id: 'ai.logistics', name: 'AI Logistics Director', role: 'logistics', enabled: true },
  { id: 'ai.purchasing', name: 'AI Purchasing Director', role: 'purchasing', enabled: true },
  { id: 'ai.accounting', name: 'AI Muhasebe Uzmanı', role: 'accounting', enabled: true },
  { id: 'ai.finance_analyst', name: 'AI Finans Analisti', role: 'finance', enabled: true },
  { id: 'ai.hr', name: 'AI İK Uzmanı', role: 'hr', enabled: true },
  { id: 'ai.marketing', name: 'AI Pazarlama', role: 'marketing', enabled: true },
  { id: 'ai.seo', name: 'AI SEO Uzmanı', role: 'seo', enabled: true },
  { id: 'ai.social', name: 'AI Sosyal Medya', role: 'marketing', enabled: true },
  { id: 'ai.ads', name: 'AI Reklam', role: 'marketing', enabled: true },
  { id: 'ai.design', name: 'AI Tasarım', role: 'design', enabled: true },
  { id: 'ai.document', name: 'AI Belge Asistanı', role: 'documents', enabled: true },
  { id: 'ai.reporting', name: 'AI Raporlama', role: 'analytics', enabled: true },
  { id: 'ai.support', name: 'AI Support Director', role: 'support', enabled: true },
  { id: 'ai.data_analyst', name: 'AI Analytics Director', role: 'analytics', enabled: true },
  { id: 'ai.knowledge_director', name: 'AI Knowledge Director', role: 'knowledge', enabled: true },
  { id: 'ai.translator', name: 'AI Çeviri', role: 'i18n', enabled: true },
  { id: 'ai.customer_comms', name: 'AI Müşteri İletişim', role: 'crm', enabled: true },
]

export const COMMAND_SAMPLES = [
  'Bugünkü satışları göster.',
  'Üretimde geciken siparişleri bul.',
  'Depoda kritik stokları listele.',
  'Almanya sevkiyatlarını göster.',
  'En kârlı müşterileri sırala.',
  'Fire nedenlerini analiz et.',
  'Bu ayki nakit akışını tahmin et.',
  'Yeni blog yaz.',
  'Instagram paylaşımı hazırla.',
  'Ali firmasına teklif oluştur.',
]

export const ORCHESTRATOR_CHAINS = [
  {
    id: 'order_to_cash',
    name: 'Sipariş → Tahsilat',
    steps: ['Satış', 'Üretim', 'Lojistik', 'Muhasebe', 'Belge', 'WhatsApp'],
  },
  {
    id: 'quote_to_wa',
    name: 'Teklif → WhatsApp',
    steps: ['CRM', 'Teklif', 'PDF', 'WhatsApp', 'Görev', 'Takvim'],
  },
  {
    id: 'stock_alert',
    name: 'Kritik Stok',
    steps: ['Depo', 'Satın Alma', 'Onay', 'Bildirim'],
  },
]

export const PROVIDERS_SEED = [
  { id: 'openai', label: 'OpenAI', configured: true, models: ['gpt-4o', 'gpt-4o-mini'] },
  { id: 'anthropic', label: 'Claude', configured: false, models: ['claude-3-5-sonnet'] },
  { id: 'gemini', label: 'Gemini', configured: false, models: ['gemini-1.5-pro'] },
  { id: 'deepseek', label: 'DeepSeek', configured: false, models: ['deepseek-chat'] },
  { id: 'mistral', label: 'Mistral', configured: false, models: ['mistral-large'] },
  { id: 'local', label: 'Yerel Model', configured: false, models: ['local-default'] },
]

const PROMPTS_SEED = [
  {
    id: 'p_crm',
    domain: 'CRM',
    title: 'Müşteri 360 özeti',
    body: 'Müşteri {{name}} için 360 özet çıkar.',
  },
  {
    id: 'p_prod',
    domain: 'Üretim',
    title: 'Geciken iş emirleri',
    body: 'Geciken iş emirlerini önceliklendir.',
  },
  { id: 'p_acc', domain: 'Muhasebe', title: 'Nakit özeti', body: 'Bu ay nakit akışını özetle.' },
  {
    id: 'p_log',
    domain: 'Lojistik',
    title: 'Sevkiyat planı',
    body: 'Bekleyen sevkiyatları rota önerisiyle listele.',
  },
  { id: 'p_wh', domain: 'Depo', title: 'Kritik stok', body: 'Kritik stok SKU’larını listele.' },
  {
    id: 'p_sales',
    domain: 'Satış',
    title: 'Pipeline',
    body: 'Açık teklifleri kapanış ihtimaline göre sırala.',
  },
  { id: 'p_seo', domain: 'SEO', title: 'Blog taslağı', body: 'Ürün için SEO blog taslağı yaz.' },
  {
    id: 'p_ads',
    domain: 'Reklam',
    title: 'Instagram',
    body: 'Instagram paylaşımı + hashtag öner.',
  },
  {
    id: 'p_doc',
    domain: 'Belge',
    title: 'Teklif PDF',
    body: 'Teklif özeti + PDF değişkenleri öner.',
  },
]

function blank() {
  return {
    agents: AIOS_AGENTS_SEED.map((a) => ({ ...a })),
    prompts: PROMPTS_SEED.map((p) => ({ ...p })),
    memory: [
      {
        id: 'm1',
        scope: 'company',
        key: 'approval_rule',
        value: 'Fatura iptali ve stok silme için insan onayı zorunlu.',
      },
      {
        id: 'm2',
        scope: 'user',
        key: 'preferred_lang',
        value: 'tr',
      },
    ],
    chat: [],
    runs: [],
    approvals: [
      {
        id: 'ap1',
        toolId: 'order.cancel',
        label: 'Sipariş iptali',
        status: 'pending',
        risk: 'high',
      },
      {
        id: 'ap2',
        toolId: 'stock.delete',
        label: 'Stok silme',
        status: 'pending',
        risk: 'high',
      },
    ],
    tasks: [
      { id: 't1', title: 'Haftalık satış özeti', status: 'queued', agentId: 'ai.sales_manager' },
      { id: 't2', title: 'Kritik stok taraması', status: 'queued', agentId: 'ai.warehouse' },
    ],
    usage: { tokensIn: 12400, tokensOut: 8600, costUsd: 0.42, runs: 18 },
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

export function ensureAiosSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function aiosOverviewLocal() {
  const s = read()
  return {
    agents: s.agents.length,
    agentsOn: s.agents.filter((a) => a.enabled).length,
    pendingApprovals: s.approvals.filter((a) => a.status === 'pending').length,
    memoryItems: s.memory.length,
    runs: s.runs.length || s.usage.runs,
    costUsd: s.usage.costUsd,
  }
}

export function listAgentsLocal() {
  return read().agents
}

export function toggleAgentLocal(id) {
  const s = read()
  s.agents = s.agents.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
  write(s)
  return s.agents.find((a) => a.id === id)
}

export function listPromptsLocal() {
  return read().prompts
}

export function listMemoryLocal() {
  return read().memory
}

export function clearMemoryLocal() {
  const s = read()
  s.memory = []
  write(s)
}

export function listApprovalsLocal() {
  return read().approvals
}

export function decideApprovalLocal(id, decision) {
  const s = read()
  s.approvals = s.approvals.map((a) =>
    a.id === id ? { ...a, status: decision === 'approve' ? 'approved' : 'rejected' } : a,
  )
  write(s)
  return s.approvals.find((a) => a.id === id)
}

export function listRunsLocal() {
  return read().runs
}

export function listTasksLocal() {
  return read().tasks
}

export function listChatLocal() {
  return read().chat
}

export function usageLocal() {
  return read().usage
}

export function appendChatLocal({ role, content, agentId, meta }) {
  const s = read()
  const entry = {
    id: `c_${Date.now()}`,
    role,
    content,
    agentId: agentId || 'ai.ceo',
    at: new Date().toISOString(),
    meta: meta || null,
  }
  s.chat = [...s.chat, entry].slice(-80)
  if (role === 'assistant' && meta) {
    s.runs = [
      {
        id: `r_${Date.now()}`,
        agentId: entry.agentId,
        provider: meta.provider || 'openai',
        model: meta.model || 'gpt-4o-mini',
        tokens: (meta.promptTokens || 0) + (meta.completionTokens || 0),
        costUsd: meta.estimatedCostUsd || 0,
        stub: Boolean(meta.stub),
        at: entry.at,
      },
      ...s.runs,
    ].slice(0, 50)
    s.usage = {
      tokensIn: s.usage.tokensIn + (meta.promptTokens || 0),
      tokensOut: s.usage.tokensOut + (meta.completionTokens || 0),
      costUsd: Number((s.usage.costUsd + (meta.estimatedCostUsd || 0)).toFixed(4)),
      runs: s.usage.runs + 1,
    }
  }
  write(s)
  return entry
}

export function stubChatReply(prompt, agentId) {
  return {
    content:
      `AIOS Brain · ${agentId}: "${String(prompt).slice(0, 160)}" — ` +
      'Gateway yolu: Browser → /v1/aios/gateway/chat → AI Gateway (OpenAI veya stub). ' +
      'Riskli işlemler Human Approval kuyruğuna düşer; AI doğrudan DB yazmaz.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    promptTokens: Math.ceil(String(prompt).length / 4),
    completionTokens: 48,
    estimatedCostUsd: 0,
    stub: true,
  }
}
