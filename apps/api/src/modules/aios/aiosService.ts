import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  aiosAgentConfigs,
  aiosApprovals,
  aiosMemory,
  aiosRuns,
  aiosRunSteps,
  aiosSchedules,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { maskSensitiveText } from '../../shared/crypto.js'
import { AIOS_AGENTS, getAgentById } from './agentsCatalog.js'
import { AIOS_TOOLS, getToolById } from './toolsCatalog.js'
import { gatewayChat, listProviders, type ChatMessage, type ModelProviderId } from './gateway.js'
import { getOrganizationCatalog, getOrgNodeById } from './organizationCatalog.js'
import { getAutonomousCatalog } from './autonomousCatalog.js'
import { getAppBuilderCatalog } from './appBuilderCatalog.js'

export function getCatalog() {
  return {
    agents: AIOS_AGENTS,
    tools: AIOS_TOOLS,
    providers: listProviders(),
    organization: getOrganizationCatalog(),
    autonomous: getAutonomousCatalog(),
    appBuilder: getAppBuilderCatalog(),
  }
}

export function getOrganization() {
  return getOrganizationCatalog()
}

export async function overview(companyId: string) {
  const [runCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiosRuns)
    .where(eq(aiosRuns.companyId, companyId))
  const [pendingApprovals] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiosApprovals)
    .where(and(eq(aiosApprovals.companyId, companyId), eq(aiosApprovals.status, 'pending')))
  const [costRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${aiosRuns.estimatedCostUsd}), 0)`,
    })
    .from(aiosRuns)
    .where(eq(aiosRuns.companyId, companyId))

  const providers = listProviders()
  return {
    agentsTotal: AIOS_AGENTS.length,
    agentsEnabled: AIOS_AGENTS.length,
    runsTotal: runCount?.count || 0,
    pendingApprovals: pendingApprovals?.count || 0,
    estimatedCostUsd: Number(costRow?.total || 0),
    providersConfigured: providers.filter((p) => p.configured).length,
    providers,
  }
}

export async function listAgentsForCompany(companyId: string) {
  const configs = await db
    .select()
    .from(aiosAgentConfigs)
    .where(eq(aiosAgentConfigs.companyId, companyId))
  const byId = new Map(configs.map((c) => [c.agentId, c]))

  return AIOS_AGENTS.map((agent) => {
    const cfg = byId.get(agent.id)
    return {
      ...agent,
      status: cfg?.enabled === false ? 'disabled' : 'ready',
      modelProvider: cfg?.modelProvider || agent.defaultProvider,
      modelId: cfg?.modelId || agent.defaultModel,
      costLimitUsd: cfg?.costLimitUsd != null ? Number(cfg.costLimitUsd) : agent.costLimitUsd,
      modules: cfg?.modules?.length ? cfg.modules : agent.modules,
      permissions: cfg?.permissions?.length ? cfg.permissions : agent.permissions,
      memoryEnabled: cfg?.memoryEnabled ?? true,
      configId: cfg?.id || null,
    }
  })
}

export async function upsertAgentConfig(
  companyId: string,
  agentId: string,
  patch: {
    enabled?: boolean
    modelProvider?: string
    modelId?: string
    costLimitUsd?: number
    modules?: string[]
    permissions?: string[]
    memoryEnabled?: boolean
  },
) {
  if (!getAgentById(agentId)) throw new AppError('NOT_FOUND', 'Agent bulunamadı', 404)
  const existing = await db
    .select()
    .from(aiosAgentConfigs)
    .where(and(eq(aiosAgentConfigs.companyId, companyId), eq(aiosAgentConfigs.agentId, agentId)))
    .limit(1)

  if (existing[0]) {
    const [row] = await db
      .update(aiosAgentConfigs)
      .set({
        enabled: patch.enabled ?? existing[0].enabled,
        modelProvider: patch.modelProvider ?? existing[0].modelProvider,
        modelId: patch.modelId ?? existing[0].modelId,
        costLimitUsd:
          patch.costLimitUsd != null ? String(patch.costLimitUsd) : existing[0].costLimitUsd,
        modules: patch.modules ?? existing[0].modules,
        permissions: patch.permissions ?? existing[0].permissions,
        memoryEnabled: patch.memoryEnabled ?? existing[0].memoryEnabled,
        updatedAt: new Date(),
      })
      .where(eq(aiosAgentConfigs.id, existing[0].id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(aiosAgentConfigs)
    .values({
      companyId,
      agentId,
      enabled: patch.enabled ?? true,
      modelProvider: patch.modelProvider || null,
      modelId: patch.modelId || null,
      costLimitUsd: patch.costLimitUsd != null ? String(patch.costLimitUsd) : null,
      modules: patch.modules || [],
      permissions: patch.permissions || [],
      memoryEnabled: patch.memoryEnabled ?? true,
    })
    .returning()
  return row
}

export async function runAgentChat(input: {
  companyId: string
  userId?: string
  agentId: string
  messages: ChatMessage[]
  provider?: ModelProviderId
  model?: string
}) {
  const agent = getAgentById(input.agentId)
  if (!agent) throw new AppError('NOT_FOUND', 'Agent bulunamadı', 404)

  const provider = (input.provider || agent.defaultProvider) as ModelProviderId
  const model = input.model || agent.defaultModel
  const system: ChatMessage = {
    role: 'system',
    content: `Sen BachMain AIOS ajanısın: ${agent.name}. Rol: ${agent.role}. Modüller: ${agent.modules.join(', ')}. Gizli anahtar, şifre, JWT, kart, IBAN istemez ve üretmezsin. Doğrudan DB yazmazsın; araçlar üzerinden çalışırsın.`,
  }

  const started = Date.now()
  const [run] = await db
    .insert(aiosRuns)
    .values({
      companyId: input.companyId,
      agentId: agent.id,
      userId: input.userId || null,
      provider,
      model,
      status: 'running',
    })
    .returning()

  try {
    const safeMessages = input.messages.filter((m) => m.role !== 'system')
    const result = await gatewayChat({
      provider,
      model,
      messages: [system, ...safeMessages],
    })

    await db.insert(aiosRunSteps).values({
      runId: run.id,
      companyId: input.companyId,
      kind: 'model',
      name: `${provider}/${model}`,
      status: 'success',
      durationMs: Date.now() - started,
      output: {
        stub: Boolean(result.stub),
        contentPreview: maskSensitiveText(result.content).slice(0, 240),
      },
    })

    const [done] = await db
      .update(aiosRuns)
      .set({
        status: 'completed',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        estimatedCostUsd: String(result.estimatedCostUsd),
        durationMs: Date.now() - started,
        finishedAt: new Date(),
        updatedAt: new Date(),
        meta: { stub: Boolean(result.stub) },
      })
      .where(eq(aiosRuns.id, run.id))
      .returning()

    return { run: done, content: result.content, stub: result.stub }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AIOS hata'
    await db
      .update(aiosRuns)
      .set({
        status: 'failed',
        error: message,
        durationMs: Date.now() - started,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiosRuns.id, run.id))
    throw err
  }
}

export async function invokeTool(input: {
  companyId: string
  userId?: string
  agentId?: string
  toolId: string
  payload?: Record<string, unknown>
}) {
  const tool = getToolById(input.toolId)
  if (!tool) throw new AppError('NOT_FOUND', 'Araç bulunamadı', 404)

  const [run] = await db
    .insert(aiosRuns)
    .values({
      companyId: input.companyId,
      agentId: input.agentId || 'ai.system',
      userId: input.userId || null,
      status: tool.requiresHumanApproval ? 'awaiting_approval' : 'completed',
      requiresApproval: tool.requiresHumanApproval,
      finishedAt: tool.requiresHumanApproval ? null : new Date(),
      durationMs: 1,
      meta: { toolId: tool.id },
    })
    .returning()

  if (tool.requiresHumanApproval) {
    const [approval] = await db
      .insert(aiosApprovals)
      .values({
        companyId: input.companyId,
        runId: run.id,
        toolId: tool.id,
        agentId: input.agentId || null,
        requestedBy: input.userId || null,
        status: 'pending',
        payload: input.payload || {},
      })
      .returning()

    await db.insert(aiosRunSteps).values({
      runId: run.id,
      companyId: input.companyId,
      kind: 'approval',
      name: tool.id,
      status: 'pending',
      input: input.payload || {},
      output: { approvalId: approval.id },
    })

    return { status: 'awaiting_approval' as const, run, approval }
  }

  // AIOS-0: safe tools return simulated success (real adapters in AIOS-1)
  const output = {
    ok: true,
    simulated: true,
    toolId: tool.id,
    message: `${tool.label} simüle edildi (AIOS-0).`,
  }

  await db.insert(aiosRunSteps).values({
    runId: run.id,
    companyId: input.companyId,
    kind: 'tool',
    name: tool.id,
    status: 'success',
    input: input.payload || {},
    output,
    durationMs: 1,
  })

  return { status: 'completed' as const, run, output }
}

export async function listRuns(companyId: string) {
  return db
    .select()
    .from(aiosRuns)
    .where(eq(aiosRuns.companyId, companyId))
    .orderBy(desc(aiosRuns.startedAt))
    .limit(100)
}

export async function listApprovals(companyId: string, status?: string) {
  if (status) {
    return db
      .select()
      .from(aiosApprovals)
      .where(and(eq(aiosApprovals.companyId, companyId), eq(aiosApprovals.status, status)))
      .orderBy(desc(aiosApprovals.createdAt))
      .limit(100)
  }
  return db
    .select()
    .from(aiosApprovals)
    .where(eq(aiosApprovals.companyId, companyId))
    .orderBy(desc(aiosApprovals.createdAt))
    .limit(100)
}

export async function decideApproval(input: {
  companyId: string
  approvalId: string
  decision: 'approved' | 'rejected'
  userId?: string
  reason?: string
}) {
  const [row] = await db
    .select()
    .from(aiosApprovals)
    .where(
      and(eq(aiosApprovals.id, input.approvalId), eq(aiosApprovals.companyId, input.companyId)),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Onay kaydı yok', 404)
  if (row.status !== 'pending') throw new AppError('CONFLICT', 'Zaten karara bağlandı', 409)

  const [updated] = await db
    .update(aiosApprovals)
    .set({
      status: input.decision,
      decidedBy: input.userId || null,
      decidedAt: new Date(),
      reason: input.reason || null,
      updatedAt: new Date(),
    })
    .where(eq(aiosApprovals.id, row.id))
    .returning()

  if (row.runId) {
    await db
      .update(aiosRuns)
      .set({
        status: input.decision === 'approved' ? 'completed' : 'failed',
        finishedAt: new Date(),
        updatedAt: new Date(),
        error: input.decision === 'rejected' ? input.reason || 'rejected' : null,
      })
      .where(eq(aiosRuns.id, row.runId))
  }

  return updated
}

export async function listMemory(companyId: string) {
  return db
    .select()
    .from(aiosMemory)
    .where(eq(aiosMemory.companyId, companyId))
    .orderBy(desc(aiosMemory.updatedAt))
    .limit(100)
}

function deepMask(value: unknown): unknown {
  if (typeof value === 'string') return maskSensitiveText(value)
  if (Array.isArray(value)) return value.map(deepMask)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepMask(v)
    }
    return out
  }
  return value
}

export async function putMemory(input: {
  companyId: string
  userId?: string
  scope?: string
  scopeId?: string
  key: string
  value: Record<string, unknown>
  sensitivity?: string
}) {
  const safeValue = deepMask(input.value || {}) as Record<string, unknown>
  const [row] = await db
    .insert(aiosMemory)
    .values({
      companyId: input.companyId,
      scope: input.scope || 'company',
      scopeId: input.scopeId || null,
      key: input.key,
      value: safeValue,
      sensitivity: input.sensitivity || 'internal',
      createdBy: input.userId || null,
    })
    .returning()
  return row
}

export async function listSchedules(companyId: string) {
  return db
    .select()
    .from(aiosSchedules)
    .where(eq(aiosSchedules.companyId, companyId))
    .orderBy(desc(aiosSchedules.createdAt))
    .limit(100)
}

export async function createSchedule(input: {
  companyId: string
  agentId: string
  cadence: string
  cronExpr?: string
  eventType?: string
  meta?: Record<string, unknown>
}) {
  if (!getAgentById(input.agentId)) throw new AppError('NOT_FOUND', 'Agent bulunamadı', 404)
  const [row] = await db
    .insert(aiosSchedules)
    .values({
      companyId: input.companyId,
      agentId: input.agentId,
      cadence: input.cadence,
      cronExpr: input.cronExpr || null,
      eventType: input.eventType || null,
      enabled: true,
      meta: input.meta || {},
    })
    .returning()
  return row
}

/**
 * Orchestrator-only agent communication. Never peer-to-peer.
 * Records an audited run + returns explainable event payload.
 */
export async function dispatchOrganizationMessage(input: {
  companyId: string
  userId?: string
  fromOrgId: string
  toOrgId: string
  intent: string
  payload?: Record<string, unknown>
}) {
  const from = getOrgNodeById(input.fromOrgId)
  const to = getOrgNodeById(input.toOrgId)
  if (!from || !to) throw new AppError('NOT_FOUND', 'Org düğümü bulunamadı', 404)

  const agent = getAgentById(to.agentId)
  if (!agent) throw new AppError('NOT_FOUND', 'Hedef agent bulunamadı', 404)

  const [run] = await db
    .insert(aiosRuns)
    .values({
      companyId: input.companyId,
      agentId: agent.id,
      userId: input.userId || null,
      provider: agent.defaultProvider,
      model: agent.defaultModel,
      status: 'completed',
      promptTokens: 0,
      completionTokens: 0,
      estimatedCostUsd: '0',
      durationMs: 0,
      finishedAt: new Date(),
      meta: {
        kind: 'org_orchestrator_dispatch',
        fromOrgId: from.id,
        toOrgId: to.id,
        intent: input.intent,
        explainWhy: to.explainWhy,
        criticalApprovalRequired: to.criticalApprovalRequired,
        payload: input.payload || {},
      },
    })
    .returning()

  await db.insert(aiosRunSteps).values({
    runId: run.id,
    companyId: input.companyId,
    kind: 'orchestrator',
    name: `${from.title} → ${to.title}`,
    status: 'success',
    durationMs: 0,
    output: {
      intent: input.intent,
      explainWhy: to.explainWhy,
      peerChat: false,
    },
  })

  return {
    event: {
      id: run.id,
      type: 'aios.org.dispatch',
      from: { orgId: from.id, title: from.title, agentId: from.agentId },
      to: { orgId: to.id, title: to.title, agentId: to.agentId },
      intent: input.intent,
      explainWhy: to.explainWhy,
      criticalApprovalRequired: to.criticalApprovalRequired,
      at: new Date().toISOString(),
    },
    run,
  }
}
