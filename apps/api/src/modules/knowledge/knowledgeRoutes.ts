import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  addVersion,
  createFaq,
  getDocument,
  ingestDocument,
  invokeMcpTool,
  listDocuments,
  listFaq,
  listMcpTools,
  overview,
  ragAssemble,
  searchKnowledge,
} from './knowledgeService.js'

export async function knowledgeRoutes(app: FastifyInstance) {
  app.get(
    '/v1/knowledge/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await overview(companyId)
      return { ok: true, ...data }
    },
  )

  app.get(
    '/v1/knowledge/documents',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listDocuments(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/knowledge/documents',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          title: z.string().min(1),
          contentText: z.string().default(''),
          docType: z.string().optional(),
          category: z.string().optional(),
          tags: z.array(z.string()).optional(),
          links: z
            .array(
              z.object({
                entityType: z.string(),
                entityId: z.string(),
                label: z.string().optional(),
              }),
            )
            .optional(),
          branchId: z.string().uuid().nullable().optional(),
          warehouseId: z.string().uuid().nullable().optional(),
          roleCodes: z.array(z.string()).optional(),
          sourceModule: z.string().optional(),
          needsOcr: z.boolean().optional(),
        })
        .parse(req.body)
      const row = await ingestDocument({
        companyId,
        userId: req.auth?.sub,
        ...body,
      })
      return { ok: true, row }
    },
  )

  app.get(
    '/v1/knowledge/documents/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const detail = await getDocument(companyId, id)
      return { ok: true, ...detail }
    },
  )

  app.post(
    '/v1/knowledge/documents/:id/versions',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const body = z
        .object({
          contentText: z.string().min(1),
          changelog: z.string().optional(),
        })
        .parse(req.body)
      const row = await addVersion(companyId, id, body.contentText, body.changelog, req.auth?.sub)
      return { ok: true, row }
    },
  )

  app.post(
    '/v1/knowledge/search',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          query: z.string().min(1),
          limit: z.number().int().positive().max(50).optional(),
        })
        .parse(req.body)
      const result = await searchKnowledge({
        companyId,
        userId: req.auth?.sub,
        query: body.query,
        limit: body.limit,
      })
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/knowledge/rag',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          query: z.string().min(1),
          limit: z.number().int().positive().max(20).optional(),
        })
        .parse(req.body)
      const result = await ragAssemble({
        companyId,
        userId: req.auth?.sub,
        query: body.query,
        limit: body.limit,
      })
      return { ok: true, ...result }
    },
  )

  app.get('/v1/knowledge/mcp/tools', { preHandler: [authenticate] }, async () => ({
    ok: true,
    tools: listMcpTools(),
  }))

  app.post(
    '/v1/knowledge/mcp/:tool',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const tool = (req.params as { tool: string }).tool
      const body = z.object({ args: z.record(z.unknown()).optional() }).parse(req.body || {})
      const result = await invokeMcpTool({
        companyId,
        userId: req.auth?.sub,
        tool,
        args: body.args as Record<string, unknown> | undefined,
      })
      return { ok: true, result }
    },
  )

  app.get(
    '/v1/knowledge/faq',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listFaq(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/knowledge/faq',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          question: z.string().min(1),
          answer: z.string().min(1),
          tags: z.array(z.string()).optional(),
        })
        .parse(req.body)
      const row = await createFaq({ companyId, ...body })
      return { ok: true, row }
    },
  )
}
