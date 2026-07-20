/**
 * AI Enterprise Organization chart — top AIOS layer.
 * Agents never peer-chat; Orchestrator dispatches events only.
 */
import { AIOS_AGENTS, getAgentById } from './agentsCatalog.js'

export type OrgTier = 'ceo' | 'c_suite' | 'director' | 'specialist'

export type OrgNode = {
  id: string
  agentId: string
  title: string
  tier: OrgTier
  reportsTo: string | null
  mandate: string[]
  explainWhy: string
  criticalApprovalRequired: boolean
}

/** Canonical digital workforce org chart (ORG-0). */
export const AI_ENTERPRISE_ORG: OrgNode[] = [
  {
    id: 'org.ceo',
    agentId: 'ai.ceo',
    title: 'AI CEO',
    tier: 'ceo',
    reportsTo: null,
    mandate: [
      'Şirketin tamamını analiz eder',
      'Departmanlardan rapor toplar',
      'Riskleri özetler',
      'Yönetime günlük rapor sunar',
    ],
    explainWhy: 'Çapraz modül sinyalleri ve yönetici KPI eşikleri birleşince günlük özet üretilir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.coo',
    agentId: 'ai.ops_director',
    title: 'AI COO',
    tier: 'c_suite',
    reportsTo: 'org.ceo',
    mandate: ['Üretim', 'Depo', 'Lojistik', 'Workflow', 'Süreç optimizasyonu'],
    explainWhy: 'Operasyon gecikme / darboğaz metrikleri eşiği aşınca COO brifingi oluşur.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.cfo',
    agentId: 'ai.cfo',
    title: 'AI CFO',
    tier: 'c_suite',
    reportsTo: 'org.ceo',
    mandate: ['Finans', 'Nakit', 'Karlılık', 'Kur riski', 'Tahsilat', 'Maliyet'],
    explainWhy: 'Nakit ve tahsilat sapmaları CFO risk skorunu yükseltir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.cmo',
    agentId: 'ai.cmo',
    title: 'AI CMO',
    tier: 'c_suite',
    reportsTo: 'org.ceo',
    mandate: ['SEO', 'Google Ads', 'Meta', 'Instagram', 'YouTube', 'LinkedIn', 'TikTok'],
    explainWhy: 'Kampanya / içerik fırsat skorları Growth sinyallerinden türetilir.',
    criticalApprovalRequired: false,
  },
  {
    id: 'org.cto',
    agentId: 'ai.cto',
    title: 'AI CTO',
    tier: 'c_suite',
    reportsTo: 'org.ceo',
    mandate: ['Platform sağlığı', 'Entegrasyon', 'AI Gateway', 'Güvenlik'],
    explainWhy: 'Sistem health ve entegrasyon hataları CTO gündemine düşer.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.chro',
    agentId: 'ai.chro',
    title: 'AI CHRO',
    tier: 'c_suite',
    reportsTo: 'org.ceo',
    mandate: ['İK', 'PDKS', 'Kapasite', 'İzin / vardiya'],
    explainWhy: 'Personel / vardiya riskleri CHRO özetine yansır.',
    criticalApprovalRequired: false,
  },
  {
    id: 'org.production',
    agentId: 'ai.production_planner',
    title: 'AI Production Director',
    tier: 'director',
    reportsTo: 'org.coo',
    mandate: ['Üretim planı', 'Darboğaz', 'Fire', 'Makine', 'Operatör', 'Kapasite'],
    explainWhy: 'İş emri gecikmesi ve OEE sapması üretim direktörünü tetikler.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.warehouse',
    agentId: 'ai.warehouse',
    title: 'AI Warehouse Director',
    tier: 'director',
    reportsTo: 'org.coo',
    mandate: ['Stok', 'Adresleme', 'Sayım', 'FIFO', 'FEFO', 'ABC'],
    explainWhy: 'Kritik stok ve ABC sapmaları depo brifingi üretir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.logistics',
    agentId: 'ai.logistics',
    title: 'AI Logistics Director',
    tier: 'director',
    reportsTo: 'org.coo',
    mandate: ['Tır doluluk', 'Palet', 'Koli', 'Rota', 'Yakıt', 'Teslim süresi'],
    explainWhy: 'Doluluk ve teslim SLA sapmaları lojistik önerisi üretir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.sales',
    agentId: 'ai.sales_manager',
    title: 'AI Sales Director',
    tier: 'director',
    reportsTo: 'org.ceo',
    mandate: ['Fırsat analizi', 'Teklif', 'İskonto riski', 'Satış hedefleri'],
    explainWhy: 'Pipeline ve iskonto risk skorları satış önerisi doğurur.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.crm',
    agentId: 'ai.crm_specialist',
    title: 'AI CRM Director',
    tier: 'director',
    reportsTo: 'org.ceo',
    mandate: ['Müşteri ilişkileri', 'Riskli müşteri', 'Sadakat'],
    explainWhy: 'Churn / sağlık skorları CRM aksiyon önerisi üretir.',
    criticalApprovalRequired: false,
  },
  {
    id: 'org.purchasing',
    agentId: 'ai.purchasing',
    title: 'AI Purchasing Director',
    tier: 'director',
    reportsTo: 'org.coo',
    mandate: ['SAT', 'Tedarikçi performans', 'Fiyat karşılaştırma', 'Teslim süresi'],
    explainWhy: 'Tedarik SLA ve fiyat sapmaları satın alma önerisi üretir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.support',
    agentId: 'ai.support',
    title: 'AI Support Director',
    tier: 'director',
    reportsTo: 'org.ceo',
    mandate: ['Ticket', 'SLA', 'Memnuniyet', 'Yanıt kalitesi'],
    explainWhy: 'SLA ihlali ve CSAT düşüşü destek brifingi oluşturur.',
    criticalApprovalRequired: false,
  },
  {
    id: 'org.quality',
    agentId: 'ai.quality',
    title: 'AI Quality Director',
    tier: 'director',
    reportsTo: 'org.coo',
    mandate: ['Kalite kontrol', 'Fire', 'Fotoğraf analizi', 'İade', 'AI Vision'],
    explainWhy: 'Fire oranı ve iade nedenleri kalite aksiyonu önerir.',
    criticalApprovalRequired: true,
  },
  {
    id: 'org.analytics',
    agentId: 'ai.data_analyst',
    title: 'AI Analytics Director',
    tier: 'director',
    reportsTo: 'org.ceo',
    mandate: ['Dashboard yorum', 'Trend', 'Tahmin', 'KPI önerisi'],
    explainWhy: 'KPI anomali tespiti analytics yorumu üretir.',
    criticalApprovalRequired: false,
  },
  {
    id: 'org.knowledge',
    agentId: 'ai.knowledge_director',
    title: 'AI Knowledge Director',
    tier: 'director',
    reportsTo: 'org.cto',
    mandate: ['Prosedür öğrenme', 'Belge indeks', 'RAG güncelleme'],
    explainWhy: 'Yeni / güncel belgeler Knowledge indeksi için işaretlenir.',
    criticalApprovalRequired: false,
  },
]

