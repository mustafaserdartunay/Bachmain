/**
 * AIOS Control Center data for Admin UI (/api/aios/*).
 * Catalog mirrors apps/api agents/tools (AIOS-0) — keep in sync conceptually.
 */
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'
import { envHealthSnapshot } from './assertEnv.mjs'

function requireStaffOrFail(req, res) {
  const session = getStaffSession(req)
  if (!session && staffAuthEnabled() && process.env.STAFF_AUTH_REQUIRED !== '0') {
    sendJson(req, res, 401, { ok: false, error: 'UNAUTHORIZED', message: 'Staff oturumu gerekli' })
    return null
  }
  return session || { email: 'local-dev' }
}

const AGENTS = [
  {
    id: 'ai.ceo',
    name: 'AI CEO',
    role: 'executive',
    modules: ['crm', 'sales', 'finance'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    costLimitUsd: 50,
  },
  {
    id: 'ai.ops_director',
    name: 'AI Operasyon Direktörü',
    role: 'operations',
    modules: ['production', 'warehouse', 'logistics'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 30,
  },
  {
    id: 'ai.sales_manager',
    name: 'AI Satış Müdürü',
    role: 'sales',
    modules: ['crm', 'quotes', 'orders'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 25,
  },
  {
    id: 'ai.crm_specialist',
    name: 'AI CRM Uzmanı',
    role: 'crm',
    modules: ['crm'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 20,
  },
  {
    id: 'ai.production_planner',
    name: 'AI Üretim Planlama Uzmanı',
    role: 'production',
    modules: ['production'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 20,
  },
  {
    id: 'ai.quality',
    name: 'AI Kalite Uzmanı',
    role: 'quality',
    modules: ['quality'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.warehouse',
    name: 'AI Depo Uzmanı',
    role: 'warehouse',
    modules: ['warehouse'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.logistics',
    name: 'AI Lojistik Planlama Uzmanı',
    role: 'logistics',
    modules: ['logistics'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 20,
  },
  {
    id: 'ai.purchasing',
    name: 'AI Satın Alma Uzmanı',
    role: 'purchasing',
    modules: ['purchasing'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.accounting',
    name: 'AI Muhasebe Uzmanı',
    role: 'accounting',
    modules: ['accounting'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 20,
  },
  {
    id: 'ai.finance_analyst',
    name: 'AI Finans Analisti',
    role: 'finance',
    modules: ['finance'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    costLimitUsd: 25,
  },
  {
    id: 'ai.hr',
    name: 'AI İnsan Kaynakları Uzmanı',
    role: 'hr',
    modules: ['hr'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 10,
  },
  {
    id: 'ai.marketing',
    name: 'AI Pazarlama Müdürü',
    role: 'marketing',
    modules: ['ai_growth'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    costLimitUsd: 30,
  },
  {
    id: 'ai.seo',
    name: 'AI SEO Uzmanı',
    role: 'seo',
    modules: ['ai_growth'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.social',
    name: 'AI Sosyal Medya Uzmanı',
    role: 'social',
    modules: ['ai_growth'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.ads',
    name: 'AI Reklam Uzmanı',
    role: 'ads',
    modules: ['ai_growth'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.design',
    name: 'AI Tasarım Asistanı',
    role: 'design',
    modules: ['ai_growth'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.document',
    name: 'AI Belge Asistanı',
    role: 'documents',
    modules: ['documents'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.reporting',
    name: 'AI Raporlama Uzmanı',
    role: 'reporting',
    modules: ['reporting'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    costLimitUsd: 20,
  },
  {
    id: 'ai.support',
    name: 'AI Destek Uzmanı',
    role: 'support',
    modules: ['support'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 15,
  },
  {
    id: 'ai.data_analyst',
    name: 'AI Veri Analisti',
    role: 'analytics',
    modules: ['reporting'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    costLimitUsd: 25,
  },
  {
    id: 'ai.translator',
    name: 'AI Çeviri Uzmanı',
    role: 'translation',
    modules: ['crm'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 10,
  },
  {
    id: 'ai.customer_comms',
    name: 'AI Müşteri İletişim Uzmanı',
    role: 'comms',
    modules: ['crm', 'omnichannel'],
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    costLimitUsd: 20,
  },
]

const TOOLS = [
  {
    id: 'customer.search',
    label: 'Customer Search',
    description: 'Müşteri ara',
    requiresHumanApproval: false,
  },
  {
    id: 'quote.create',
    label: 'Create Quote',
    description: 'Teklif taslağı',
    requiresHumanApproval: false,
  },
  {
    id: 'order.create',
    label: 'Create Order',
    description: 'Sipariş oluştur',
    requiresHumanApproval: true,
  },
  {
    id: 'task.update',
    label: 'Update Task',
    description: 'Görev güncelle',
    requiresHumanApproval: false,
  },
  {
    id: 'invoice.draft',
    label: 'Generate Invoice Draft',
    description: 'Fatura taslağı',
    requiresHumanApproval: false,
  },
  {
    id: 'truck.load',
    label: 'Calculate Truck Load',
    description: 'Yük hesabı',
    requiresHumanApproval: false,
  },
  {
    id: 'document.generate',
    label: 'Generate Document',
    description: 'Belge üret',
    requiresHumanApproval: false,
  },
  {
    id: 'email.send',
    label: 'Send Email',
    description: 'E-posta gönder',
    requiresHumanApproval: true,
  },
  {
    id: 'whatsapp.send',
    label: 'Send WhatsApp',
    description: 'WhatsApp gönder',
    requiresHumanApproval: true,
  },
  {
    id: 'route.create',
    label: 'Create Route',
    description: 'Rota oluştur',
    requiresHumanApproval: false,
  },
  {
    id: 'inventory.search',
    label: 'Search Inventory',
    description: 'Stok ara',
    requiresHumanApproval: false,
  },
  {
    id: 'order.cancel',
    label: 'Cancel Order',
    description: 'Sipariş iptali',
    requiresHumanApproval: true,
  },
  {
    id: 'invoice.cancel',
    label: 'Cancel Invoice',
    description: 'Fatura iptali',
    requiresHumanApproval: true,
  },
  {
    id: 'price.bulk_update',
    label: 'Bulk Price Update',
    description: 'Toplu fiyat',
    requiresHumanApproval: true,
  },
  {
    id: 'stock.delete',
    label: 'Delete Stock',
    description: 'Stok silme',
    requiresHumanApproval: true,
  },
  {
    id: 'user.delete',
    label: 'Delete User',
    description: 'Kullanıcı silme',
    requiresHumanApproval: true,
  },
  {
    id: 'package.change',
    label: 'Change Package',
    description: 'Paket değiştirme',
    requiresHumanApproval: true,
  },
  {
    id: 'role.elevate',
    label: 'Elevate Role',
    description: 'Yetki yükseltme',
    requiresHumanApproval: true,
  },
  {
    id: 'data.bulk_import',
    label: 'Bulk Data Import',
    description: 'Toplu aktarım',
    requiresHumanApproval: true,
  },
]

function providers() {
  const env = envHealthSnapshot()
  return [
    {
      id: 'openai',
      label: 'OpenAI',
      configured: Boolean(env.checks?.openai),
      models: ['gpt-4o', 'gpt-4o-mini'],
    },
    {
      id: 'anthropic',
      label: 'Anthropic Claude',
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      models: ['claude-3-5-sonnet'],
    },
    {
      id: 'gemini',
      label: 'Google Gemini',
      configured: Boolean(process.env.GEMINI_API_KEY),
      models: ['gemini-1.5-pro'],
    },
    {
      id: 'azure_openai',
      label: 'Azure OpenAI',
      configured: Boolean(process.env.AZURE_OPENAI_API_KEY),
      models: ['gpt-4o'],
    },
    {
      id: 'local',
      label: 'Yerel LLM',
      configured: Boolean(process.env.LOCAL_LLM_URL),
      models: ['local-default'],
    },
  ]
}

export async function handleAiosApi(req, res, path) {
  if (!path.startsWith('aios')) return false
  const method = req.method
  if (method === 'GET' && (path === 'aios' || path === 'aios/overview')) {
    if (!requireStaffOrFail(req, res)) return true
    const rows = providers()
    sendJson(req, res, 200, {
      ok: true,
      agentsTotal: AGENTS.length,
      toolsTotal: TOOLS.length,
      providersConfigured: rows.filter((p) => p.configured).length,
      providers: rows,
      agents: AGENTS,
      tools: TOOLS,
      sections: [
        'Dashboard',
        'Agent Manager',
        'Model Manager',
        'Prompt Library',
        'Tool Library',
        'Memory',
        'Knowledge Base',
        'Usage',
        'Costs',
        'Logs',
        'Approvals',
        'Automation',
        'Alerts',
        'Settings',
      ],
      mock: false,
      source: '/api/aios/overview',
      sampledAt: new Date().toISOString(),
    })
    return true
  }
  return false
}
