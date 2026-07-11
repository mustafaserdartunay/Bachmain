/**
 * Vercel serverless adapter — proxies admin control-center API routes.
 * Full Node server lives in ../server for local/dev; this wraps key endpoints.
 */
import { loadStore, withStore, newId } from '../server/store.mjs'

function json(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'https://uygulama.bachmain.com')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.end(JSON.stringify(data))
}

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
    return json(res, 204, {})
  }

  try {
    const path = getPath(req)
    const method = req.method

    if (method === 'GET' && (path === '' || path === 'health')) {
      return json(res, 200, {
        status: 'ok',
        service: 'bachmain-platform-api',
        timestamp: new Date().toISOString(),
      })
    }

    if (method === 'GET' && path === 'dashboard') {
      const store = await loadStore()
      return json(res, 200, store.dashboard || {})
    }

    if (method === 'GET' && path === 'tickets') {
      const store = await loadStore()
      return json(res, 200, store.supportTickets || [])
    }

    if (method === 'POST' && path === 'tickets') {
      const body = await readBody(req)
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
      return json(res, 201, ticket)
    }

    if (method === 'GET' && path === 'customers') {
      const store = await loadStore()
      return json(res, 200, store.customers || [])
    }

    if (method === 'GET' && path === 'notifications') {
      const store = await loadStore()
      return json(res, 200, store.notifications || store.campaigns || [])
    }

    if (method === 'POST' && path === 'notifications') {
      const body = await readBody(req)
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
      return json(res, 201, item)
    }

    return json(res, 404, { error: 'NOT_FOUND', path })
  } catch (error) {
    return json(res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
