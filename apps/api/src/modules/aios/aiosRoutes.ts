import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  authenticate,
  requirePermission,
  requireTenant,
  requireStaff,
} from '../../shared/authGuard.js'
import {
  createSchedule,
  decideApproval,
  dispatchOrganizationMessage,
  getCatalog,
  getOrganization,
  invokeTool,
  listAgentsForCompany,
  listApprovals,
  listMemory,
  listRuns,
  listSchedules,
  overview,
  putMemory,
  runAgentChat,
  upsertAgentConfig,
} from './aiosService.js'
import { listProviders } from './gateway.js'
import {
  autonomousEveningReport,
  autonomousMorningReport,
  autonomousOverview,
  autonomousRunScenario,
  autonomousSuggestionFeedback,
} from './autonomousService.js'

export async function aiosRoutes(app: FastifyInstance) {
  app.get('/v1/aios/catalog', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...getCatalog(),
  }))

  app.get(
    '/v1/aios/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await overview(companyId)
      return { ok: true, ...data }
    },
  )

  app.get(
    '/v1/aios/agents',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listAgentsForCompany(companyId)
      return { ok: true, rows }
    },
  )

  app.patch(
    '/v1/aios/agents/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          enabled: z.boolean().optional(),
          modelProvider: z.string().optional(),
          modelId: z.string().optional(),
          costLimitUsd: z.number().optional(),
          modules: z.array(z.string()).optional(),
          permissions: z.array(z.string()).optional(),
          memoryEnabled: z.boolean().optional(),
        })
        .parse(req.body || {})
      const row = await upsertAgentConfig(companyId, id, body)
      return { ok: true, row }
    },
  )

  app.get('/v1/aios/tools', { preHandler: [authenticate] }, async () => ({
    ok: true,
    rows: getCatalog().tools,
  }))

  app.get('/v1/aios/providers', { preHandler: [authenticate] }, async () => ({
    ok: true,
    rows: listProviders(),
  }))

  app.get(
    '/v1/aios/organization',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({
      ok: true,
      ...getOrganization(),
    }),
  )

  app.get(
    '/v1/aios/autonomous/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await autonomousOverview(companyId)
      return { ok: true, ...data }
    },
  )

  app.get(
    '/v1/aios/autonomous/reports/morning',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, report: autonomousMorningReport() }),
  )

  app.get(
    '/v1/aios/autonomous/reports/evening',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, report: autonomousEveningReport() }),
  )

  app.post(
    '/v1/aios/autonomous/suggestions/:id/feedback',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          decision: z.enum(['accept', 'reject', 'edit']),
          note: z.string().max(1000).optional(),
        })
        .parse(req.body || {})
      const row = autonomousSuggestionFeedback(companyId, id, body.decision, body.note)
      return { ok: true, ...row }
    },
  )

  app.post(
    '/v1/aios/autonomous/scenarios/run',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const body = z.object({ scenarioId: z.string().min(1) }).parse(req.body || {})
      const result = autonomousRunScenario(body.scenarioId)
      return { ok: true, result }
    },
  )

  app.post(
    '/v1/aios/organization/dispatch',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          fromOrgId: z.string().min(1),
          toOrgId: z.string().min(1),
          intent: z.string().min(1).max(500),
          payload: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      const result = await dispatchOrganizationMessage({
        companyId,
        userId: req.auth?.sub,
        fromOrgId: body.fromOrgId,
        toOrgId: body.toOrgId,
        intent: body.intent,
        payload: body.payload as Record<string, unknown> | undefined,
      })
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/aios/gateway/chat',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          agentId: z.string().min(1),
          messages: z
            .array(
              z.object({
                role: z.enum(['system', 'user', 'assistant']),
                content: z.string(),
              }),
            )
            .min(1),
          provider: z
            .enum(['openai', 'anthropic', 'gemini', 'deepseek', 'mistral', 'azure_openai', 'local'])
            .optional(),
          model: z.string().optional(),
        })
        .parse(req.body)
      const result = await runAgentChat({
        companyId,
        userId: req.auth?.sub,
        agentId: body.agentId,
        messages: body.messages,
        provider: body.provider,
        model: body.model,
      })
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/aios/tools/:toolId/invoke',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const toolId = (req.params as { toolId: string }).toolId
      const body = z
        .object({
          agentId: z.string().optional(),
          payload: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      const result = await invokeTool({
        companyId,
        userId: req.auth?.sub,
        agentId: body.agentId,
        toolId,
        payload: body.payload as Record<string, unknown> | undefined,
      })
      return { ok: true, ...result }
    },
  )

  app.get(
    '/v1/aios/runs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listRuns(companyId)
      return { ok: true, rows }
    },
  )

  app.get(
    '/v1/aios/approvals',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const status = (req.query as { status?: string })?.status
      const rows = await listApprovals(companyId, status)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/aios/approvals/:id/decide',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          decision: z.enum(['approved', 'rejected']),
          reason: z.string().optional(),
        })
        .parse(req.body)
      const row = await decideApproval({
        companyId,
        approvalId: id,
        decision: body.decision,
        userId: req.auth?.sub,
        reason: body.reason,
      })
      return { ok: true, row }
    },
  )

  app.get(
    '/v1/aios/memory',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listMemory(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/aios/memory',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          key: z.string().min(1),
          value: z.record(z.unknown()),
          scope: z.string().optional(),
          scopeId: z.string().optional(),
          sensitivity: z.string().optional(),
        })
        .parse(req.body)
      const row = await putMemory({
        companyId,
        userId: req.auth?.sub,
        key: body.key,
        value: body.value as Record<string, unknown>,
        scope: body.scope,
        scopeId: body.scopeId,
        sensitivity: body.sensitivity,
      })
      return { ok: true, row }
    },
  )

  app.get(
    '/v1/aios/schedules',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listSchedules(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/aios/schedules',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          agentId: z.string().min(1),
          cadence: z.enum(['once', 'hourly', 'daily', 'weekly', 'monthly', 'event']),
          cronExpr: z.string().optional(),
          eventType: z.string().optional(),
          meta: z.record(z.unknown()).optional(),
        })
        .parse(req.body)
      const row = await createSchedule({
        companyId,
        agentId: body.agentId,
        cadence: body.cadence,
        cronExpr: body.cronExpr,
        eventType: body.eventType,
        meta: body.meta as Record<string, unknown> | undefined,
      })
      return { ok: true, row }
    },
  )

  /** Platform staff overview (no tenant) — Control Center */
  app.get(
    '/v1/admin/aios/overview',
    { preHandler: requireStaff('superadmin', 'support') },
    async () => {
      const catalog = getCatalog()
      return {
        ok: true,
        agentsTotal: catalog.agents.length,
        toolsTotal: catalog.tools.length,
        providers: catalog.providers,
        sections: [
          'Dashboard',
          'Enterprise Organization',
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
        organization: catalog.organization?.counts || null,
      }
    },
  )
}
