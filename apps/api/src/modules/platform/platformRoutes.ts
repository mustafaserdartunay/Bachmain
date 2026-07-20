import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  compositeHealth,
  createModule,
  enqueueJob,
  eventCatalogSummary,
  listFlags,
  listIntegrations,
  listJobs,
  listModules,
  listPlugins,
  overview,
  patchModule,
  upsertFlag,
} from './platformService.js'

export async function platformRoutes(app: FastifyInstance) {
  app.get(
    '/v1/platform/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...(await overview()) }),
  )

  app.get(
    '/v1/platform/modules',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, modules: await listModules() }),
  )

  app.post(
    '/v1/platform/modules',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const body = z
        .object({
          code: z.string().min(1),
          label: z.string().min(1),
          route: z.string().optional(),
          apiPrefix: z.string().optional(),
          domain: z.string().optional(),
          entitlementCode: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, module: await createModule(body) }
    },
  )

  app.patch(
    '/v1/platform/modules/:code',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const { code } = req.params as { code: string }
      const body = z
        .object({ status: z.enum(['active', 'inactive', 'licensed']) })
        .parse(req.body || {})
      return { ok: true, module: await patchModule(code, body.status) }
    },
  )

  app.get(
    '/v1/platform/flags',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, flags: await listFlags() }),
  )

  app.post(
    '/v1/platform/flags',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const body = z
        .object({
          key: z.string().min(1),
          enabled: z.boolean().optional(),
          description: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, flag: await upsertFlag(body) }
    },
  )

  app.get(
    '/v1/platform/health',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...(await compositeHealth()) }),
  )

  app.get(
    '/v1/platform/jobs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      let companyId: string | undefined
      try {
        companyId = requireTenant(req)
      } catch {
        companyId = undefined
      }
      return { ok: true, jobs: await listJobs(companyId) }
    },
  )

  app.post(
    '/v1/platform/jobs',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          queue: z.string().optional(),
          priority: z.number().optional(),
          payload: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, job: await enqueueJob(companyId, body) }
    },
  )

  app.get(
    '/v1/platform/events/catalog',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...eventCatalogSummary() }),
  )

  app.get(
    '/v1/platform/integrations',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, integrations: await listIntegrations() }),
  )

  app.get(
    '/v1/platform/plugins',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, plugins: await listPlugins() }),
  )
}
