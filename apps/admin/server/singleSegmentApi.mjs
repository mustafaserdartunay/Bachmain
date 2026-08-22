/**
 * Vercel single-segment API routes used by the admin frontend.
 * Local server/index.mjs must mirror these (/api/member, /api/support-ticket).
 */
import { loadStore, withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { getStaffSession, requireStaffOrReject } from './staffAuth.mjs'
import {
  buildAccountRows,
  buildMembershipDetail,
  buildMembershipMetrics,
} from './membershipViews.mjs'
import {
  extendMembership,
  extendMembershipByAccount,
  activatePlanDirect,
  seedBillingIfEmpty,
  notifyMembershipEvent,
} from './subscriptionService.mjs'
import { startEmailChange, deleteMembershipAccount } from './emailChange.mjs'
import {
  addSupportReply,
  getSupportTicket,
  notifySupportReply,
  updateSupportTicket,
} from './supportRoutes.mjs'

function queryFromUrl(url) {
  return Object.fromEntries(url.searchParams.entries())
}

async function handleMembershipMutate(req, res, body) {
  const accountId = String(body.id || body.accountId || '').trim()
  if (!accountId) {
    return sendJson(req, res, 400, {
      ok: false,
      error: 'MISSING_ID',
      message: 'Üye id zorunlu',
    })
  }
  const op = String(body.op || body.actionType || 'extend')

  if (op === 'extend') {
    try {
      const result = await withStore(async (store) => {
        seedBillingIfEmpty(store)
        const extended = await extendMembershipByAccount(store, accountId, {
          days: body.days ?? 7,
          mode: body.mode || 'trial',
          note: body.note || '',
        })
        return { ...extended, detail: buildMembershipDetail(store, accountId) }
      })
      return sendJson(req, res, 200, { ok: true, ...result })
    } catch (err) {
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'EXTEND_FAILED',
        message: err.message,
      })
    }
  }

  if (op === 'delete') {
    try {
      const result = await withStore((store) => deleteMembershipAccount(store, accountId))
      return sendJson(req, res, 200, { ok: true, ...result })
    } catch (err) {
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'DELETE_FAILED',
        message: err.message,
      })
    }
  }

  if (op === 'start_email_change') {
    try {
      const result = await withStore(async (store) => {
        const started = await startEmailChange(store, {
          accountId,
          staffEmail: body.staffEmail || null,
        })
        return {
          ...started,
          detail: buildMembershipDetail(store, accountId),
        }
      })
      return sendJson(req, res, 200, { ok: true, ...result })
    } catch (err) {
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'EMAIL_CHANGE_FAILED',
        message: err.message,
      })
    }
  }

  const action = String(body.action || op)
  try {
    const result = await withStore(async (store) => {
      const account = (store.accounts || []).find((a) => a.id === accountId)
      if (!account) {
        throw Object.assign(new Error('Üye hesabı bulunamadı'), {
          code: 'NOT_FOUND',
          status: 404,
        })
      }
      const customer = (store.customers || []).find((c) => c.id === account.customerId)
      seedBillingIfEmpty(store)

      if (action === 'suspend') {
        account.canLogin = false
        if (customer) {
          customer.status = 'suspended'
          customer.subscriptionStatus = 'suspended'
        }
        await notifyMembershipEvent(store, {
          type: 'account_suspended',
          accountId: account.id,
          customerId: customer?.id || account.customerId || null,
          endDate: customer?.licenseExpiry || account.licenseExpiry || null,
          planName: account.plan || customer?.plan || '',
        })
      } else if (action === 'activate') {
        account.canLogin = true
        if (account.role === 'demo_lead') account.role = 'owner'
        if (customer) {
          const stillValid =
            customer.licenseExpiry &&
            new Date(`${customer.licenseExpiry}T23:59:59.999`) >= new Date()
          customer.status = stillValid
            ? customer.subscriptionStatus === 'trialing' || customer.status === 'trial'
              ? 'trial'
              : 'active'
            : 'trial'
          customer.subscriptionStatus = customer.status === 'trial' ? 'trialing' : 'active'
        }
        await notifyMembershipEvent(store, {
          type: 'account_activated',
          accountId: account.id,
          customerId: customer?.id || account.customerId || null,
          endDate: customer?.licenseExpiry || account.licenseExpiry || null,
          planName: account.plan || customer?.plan || '',
        })
      } else if (action === 'set_plan') {
        if (!customer) {
          throw Object.assign(new Error('Müşteri kaydı yok'), { code: 'NO_CUSTOMER', status: 400 })
        }
        activatePlanDirect(store, customer.id, body.planCode || 'starter', body.period || 'month', {
          action: 'staff_membership_plan',
          status: body.asTrial ? 'trialing' : 'active',
        })
      } else if (action === 'convert_demo') {
        account.canLogin = true
        account.role = 'owner'
        account.source = 'demo_converted'
        if (customer) {
          customer.source = 'demo_converted'
          if (!customer.licenseExpiry) {
            await extendMembership(store, customer.id, { days: body.days ?? 7, mode: 'trial' })
          } else {
            customer.status = 'trial'
            customer.subscriptionStatus = 'trialing'
          }
        }
      } else {
        throw Object.assign(new Error('Geçersiz işlem'), { code: 'INVALID_ACTION', status: 400 })
      }

      account.updatedAt = new Date().toISOString()
      return buildMembershipDetail(store, accountId)
    })
    return sendJson(req, res, 200, { ok: true, detail: result })
  } catch (err) {
    return sendJson(req, res, err.status || 400, {
      ok: false,
      error: err.code || 'ACTION_FAILED',
      message: err.message,
    })
  }
}

export async function handleMemberApi(req, res, method, query, body) {
  if (method === 'GET') {
    const qid = String(query.id || query.itemId || '').trim()
    if (qid) {
      const store = await loadStore()
      const detail = buildMembershipDetail(store, decodeURIComponent(qid))
      if (!detail) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
      return sendJson(req, res, 200, detail)
    }
    const store = await loadStore()
    return sendJson(req, res, 200, {
      rows: buildAccountRows(store),
      metrics: buildMembershipMetrics(store).slice(0, 4),
    })
  }

  if (method === 'POST') {
    return handleMembershipMutate(req, res, body)
  }

  return sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
}

export async function handleSupportTicketApi(req, res, method, query, body) {
  const staffGate = requireStaffOrReject(req, 'support-ticket', method)
  if (!staffGate.ok) {
    return sendJson(req, res, staffGate.status, staffGate.body)
  }

  const id = String(query.id || query.ticketId || '').trim()
  const op = String(query.op || (method === 'GET' ? 'get' : ''))
    .trim()
    .toLowerCase()

  if (!id) {
    return sendJson(req, res, 400, { error: 'MISSING_ID', message: 'Ticket id zorunlu' })
  }

  const staffAuthor =
    body.author || getStaffSession(req)?.user?.email || staffGate.session?.user?.email || 'Destek'

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
}

export { queryFromUrl }
