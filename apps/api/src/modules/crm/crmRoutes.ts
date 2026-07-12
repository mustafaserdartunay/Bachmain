import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { customers } from '../../db/schema/index.js'
import { authenticate, requireTenant } from '../../shared/authGuard.js'
import { logActivity } from '../audit/activityService.js'

export async function crmRoutes(app: FastifyInstance) {
  app.get('/v1/customers', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const rows = await db
      .select()
      .from(customers)
      .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
      .orderBy(desc(customers.createdAt))
      .limit(500)
    return { ok: true, rows }
  })

  app.post('/v1/customers', { preHandler: authenticate }, async (req) => {
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

    const [row] = await db
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

    await logActivity({
      companyId,
      userId: req.auth!.sub,
      action: 'customer.create',
      resource: 'customer',
      resourceId: row.id,
    })

    return { ok: true, customer: row }
  })
}
