import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  createWorkflow,
  getCatalog,
  getWorkflow,
  ingestEvent,
  listRuns,
  listWorkflows,
  publishVersion,
  rollbackVersion,
  saveVersion,
  simulateWorkflow,
  updateWorkflowMeta,
} from './workflowService.js'

const graphSchema = z.object({
  nodes: z.array(z.unknown()).default([]),
  edges: z.array(z.unknown()).default([]),
})

export async function workflowRoutes(app: FastifyInstance) {
  app.get(
    '/v1/workflows/catalog',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...getCatalog() }),
  )

  app.get(
    '/v1/workflows/templates',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, templates: getCatalog().templates }),
  )

  app.get(
    '/v1/workflows',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listWorkflows(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/workflows',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          graph: graphSchema.optional(),
          branchId: z.string().uuid().nullable().optional(),
          warehouseId: z.string().uuid().nullable().optional(),
          roleCodes: z.array(z.string()).optional(),
          packageCodes: z.array(z.string()).optional(),
        })
        .parse(req.body)
      const row = await createWorkflow({
        companyId,
        name: body.name,
        description: body.description,
        graph: body.graph,
        userId: req.auth?.sub,
        branchId: body.branchId,
        warehouseId: body.warehouseId,
        roleCodes: body.roleCodes,
        packageCodes: body.packageCodes,
      })
      return { ok: true, row }
    },
  )

  app.get(
    '/v1/workflows/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const detail = await getWorkflow(companyId, id)
      return { ok: true, ...detail }
    },
  )

  app.patch(
    '/v1/workflows/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().nullable().optional(),
          branchId: z.string().uuid().nullable().optional(),
          warehouseId: z.string().uuid().nullable().optional(),
          roleCodes: z.array(z.string()).optional(),
          packageCodes: z.array(z.string()).optional(),
          status: z.enum(['draft', 'published', 'archived']).optional(),
        })
        .parse(req.body)
      const row = await updateWorkflowMeta(companyId, id, { ...body, userId: req.auth?.sub })
      return { ok: true, row }
    },
  )

  app.post(
    '/v1/workflows/:id/versions',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          graph: graphSchema,
          changelog: z.string().optional(),
        })
        .parse(req.body)
      const version = await saveVersion(companyId, id, body.graph, body.changelog, req.auth?.sub)
      return { ok: true, version }
    },
  )

  app.post(
    '/v1/workflows/:id/publish',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z.object({ version: z.number().int().positive() }).parse(req.body)
      const row = await publishVersion(companyId, id, body.version, req.auth?.sub)
      return { ok: true, row }
    },
  )

  app.post(
    '/v1/workflows/:id/rollback',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z.object({ version: z.number().int().positive() }).parse(req.body)
      const row = await rollbackVersion(companyId, id, body.version, req.auth?.sub)
      return { ok: true, row }
    },
  )

  app.post(
    '/v1/workflows/:id/simulate',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          version: z.number().int().positive().optional(),
          payload: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      const result = await simulateWorkflow(companyId, id, {
        version: body.version,
        payload: body.payload as Record<string, unknown> | undefined,
        userId: req.auth?.sub,
      })
      return { ok: true, ...result }
    },
  )

  app.get(
    '/v1/workflows/:id/runs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const rows = await listRuns(companyId, id)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/workflows/events',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          eventType: z.string().min(1),
          payload: z.record(z.unknown()).optional(),
        })
        .parse(req.body)
      const result = await ingestEvent(
        companyId,
        body.eventType,
        (body.payload || {}) as Record<string, unknown>,
      )
      return { ok: true, ...result }
    },
  )
}
