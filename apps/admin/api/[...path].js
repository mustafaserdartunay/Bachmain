/**
 * Vercel serverless adapter — proxies admin control-center API routes.
 */
import { loadStore, withStore, newId, storageBackend } from '../server/store.mjs'
import { handleAuthApi, sendJson, applyCors } from '../server/authRoutes.mjs'
import { requireStaffOrReject, staffAuthEnabled } from '../server/staffAuth.mjs'
import { handlePaymentsApi } from '../server/payments.mjs'
import { handleBillingApi } from '../server/billingRoutes.mjs'
import { handleTenantApi } from '../server/tenantApi.mjs'
import { handleLeadsApi } from '../server/leads.mjs'
import { handleLegalApi } from '../server/legal.mjs'
import { handleAnnouncementsApi } from '../server/announcements.mjs'
import { handleWhatsAppApi } from '../server/whatsappApi.mjs'
import { handleMailApi } from '../server/mailRoutes.mjs'
import { hasDatabase } from '../server/db.mjs'
import {
  buildCustomerRows,
  buildAccountRows,
  buildPaymentRequestRows,
  buildMembershipMetrics,
  buildMembershipDetail,
  customerToRow,
} from '../server/membershipViews.mjs'
import {
  extendMembership,
  extendMembershipByAccount,
  activatePlanDirect,
  seedBillingIfEmpty,
  notifyMembershipEvent,
} from '../server/subscriptionService.mjs'
import { startEmailChange, deleteMembershipAccount } from '../server/emailChange.mjs'
import { handleQualityControl } from '../server/qualityControl.mjs'
import { handleSocialConnections } from '../server/socialConnections.mjs'
import { handlePlatformAdminApi } from '../server/platformAdminRoutes.mjs'
import { handleEdocumentsApi } from '../server/edocumentsRoutes.mjs'
import { handleSecurityApi } from '../server/securityRoutes.mjs'
import { handleAiosApi } from '../server/aiosRoutes.mjs'
import {
  buildDashboardPayload,
  buildServerMonitorRows,
  loadLiveSupportRows,
} from '../server/systemMetrics.mjs'
import {
  addSupportReply,
  buildSupportModuleRows,
  createSupportTicketFromRequest,
  getSupportTicket,
  listSupportTickets,
  notifySupportReply,
  notifySupportTicketCreated,
  updateSupportTicket,
} from '../server/supportRoutes.mjs'

function getPath(req) {
  // Vercel catch-all: /api/[...path] may expose segments via query.path
  const q = req.query?.path
  if (q != null && q !== '') {
    const joined = Array.isArray(q) ? q.filter(Boolean).join('/') : String(q)
    if (joined.trim()) {
      return joined.replace(/^\/+/, '').replace(/\/+$/, '')
    }
  }

  const raw = String(req.url || '')
  let pathname = raw
  try {
    pathname = new URL(raw, 'http://localhost').pathname
  } catch {
    pathname = raw.split('?')[0] || raw
  }

  return (
    pathname
      .replace(/^\/api\/?/, '')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '') || ''
  )
}

