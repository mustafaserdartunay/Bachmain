import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  growthAuditLog,
  growthCampaigns,
  growthCompetitors,
  growthContentAssets,
  growthFunnels,
  growthLeads,
  growthSeoAudits,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { ingestEvent } from '../workflow/workflowService.js'
import { DEFAULT_FUNNEL_STAGES, GROWTH_LOCALES, growthCatalog } from './catalog.js'

async function audit(
  companyId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  payload: Record<string, unknown> = {},
) {
  await db.insert(growthAuditLog).values({
    companyId,
    action,
    entityType,
    entityId,
    payload,
  })
}

export function catalog() {
  return growthCatalog()
}

export async function overview(companyId: string) {
  const [leads] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(growthLeads)
    .where(and(eq(growthLeads.companyId, companyId), isNull(growthLeads.deletedAt)))
  const [hot] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(growthLeads)
    .where(
      and(
        eq(growthLeads.companyId, companyId),
        eq(growthLeads.temperature, 'hot'),
        isNull(growthLeads.deletedAt),
      ),
    )
  const [campaigns] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(growthCampaigns)
    .where(and(eq(growthCampaigns.companyId, companyId), isNull(growthCampaigns.deletedAt)))
  const [content] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(growthContentAssets)
    .where(and(eq(growthContentAssets.companyId, companyId), isNull(growthContentAssets.deletedAt)))
  const [seo] = await db
    .select({ score: growthSeoAudits.score })
    .from(growthSeoAudits)
    .where(and(eq(growthSeoAudits.companyId, companyId), isNull(growthSeoAudits.deletedAt)))
    .orderBy(desc(growthSeoAudits.createdAt))
    .limit(1)

  // AG-0 demo KPIs until live analytics adapters (AG-3)
  return {
    visitorsToday: 128,
    newLeads: leads?.count ?? 0,
    newCustomers: 3,
    quotes: 7,
    orders: 4,
    revenue: 186400,
    adSpend: 12400,
    roas: 2.4,
    roi: 1.8,
    cac: 4100,
    ltv: 28400,
    seoScore: seo?.score ?? 72,
    aiContents: content?.count ?? 0,
    socialPosts: 9,
    hotLeads: hot?.count ?? 0,
    campaigns: campaigns?.count ?? 0,
    currency: 'TRY',
    phase: 'AG-0',
    source: 'ag-0-demo+db',
  }
}

export async function listLeads(companyId: string) {
  return db
    .select()
    .from(growthLeads)
    .where(and(eq(growthLeads.companyId, companyId), isNull(growthLeads.deletedAt)))
    .orderBy(desc(growthLeads.createdAt))
    .limit(200)
}

export async function createLead(
  companyId: string,
  input: {
    source: string
    name?: string
    email?: string
    phone?: string
    companyName?: string
    message?: string
    meta?: Record<string, unknown>
  },
) {
  const [row] = await db
    .insert(growthLeads)
    .values({
      companyId,
      source: input.source,
      name: input.name,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName,
      message: input.message,
      status: 'new',
      meta: input.meta || {},
    })
    .returning()

  await audit(companyId, 'lead.created', 'lead', row.id, { source: input.source })
  await ingestEvent(companyId, 'trigger.growth.lead.created', {
    leadId: row.id,
    source: row.source,
  })
  return row
}

