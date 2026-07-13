import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadStore, withStore, newId } from './store.mjs'
import { handleAuthApi, applyCors, sendJson as sendAuthJson } from './authRoutes.mjs'
import { handleLeadsApi } from './leads.mjs'
import { handleWhatsAppApi } from './whatsappApi.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PUBLIC = path.join(ROOT, 'public')
const PORT = Number(process.env.PORT || process.env.API_PORT || 5200)
const SERVE_STATIC = process.env.SERVE_STATIC !== 'false'

function sendJson(req, res, status, data) {
  return sendAuthJson(req, res, status, data)
}

function computeMetrics(rows) {
  const activeStatuses = ['Aktif', 'Ödendi', 'Sağlıklı', 'Yayında', 'Gönderildi', 'Çözüldü']
  const pendingStatuses = ['Bekleyen', 'Bekliyor', 'Taslak', 'Planlandı', 'Açık', 'Gecikmiş']
  return [
    { label: 'Toplam', value: String(rows.length), change: 'Kayıt', trend: 'neutral' },
    { label: 'Aktif', value: String(rows.filter((r) => activeStatuses.includes(r.status)).length || Math.floor(rows.length * 0.7)), change: '—', trend: 'up' },
    { label: 'Bekleyen', value: String(rows.filter((r) => pendingStatuses.includes(r.status)).length), change: '—', trend: 'neutral' },
    { label: 'Bu Ay', value: String(Math.max(1, Math.floor(rows.length * 0.3))), change: 'Yeni', trend: 'up' },
  ]
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) }
      catch { reject(new Error('INVALID_JSON')) }
    })
    req.on('error', reject)
  })
}

