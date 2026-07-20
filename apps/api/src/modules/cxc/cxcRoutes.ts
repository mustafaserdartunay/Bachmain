import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  aiInsights,
  createNextAction,
  createOpportunity,
  createStage,
  createTicket,
  customer360,
  listHealth,
  listLoyalty,
  listNextActions,
  listOpportunities,
  listStages,
  listTickets,
  listTimeline,
  moveOpportunityStage,
  overview,
  upsertHealth,
  upsertLoyalty,
} from './cxcService.js'

export async function cxcRoutes(app: FastifyInstance) {
  app.get(
    '/v1/cxc/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/cxc/customers/:id/360',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      return { ok: true, ...(await customer360(companyId, id)) }
    },
  )

  app.get(
    '/v1/cxc/customers/:id/timeline',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      const q = req.query as { kind?: string }
      return { ok: true, events: await listTimeline(companyId, id, q.kind) }
    },
  )

  app.get(
    '/v1/cxc/pipeline/stages',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, stages: await listStages(companyId) }
    },
  )

  app.post(
    '/v1/cxc/pipeline/stages',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          code: z.string().min(1),
          label: z.string().min(1),
          sortOrder: z.number().optional(),
          color: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, stage: await createStage(companyId, body) }
    },
  )

  app.get(
    '/v1/cxc/opportunities',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = req.query as { customerId?: string }
      return { ok: true, opportunities: await listOpportunities(companyId, q.customerId) }
    },
  )

  app.post(
    '/v1/cxc/opportunities',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          customerId: z.string().min(1),
          title: z.string().min(1),
          stageCode: z.string().optional(),
          amount: z.number().optional(),
          source: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, opportunity: await createOpportunity(companyId, body) }
    },
  )

  app.patch(
    '/v1/cxc/opportunities/:id/stage',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      const body = z.object({ stageCode: z.string().min(1) }).parse(req.body || {})
      return { ok: true, opportunity: await moveOpportunityStage(companyId, id, body.stageCode) }
    },
  )

  app.get(
    '/v1/cxc/health',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, scores: await listHealth(companyId) }
    },
  )

  app.post(
    '/v1/cxc/health',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          customerId: z.string().min(1),
          score: z.number().min(0).max(100),
          churnRisk: z.string().optional(),
          factors: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, score: await upsertHealth(companyId, body) }
    },
  )

  app.get(
    '/v1/cxc/loyalty',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, loyalty: await listLoyalty(companyId) }
    },
  )

  app.post(
    '/v1/cxc/loyalty',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          customerId: z.string().min(1),
          tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'vip']),
          points: z.number().optional(),
          discountPct: z.number().optional(),
        })
        .parse(req.body || {})
      return { ok: true, loyalty: await upsertLoyalty(companyId, body) }
    },
  )

  app.get(
    '/v1/cxc/tickets',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = req.query as { customerId?: string }
      return { ok: true, tickets: await listTickets(companyId, q.customerId) }
    },
  )

  app.post(
    '/v1/cxc/tickets',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          customerId: z.string().min(1),
          subject: z.string().min(1),
          channel: z.string().optional(),
          priority: z.string().optional(),
          aiSummary: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, ticket: await createTicket(companyId, body) }
    },
  )

  app.get(
    '/v1/cxc/ai/insights',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = req.query as { customerId?: string }
      return { ok: true, insights: await aiInsights(companyId, q.customerId) }
    },
  )

  app.get(
    '/v1/cxc/ai/next-actions',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = req.query as { customerId?: string }
      return { ok: true, actions: await listNextActions(companyId, q.customerId) }
    },
  )

  app.post(
    '/v1/cxc/ai/next-actions',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          customerId: z.string().min(1),
          action: z.string().min(1),
          reason: z.string().optional(),
          priority: z.number().optional(),
        })
        .parse(req.body || {})
      return { ok: true, action: await createNextAction(companyId, body) }
    },
  )
}
