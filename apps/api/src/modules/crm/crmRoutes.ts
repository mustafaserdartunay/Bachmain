import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { customers } from '../../db/schema/index.js'
import { authenticate, requirePermission, requireTenant } from '../../shared/authGuard.js'
import { logActivity } from '../audit/activityService.js'
import { withCompanyRls } from '../../shared/tenantRls.js'

export async function crmRoutes(app: FastifyInstance) {
  app.get(
    '/v1/customers',
    { preHandler: [authenticate, requirePermission('crm.customers.view')] },
    async (req) => {
      const companyId = requireTenant(req)
      const rows = await withCompanyRls(companyId, async (tx) =>
        tx
          .select()
          .from(customers)
          .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
          .orderBy(desc(customers.createdAt))
          .limit(500),
      )
      return { ok: true, rows }
    },
  )

  app.post(
    '/v1/customers',
    { preHandler: [authenticate, requirePermission('crm.customers.create')] },
    async (req) => {
      const companyId = requireTenant(req)
      const body = z
        .object({
          name: z.string().min(1),
          contact: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          city: z.string().optional(),
          taxNo: z.string().optional(),
        })
        .parse(req.body)

      const row = await withCompanyRls(companyId, async (tx) => {
        const [created] = await tx
          .insert(customers)
          .values({
            companyId,
            name: body.name,
            contact: body.contact || null,
            email: body.email || null,
            phone: body.phone || null,
            city: body.city || null,
            taxNo: body.taxNo || null,
          })
          .returning()
        return created
      })

      await logActivity({
        companyId,
        userId: req.auth!.sub,
        action: 'customer.create',
        resource: 'customer',
        resourceId: row.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })

      return { ok: true, customer: row }
    },
  )

  app.patch(
    '/v1/customers/:id',
    { preHandler: [authenticate, requirePermission('crm.customers.update')] },
    async (req) => {
      const companyId = requireTenant(req)
      const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
      const body = z
        .object({
          name: z.string().min(1).optional(),
          contact: z.string().optional(),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          city: z.string().optional().nullable(),
          taxNo: z.string().optional().nullable(),
        })
        .parse(req.body)

      const row = await withCompanyRls(companyId, async (tx) => {
        const [updated] = await tx
          .update(customers)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customers.id, id),
              eq(customers.companyId, companyId),
              isNull(customers.deletedAt),
            ),
          )
          .returning()
        return updated
      })

      if (!row) {
        return { ok: false, error: 'NOT_FOUND' }
      }

      await logActivity({
        companyId,
        userId: req.auth!.sub,
        action: 'customer.update',
        resource: 'customer',
        resourceId: row.id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })

      return { ok: true, customer: row }
    },
  )
}
