import type { Server } from 'socket.io'
import { db } from '../../db/client.js'
import { notifications } from '../../db/schema/index.js'

let ioRef: Server | null = null

export function bindNotificationIo(io: Server) {
  ioRef = io
}

export async function notifyUser(input: {
  userId: string
  companyId?: string | null
  type: string
  title: string
  body?: string
  link?: string
  meta?: Record<string, unknown>
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      companyId: input.companyId || null,
      type: input.type,
      title: input.title,
      body: input.body || null,
      link: input.link || null,
      meta: input.meta || {},
    })
    .returning()

  ioRef?.to(`user:${input.userId}`).emit('notification:new', row)
  return row
}
