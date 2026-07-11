/**
 * Explicit /api/modules/* routes for Vercel (multi-segment catch-all reliability).
 */
import { loadStore } from '../../server/store.mjs'
import { sendJson, applyCors } from '../../server/authRoutes.mjs'

function getModulePath(req) {
  const url = new URL(req.url, 'http://localhost')
  return url.pathname.replace(/^\/api\/modules\/?/, '') || ''
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    if (req.method !== 'GET') {
      return sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
    }

    const rest = getModulePath(req)
    const parts = rest ? rest.split('/').filter(Boolean) : []
    const moduleId = parts[0]
    const itemId = parts[1]
    if (!moduleId) {
      return sendJson(req, res, 400, { error: 'MODULE_ID_REQUIRED' })
    }

    const store = await loadStore()
    if (!store.modules) store.modules = {}

    if (parts.length === 1) {
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

    if (parts.length === 2) {
      const rows = store.modules[moduleId] || []
      const row = rows.find((r) => r.id === itemId)
      if (!row) return sendJson(req, res, 404, { error: 'Kayıt bulunamadı' })
      return sendJson(req, res, 200, row)
    }

    return sendJson(req, res, 404, { error: 'NOT_FOUND', path: rest })
  } catch (error) {
    return sendJson(req, res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
