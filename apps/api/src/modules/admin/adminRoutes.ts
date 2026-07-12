import type { FastifyInstance } from 'fastify'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  activityLogs,
  companies,
  leads,
  payments,
  subscriptions,
  supportTickets,
  users,
} from '../../db/schema/index.js'
import { requireStaff } from '../../shared/authGuard.js'

export async function adminRoutes(app: FastifyInstance) {
  app.get('/v1/admin/dashboard', { preHandler: requireStaff('support', 'billing', 'superadmin') }, async () => {
    const [companyCount] = await db.select({ count: sql<number>`count(*)::int` }).from(companies)
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users)
    const [leadCount] = await db.select({ count: sql<number>`count(*)::int` }).from(leads)
    const [openTickets] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .where(eq(supportTickets.status, 'open'))

    return {
      ok: true,
      kpis: [
        { label: 'Firmalar', value: companyCount.count },
        { label: 'Kullanıcılar', value: userCount.count },
        { label: 'Demo Talepleri', value: leadCount.count },
        { label: 'Açık Ticket', value: openTickets.count },
      ],
    }
  })

  app.get('/v1/admin/companies', { preHandler: requireStaff('support', 'billing', 'superadmin') }, async () => {
    const rows = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(200)
    return { ok: true, rows }
  })

  app.get('/v1/admin/users', { preHandler: requireStaff('superadmin', 'support') }, async () => {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200)
    return {
      ok: true,
      rows: rows.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        platformRole: u.platformRole,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    }
  })

  app.get('/v1/admin/subscriptions', { preHandler: requireStaff('billing', 'superadmin') }, async () => {
    const rows = await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(200)
    return { ok: true, rows }
  })

  app.get('/v1/admin/payments', { preHandler: requireStaff('billing', 'superadmin') }, async () => {
    const rows = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(200)
    return { ok: true, rows }
  })

  app.get('/v1/admin/activity-logs', { preHandler: requireStaff('superadmin', 'support') }, async () => {
    const rows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(200)
    return { ok: true, rows }
  })

  app.get('/v1/admin/tickets', { preHandler: requireStaff('support', 'superadmin') }, async () => {
    const rows = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(200)
    return { ok: true, rows }
  })
}
