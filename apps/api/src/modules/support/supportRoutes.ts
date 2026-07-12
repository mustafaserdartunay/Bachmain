import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { asc, desc, eq } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { db } from '../../db/client.js'
import {
  chatMessages,
  liveConversations,
  supportTickets,
  ticketMessages,
} from '../../db/schema/index.js'
import { authenticate, requireTenant } from '../../shared/authGuard.js'
import { notifyUser } from '../notifications/notificationService.js'
import { AppError } from '../../shared/errors.js'

export async function supportRoutes(app: FastifyInstance, io: Server) {
  app.post('/v1/support/tickets', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const body = z
      .object({
        subject: z.string().min(3),
        body: z.string().min(1),
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
      })
      .parse(req.body)

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        companyId,
        createdByUserId: req.auth!.sub,
        subject: body.subject,
        priority: body.priority,
        status: 'open',
      })
      .returning()

    const [message] = await db
      .insert(ticketMessages)
      .values({
        ticketId: ticket.id,
        authorUserId: req.auth!.sub,
        body: body.body,
        isStaff: false,
      })
      .returning()

    io.to('admin:support').emit('ticket:created', { ticket, message })
    return { ok: true, ticket, message }
  })

  app.get('/v1/support/tickets', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const rows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.companyId, companyId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(100)
    return { ok: true, rows }
  })

  app.get('/v1/support/tickets/:id/messages', { preHandler: authenticate }, async (req) => {
    const { id } = req.params as { id: string }
    const rows = await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, id))
      .orderBy(asc(ticketMessages.createdAt))
    return { ok: true, rows }
  })

  app.post('/v1/support/tickets/:id/messages', { preHandler: authenticate }, async (req) => {
    const { id } = req.params as { id: string }
    const body = z.object({ body: z.string().min(1) }).parse(req.body)
    const isStaff = (req.auth?.platformRole || 'none') !== 'none'

    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1)
    if (!ticket) throw new AppError('NOT_FOUND', 'Ticket bulunamadı', 404)

    const [message] = await db
      .insert(ticketMessages)
      .values({
        ticketId: id,
        authorUserId: req.auth!.sub,
        body: body.body,
        isStaff,
      })
      .returning()

    if (isStaff) {
      await db
        .update(supportTickets)
        .set({ status: 'waiting_customer', updatedAt: new Date() })
        .where(eq(supportTickets.id, id))
      await notifyUser({
        userId: ticket.createdByUserId,
        companyId: ticket.companyId,
        type: 'ticket',
        title: 'Destek yanıtı',
        body: body.body.slice(0, 140),
        link: `/destek/${id}`,
      })
      io.to(`company:${ticket.companyId}`).emit('ticket:message', { ticketId: id, message })
    } else {
      io.to('admin:support').emit('ticket:message', { ticketId: id, message })
    }

    return { ok: true, message }
  })

  app.patch('/v1/admin/support/tickets/:id', { preHandler: authenticate }, async (req) => {
    if ((req.auth?.platformRole || 'none') === 'none') {
      throw new AppError('FORBIDDEN', 'Yetkisiz', 403)
    }
    const { id } = req.params as { id: string }
    const body = z
      .object({
        status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
        assignedToUserId: z.string().uuid().nullable().optional(),
      })
      .parse(req.body)

    const [ticket] = await db
      .update(supportTickets)
      .set({
        ...(body.status ? { status: body.status } : {}),
        ...(body.assignedToUserId !== undefined ? { assignedToUserId: body.assignedToUserId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id))
      .returning()

    io.to(`company:${ticket.companyId}`).emit('ticket:updated', ticket)
    return { ok: true, ticket }
  })

  app.post('/v1/support/chat/conversations', { preHandler: authenticate }, async (req) => {
    const companyId = requireTenant(req)
    const [conversation] = await db
      .insert(liveConversations)
      .values({
        companyId,
        customerUserId: req.auth!.sub,
        status: 'open',
      })
      .returning()
    io.to('admin:support').emit('chat:conversation', conversation)
    return { ok: true, conversation }
  })

  app.post('/v1/support/chat/messages', { preHandler: authenticate }, async (req) => {
    const body = z
      .object({
        conversationId: z.string().uuid(),
        body: z.string().min(1),
      })
      .parse(req.body)

    const [conversation] = await db
      .select()
      .from(liveConversations)
      .where(eq(liveConversations.id, body.conversationId))
      .limit(1)
    if (!conversation) throw new AppError('NOT_FOUND', 'Konuşma bulunamadı', 404)

    const isStaff = (req.auth?.platformRole || 'none') !== 'none'
    const [message] = await db
      .insert(chatMessages)
      .values({
        conversationId: body.conversationId,
        authorUserId: req.auth!.sub,
        body: body.body,
        isStaff,
      })
      .returning()

    const payload = { conversationId: body.conversationId, message }
    if (isStaff) {
      io.to(`company:${conversation.companyId}`).emit('chat:message', payload)
      io.to(`conversation:${body.conversationId}`).emit('chat:message', payload)
    } else {
      io.to('admin:support').emit('chat:message', payload)
      io.to(`conversation:${body.conversationId}`).emit('chat:message', payload)
    }
    return { ok: true, message }
  })
}
