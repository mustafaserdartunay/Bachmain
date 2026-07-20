import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  aiDesign,
  createAsset,
  createFont,
  createJob,
  createLabel,
  createProfile,
  createTemplate,
  listAssets,
  listFonts,
  listJobs,
  listLabels,
  listProfiles,
  listTemplates,
  marketplace,
  overview,
  renderStub,
} from './documentsService.js'

export async function documentsRoutes(app: FastifyInstance) {
  app.get(
    '/v1/documents/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/documents/templates',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, templates: await listTemplates(companyId) }
    },
  )

  app.post(
    '/v1/documents/templates',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          docType: z.string().optional(),
          design: z.record(z.unknown()).optional(),
          locale: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, template: await createTemplate(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/labels',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, labels: await listLabels(companyId) }
    },
  )

  app.post(
    '/v1/documents/labels',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          widthMm: z.number().positive(),
          heightMm: z.number().positive(),
          labelKind: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, label: await createLabel(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/print-profiles',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, profiles: await listProfiles(companyId) }
    },
  )

  app.post(
    '/v1/documents/print-profiles',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          brand: z.string().optional(),
          deviceClass: z.string().optional(),
          target: z.string().optional(),
          paper: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, profile: await createProfile(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/print-jobs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, jobs: await listJobs(companyId) }
    },
  )

  app.post(
    '/v1/documents/print-jobs',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          templateId: z.string().optional(),
          docType: z.string().optional(),
          sourceRef: z.string().optional(),
          output: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, job: await createJob(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/assets',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, assets: await listAssets(companyId) }
    },
  )

  app.post(
    '/v1/documents/assets',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          kind: z.string().optional(),
          url: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, asset: await createAsset(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/fonts',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, fonts: await listFonts(companyId) }
    },
  )

  app.post(
    '/v1/documents/fonts',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          family: z.string().min(1),
          source: z.string().optional(),
          weights: z.array(z.union([z.number(), z.string()])).optional(),
        })
        .parse(req.body || {})
      return { ok: true, font: await createFont(companyId, body) }
    },
  )

  app.post(
    '/v1/documents/render',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          templateId: z.string().optional(),
          docType: z.string().optional(),
          context: z.record(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, ...(await renderStub(companyId, body)) }
    },
  )

  app.post(
    '/v1/documents/ai-design',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          prompt: z.string().min(3),
          docType: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, design: await aiDesign(companyId, body) }
    },
  )

  app.get(
    '/v1/documents/marketplace',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, items: await marketplace() }),
  )
}
