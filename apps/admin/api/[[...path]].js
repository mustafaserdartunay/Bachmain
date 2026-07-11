/**
 * Vercel serverless adapter — proxies admin control-center API routes.
 * Full Node server lives in ../server for local/dev; this wraps key endpoints.
 */
import { loadStore, withStore, newId } from '../server/store.mjs'
import { handleAuthApi, sendJson, applyCors } from '../server/authRoutes.mjs'

function getPath(req) {
  const url = new URL(req.url, 'http://localhost')
  return url.pathname.replace(/^\/api\/?/, '') || ''
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
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
    const body = method === 'POST' || method === 'PUT' ? await readBody(req) : {}

    if (await handleAuthApi(req, res, path, body)) return

    if (method === 'GET' && (path === '' || path === 'health')) {
      return sendJson(req, res, 200, {
        status: 'ok',
        service: 'bachmain-platform-api',
        timestamp: new Date().toISOString(),
      })
    }

    if (method === 'GET' && path === 'dashboard') {
      const store = await loadStore()
      const customers = store.customers || []
      const tickets = store.supportTickets || []
      const expiringLicenses = customers
        .filter((c) => ['active', 'trial'].includes(c.status))
        .filter((c) => c.licenseExpiry && new Date(c.licenseExpiry) < new Date(Date.now() + 90 * 86400000))
        .slice(0, 5)
      const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).slice(0, 8)
      return sendJson(req, res, 200, {
        ...(store.dashboard || {}),
        expiringLicenses,
        openTickets,
        kpis: store.dashboard?.kpis || [
          { label: 'Aktif Müşteri', value: String(customers.filter((c) => c.status === 'active').length), change: '', trend: 'up' },
          { label: 'Açık Ticket', value: String(openTickets.length), change: '', trend: 'neutral' },
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
        let rows = store.modules[moduleId] || []
        if (moduleId === 'customers' && rows.length === 0) {
          rows = (store.customers || []).map((c) => ({
            id: c.id,
            company: c.company,
            contact: c.contact,
            city: c.city || '—',
            plan: c.plan,
            mrr: typeof c.mrr === 'number' ? `₺${c.mrr}` : c.mrr || '₺0',
            status: c.status === 'trial' ? 'Deneme' : c.status === 'active' ? 'Aktif' : c.status,
            licenseExpiry: c.licenseExpiry,
          }))
        }
        return sendJson(req, res, 200, { rows, metrics: [] })
      }
      if (parts.length === 3) {
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
