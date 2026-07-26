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
import { handleWhatsAppApi } from '../server/whatsappApi.mjs'
import { handleMailApi } from '../server/mailRoutes.mjs'
import { hasDatabase } from '../server/db.mjs'
import {
  buildCustomerRows,
  buildAccountRows,
  buildPaymentRequestRows,
  buildMembershipMetrics,
  customerToRow,
} from '../server/membershipViews.mjs'

function getPath(req) {
  const url = new URL(req.url, 'http://localhost')
  return url.pathname.replace(/^\/api\/?/, '') || ''
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
    if (await handleBillingApi(req, res, path, body)) return
    if (await handlePaymentsApi(req, res, path, body)) return
    if (await handleWhatsAppApi(req, res, path, body)) return
    if (await handleTenantApi(req, res, path, body)) return
    if (await handleMailApi(req, res, path, body)) return

    if (method === 'GET' && (path === '' || path === 'health')) {
      const mailConfigured = Boolean(String(process.env.RESEND_API_KEY || '').trim())
      return sendJson(req, res, 200, {
        status: 'ok',
        service: 'bachmain-platform-api',
        timestamp: new Date().toISOString(),
        storage: storageBackend(),
        database: hasDatabase(),
        staffAuth: staffAuthEnabled(),
        mail: {
          provider: 'resend',
          configured: mailConfigured,
          from: process.env.EMAIL_FROM || 'BACHMAIN <noreply@bachmain.com>',
          webUrl: process.env.WEB_URL || 'https://www.bachmain.com',
        },
      })
    }

    const staffGate = requireStaffOrReject(req, path, method)
    if (!staffGate.ok) {
      return sendJson(req, res, staffGate.status, staffGate.body)
    }

    if (method === 'GET' && path === 'dashboard') {
      const store = await loadStore()
      const customers = store.customers || []
      const tickets = store.supportTickets || []
      const paymentRequests = store.paymentRequests || []
      const expiringLicenses = customers
        .filter((c) => ['active', 'trial'].includes(c.status))
        .filter(
          (c) =>
            c.licenseExpiry && new Date(c.licenseExpiry) < new Date(Date.now() + 90 * 86400000),
        )
        .slice(0, 5)
      const openTickets = tickets
        .filter((t) => !['resolved', 'closed'].includes(t.status))
        .slice(0, 8)
      const webSignups = customers.filter((c) => c.source === 'self_signup').length
      return sendJson(req, res, 200, {
        ...(store.dashboard || {}),
        expiringLicenses,
        openTickets,
        pendingPayments: (store.dashboard?.pendingPayments || []).concat(
          paymentRequests
            .filter((p) => p.status === 'pending')
            .slice(0, 8)
            .map((p) => ({
              id: p.id,
              customer: p.companyName || p.email || 'Web üye',
              amount: 0,
              dueDate: (p.createdAt || '').slice(0, 10),
              status: 'Bekleyen',
            })),
        ),
        recentActivities: [
          ...customers
            .filter((c) => c.source === 'self_signup')
            .slice(0, 5)
            .map((c) => ({
              id: `act_${c.id}`,
              title: 'Yeni web üyeliği',
              description: `${c.company} · ${c.plan} · ${c.email}`,
              date: c.createdAt,
              type: 'success',
              user: 'Sistem',
            })),
          ...(store.dashboard?.recentActivities || []),
        ].slice(0, 12),
        kpis: [
          { label: 'Toplam Müşteri', value: String(customers.length), change: '', trend: 'up' },
          { label: 'Web Üyelik', value: String(webSignups), change: '', trend: 'up' },
          {
            label: 'Demo Talep',
            value: String(
              customers.filter((c) => c.source === 'demo_request' || c.source === 'demo_converted')
                .length,
            ),
            change: '',
            trend: 'up',
          },
          {
            label: 'Ödeme Talebi',
            value: String(paymentRequests.filter((p) => p.status === 'pending').length),
            change: '',
            trend: 'neutral',
          },
        ],
      })
    }

    if (method === 'GET' && path.startsWith('modules/')) {
      const parts = path.split('/')
      const moduleId = parts[1]
      const itemId = parts[2]
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
          rows = real.length ? real : store.modules.payments || []
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
        } else {
          rows = store.modules[moduleId] || []
        }
        return sendJson(req, res, 200, { rows, metrics })
      }

      if (parts.length === 3) {
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
          const row = buildAccountRows(store).find((r) => r.id === itemId)
          if (!row) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
          return sendJson(req, res, 200, row)
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

    if (method === 'GET' && path === 'payment-requests') {
      const store = await loadStore()
      return sendJson(req, res, 200, buildPaymentRequestRows(store))
    }

    if (method === 'GET' && path === 'notifications') {
      const store = await loadStore()
      return sendJson(req, res, 200, store.notifications || store.campaigns || [])
    }

    if (method === 'POST' && path === 'notifications') {
      const item = {
        id: newId('ntf'),
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
