import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  cxcAiInsights,
  cxcHealthScores,
  cxcLoyalty,
  cxcNextActions,
  cxcOpportunities,
  cxcPipelineStages,
  cxcSupportTickets,
  cxcTimelineEvents,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

const DEFAULT_STAGES = [
  { code: 'new_lead', label: 'Yeni Lead', sortOrder: 10, color: '#94a3b8' },
  { code: 'contacted', label: 'İletişime Geçildi', sortOrder: 20, color: '#38bdf8' },
  { code: 'quote_prep', label: 'Teklif Hazırlanıyor', sortOrder: 30, color: '#a78bfa' },
  { code: 'quote_sent', label: 'Teklif Gönderildi', sortOrder: 40, color: '#818cf8' },
  { code: 'revision', label: 'Revizyon', sortOrder: 50, color: '#fbbf24' },
  { code: 'awaiting', label: 'Onay Bekliyor', sortOrder: 60, color: '#fb923c' },
  { code: 'won', label: 'Siparişe Dönüştü', sortOrder: 70, color: '#34d399', isWon: true },
  { code: 'lost', label: 'Kaybedildi', sortOrder: 80, color: '#f87171', isLost: true },
]

async function ensureStages(companyId: string) {
  const [existing] = await db
    .select()
    .from(cxcPipelineStages)
    .where(and(eq(cxcPipelineStages.companyId, companyId), isNull(cxcPipelineStages.deletedAt)))
    .limit(1)
  if (existing) return
  for (const row of DEFAULT_STAGES) {
    await db.insert(cxcPipelineStages).values({
      companyId,
      code: row.code,
      label: row.label,
      sortOrder: row.sortOrder,
      color: row.color,
      isWon: Boolean(row.isWon),
      isLost: Boolean(row.isLost),
      active: true,
    })
  }
}

export async function overview(companyId: string) {
  await ensureStages(companyId)
  const [ops] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cxcOpportunities)
    .where(and(eq(cxcOpportunities.companyId, companyId), isNull(cxcOpportunities.deletedAt)))
  const [tickets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cxcSupportTickets)
    .where(
      and(
        eq(cxcSupportTickets.companyId, companyId),
        eq(cxcSupportTickets.status, 'open'),
        isNull(cxcSupportTickets.deletedAt),
      ),
    )
  const [actions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cxcNextActions)
    .where(
      and(
        eq(cxcNextActions.companyId, companyId),
        eq(cxcNextActions.status, 'pending'),
        isNull(cxcNextActions.deletedAt),
      ),
    )

  return {
    phase: 'CXC-0',
    customersAtRisk: 3,
    topCustomers: 12,
    openOpportunities: ops?.count ?? 0,
    openTickets: tickets?.count ?? 0,
    pendingActions: actions?.count ?? 0,
    avgHealthScore: 72,
    pipelineValue: 1850000,
    currency: 'TRY',
    source: 'cxc-0-demo+projection',
    links: {
      customers: '/musteriler',
      crm: '/crm',
      leads: '/ai-buyume/lead',
      messages: '/mesajlar',
      finance: '/finans',
    },
  }
}

export async function listStages(companyId: string) {
  await ensureStages(companyId)
  return db
    .select()
    .from(cxcPipelineStages)
    .where(and(eq(cxcPipelineStages.companyId, companyId), isNull(cxcPipelineStages.deletedAt)))
    .orderBy(asc(cxcPipelineStages.sortOrder))
}

export async function createStage(
  companyId: string,
  input: { code: string; label: string; sortOrder?: number; color?: string },
) {
  const [row] = await db
    .insert(cxcPipelineStages)
    .values({
      companyId,
      code: input.code,
      label: input.label,
      sortOrder: input.sortOrder ?? 100,
      color: input.color,
      active: true,
    })
    .returning()
  return row
}

export async function listOpportunities(companyId: string, customerId?: string) {
  await ensureStages(companyId)
  const cond = [eq(cxcOpportunities.companyId, companyId), isNull(cxcOpportunities.deletedAt)]
  if (customerId) cond.push(eq(cxcOpportunities.customerId, customerId))
  return db
    .select()
    .from(cxcOpportunities)
    .where(and(...cond))
    .orderBy(desc(cxcOpportunities.updatedAt))
}

export async function createOpportunity(
  companyId: string,
  input: {
    customerId: string
    title: string
    stageCode?: string
    amount?: number
    source?: string
  },
) {
  await ensureStages(companyId)
  const [row] = await db
    .insert(cxcOpportunities)
    .values({
      companyId,
      customerId: input.customerId,
      title: input.title,
      stageCode: input.stageCode || 'new_lead',
      amount: String(input.amount ?? 0),
      source: input.source,
      probability: 10,
    })
    .returning()
  await ingestEvent(companyId, 'trigger.cxc.opportunity.created', {
    opportunityId: row.id,
    customerId: input.customerId,
  })
  return row
}

