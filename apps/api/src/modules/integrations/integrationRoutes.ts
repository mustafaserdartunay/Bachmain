import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  connectIntegration,
  disconnectIntegration,
  integrationCatalog,
  integrationOverview,
  listConnections,
  listRetries,
  listWebhooks,
  runIntegrationWizard,
} from './integrationService.js'

export async function integrationRoutes(app: FastifyInstance) {
  app.get(
    '/v1/integrations/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...integrationOverview(companyId) }
    },
  )

  app.get('/v1/integrations/catalog', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...integrationCatalog(),
  }))

  app.get(
    '/v1/integrations/connections',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, rows: listConnections(companyId) }
    },
  )

  app.post(
    '/v1/integrations/connect',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ connectorId: z.string().min(1) }).parse(req.body || {})
      const result = connectIntegration(companyId, body.connectorId)
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/integrations/disconnect',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ connectorId: z.string().min(1) }).parse(req.body || {})
      const result = disconnectIntegration(companyId, body.connectorId)
      return { ok: true, ...result }
    },
  )

  app.post(
    '/v1/integrations/wizard',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const body = z.object({ brief: z.string().min(3).max(2000) }).parse(req.body || {})
      return { ok: true, ...runIntegrationWizard(body.brief) }
    },
  )

  app.get(
    '/v1/integrations/webhooks',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, rows: listWebhooks() }),
  )

  app.get(
    '/v1/integrations/retries',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, rows: listRetries() }),
  )
}
