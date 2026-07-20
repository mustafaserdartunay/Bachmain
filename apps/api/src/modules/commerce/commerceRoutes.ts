import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  connectChannel,
  createPriceRule,
  enqueueStockSync,
  ingestChannelOrder,
  listChannels,
  listInbox,
  listListings,
  listPriceRules,
  listStockJobs,
  marketplaceCatalog,
  overview,
  promoteInboxOrder,
  publishListing,
  resolvePrice,
} from './commerceService.js'

export async function commerceRoutes(app: FastifyInstance) {
  app.get('/v1/commerce/catalog/marketplaces', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...marketplaceCatalog(),
  }))

  app.get(
    '/v1/commerce/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await overview(companyId)
      return { ok: true, ...data }
    },
  )

  app.get(
    '/v1/commerce/channels',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const data = await listChannels(companyId)
      return { ok: true, ...data }
    },
  )

  app.post(
    '/v1/commerce/channels/:key/connect',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { key } = z.object({ key: z.string().min(1) }).parse(req.params)
      const row = await connectChannel(companyId, key)
      return { ok: true, channel: row }
    },
  )

  app.get(
    '/v1/commerce/listings',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listListings(companyId)
      return { ok: true, listings: rows }
    },
  )

  app.post(
    '/v1/commerce/listings',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          channelKey: z.string().min(1),
          productId: z.string().min(1),
          sku: z.string().optional(),
          title: z.string().optional(),
          price: z.string().optional(),
          currency: z.string().optional(),
        })
        .parse(req.body || {})
      const row = await publishListing(companyId, body)
      return { ok: true, listing: row }
    },
  )

  app.get(
    '/v1/commerce/price-rules',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listPriceRules(companyId)
      return { ok: true, rules: rows }
    },
  )

  app.post(
    '/v1/commerce/price-rules',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          priority: z.number().int().optional(),
          scope: z.string().optional(),
          customerId: z.string().optional(),
          dealerId: z.string().optional(),
          countryCode: z.string().optional(),
          currency: z.string().optional(),
          productId: z.string().optional(),
          minQty: z.number().int().optional(),
          adjustmentType: z.enum(['percent', 'fixed', 'override']).optional(),
          adjustmentValue: z.string().min(1),
        })
        .parse(req.body || {})
      const row = await createPriceRule(companyId, body)
      return { ok: true, rule: row }
    },
  )

  app.post(
    '/v1/commerce/price/resolve',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          productId: z.string().min(1),
          basePrice: z.number(),
          customerId: z.string().optional(),
          dealerId: z.string().optional(),
          countryCode: z.string().optional(),
          currency: z.string().optional(),
          qty: z.number().optional(),
        })
        .parse(req.body || {})
      const result = await resolvePrice(companyId, body)
      return { ok: true, ...result }
    },
  )

  app.get(
    '/v1/commerce/orders/inbox',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await listInbox(companyId)
      return { ok: true, orders: rows }
    },
  )

  app.post(
    '/v1/commerce/orders/inbox',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          channelKey: z.string().min(1),
          externalOrderId: z.string().min(1),
          currency: z.string().optional(),
          totalAmount: z.string().optional(),
          customerName: z.string().optional(),
          customerEmail: z.string().optional(),
          lines: z.array(z.record(z.unknown())).optional(),
          rawPayload: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      const row = await ingestChannelOrder(companyId, body)
      return { ok: true, order: row }
    },
  )

  app.post(
    '/v1/commerce/orders/inbox/:id/promote',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      const row = await promoteInboxOrder(companyId, id)
      return { ok: true, order: row }
    },
  )

  app.get(
    '/v1/commerce/stock-sync',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const jobs = await listStockJobs(companyId)
      return { ok: true, jobs }
    },
  )

  app.post(
    '/v1/commerce/stock-sync',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ channelKey: z.string().optional() }).parse(req.body || {})
      const job = await enqueueStockSync(companyId, body.channelKey)
      return { ok: true, job }
    },
  )
}
