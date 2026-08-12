/**
 * Explicit /api/support/* for Vercel (max one path segment after /support).
 * CRM create: POST /api/support/tickets
 * Detail/reply use /api/support-ticket?id= (see support-ticket.js)
 */
import { withStore, loadStore } from '../../server/store.mjs'
import { applyCors, sendJson } from '../../server/authRoutes.mjs'
import { requireStaffOrReject } from '../../server/staffAuth.mjs'
import {
  createSupportTicketFromRequest,
  listSupportTickets,
  notifySupportTicketCreated,
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

    // CRM → yeni talep
    if (method === 'POST' && (sub === 'tickets' || sub === '')) {
      try {
        const result = await withStore(async (store) =>
          createSupportTicketFromRequest(store, req, body),
        )
        await withStore(async (store) => {
          await notifySupportTicketCreated(store, result)
        }).catch(() => null)
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

    return sendJson(req, res, 404, {
      error: 'NOT_FOUND',
      path: fullPath,
      hint: 'Detay için /api/support-ticket?id=... kullanın',
    })
  } catch (error) {
    return sendJson(req, res, error?.status || 500, {
      error: 'SERVER_ERROR',
      message: error?.message || 'Sunucu hatası',
    })
  }
}