export function getOrganizationCatalog() {
  const nodes = AI_ENTERPRISE_ORG.map((node) => {
    const agent = getAgentById(node.agentId)
    return {
      ...node,
      agent: agent
        ? {
            id: agent.id,
            name: agent.name,
            role: agent.role,
            modules: agent.modules,
            permissions: agent.permissions,
            defaultProvider: agent.defaultProvider,
            defaultModel: agent.defaultModel,
            orgTier: agent.orgTier,
          }
        : null,
    }
  })

  const specialists = AIOS_AGENTS.filter(
    (a) =>
      a.orgTier === 'specialist' ||
      (!a.orgTier && !AI_ENTERPRISE_ORG.some((n) => n.agentId === a.id)),
  ).map((a) => ({
    id: `org.spec.${a.id}`,
    agentId: a.id,
    title: a.name,
    tier: 'specialist' as const,
    reportsTo: null as string | null,
    mandate: [a.description],
    explainWhy: 'Uzman ajan — Orchestrator üzerinden görevlendirilir; peer chat yok.',
    criticalApprovalRequired: false,
    agent: {
      id: a.id,
      name: a.name,
      role: a.role,
      modules: a.modules,
      permissions: a.permissions,
      defaultProvider: a.defaultProvider,
      defaultModel: a.defaultModel,
      orgTier: a.orgTier || 'specialist',
    },
  }))

  return {
    version: 'ORG-0',
    rule: 'Agents never peer-chat; Orchestrator + events only.',
    chart: nodes,
    specialists,
    counts: {
      cSuite: nodes.filter((n) => n.tier === 'ceo' || n.tier === 'c_suite').length,
      directors: nodes.filter((n) => n.tier === 'director').length,
      specialists: specialists.length,
      totalAgents: AIOS_AGENTS.length,
    },
  }
}

export function getOrgNodeById(id: string) {
  return AI_ENTERPRISE_ORG.find((n) => n.id === id) || null
}