function getQuery(req) {
  const out = {}
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'path') continue
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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const path = getPath(req)
    const method = req.method
    const body =
      method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readBody(req) : {}

    if (await handleAuthApi(req, res, path, body)) return
    if (await handleLeadsApi(req, res, path, body)) return
    if (await handleLegalApi(req, res, path, body)) return
    if (await handleAnnouncementsApi(req, res, path, body)) return
    if (await handleBillingApi(req, res, path, body)) return
    if (await handlePaymentsApi(req, res, path, body)) return
    if (await handleWhatsAppApi(req, res, path, body)) return
    if (await handleTenantApi(req, res, path, body)) return
    if (await handleEdocumentsApi(req, res, path, body, getQuery(req))) return
    if (await handleMailApi(req, res, path, body)) return

    // CRM destek talebi — staff gate öncesi (üyelik Bearer yeterli)
    if (method === 'POST' && path === 'support/tickets') {
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

    if (method === 'GET' && (path === '' || path === 'health')) {
      return sendJson(req, res, 200, {
        status: 'ok',
        service: 'bachmain-platform-api',
        timestamp: new Date().toISOString(),
        storage: storageBackend(),
        database: hasDatabase(),
        staffAuth: staffAuthEnabled(),
      })
    }

    const staffGate = requireStaffOrReject(req, path, method)
    if (!staffGate.ok) {
      return sendJson(req, res, staffGate.status, staffGate.body)
    }

    const query = getQuery(req)

    // Single-segment ticket detail (Vercel-safe): /api/support-ticket?id=
    if (path === 'support-ticket') {
      const id = String(query.id || query.ticketId || body.id || '').trim()
      const op = String(query.op || (method === 'GET' ? 'get' : ''))
        .trim()
        .toLowerCase()
      if (!id) {
        return sendJson(req, res, 400, { error: 'MISSING_ID', message: 'Ticket id zorunlu' })
      }
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
              body.author || 'Destek',
            ),
          )
          return sendJson(req, res, 200, { ok: true, ticket })
        } catch (error) {
          if (error?.message === 'NOT_FOUND') {
            return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
          }
          if (error?.message === 'INVALID_STATUS' || error?.message === 'INVALID_PRIORITY') {
            return sendJson(req, res, 400, {
              error: error.message,
              message: 'Geçersiz alan değeri',
            })
          }
          throw error
        }
      }
      if (method === 'POST' && (op === 'reply' || op === 'replies')) {
        try {
          const result = await withStore(async (store) =>
            addSupportReply(store, id, {
              content: body.content || body.message || body.body,
              author: body.author || 'Destek',
              notifyUser: body.notifyUser !== false,
            }),
          )
          await withStore(async (store) => {
            await notifySupportReply(store, result.ticket, result.reply)
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
        const note = await withStore((store) => {
          const ticket = getSupportTicket(store, id)
          if (!ticket) return null
          if (!Array.isArray(ticket.internalNotes)) ticket.internalNotes = []
          const row = {
            id: newId('n'),
            content: String(body.content || body.note || body.body || '').trim(),
            author: body.author || 'Destek',
            createdAt: new Date().toISOString(),
            date: new Date().toISOString(),
          }
          if (!row.content) {
            const err = new Error('MESSAGE_REQUIRED')
            err.status = 400
            throw err
          }
          ticket.internalNotes.push(row)
          ticket.updatedAt = row.createdAt
          return row
        })
        if (!note) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
        return sendJson(req, res, 201, { ok: true, note })
      }
    }

    if (await handleQualityControl(req, res, path, body, query)) return
    if (await handleSocialConnections(req, res, path)) return
    if (await handleSecurityApi(req, res, path)) return
    if (await handleAiosApi(req, res, path)) return
    if (await handlePlatformAdminApi(req, res, path, body)) return

    if (method === 'GET' && path === 'dashboard') {
      const store = await loadStore()
      const extras = await buildServerMonitorRows()
      const payload = buildDashboardPayload(store)
      return sendJson(req, res, 200, {
        ...payload,
        systemHealth: extras.map((row) => ({
          name: row.name,
          status:
            row.status === 'Sağlıklı' ? 'healthy' : row.status === 'Kritik' ? 'down' : 'warning',
          uptime: '—',
          latency: row.latency || '—',
        })),
      })
    }

    // Single-segment member API (works on Vercel; multi-segment /api/a/b/c returns NOT_FOUND)
    if (path === 'member' || path === 'modules/memberships' || path === 'memberships') {
      if (method === 'GET') {
        const qid = String(query.id || query.itemId || '').trim()
        if (qid) {
          const store = await loadStore()
          const detail = buildMembershipDetail(store, decodeURIComponent(qid))
          if (!detail) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
          return sendJson(req, res, 200, detail)
        }
        if (path === 'member') {
          const store = await loadStore()
          return sendJson(req, res, 200, {
            rows: buildAccountRows(store),
            metrics: buildMembershipMetrics(store).slice(0, 4),
          })
        }
        // fall through to modules list for modules/memberships without id
      }
      if (method === 'POST') {
        return handleMembershipMutate(req, res, body)
      }
    }

    if (method === 'GET' && path.startsWith('modules/')) {
      const parts = path.split('/').filter(Boolean)
      const moduleId = parts[1]
      const itemId = parts.slice(2).join('/') || undefined
      const store = await loadStore()
      if (!store.modules) store.modules = {}

      if (parts.length === 2) {
        let rows = []
        let metrics = []
        if (moduleId === 'customers') {
          rows = buildCustomerRows(store)
          metrics = buildMembershipMetrics(store).slice(0, 4)
        } else if (moduleId === 'memberships' || moduleId === 'accounts-users') {
          rows = buildAccountRows(store)
          metrics = buildMembershipMetrics(store).slice(0, 4)
        } else if (moduleId === 'payment-requests' || moduleId === 'payments') {
          // Real payment requests take priority for "payments" list when present
          const real = buildPaymentRequestRows(store)
          rows = real
          metrics = buildMembershipMetrics(store).slice(3, 5)
        } else if (moduleId === 'subscriptions') {
          rows = buildCustomerRows(store).map((c, i) => ({
            id: `sub_${c.id}`,
            customer: c.company,
            plan: c.plan,
            startDate: c.createdAt,
            expiry: c.licenseExpiry,
            status: c.status,
            mrr: c.mrr,
            source: c.source,
          }))
        } else if (moduleId === 'notifications') {
          const staffOnly = (store.notifications || []).filter(
            (n) =>
              n &&
              (n.audience === 'staff' ||
                [
                  'demo_request',
                  'payment_request',
                  'new_user',
                  'package_purchase',
                  'kontor_purchase',
                  'module_purchase',
                  'staff_alert',
                ].includes(n.type)),
          )
          rows = staffOnly.map((n) => ({
            id: n.id,
            title: n.title,
            type: n.type || 'Bildirim',
            sent: n.createdAt ? new Date(n.createdAt).toLocaleString('tr-TR') : '—',
            recipients: 'admin@bachmain.com',
            status: 'Yönetim',
            body: n.body || '',
            customerId: n.customerId || null,
            accountId: n.accountId || null,
          }))
          metrics = [
            { label: 'Toplam bildirim', value: String(rows.length) },
            {
              label: 'Demo',
              value: String(staffOnly.filter((n) => n.type === 'demo_request').length),
            },
            {
              label: 'Satın alma',
              value: String(
                staffOnly.filter((n) =>
                  [
                    'package_purchase',
                    'kontor_purchase',
                    'module_purchase',
                    'payment_request',
                  ].includes(n.type),
                ).length,
              ),
            },
          ]
        } else if (moduleId === 'support') {
          rows = buildSupportModuleRows(store)
          metrics = [
            { label: 'Toplam', value: String(rows.length), change: 'Ticket', trend: 'neutral' },
            {
              label: 'Açık',
              value: String(rows.filter((r) => r.status === 'Açık').length),
              change: '—',
              trend: 'up',
            },
            {
              label: 'Bekliyor',
              value: String(rows.filter((r) => r.status === 'Bekliyor').length),
              change: '—',
              trend: 'neutral',
            },
            {
              label: 'Yüksek',
              value: String(
                rows.filter((r) => r.priority === 'Yüksek' || r.priority === 'Kritik').length,
              ),
              change: 'Öncelik',
              trend: 'down',
            },
          ]
        } else if (moduleId === 'live-support') {
          rows = await loadLiveSupportRows()
        } else if (moduleId === 'server') {
          rows = await buildServerMonitorRows()
        } else {
          rows = store.modules[moduleId] || []
        }
        return sendJson(req, res, 200, { rows, metrics })
      }

      if (parts.length >= 3 && itemId) {
        if (moduleId === 'customers') {
          const customer = (store.customers || []).find((c) => c.id === itemId)
          if (!customer) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
          const account = (store.accounts || []).find((a) => a.customerId === itemId)
          return sendJson(req, res, 200, {
            ...customerToRow(customer, account),
            ...customer,
            accountEmail: account?.email,
            accountId: account?.id,
          })
        }
        if (moduleId === 'memberships' || moduleId === 'accounts-users') {
          const detail = buildMembershipDetail(store, decodeURIComponent(itemId))
          if (!detail) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
          return sendJson(req, res, 200, detail)
        }
        if (moduleId === 'payment-requests') {
          const row = buildPaymentRequestRows(store).find((r) => r.id === itemId)
          if (!row) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
          return sendJson(req, res, 200, row)
        }
        const rows = store.modules[moduleId] || []
        const row = rows.find((r) => r.id === itemId)
        if (!row) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
        return sendJson(req, res, 200, row)
      }
    }

    if (method === 'GET' && path === 'tickets') {
      const store = await loadStore()
      return sendJson(req, res, 200, store.supportTickets || [])
    }

    if (method === 'POST' && path === 'tickets') {
      const ticket = {
        id: newId('tkt'),
        subject: body.subject || 'Destek talebi',
        status: 'open',
        priority: body.priority || 'normal',
        customerId: body.customerId || null,
        customerName: body.customerName || 'CRM Kullanıcısı',
        messages: [
          {
            id: newId('msg'),
            author: body.author || 'customer',
            body: body.message || body.body || '',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await withStore((store) => {
        store.supportTickets = [ticket, ...(store.supportTickets || [])]
        return store
      })
      return sendJson(req, res, 201, ticket)
    }

    if (method === 'GET' && path === 'customers') {
      const store = await loadStore()
      return sendJson(req, res, 200, store.customers || [])
    }

    const customerMatch = path.match(/^customers\/([^/]+)$/)
    if (method === 'GET' && customerMatch) {
      const store = await loadStore()
      const customer = (store.customers || []).find((c) => c.id === customerMatch[1])
      if (!customer) return sendJson(req, res, 404, { error: 'Müşteri bulunamadı' })
      const account = (store.accounts || []).find((a) => a.customerId === customer.id)
      const tickets = (store.supportTickets || []).filter((t) => t.customerId === customer.id)
      const paymentRequests = (store.paymentRequests || []).filter(
        (p) => p.customerId === customer.id,
      )
      return sendJson(req, res, 200, {
        ...customer,
        account,
        userList: account
          ? [
              {
                id: account.id,
                name: account.fullName,
                email: account.email,
                role: account.role || 'owner',
                lastLogin: account.lastLoginAt || '—',
                status: 'Aktif',
              },
            ]
          : [],
        invoices: store.customerExtras?.invoices || [],
        payments: paymentRequests.map((p) => ({
          id: p.id,
          date: (p.createdAt || '').slice(0, 10),
          amount: 0,
          method: p.plan,
          status: p.status,
        })),
        aiUsage: store.customerExtras?.aiUsage || {
          totalQueries: 0,
          tokensUsed: 0,
          costEstimate: 0,
          topFeatures: [],
        },
        loginHistory: (store.customerExtras?.loginHistory || []).filter(
          (h) => h.customerId === customer.id || h.email === customer.email,
        ),
        timeline: store.customerExtras?.timeline || [],
        supportTickets: tickets,
        paymentRequests,
        passwordChangedAt: account?.passwordChangedAt || null,
        mailLogs: (
          (store.mail?.logs || []).filter(
            (m) =>
              m.customerId === customer.id ||
              m.accountId === account?.id ||
              (m.to &&
                account?.email &&
                String(m.to).toLowerCase() === String(account.email).toLowerCase()),
          ) || []
        ).slice(0, 50),
        authEvents: (
          (store.authEvents || []).filter(
            (e) =>
              e.customerId === customer.id ||
              e.accountId === account?.id ||
              e.email === customer.email,
          ) || []
        ).slice(0, 50),
      })
    }

    if (method === 'GET' && path === 'accounts') {
      const store = await loadStore()
      return sendJson(req, res, 200, buildAccountRows(store))
    }

    const membershipExtendMatch = path.match(/^memberships\/([^/]+)\/extend$/)
    if (method === 'POST' && membershipExtendMatch) {
      const accountId = membershipExtendMatch[1]
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

    const membershipActionMatch = path.match(/^memberships\/([^/]+)\/action$/)
    if (method === 'POST' && membershipActionMatch) {
      const accountId = membershipActionMatch[1]
      const action = String(body.action || '')
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
              throw Object.assign(new Error('Müşteri kaydı yok'), {
                code: 'NO_CUSTOMER',
                status: 400,
              })
            }
            activatePlanDirect(
              store,
              customer.id,
              body.planCode || 'starter',
              body.period || 'month',
              {
                action: 'staff_membership_plan',
                status: body.asTrial ? 'trialing' : 'active',
              },
            )
          } else if (action === 'convert_demo') {
            account.canLogin = true
            account.role = 'owner'
            account.source = 'demo_converted'
            if (customer) {
              customer.source = 'demo_converted'
              if (!customer.licenseExpiry) {
                await extendMembership(store, customer.id, {
                  days: body.days ?? 7,
                  mode: 'trial',
                })
              } else {
                customer.status = 'trial'
                customer.subscriptionStatus = 'trialing'
              }
            }
          } else {
            throw Object.assign(new Error('Geçersiz işlem'), {
              code: 'INVALID_ACTION',
              status: 400,
            })
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

    if (method === 'GET' && path === 'payment-requests') {
      const store = await loadStore()
      return sendJson(req, res, 200, buildPaymentRequestRows(store))
    }

    if (method === 'GET' && path === 'notifications') {
      const staffGate = requireStaffOrReject(req, path, method)
      if (!staffGate.ok) return sendJson(req, res, staffGate.status || 401, staffGate.body)
      const store = await loadStore()
      const staffOnly = (store.notifications || []).filter(
        (n) =>
          n &&
          (n.audience === 'staff' ||
            [
              'demo_request',
              'payment_request',
              'new_user',
              'package_purchase',
              'kontor_purchase',
              'module_purchase',
              'staff_alert',
            ].includes(n.type)),
      )
      return sendJson(req, res, 200, staffOnly)
    }

    if (method === 'POST' && path === 'notifications') {
      const staffGate = requireStaffOrReject(req, path, method)
      if (!staffGate.ok) return sendJson(req, res, staffGate.status || 401, staffGate.body)
      const item = {
        id: newId('ntf'),
        audience: 'staff',
        title: body.title || 'Bildirim',
        body: body.body || body.message || '',
        type: body.type || 'announcement',
        createdAt: new Date().toISOString(),
      }
      await withStore((store) => {
        store.notifications = [item, ...(store.notifications || [])]
        return store
      })
      return sendJson(req, res, 201, item)
    }

    return sendJson(req, res, 404, { error: 'NOT_FOUND', path })
  } catch (error) {
    return sendJson(req, res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