export async function moveOpportunityStage(companyId: string, id: string, stageCode: string) {
  const [row] = await db
    .update(cxcOpportunities)
    .set({ stageCode, updatedAt: new Date() })
    .where(
      and(
        eq(cxcOpportunities.id, id),
        eq(cxcOpportunities.companyId, companyId),
        isNull(cxcOpportunities.deletedAt),
      ),
    )
    .returning()
  if (row) {
    await ingestEvent(companyId, 'trigger.cxc.opportunity.stage_changed', {
      opportunityId: id,
      stageCode,
      customerId: row.customerId,
    })
  }
  return row
}

export async function customer360(companyId: string, customerId: string) {
  const [health] = await db
    .select()
    .from(cxcHealthScores)
    .where(
      and(
        eq(cxcHealthScores.companyId, companyId),
        eq(cxcHealthScores.customerId, customerId),
        isNull(cxcHealthScores.deletedAt),
      ),
    )
    .limit(1)
  const [loyalty] = await db
    .select()
    .from(cxcLoyalty)
    .where(
      and(
        eq(cxcLoyalty.companyId, companyId),
        eq(cxcLoyalty.customerId, customerId),
        isNull(cxcLoyalty.deletedAt),
      ),
    )
    .limit(1)
  const opportunities = await listOpportunities(companyId, customerId)
  const tickets = await listTickets(companyId, customerId)
  const actions = await listNextActions(companyId, customerId)
  const timeline = await listTimeline(companyId, customerId)
  return {
    customerId,
    health: health || {
      score: 68,
      churnRisk: 'medium',
      factors: {
        orders: 70,
        collections: 65,
        support: 80,
        satisfaction: 72,
        activity: 60,
        profitability: 75,
      },
    },
    loyalty: loyalty || { tier: 'silver', points: 420, discountPct: '5' },
    opportunities,
    tickets,
    nextActions: actions,
    timelinePreview: timeline.slice(0, 8),
    links: {
      detail: `/musteriler/${customerId}`,
      crm: '/crm',
      invoices: '/musteriler/faturalar',
      messages: '/mesajlar',
    },
  }
}

export async function listTimeline(companyId: string, customerId: string, kind?: string) {
  const cond = [
    eq(cxcTimelineEvents.companyId, companyId),
    eq(cxcTimelineEvents.customerId, customerId),
    isNull(cxcTimelineEvents.deletedAt),
  ]
  if (kind) cond.push(eq(cxcTimelineEvents.kind, kind))
  const rows = await db
    .select()
    .from(cxcTimelineEvents)
    .where(and(...cond))
    .orderBy(desc(cxcTimelineEvents.occurredAt))
    .limit(100)
  if (rows.length) return rows
  return demoTimeline(customerId)
}

function demoTimeline(customerId: string) {
  const now = Date.now()
  return [
    {
      id: 'demo-t1',
      customerId,
      kind: 'call',
      title: 'Telefon görüşmesi',
      summary: 'Fiyat revizyonu konuşuldu',
      occurredAt: new Date(now - 2 * 3600e3),
      sourceModule: 'crm',
    },
    {
      id: 'demo-t2',
      customerId,
      kind: 'whatsapp',
      title: 'WhatsApp mesajı',
      summary: 'Numune fotoğrafları gönderildi',
      occurredAt: new Date(now - 26 * 3600e3),
      sourceModule: 'omni',
    },
    {
      id: 'demo-t3',
      customerId,
      kind: 'quote',
      title: 'Teklif gönderildi',
      summary: 'TKL-2026-0142',
      occurredAt: new Date(now - 3 * 86400e3),
      sourceModule: 'quotes',
    },
    {
      id: 'demo-t4',
      customerId,
      kind: 'invoice',
      title: 'Fatura kesildi',
      summary: 'FAT-2026-0088',
      occurredAt: new Date(now - 7 * 86400e3),
      sourceModule: 'finance',
    },
    {
      id: 'demo-t5',
      customerId,
      kind: 'payment',
      title: 'Tahsilat',
      summary: '45.000 TRY',
      occurredAt: new Date(now - 8 * 86400e3),
      sourceModule: 'finance',
    },
  ]
}

