import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  catalog,
  createCampaign,
  createCompetitor,
  createContent,
  createFunnel,
  createLead,
  expandContentI18n,
  listAudit,
  listCampaigns,
  listCompetitors,
  listContent,
  listFunnels,
  listLeads,
  listSeoAudits,
  overview,
  runSeoAudit,
  scoreLead,
} from './growthService.js'

export async function growthRoutes(app: FastifyInstance) {
  app.get('/v1/growth/catalog', { preHandler: [authenticate] }, async () => ({
    ok: true,
    ...catalog(),
  }))

  app.get(
    '/v1/growth/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/growth/leads',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, leads: await listLeads(companyId) }
    },
  )

  app.post(
    '/v1/growth/leads',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          source: z.string().min(1),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          message: z.string().optional(),
          meta: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, lead: await createLead(companyId, body) }
    },
  )

  app.post(
    '/v1/growth/leads/:id/score',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      return { ok: true, lead: await scoreLead(companyId, id) }
    },
  )

  app.get(
    '/v1/growth/campaigns',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, campaigns: await listCampaigns(companyId) }
    },
  )

  app.post(
    '/v1/growth/campaigns',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          channel: z.string().optional(),
          budget: z.string().optional(),
          currency: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, campaign: await createCampaign(companyId, body) }
    },
  )

  app.get(
    '/v1/growth/content',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, assets: await listContent(companyId) }
    },
  )

  app.post(
    '/v1/growth/content',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          kind: z.string().min(1),
          locale: z.string().optional(),
          title: z.string().optional(),
          body: z.string().optional(),
          channelTargets: z.array(z.string()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, asset: await createContent(companyId, body) }
    },
  )

  app.post(
    '/v1/growth/content/:id/expand-i18n',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      return { ok: true, ...(await expandContentI18n(companyId, id)) }
    },
  )

  app.get(
    '/v1/growth/seo/audits',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, audits: await listSeoAudits(companyId) }
    },
  )

  app.post(
    '/v1/growth/seo/audits',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ url: z.string().optional() }).parse(req.body || {})
      return { ok: true, audit: await runSeoAudit(companyId, body.url) }
    },
  )

  app.get(
    '/v1/growth/competitors',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, competitors: await listCompetitors(companyId) }
    },
  )

  app.post(
    '/v1/growth/competitors',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          website: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, competitor: await createCompetitor(companyId, body) }
    },
  )

  app.get(
    '/v1/growth/funnels',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, funnels: await listFunnels(companyId) }
    },
  )

  app.post(
    '/v1/growth/funnels',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z.object({ name: z.string().min(1) }).parse(req.body || {})
      return { ok: true, funnel: await createFunnel(companyId, body.name) }
    },
  )

  app.get(
    '/v1/growth/audit',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, entries: await listAudit(companyId) }
    },
  )
}
