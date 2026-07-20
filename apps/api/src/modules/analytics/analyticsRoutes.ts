import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import {
  boardReport,
  createAlert,
  createDashboard,
  createExport,
  createGoal,
  createKpi,
  createOkr,
  forecasts,
  insights,
  listAlerts,
  listDashboards,
  listGoals,
  listKpis,
  listOkrs,
  overview,
  updateLayout,
} from './analyticsService.js'

export async function analyticsRoutes(app: FastifyInstance) {
  app.get(
    '/v1/analytics/overview',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, ...(await overview(companyId)) }
    },
  )

  app.get(
    '/v1/analytics/dashboards',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, dashboards: await listDashboards(companyId) }
    },
  )

  app.post(
    '/v1/analytics/dashboards',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          slug: z.string().min(1),
          kind: z.string().optional(),
          layout: z.array(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, dashboard: await createDashboard(companyId, body) }
    },
  )

  app.patch(
    '/v1/analytics/dashboards/:id/layout',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = req.params as { id: string }
      const body = z.object({ layout: z.array(z.unknown()) }).parse(req.body || {})
      return { ok: true, dashboard: await updateLayout(companyId, id, body.layout) }
    },
  )

  app.get(
    '/v1/analytics/kpis',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, kpis: await listKpis(companyId) }
    },
  )

  app.post(
    '/v1/analytics/kpis',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          code: z.string().min(1),
          label: z.string().min(1),
          source: z.string().optional(),
          unit: z.string().optional(),
          target: z.number().optional(),
        })
        .parse(req.body || {})
      return { ok: true, kpi: await createKpi(companyId, body) }
    },
  )

  app.get(
    '/v1/analytics/alerts',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, alerts: await listAlerts(companyId) }
    },
  )

  app.post(
    '/v1/analytics/alerts',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          kpiCode: z.string().optional(),
          operator: z.string().optional(),
          threshold: z.number().optional(),
          channels: z.array(z.unknown()).optional(),
        })
        .parse(req.body || {})
      return { ok: true, alert: await createAlert(companyId, body) }
    },
  )

  app.get(
    '/v1/analytics/goals',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, goals: await listGoals(companyId) }
    },
  )

  app.post(
    '/v1/analytics/goals',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          title: z.string().min(1),
          scope: z.string().optional(),
          targetValue: z.number().optional(),
          actualValue: z.number().optional(),
          period: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, goal: await createGoal(companyId, body) }
    },
  )

  app.get(
    '/v1/analytics/okrs',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, okrs: await listOkrs(companyId) }
    },
  )

  app.post(
    '/v1/analytics/okrs',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          objective: z.string().min(1),
          scope: z.string().optional(),
          keyResults: z.array(z.unknown()).optional(),
          progressPct: z.number().optional(),
        })
        .parse(req.body || {})
      return { ok: true, okr: await createOkr(companyId, body) }
    },
  )

  app.get(
    '/v1/analytics/insights',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, insights: await insights(companyId) }
    },
  )

  app.get(
    '/v1/analytics/forecasts',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      return { ok: true, forecasts: await forecasts(companyId) }
    },
  )

  app.post(
    '/v1/analytics/exports',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          format: z.string().optional(),
          source: z.string().optional(),
        })
        .parse(req.body || {})
      return { ok: true, export: await createExport(companyId, body) }
    },
  )

  app.get(
    '/v1/analytics/board-report',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async () => ({ ok: true, report: boardReport() }),
  )
}
