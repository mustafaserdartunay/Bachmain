/**
 * Bach AI V2 — sync event helpers for Socket.IO company rooms.
 * Payload: id + metadata only (no full document dump).
 */

export const AI_SYNC_EVENTS = {
  OFFER_CREATED: 'offer.created',
  OFFER_UPDATED: 'offer.updated',
  ORDER_CREATED: 'order.created',
  CUSTOMER_UPDATED: 'customer.updated',
  STOCK_CHANGED: 'stock.changed',
  AI_ACTION_COMPLETED: 'ai.action.completed',
}

/**
 * @param {import('socket.io').Server} io
 * @param {string} companyId
 * @param {string} event
 * @param {{ id?: string, meta?: Record<string, unknown> }} payload
 */
export function emitCompanyAiSync(
  io: { to: (room: string) => { emit: (event: string, payload: unknown) => void } } | null,
  companyId: string,
  event: string,
  payload: { id?: string; meta?: Record<string, unknown> } = {},
) {
  const cid = String(companyId || '').trim()
  if (!io || !cid || !event) return false
  io.to(`company:${cid}`).emit(event, {
    id: payload.id || null,
    meta: payload.meta || {},
    at: new Date().toISOString(),
  })
  return true
}