async function serveStatic(res, pathname) {
  const safe = pathname.split('?')[0]
  const tryPaths = safe === '/' || !path.extname(safe)
    ? [path.join(DIST, 'index.html')]
    : [path.join(DIST, safe), path.join(PUBLIC, safe.replace(/^\//, ''))]

  for (const filePath of tryPaths) {
    try {
      const data = await fs.readFile(filePath)
      const ext = path.extname(filePath)
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
      res.end(data)
      return true
    } catch { /* try next */ }
  }
  return false
}

async function handle(req, res, url) {
  const { pathname } = url
  const method = req.method

  if (method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const apiPath = pathname.replace(/^\/api\/?/, '') || ''
    if (method === 'POST' || method === 'GET' || method === 'PUT' || method === 'PATCH') {
      let body = {}
      if (method !== 'GET' && pathname.startsWith('/api/')) {
        try {
          body = await parseBody(req)
        } catch {
          body = {}
        }
      }
      if (await handleAuthApi(req, res, apiPath, body)) return
      if (await handleLeadsApi(req, res, apiPath, body)) return
      if (await handleWhatsAppApi(req, res, apiPath, body)) return
    }

    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(req, res, 200, { status: 'ok', service: 'bachmain-control-center-api', timestamp: new Date().toISOString() })
    }

    if (method === 'GET' && pathname === '/api/dashboard') {
      const store = await loadStore()
      const expiringLicenses = store.customers.filter((c) => ['active', 'trial'].includes(c.status)).filter((c) => new Date(c.licenseExpiry) < new Date('2026-03-01')).slice(0, 5)
      const openTickets = store.supportTickets.filter((t) => !['resolved', 'closed'].includes(t.status))
      return sendJson(req, res, 200, {
        ...store.dashboard,
        expiringLicenses,
        openTickets,
        kpis: [
          { label: 'Aktif Müşteri', value: String(store.customers.filter((c) => c.status === 'active').length), change: '+12 bu ay', trend: 'up' },
          { label: 'Aylık Gelir (MRR)', value: '₺1.24M', change: '+8.3%', trend: 'up' },
          { label: 'Açık Ticket', value: String(openTickets.length), change: '-3 dünden', trend: 'down' },
          { label: 'Sistem Uptime', value: '99.97%', change: 'Son 30 gün', trend: 'neutral' },
        ],
      })
    }

    if (method === 'GET' && pathname === '/api/customers') {
      const store = await loadStore()
      return sendJson(req, res, 200, store.customers)
    }

    const customerMatch = pathname.match(/^\/api\/customers\/([^/]+)$/)
    if (method === 'GET' && customerMatch) {
      const store = await loadStore()
      const customer = store.customers.find((c) => c.id === customerMatch[1])
      if (!customer) return sendJson(req, res, 404, { error: 'Müşteri bulunamadı' })
      const tickets = store.supportTickets.filter((t) => t.customerId === customer.id)
      return sendJson(req, res, 200, { ...customer, userList: store.customerExtras.users, invoices: store.customerExtras.invoices, payments: store.customerExtras.payments, aiUsage: store.customerExtras.aiUsage, loginHistory: store.customerExtras.loginHistory, timeline: store.customerExtras.timeline, supportTickets: tickets })
    }

    if (method === 'POST' && pathname === '/api/customers') {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const customer = { id: newId('c'), status: 'trial', mrr: 0, users: 1, balance: 0, createdAt: new Date().toISOString().slice(0, 10), licenseExpiry: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10), ...body }
        store.customers.unshift(customer)
        store.modules.customers.unshift({ id: customer.id, company: customer.company, contact: customer.contact, city: customer.city, plan: customer.plan, mrr: '₺0', status: 'Deneme', licenseExpiry: customer.licenseExpiry })
        return customer
      })
      return sendJson(req, res, 201, result)
    }

    if (method === 'PUT' && customerMatch) {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const idx = store.customers.findIndex((c) => c.id === customerMatch[1])
        if (idx < 0) throw new Error('NOT_FOUND')
        store.customers[idx] = { ...store.customers[idx], ...body }
        return store.customers[idx]
      }).catch((e) => (e.message === 'NOT_FOUND' ? null : Promise.reject(e)))
      if (!result) return sendJson(req, res, 404, { error: 'Müşteri bulunamadı' })
      return sendJson(req, res, 200, result)
    }

    if (method === 'DELETE' && customerMatch) {
      await withStore((store) => {
        store.customers = store.customers.filter((c) => c.id !== customerMatch[1])
        store.modules.customers = store.modules.customers.filter((r) => r.id !== customerMatch[1])
      })
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
      return res.end()
    }

    if (method === 'GET' && pathname === '/api/support/tickets') {
      const store = await loadStore()
      return sendJson(req, res, 200, store.supportTickets)
    }

    const ticketMatch = pathname.match(/^\/api\/support\/tickets\/([^/]+)$/)
    if (method === 'GET' && ticketMatch) {
      const store = await loadStore()
      const ticket = store.supportTickets.find((t) => t.id === ticketMatch[1])
      if (!ticket) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
      return sendJson(req, res, 200, ticket)
    }

    if (method === 'POST' && pathname === '/api/support/tickets') {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const ticket = { id: newId('t'), status: 'open', priority: 'medium', assignee: 'Atanmadı', tags: [], internalNotes: [], attachments: [], timeline: [{ id: newId('tl'), title: 'Ticket oluşturuldu', date: new Date().toISOString(), type: 'info' }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), slaDeadline: new Date(Date.now() + 24 * 3600000).toISOString(), ...body }
        store.supportTickets.unshift(ticket)
        return ticket
      })
      return sendJson(req, res, 201, result)
    }

    const noteMatch = pathname.match(/^\/api\/support\/tickets\/([^/]+)\/notes$/)
    if (method === 'POST' && noteMatch) {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const ticket = store.supportTickets.find((t) => t.id === noteMatch[1])
        if (!ticket) throw new Error('NOT_FOUND')
        const note = { id: newId('n'), author: body.author || 'Admin', content: body.content, date: new Date().toISOString() }
        ticket.internalNotes.push(note)
        ticket.timeline.push({ id: newId('tl'), title: 'İç not eklendi', description: note.content, date: note.date, type: 'warning', user: note.author })
        ticket.updatedAt = new Date().toISOString()
        return note
      }).catch((e) => (e.message === 'NOT_FOUND' ? null : Promise.reject(e)))
      if (!result) return sendJson(req, res, 404, { error: 'Ticket bulunamadı' })
      return sendJson(req, res, 201, result)
    }

    const moduleMatch = pathname.match(/^\/api\/modules\/([^/]+)$/)
    if (method === 'GET' && moduleMatch) {
      const store = await loadStore()
      const rows = store.modules[moduleMatch[1]]
      if (!rows) return sendJson(req, res, 404, { error: 'Modül bulunamadı' })
      return sendJson(req, res, 200, { rows, metrics: computeMetrics(rows) })
    }

    const moduleItemMatch = pathname.match(/^\/api\/modules\/([^/]+)\/([^/]+)$/)
    if (method === 'GET' && moduleItemMatch) {
      const store = await loadStore()
      const rows = store.modules[moduleItemMatch[1]]
      if (!rows) return sendJson(req, res, 404, { error: 'Modül bulunamadı' })
      const row = rows.find((r) => r.id === moduleItemMatch[2])
      if (!row) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
      return sendJson(req, res, 200, row)
    }

    if (method === 'POST' && moduleMatch) {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const rows = store.modules[moduleMatch[1]]
        if (!rows) throw new Error('NOT_FOUND')
        const row = { id: newId('row'), ...body }
        rows.unshift(row)
        return row
      }).catch((e) => (e.message === 'NOT_FOUND' ? null : Promise.reject(e)))
      if (!result) return sendJson(req, res, 404, { error: 'Modül bulunamadı' })
      return sendJson(req, res, 201, result)
    }

    if (method === 'PUT' && moduleItemMatch) {
      const body = await parseBody(req)
      const result = await withStore((store) => {
        const rows = store.modules[moduleItemMatch[1]]
        if (!rows) throw new Error('NOT_FOUND')
        const idx = rows.findIndex((r) => r.id === moduleItemMatch[2])
        if (idx < 0) throw new Error('ITEM_NOT_FOUND')
        rows[idx] = { ...rows[idx], ...body }
        return rows[idx]
      }).catch((e) => {
        if (e.message === 'NOT_FOUND') return { error: 'NOT_FOUND' }
        if (e.message === 'ITEM_NOT_FOUND') return { error: 'ITEM_NOT_FOUND' }
        throw e
      })
      if (result?.error === 'NOT_FOUND') return sendJson(req, res, 404, { error: 'Modül bulunamadı' })
      if (result?.error === 'ITEM_NOT_FOUND') return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
      return sendJson(req, res, 200, result)
    }

    if (method === 'DELETE' && moduleItemMatch) {
      await withStore((store) => {
        const rows = store.modules[moduleItemMatch[1]]
        if (rows) store.modules[moduleItemMatch[1]] = rows.filter((r) => r.id !== moduleItemMatch[2])
      })
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*' })
      return res.end()
    }

    const bulkMatch = pathname.match(/^\/api\/modules\/([^/]+)\/bulk-delete$/)
    if (method === 'POST' && bulkMatch) {
      const body = await parseBody(req)
      const ids = body?.ids ?? []
      await withStore((store) => {
        const rows = store.modules[bulkMatch[1]]
        if (rows) store.modules[bulkMatch[1]] = rows.filter((r) => !ids.includes(r.id))
      })
      return sendJson(req, res, 200, { deleted: ids.length })
    }

    if (!pathname.startsWith('/api')) {
      if (SERVE_STATIC && method === 'GET' && await serveStatic(res, pathname)) return
      if (!SERVE_STATIC) return sendJson(req, res, 404, { error: 'Endpoint bulunamadı' })
      return sendJson(req, res, 404, { error: 'Dosya bulunamadı' })
    }

    return sendJson(req, res, 404, { error: 'Endpoint bulunamadı' })
  } catch (err) {
    console.error(err)
    return sendJson(req, res, 500, { error: 'Sunucu hatası' })
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  handle(req, res, url)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`BACHMAIN Control Center running at http://127.0.0.1:${PORT}`)
  console.log(`API available at http://127.0.0.1:${PORT}/api/health`)
})
