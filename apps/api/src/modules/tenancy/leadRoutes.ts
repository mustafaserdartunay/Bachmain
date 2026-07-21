import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { leads, users } from '../../db/schema/index.js'
import { notifyUser } from '../notifications/notificationService.js'
import { requireStaff } from '../../shared/authGuard.js'

export async function leadRoutes(app: FastifyInstance) {
  app.post('/v1/leads/demo', async (req) => {
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(3),
        company: z.string().optional(),
        companyName: z.string().optional(),
        size: z.string().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
      })
      .parse(req.body)

    const [lead] = await db
      .insert(leads)
      .values({
        fullName: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        companyName: (body.companyName || body.company || '').trim() || null,
        companySize: body.size || null,
        message: body.message || null,
        source: body.source || 'bachmain_demo',
        status: 'pending',
      })
      .returning()

    const staff = await db
      .select()
      .from(users)
      .where(eq(users.platformRole, 'superadmin'))
      .limit(20)
    for (const s of staff) {
      await notifyUser({
        userId: s.id,
        type: 'lead',
        title: `Demo talebi: ${lead.companyName || lead.fullName}`,
        body: `${lead.email} · ${lead.phone}`,
        meta: { leadId: lead.id },
      })
    }

    return {
      ok: true,
      id: lead.id,
      message: 'Demo talebiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
    }
  })

  app.get('/v1/admin/leads', { preHandler: [requireStaff()] }, async () => {
    const rows = await db.select().from(leads).limit(200)
    return { ok: true, rows }
  })
}
