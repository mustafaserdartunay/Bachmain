import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  factory,
  flow,
  getPreferences,
  overview,
  patchPreferences,
  warehouse,
} from './twinService.js'

export async function twinRoutes(app: FastifyInstance) {
  app.get(
    '/v1/twin/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await overview(companyId)
      return { ok: true, ...data }
    },
  )

  app.get(
    '/v1/twin/preferences',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const row = await getPreferences(companyId)
      return { ok: true, row }
    },
  )

  app.patch(
    '/v1/twin/preferences',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          enable3d: z.boolean().optional(),
          defaultView: z.string().optional(),
          layout: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      const row = await patchPreferences(companyId, {
        ...body,
        layout: body.layout as Record<string, unknown> | undefined,
      })
      return { ok: true, row }
    },
  )

  app.get(
    '/v1/twin/factory',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...factory() }),
  )

  app.get(
    '/v1/twin/warehouse',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...warehouse() }),
  )

  app.get(
    '/v1/twin/flow',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...flow() }),
  )
}
