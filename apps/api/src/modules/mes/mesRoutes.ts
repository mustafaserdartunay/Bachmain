import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  aiInsights,
  createBom,
  createMaintenance,
  createOperator,
  createRouting,
  createWorkCenter,
  listBoms,
  listEvents,
  listMaintenance,
  listOperators,
  listRoutings,
  listScrap,
  listShifts,
  listWorkCenters,
  oeeSummary,
  operatorAction,
  overview,
} from './mesService.js'

export async function mesRoutes(app: FastifyInstance) {
  app.get(
    '/v1/mes/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/mes/work-centers',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, workCenters: await listWorkCenters(companyId) }
    },
  )

  app.post(
    '/v1/mes/work-centers',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({ code: z.string().min(1), name: z.string().min(1), kind: z.string().optional() })
        .parse(req.body || {})
      return { ok: true, workCenter: await createWorkCenter(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/operators',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, operators: await listOperators(companyId) }
    },
  )

  app.post(
    '/v1/mes/operators',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({ code: z.string().min(1), name: z.string().min(1) })
        .parse(req.body || {})
      return { ok: true, operator: await createOperator(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/shifts',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, shifts: await listShifts(companyId) }
    },
  )

  app.get(
    '/v1/mes/boms',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, boms: await listBoms(companyId) }
    },
  )

  app.post(
    '/v1/mes/boms',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          productId: z.string().min(1),
          name: z.string().min(1),
          lines: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body || {})
      return { ok: true, bom: await createBom(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/routings',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, routings: await listRoutings(companyId) }
    },
  )

  app.post(
    '/v1/mes/routings',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          productId: z.string().min(1),
          name: z.string().min(1),
          operations: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body || {})
      return { ok: true, routing: await createRouting(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/events',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const q = z.object({ productionJobId: z.string().optional() }).parse(req.query || {})
      return { ok: true, events: await listEvents(companyId, q.productionJobId) }
    },
  )

  app.post(
    '/v1/mes/operator/action',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          action: z.enum([
            'start',
            'pause',
            'resume',
            'finish',
            'scrap',
            'qc_call',
            'photo',
            'video',
            'qr',
            'barcode',
          ]),
          productionJobId: z.string().optional(),
          workCenterId: z.string().uuid().optional(),
          operatorId: z.string().uuid().optional(),
          qtyGood: z.number().int().optional(),
          qtyScrap: z.number().int().optional(),
          note: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, event: await operatorAction(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/scrap',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, scrap: await listScrap(companyId) }
    },
  )

  app.get(
    '/v1/mes/oee',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await oeeSummary(companyId)) }
    },
  )

  app.get(
    '/v1/mes/maintenance',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, items: await listMaintenance(companyId) }
    },
  )

  app.post(
    '/v1/mes/maintenance',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          title: z.string().min(1),
          workCenterId: z.string().uuid().optional(),
          kind: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, item: await createMaintenance(companyId, body) }
    },
  )

  app.get(
    '/v1/mes/ai/insights',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, ...aiInsights() }),
  )
}
