import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  featureFlags,
  platformHealthSnapshots,
  platformIntegrations,
  platformJobs,
  platformModules,
  platformPlugins,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

const MODULE_SEED = [
  {
    code: 'identity',
    label: 'Identity',
    route: '/profil',
    apiPrefix: '/v1/auth',
    domain: 'platform',
    entitlementCode: 'dashboard_basic',
  },
  {
    code: 'mdm',
    label: 'Master Data',
    route: '/ayarlar/master-data',
    apiPrefix: '/v1/mdm',
    domain: 'mdm',
    entitlementCode: 'crm',
  },
  {
    code: 'workflow',
    label: 'Workflow Engine',
    route: '/otomasyon',
    apiPrefix: '/v1/workflows',
    domain: 'platform',
    entitlementCode: 'crm',
  },
  {
    code: 'aios',
    label: 'AIOS / AI Gateway',
    route: '/aios',
    apiPrefix: '/v1/aios',
    domain: 'ai',
    entitlementCode: 'ai_growth',
  },
  {
    code: 'knowledge',
    label: 'Knowledge',
    route: '/bilgi-merkezi',
    apiPrefix: '/v1/knowledge',
    domain: 'knowledge',
    entitlementCode: 'crm',
  },
  {
    code: 'twin',
    label: 'Digital Twin',
    route: '/dijital-ikiz',
    apiPrefix: '/v1/twin',
    domain: 'twin',
    entitlementCode: 'crm',
  },
  {
    code: 'commerce',
    label: 'Commerce',
    route: '/ticaret',
    apiPrefix: '/v1/commerce',
    domain: 'commerce',
    entitlementCode: 'pos',
  },
  {
    code: 'growth',
    label: 'AI Growth',
    route: '/ai-buyume',
    apiPrefix: '/v1/growth',
    domain: 'growth',
    entitlementCode: 'ai_growth',
  },
  {
    code: 'mes',
    label: 'MES',
    route: '/mes',
    apiPrefix: '/v1/mes',
    domain: 'mes',
    entitlementCode: 'production',
  },
  {
    code: 'finance',
    label: 'Finance',
    route: '/finans',
    apiPrefix: '/v1/finance',
    domain: 'finance',
    entitlementCode: 'finance',
  },
  {
    code: 'cxc',
    label: 'Customer Experience',
    route: '/musteri-deneyimi',
    apiPrefix: '/v1/cxc',
    domain: 'crm',
    entitlementCode: 'crm',
  },
  {
    code: 'documents',
    label: 'Document Platform',
    route: '/belge-merkezi',
    apiPrefix: '/v1/documents',
    domain: 'documents',
    entitlementCode: 'crm',
  },
  {
    code: 'analytics',
    label: 'Analytics',
    route: '/analitik',
    apiPrefix: '/v1/analytics',
    domain: 'analytics',
    entitlementCode: 'reporting',
  },
  {
    code: 'crm',
    label: 'CRM / ERP SoT',
    route: '/musteriler',
    apiPrefix: '/v1/crm',
    domain: 'crm',
    entitlementCode: 'crm',
  },
  {
    code: 'billing',
    label: 'License / Billing',
    route: '/hesap/lisans',
    apiPrefix: '/v1/billing',
    domain: 'platform',
    entitlementCode: 'dashboard_basic',
  },
]

const INTEGRATION_SEED = [
  { code: 'openai', label: 'OpenAI', kind: 'ai' },
  { code: 'stripe', label: 'Stripe', kind: 'billing' },
  { code: 'whatsapp', label: 'WhatsApp Cloud', kind: 'messaging' },
  { code: 'resend', label: 'Resend Email', kind: 'messaging' },
  { code: 'google_maps', label: 'Google Maps', kind: 'maps' },
]

const PLUGIN_SEED = [
  { slug: 'sample-kpi-widget', title: 'Sample KPI Widget', kind: 'widget' },
  { slug: 'sample-workflow-pack', title: 'Sample Workflow Pack', kind: 'workflow' },
]

async function ensureModules() {
  const [existing] = await db.select().from(platformModules).limit(1)
  if (existing) return
  for (const row of MODULE_SEED) {
    await db.insert(platformModules).values({ ...row, status: 'active', version: '2026' })
  }
}

async function ensureIntegrations() {
  const [existing] = await db.select().from(platformIntegrations).limit(1)
  if (existing) return
  for (const row of INTEGRATION_SEED) {
    await db.insert(platformIntegrations).values({ ...row, status: 'configured' })
  }
}

async function ensurePlugins() {
  const [existing] = await db.select().from(platformPlugins).limit(1)
  if (existing) return
  for (const row of PLUGIN_SEED) {
    await db.insert(platformPlugins).values({ ...row, status: 'available', version: '0.1.0' })
  }
}

