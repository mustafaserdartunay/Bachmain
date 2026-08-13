/**
 * Single-segment support ticket detail API.
 * Vercel returns NOT_FOUND for /api/support/tickets/:id (3+ path parts).
 * Use /api/support-ticket?id=... instead.
 */
import { withStore, loadStore, newId } from '../server/store.mjs'
import { applyCors, sendJson } from '../server/authRoutes.mjs'
import { requireStaffOrReject, getStaffSession } from '../server/staffAuth.mjs'
import {
  addSupportReply,
  getSupportTicket,
  notifySupportReply,
  updateSupportTicket,
} from '../server/supportRoutes.mjs'

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function getQuery(req) {
  const out = {}
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (Array.isArray(v)) out[k] = v[0]
      else if (v != null) out[k] = String(v)
    }
  }
  try {
    const url = new URL(String(req.url || ''), 'http://localhost')
    for (const [k, v] of url.searchParams.entries()) out[k] = v
  } catch {
    /* ignore */
  }
  return out
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const method = req.method
    const query = getQuery(req)
    const id = String(query.id || query.ticketId || '').trim()
    const op = String(query.op || (method === 'GET' ? 'get' : '')).trim().toLowerCase()
    const body =
      method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readBody(req) : {}

    const staffGate = requireStaffOrReject(req, 'support-ticket', method)
    if (!staffGate.ok) {
      return sendJson(req, res, staffGate.status, staffGate.body)
    }

    if (!id) {
      return sendJson(req, res, 400, { error: 'MISSING_ID', message: 'Ticket id zorunlu' })
    }

    const staffAuthor =
      body.author ||
      getStaffSession(req)?.user?.email ||
      staffGate.session?.user?.email ||
      'Destek'

    if (method === 'GET' || op === 'get') {
      const store = await loadStore()
      const ticket = getSupportTicket(store, id)
      if (!ticket) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
      return sendJson(req, res, 200, ticket)
    }

    if (method === 'POST' && (op === 'update' || op === 'patch')) {
      try {
        const ticket = await withStore((store) =>
          updateSupportTicket(
            store,
            id,
            {
              status: body.status,
              priority: body.priority,
              assignee: body.assignee,
            },
            staffAuthor,
          ),
        )
        return sendJson(req, res, 200, { ok: true, ticket })
      } catch (error) {
        if (error?.message === 'NOT_FOUND') {
          return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
        }
        if (error?.message === 'INVALID_STATUS' || error?.message === 'INVALID_PRIORITY') {
          return sendJson(req, res, 400, { error: error.message, message: 'Geçersiz alan değeri' })
        }
        throw error
      }
    }

    if (method === 'POST' && (op === 'reply' || op === 'replies')) {
      try {
        const result = await withStore(async (store) =>
          addSupportReply(store, id, {
            content: body.content || body.message || body.body,
            author: staffAuthor,
            notifyUser: body.notifyUser !== false,
          }),
        )
        await withStore(async (store) => {
          const live = getSupportTicket(store, id) || result.ticket
          await notifySupportReply(store, live, result.reply)
        }).catch(() => null)
        return sendJson(req, res, 201, { ok: true, ...result })
      } catch (error) {
        if (error?.message === 'NOT_FOUND') {
          return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
        }
        if (error?.message === 'MESSAGE_REQUIRED') {
          return sendJson(req, res, 400, { error: 'Yanıt metni zorunludur' })
        }
        throw error
      }
    }

    if (method === 'POST' && (op === 'note' || op === 'notes')) {
      try {
        const result = await withStore((store) => {
          const ticket = getSupportTicket(store, id)
          if (!ticket) return null
          if (!Array.isArray(ticket.internalNotes)) ticket.internalNotes = []
          const note = {
            id: newId('n'),
            content: String(body.content || body.note || body.body || '').trim(),
            author: staffAuthor,
            createdAt: new Date().toISOString(),
            date: new Date().toISOString(),
          }
          if (!note.content) {
            const err = new Error('MESSAGE_REQUIRED')
            err.status = 400
            throw err
          }
          ticket.internalNotes.push(note)
          ticket.updatedAt = note.createdAt
          return note
        })
        if (!result) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
        return sendJson(req, res, 201, { ok: true, note: result })
      } catch (error) {
        if (error?.message === 'MESSAGE_REQUIRED') {
          return sendJson(req, res, 400, { error: 'Not metni zorunludur' })
        }
        throw error
      }
    }

    return sendJson(req, res, 404, { error: 'NOT_FOUND', op })
  } catch (error) {
    return sendJson(req, res, error?.status || 500, {
      error: 'SERVER_ERROR',
      message: error?.message || 'Sunucu hatası',
    })
  }
}