export async function scoreLead(companyId: string, leadId: string) {
  const [row] = await db
    .select()
    .from(growthLeads)
    .where(
      and(
        eq(growthLeads.id, leadId),
        eq(growthLeads.companyId, companyId),
        isNull(growthLeads.deletedAt),
      ),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Lead bulunamadı', 404)

  // AG-0 heuristic stub (AG-1 → AIOS)
  let score = 35
  if (row.email) score += 15
  if (row.phone) score += 10
  if (row.companyName) score += 15
  if (row.message && row.message.length > 40) score += 10
  if (['linkedin', 'web_form', 'api'].includes(row.source)) score += 10
  score = Math.min(98, score)

  const temperature = score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold'
  const purchaseProbability = Math.round(score * 0.85 * 100) / 100
  const estimatedRevenue = temperature === 'hot' ? 45000 : temperature === 'warm' ? 18000 : 5000

  const [updated] = await db
    .update(growthLeads)
    .set({
      score,
      temperature,
      purchaseProbability: String(purchaseProbability),
      estimatedRevenue: String(estimatedRevenue),
      status: 'scored',
      updatedAt: new Date(),
    })
    .where(eq(growthLeads.id, row.id))
    .returning()

  await audit(companyId, 'lead.scored', 'lead', row.id, { score, temperature })
  await ingestEvent(companyId, 'trigger.growth.lead.scored', {
    leadId: row.id,
    score,
    temperature,
  })
  return updated
}

export async function listCampaigns(companyId: string) {
  return db
    .select()
    .from(growthCampaigns)
    .where(and(eq(growthCampaigns.companyId, companyId), isNull(growthCampaigns.deletedAt)))
    .orderBy(desc(growthCampaigns.createdAt))
}

export async function createCampaign(
  companyId: string,
  input: { name: string; channel?: string; budget?: string; currency?: string },
) {
  const [row] = await db
    .insert(growthCampaigns)
    .values({
      companyId,
      name: input.name,
      channel: input.channel || 'multi',
      budget: input.budget,
      currency: input.currency || 'TRY',
      status: 'draft',
    })
    .returning()
  await audit(companyId, 'campaign.created', 'campaign', row.id, { name: row.name })
  await ingestEvent(companyId, 'trigger.growth.campaign.created', { campaignId: row.id })
  return row
}

export async function listContent(companyId: string) {
  return db
    .select()
    .from(growthContentAssets)
    .where(and(eq(growthContentAssets.companyId, companyId), isNull(growthContentAssets.deletedAt)))
    .orderBy(desc(growthContentAssets.createdAt))
    .limit(200)
}

export async function createContent(
  companyId: string,
  input: {
    kind: string
    locale?: string
    title?: string
    body?: string
    channelTargets?: string[]
  },
) {
  const [row] = await db
    .insert(growthContentAssets)
    .values({
      companyId,
      kind: input.kind,
      locale: input.locale || 'tr',
      title: input.title,
      body: input.body,
      channelTargets: input.channelTargets || [],
      status: 'draft',
    })
    .returning()
  await audit(companyId, 'content.created', 'content', row.id, { kind: row.kind })
  return row
}

export async function expandContentI18n(companyId: string, contentId: string) {
  const [parent] = await db
    .select()
    .from(growthContentAssets)
    .where(
      and(
        eq(growthContentAssets.id, contentId),
        eq(growthContentAssets.companyId, companyId),
        isNull(growthContentAssets.deletedAt),
      ),
    )
    .limit(1)
  if (!parent) throw new AppError('NOT_FOUND', 'İçerik bulunamadı', 404)

  const created = []
  for (const locale of GROWTH_LOCALES) {
    if (locale === parent.locale) continue
    const [row] = await db
      .insert(growthContentAssets)
      .values({
        companyId,
        kind: parent.kind,
        locale,
        title: `[${locale.toUpperCase()}] ${parent.title || 'Untitled'}`,
        body: parent.body
          ? `(AG-0 stub translation → ${locale})\n\n${parent.body}`
          : `(AG-0 stub translation → ${locale})`,
        status: 'draft',
        parentId: parent.id,
        channelTargets: parent.channelTargets || [],
        meta: { i18nStub: true, from: parent.locale },
      })
      .returning()
    created.push(row)
  }

  await audit(companyId, 'content.i18n_expanded', 'content', parent.id, {
    locales: created.map((c) => c.locale),
  })
  await ingestEvent(companyId, 'trigger.growth.content.i18n', {
    contentId: parent.id,
    count: created.length,
  })
  return { parent, translations: created }
}

export async function listSeoAudits(companyId: string) {
  return db
    .select()
    .from(growthSeoAudits)
    .where(and(eq(growthSeoAudits.companyId, companyId), isNull(growthSeoAudits.deletedAt)))
    .orderBy(desc(growthSeoAudits.createdAt))
    .limit(50)
}

export async function runSeoAudit(companyId: string, url?: string) {
  const score = 68 + Math.floor(Math.random() * 20)
  const [row] = await db
    .insert(growthSeoAudits)
    .values({
      companyId,
      url: url || 'https://example.com',
      score,
      findings: [
        { code: 'meta_title', severity: 'warn', message: 'Title 60 karakteri aşıyor olabilir' },
        { code: 'h1', severity: 'info', message: 'H1 tek ve net' },
        { code: 'schema', severity: 'warn', message: 'FAQ schema eksik' },
      ],
      recommendations: [
        'Meta description güçlendir',
        'İç link ağı ekle',
        'FAQ schema ekle',
        'GSC kapsama hatalarını kontrol et',
      ],
      status: 'done',
      meta: { source: 'ag-0-stub' },
    })
    .returning()
  await audit(companyId, 'seo.audit', 'seo_audit', row.id, { score })
  await ingestEvent(companyId, 'trigger.growth.seo.audited', { auditId: row.id, score })
  return row
}

export async function listCompetitors(companyId: string) {
  return db
    .select()
    .from(growthCompetitors)
    .where(and(eq(growthCompetitors.companyId, companyId), isNull(growthCompetitors.deletedAt)))
}

export async function createCompetitor(
  companyId: string,
  input: { name: string; website?: string; notes?: string },
) {
  const [row] = await db
    .insert(growthCompetitors)
    .values({
      companyId,
      name: input.name,
      website: input.website,
      notes: input.notes,
      lastAnalysis: {
        seoScore: 61,
        contentVelocity: 'orta',
        adsPresence: 'var',
        stub: true,
      },
    })
    .returning()
  await audit(companyId, 'competitor.added', 'competitor', row.id, { name: row.name })
  return row
}

export async function listFunnels(companyId: string) {
  return db
    .select()
    .from(growthFunnels)
    .where(and(eq(growthFunnels.companyId, companyId), isNull(growthFunnels.deletedAt)))
}

export async function createFunnel(companyId: string, name: string) {
  const [row] = await db
    .insert(growthFunnels)
    .values({
      companyId,
      name,
      status: 'draft',
      stages: DEFAULT_FUNNEL_STAGES.map((s) => ({ ...s, count: 0 })),
    })
    .returning()
  await audit(companyId, 'funnel.created', 'funnel', row.id, { name })
  return row
}

export async function listAudit(companyId: string) {
  return db
    .select()
    .from(growthAuditLog)
    .where(and(eq(growthAuditLog.companyId, companyId), isNull(growthAuditLog.deletedAt)))
    .orderBy(desc(growthAuditLog.createdAt))
    .limit(100)
}
