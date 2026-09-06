import type { Server } from 'socket.io'
import { verifyAccessToken } from '../shared/jwt.js'
import { AI_SYNC_EVENTS } from './aiSyncEvents.js'

export function registerRealtime(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        String(socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '')
      if (!token) return next(new Error('UNAUTHORIZED'))
      const claims = await verifyAccessToken(token)
      socket.data.auth = claims
      next()
    } catch {
      next(new Error('UNAUTHORIZED'))
    }
  })

  io.on('connection', (socket) => {
    const auth = socket.data.auth as { sub: string; cid?: string | null; platformRole?: string }
    socket.join(`user:${auth.sub}`)
    if (auth.cid) socket.join(`company:${auth.cid}`)
    if (auth.platformRole && auth.platformRole !== 'none') {
      socket.join('admin:support')
    }

    socket.on('chat:join', (conversationId: string) => {
      if (conversationId) socket.join(`conversation:${conversationId}`)
    })

    socket.on('ticket:join', (ticketId: string) => {
      if (ticketId) socket.join(`ticket:${ticketId}`)
    })

    /** Bach AI V2 — client asks to refetch after metadata-only sync events. */
    socket.on('live:subscribe', () => {
      if (auth.cid) socket.join(`company:${auth.cid}`)
    })

    socket.on('ai:sync:ack', (payload: { event?: string; id?: string }) => {
      if (!auth.cid) return
      socket.to(`company:${auth.cid}`).emit(AI_SYNC_EVENTS.AI_ACTION_COMPLETED, {
        id: payload?.id || null,
        meta: { event: payload?.event || null, ackedBy: auth.sub },
        at: new Date().toISOString(),
      })
    })
  })
}

export { AI_SYNC_EVENTS, emitCompanyAiSync } from './aiSyncEvents.js'
