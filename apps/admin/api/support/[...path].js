/**
 * Explicit /api/support/* for Vercel.
 * Multi-segment catch-all (/api/a/b) returns NOT_FOUND without this file.
 * CRM ticket create is public (member Bearer optional); list/detail/replies need staff.
 */
import { withStore, loadStore } from '../../server/store.mjs'
import { applyCors, sendJson } from '../../server/authRoutes.mjs'
import { requireStaffOrReject } from '../../server/staffAuth.mjs'
import {
  addSupportReply,
  createSupportTicketFromRequest,
  getSupportTicket,
  listSupportTickets,
} from '../../server/supportRoutes.mjs'

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

function getSupportSubpath(req) {
  const q = req.query?.path
  if (q != null && q !== '') {
    const joined = Array.isArray(q) ? q.filter(Boolean).join('/') : String(q)
    if (joined.trim()) return joined.replace(/^\/+/, '').replace(/\/+$/, '')
  }
  const url = new URL(req.url || '/', 'http://localhost')
  return url.pathname.replace(/^\/api\/support\/?/, '') || ''
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const sub = getSupportSubpath(req)
    const method = req.method
    const body =
      method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readBody(req) : {}

    // CRM → yeni talep (üyelik Bearer ile; staff gerekmez)
    if (method === 'POST' && (sub === 'tickets' || sub === '')) {
      try {
        const result = await withStore(async (store) =>
          createSupportTicketFromRequest(store, req, body),
        )
        return sendJson(req, res, 201, {
          ok: true,
          ticket: result,
          acknowledgment: result?.acknowledgment || null,
          ackMessage: result?.acknowledgment?.body || null,
        })
      } catch (error) {
        if (error?.message === 'MESSAGE_REQUIRED') {
          return sendJson(req, res, 400, { error: 'Mesaj zorunludur', message: 'Mesaj zorunludur' })
        }
        throw error
      }
    }

    const fullPath = sub ? `support/${sub}` : 'support'
    const staffGate = requireStaffOrReject(req, fullPath, method)
    if (!staffGate.ok) {
      return sendJson(req, res, staffGate.status, staffGate.body)
    }

    if (method === 'GET' && sub === 'tickets') {
      const store = await loadStore()
      return sendJson(req, res, 200, listSupportTickets(store))
    }

    const ticketMatch = sub.match(/^tickets\/([^/]+)$/)
    if (method === 'GET' && ticketMatch) {
      const store = await loadStore()
      const ticket = getSupportTicket(store, ticketMatch[1])
      if (!ticket) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
      return sendJson(req, res, 200, ticket)
    }

    const replyMatch = sub.match(/^tickets\/([^/]+)\/replies$/)
    if (method === 'POST' && replyMatch) {
      try {
        const result = await withStore(async (store) =>
          addSupportReply(store, replyMatch[1], {
            content: body.content || body.message || body.body,
            author: body.author || staffGate.session?.user?.email || 'Destek',
            notifyUser: body.notifyUser !== false,
          }),
        )
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

    const noteMatch = sub.match(/^tickets\/([^/]+)\/notes$/)
    if (method === 'POST' && noteMatch) {
      const result = await withStore((store) => {
        const ticket = getSupportTicket(store, noteMatch[1])
        if (!ticket) return null
        if (!Array.isArray(ticket.internalNotes)) ticket.internalNotes = []
        const note = {
          id: `n_${Date.now()}`,
          content: String(body.content || body.note || body.body || '').trim(),
          author: body.author || staffGate.session?.user?.email || 'Destek',
          createdAt: new Date().toISOString(),
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
    }

    return sendJson(req, res, 404, { error: 'NOT_FOUND', path: fullPath })
  } catch (error) {
    return sendJson(req, res, error?.status || 500, {
      error: 'SERVER_ERROR',
      message: error?.message || 'Sunucu hatası',
    })
  }
}