export async function overview() {
  await ensureModules()
  await ensureIntegrations()
  await ensurePlugins()
  const [mods] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformModules)
    .where(and(eq(platformModules.status, 'active'), isNull(platformModules.deletedAt)))
  const [jobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(platformJobs)
    .where(and(eq(platformJobs.status, 'queued'), isNull(platformJobs.deletedAt)))
  const [flags] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(featureFlags)
    .where(isNull(featureFlags.deletedAt))

  return {
    phase: 'PC-0',
    architecture: 'modular-monolith',
    activeModules: mods?.count ?? 0,
    queuedJobs: jobs?.count ?? 0,
    featureFlags: flags?.count ?? 0,
    eventBus: 'workflow.catalog + publishDomainEvent',
    links: {
      workflow: '/otomasyon',
      aios: '/aios',
      mdm: '/ayarlar/master-data',
      settings: '/ayarlar',
      license: '/hesap/lisans',
      onboarding: '/kurulum',
    },
  }
}

export async function listModules() {
  await ensureModules()
  return db
    .select()
    .from(platformModules)
    .where(isNull(platformModules.deletedAt))
    .orderBy(asc(platformModules.domain), asc(platformModules.code))
}

export async function createModule(input: {
  code: string
  label: string
  route?: string
  apiPrefix?: string
  domain?: string
  entitlementCode?: string
}) {
  const [row] = await db
    .insert(platformModules)
    .values({
      code: input.code,
      label: input.label,
      route: input.route,
      apiPrefix: input.apiPrefix,
      domain: input.domain || 'custom',
      entitlementCode: input.entitlementCode,
      status: 'active',
    })
    .returning()
  return row
}

export async function patchModule(code: string, status: string) {
  const [row] = await db
    .update(platformModules)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(platformModules.code, code), isNull(platformModules.deletedAt)))
    .returning()
  return row
}

export async function listFlags() {
  return db
    .select()
    .from(featureFlags)
    .where(isNull(featureFlags.deletedAt))
    .orderBy(asc(featureFlags.key))
}

export async function upsertFlag(input: { key: string; enabled?: boolean; description?: string }) {
  const [existing] = await db
    .select()
    .from(featureFlags)
    .where(and(eq(featureFlags.key, input.key), isNull(featureFlags.deletedAt)))
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(featureFlags)
      .set({
        enabled: input.enabled ?? existing.enabled,
        description: input.description ?? existing.description,
        updatedAt: new Date(),
      })
      .where(eq(featureFlags.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(featureFlags)
    .values({
      key: input.key,
      enabled: input.enabled ?? false,
      description: input.description,
    })
    .returning()
  return row
}

export async function compositeHealth() {
  const checks = [
    { service: 'api', status: 'ok', latencyMs: 2 },
    { service: 'database', status: 'ok', latencyMs: 12 },
    { service: 'redis', status: 'degraded', latencyMs: 40, detail: { note: 'optional' } },
    { service: 'ai_gateway', status: 'ok', latencyMs: 8 },
    { service: 'email', status: 'ok', latencyMs: 5 },
    { service: 'whatsapp', status: 'unknown', latencyMs: null },
    { service: 'google_maps', status: 'ok', latencyMs: 15 },
    { service: 'billing', status: 'ok', latencyMs: 20 },
  ]
  for (const c of checks) {
    await db.insert(platformHealthSnapshots).values({
      service: c.service,
      status: c.status,
      latencyMs: c.latencyMs ?? undefined,
      detail: c.detail || {},
      checkedAt: new Date(),
    })
  }
  return {
    overall: checks.every((c) => c.status === 'ok' || c.status === 'degraded')
      ? 'healthy'
      : 'degraded',
    checks,
    phase: 'PC-0',
  }
}

export async function listJobs(companyId?: string) {
  const cond = [isNull(platformJobs.deletedAt)]
  if (companyId) cond.push(eq(platformJobs.companyId, companyId))
  return db
    .select()
    .from(platformJobs)
    .where(and(...cond))
    .orderBy(desc(platformJobs.createdAt))
    .limit(100)
}

export async function enqueueJob(
  companyId: string | null,
  input: { name: string; queue?: string; priority?: number; payload?: Record<string, unknown> },
) {
  const [row] = await db
    .insert(platformJobs)
    .values({
      companyId: companyId || undefined,
      name: input.name,
      queue: input.queue || 'default',
      priority: input.priority ?? 50,
      payload: input.payload || {},
      status: 'queued',
      runAt: new Date(),
    })
    .returning()
  if (companyId) {
    await ingestEvent(companyId, 'trigger.platform.job.queued', { jobId: row.id, name: row.name })
  }
  return row
}

export async function listIntegrations() {
  await ensureIntegrations()
  return db.select().from(platformIntegrations).where(isNull(platformIntegrations.deletedAt))
}

export async function listPlugins() {
  await ensurePlugins()
  return db.select().from(platformPlugins).where(isNull(platformPlugins.deletedAt))
}

export function eventCatalogSummary() {
  return {
    source: 'workflow NODE_CATALOG',
    bus: 'publishDomainEvent / ingestEvent',
    sampleTriggers: [
      'trigger.customer.created',
      'trigger.order.created',
      'trigger.production.started',
      'trigger.payment.received',
      'trigger.analytics.dashboard.layout_saved',
      'trigger.document.rendered',
      'trigger.platform.job.queued',
    ],
    note: 'Single event bus — do not invent a parallel bus in domains.',
  }
}
