import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  installMarketplaceItem,
  listInstalled,
  marketplaceCatalog,
  marketplaceOverview,
  marketplaceRecommend,
  uninstallMarketplaceItem,
} from './marketplaceService.js'

export async function marketplaceRoutes(app: FastifyInstance) {
  app.get(
    '/v1/marketplace/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...marketplaceOverview(companyId) }
    },
  )

  app.get('/v1/marketplace/catalog', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...marketplaceCatalog(),
  }))

  app.get(
    '/v1/marketplace/installed',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, rows: listInstalled(companyId) }
    },
  )

  app.post(
    '/v1/marketplace/install',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ itemId: z.string().min(1) }).parse(req.body || {})
      const result = installMarketplaceItem(companyId, body.itemId)
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/marketplace/uninstall',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ itemId: z.string().min(1) }).parse(req.body || {})
      const result = uninstallMarketplaceItem(companyId, body.itemId)
      return { ok: true, ...result }
    },
  )

  app.get(
    '/v1/marketplace/recommend',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const q = (req.query as { hints?: string })?.hints
      const hints = q
        ? String(q)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      return { ok: true, ...marketplaceRecommend(hints) }
    },
  )
}
