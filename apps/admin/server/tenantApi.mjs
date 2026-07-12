/**
 * Tenant CRM data sync — durable per-tenant collections in Postgres.
 */
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { loadStore } from './store.mjs'
import { getTenantCollection, setTenantCollection, hasDatabase } from './db.mjs'
import { sendJson } from './authRoutes.mjs'

const ALLOWED_COLLECTIONS = new Set([
  'crmRecords',
  'products',
  'quotes',
  'treasury',
  'settings',
  'workspace',
])

export async function handleTenantApi(req, res, path, body = {}) {
  const method = req.method
  if (!path.startsWith('tenant/')) return false

  if (!hasDatabase()) {
    sendJson(req, res, 503, {
      error: 'DATABASE_REQUIRED',
      message: 'Tenant veri senkronu için DATABASE_URL gerekli',
    })
    return true
  }

  const token = getBearerOrCookieToken(req)
  const store = await loadStore()
  const session = getAccountFromToken(store, token)
  if (!session?.user?.tenantCode) {
    sendJson(req, res, 401, { error: 'UNAUTHORIZED', message: 'Üye oturumu gerekli' })
    return true
  }

  const tenantCode = session.user.tenantCode
  const parts = path.split('/')
  // tenant/:collection
  const collection = parts[1]
  if (!collection || !ALLOWED_COLLECTIONS.has(collection)) {
    sendJson(req, res, 400, {
      error: 'INVALID_COLLECTION',
      message: `İzin verilen koleksiyonlar: ${[...ALLOWED_COLLECTIONS].join(', ')}`,
    })
    return true
  }

  // License gate
  const customer = session.customer
  if (customer?.licenseExpiry) {
    const expired = new Date(customer.licenseExpiry) < new Date(new Date().toISOString().slice(0, 10))
    if (expired && customer.status !== 'active') {
      // trial/expired blocked for writes
      if (method !== 'GET') {
        sendJson(req, res, 402, {
          error: 'LICENSE_EXPIRED',
          message: 'Lisans veya deneme süresi dolmuş. Plan yükseltin.',
          licenseExpiry: customer.licenseExpiry,
          status: customer.status,
        })
        return true
      }
    }
  }

  if (method === 'GET') {
    const payload = (await getTenantCollection(tenantCode, collection)) || {}
    sendJson(req, res, 200, { ok: true, tenantCode, collection, payload })
    return true
  }

  if (method === 'PUT' || method === 'POST') {
    const payload = body.payload ?? body
    await setTenantCollection(tenantCode, collection, payload)
    sendJson(req, res, 200, { ok: true, tenantCode, collection })
    return true
  }

  sendJson(req, res, 405, { error: 'METHOD_NOT_ALLOWED' })
  return true
}
