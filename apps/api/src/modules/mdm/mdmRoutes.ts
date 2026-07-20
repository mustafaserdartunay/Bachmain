import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  customerImpact,
  findCustomerDuplicates,
  globalMdmSearch,
  listTags,
  mdmQualitySnapshot,
  mergeCustomers,
  upsertTag,
} from './mdmService.js'

export async function mdmRoutes(app: FastifyInstance) {
  app.get(
    '/v1/mdm/search',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = String((req.query as { q?: string })?.q || '')
      const results = await globalMdmSearch(companyId, q)
      return { ok: true, q, ...results }
    },
  )

  app.post(
    '/v1/mdm/duplicates',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          entityType: z.enum(['customer']).default('customer'),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          taxNo: z.string().optional(),
        })
        .parse(req.body)
      const matches = await findCustomerDuplicates(companyId, body)
      return { ok: true, matches }
    },
  )

  app.get(
    '/v1/mdm/customers/:id/impact',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const id = (req.params as { id: string }).id
      const impact = await customerImpact(companyId, id)
      return { ok: true, impact }
    },
  )

  app.post(
    '/v1/mdm/merge',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          entityType: z.literal('customer'),
          survivorId: z.string().uuid(),
          mergeIds: z.array(z.string().uuid()).min(1),
        })
        .parse(req.body)
      const result = await mergeCustomers({
        companyId,
        survivorId: body.survivorId,
        mergeIds: body.mergeIds,
        userId: req.auth?.sub,
      })
      return result
    },
  )

  app.get(
    '/v1/mdm/quality',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const snapshot = await mdmQualitySnapshot(companyId)
      return { ok: true, snapshot }
    },
  )

  app.get(
    '/v1/mdm/tags',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listTags(companyId)
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/mdm/tags',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          code: z.string().min(1),
          label: z.string().min(1),
          color: z.string().optional(),
        })
        .parse(req.body)
      const row = await upsertTag(companyId, body)
      return { ok: true, tag: row }
    },
  )
}