export async function upsertHealth(
  companyId: string,
  input: {
    customerId: string
    score: number
    churnRisk?: string
    factors?: Record<string, unknown>
  },
) {
  const [existing] = await db
    .select()
    .from(cxcHealthScores)
    .where(
      and(
        eq(cxcHealthScores.companyId, companyId),
        eq(cxcHealthScores.customerId, input.customerId),
        isNull(cxcHealthScores.deletedAt),
      ),
    )
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(cxcHealthScores)
      .set({
        score: input.score,
        churnRisk: input.churnRisk || existing.churnRisk,
        factors: input.factors || existing.factors,
        computedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(cxcHealthScores.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(cxcHealthScores)
    .values({
      companyId,
      customerId: input.customerId,
      score: input.score,
      churnRisk: input.churnRisk || 'medium',
      factors: input.factors || {},
      computedAt: new Date(),
    })
    .returning()
  return row
}

export async function listHealth(companyId: string) {
  return db
    .select()
    .from(cxcHealthScores)
    .where(and(eq(cxcHealthScores.companyId, companyId), isNull(cxcHealthScores.deletedAt)))
    .orderBy(asc(cxcHealthScores.score))
}

export async function listLoyalty(companyId: string) {
  return db
    .select()
    .from(cxcLoyalty)
    .where(and(eq(cxcLoyalty.companyId, companyId), isNull(cxcLoyalty.deletedAt)))
}

export async function upsertLoyalty(
  companyId: string,
  input: { customerId: string; tier: string; points?: number; discountPct?: number },
) {
  const [existing] = await db
    .select()
    .from(cxcLoyalty)
    .where(
      and(
        eq(cxcLoyalty.companyId, companyId),
        eq(cxcLoyalty.customerId, input.customerId),
        isNull(cxcLoyalty.deletedAt),
      ),
    )
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(cxcLoyalty)
      .set({
        tier: input.tier,
        points: input.points ?? existing.points,
        discountPct: input.discountPct != null ? String(input.discountPct) : existing.discountPct,
        updatedAt: new Date(),
      })
      .where(eq(cxcLoyalty.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(cxcLoyalty)
    .values({
      companyId,
      customerId: input.customerId,
      tier: input.tier,
      points: input.points ?? 0,
      discountPct: String(input.discountPct ?? 0),
    })
    .returning()
  return row
}

export async function listTickets(companyId: string, customerId?: string) {
  const cond = [eq(cxcSupportTickets.companyId, companyId), isNull(cxcSupportTickets.deletedAt)]
  if (customerId) cond.push(eq(cxcSupportTickets.customerId, customerId))
  return db
    .select()
    .from(cxcSupportTickets)
    .where(and(...cond))
    .orderBy(desc(cxcSupportTickets.createdAt))
}

export async function createTicket(
  companyId: string,
  input: {
    customerId: string
    subject: string
    channel?: string
    priority?: string
    aiSummary?: string
  },
) {
  const [row] = await db
    .insert(cxcSupportTickets)
    .values({
      companyId,
      customerId: input.customerId,
      subject: input.subject,
      channel: input.channel || 'portal',
      priority: input.priority || 'normal',
      status: 'open',
      aiSummary: input.aiSummary,
      slaDueAt: new Date(Date.now() + 24 * 3600e3),
    })
    .returning()
  await ingestEvent(companyId, 'trigger.cxc.ticket.created', {
    ticketId: row.id,
    customerId: input.customerId,
  })
  return row
}

export async function aiInsights(companyId: string, customerId?: string) {
  const cond = [eq(cxcAiInsights.companyId, companyId), isNull(cxcAiInsights.deletedAt)]
  if (customerId) cond.push(eq(cxcAiInsights.customerId, customerId))
  const rows = await db
    .select()
    .from(cxcAiInsights)
    .where(and(...cond))
    .orderBy(desc(cxcAiInsights.createdAt))
    .limit(20)
  if (rows.length) return rows
  return [
    {
      id: 'demo-i1',
      companyId,
      customerId: customerId || null,
      kind: 'purchase_habit',
      title: 'Satın alma alışkanlığı',
      payload: { avgOrderDays: 28, preferredSku: 'PANEL-A', seasonality: 'Q2 peak' },
    },
    {
      id: 'demo-i2',
      companyId,
      customerId: customerId || null,
      kind: 'churn',
      title: 'Churn ihtimali',
      payload: { probability: 0.22, drivers: ['last_contact_45d', 'open_ticket'] },
    },
    {
      id: 'demo-i3',
      companyId,
      customerId: customerId || null,
      kind: 'repurchase',
      title: 'Tekrar satın alma olasılığı',
      payload: { probability: 0.71, nextWindowDays: 14 },
    },
  ]
}

export async function listNextActions(companyId: string, customerId?: string) {
  const cond = [eq(cxcNextActions.companyId, companyId), isNull(cxcNextActions.deletedAt)]
  if (customerId) cond.push(eq(cxcNextActions.customerId, customerId))
  const rows = await db
    .select()
    .from(cxcNextActions)
    .where(and(...cond))
    .orderBy(desc(cxcNextActions.priority))
    .limit(30)
  if (rows.length) return rows
  return [
    {
      id: 'demo-a1',
      customerId: customerId || 'demo',
      action: 'Bu müşteriyi ara.',
      reason: 'Son görüşme 12 gün önce',
      priority: 90,
      status: 'pending',
    },
    {
      id: 'demo-a2',
      customerId: customerId || 'demo',
      action: 'Tahsilatı hatırlat.',
      reason: 'Vadesi geçmiş bakiye',
      priority: 85,
      status: 'pending',
    },
    {
      id: 'demo-a3',
      customerId: customerId || 'demo',
      action: 'Yeni teklif gönder.',
      reason: 'Ürün fiyat güncellemesi',
      priority: 70,
      status: 'pending',
    },
  ]
}

export async function createNextAction(
  companyId: string,
  input: { customerId: string; action: string; reason?: string; priority?: number },
) {
  const [row] = await db
    .insert(cxcNextActions)
    .values({
      companyId,
      customerId: input.customerId,
      action: input.action,
      reason: input.reason,
      priority: input.priority ?? 50,
      status: 'pending',
    })
    .returning()
  return row
}
