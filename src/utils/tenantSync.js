/**
 * Sync selected CRM collections to platform Postgres (tenant_data).
 * Falls back silently when DATABASE_URL is not configured on the API.
 *
 * Phase 4 dual-write: enable via VITE_CRM_DUAL_WRITE=1 (see crmApiDualWrite.js).
 * Cutover checklist: docs/54_CRM_TENANT_CUTOVER.md
 */
import { getStoredSession } from './platformAuth'

const API_BASE = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'

async function tenantFetch(collection, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!token) throw new Error('Oturum yok')
  const res = await fetch(`${API_BASE}/tenant/${collection}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify({ payload: body }) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || 'Tenant sync failed')
    err.code = data.error
    err.status = res.status
    throw err
  }
  return data
}

export async function pullTenantCollection(collection) {
  const data = await tenantFetch(collection)
  return data.payload
}

export async function pushTenantCollection(collection, payload) {
  return tenantFetch(collection, { method: 'PUT', body: payload })
}

/** Debounced push helper for localStorage-backed stores. */
export function scheduleTenantPush(collection, payload, delayMs = 1200) {
  const key = `__bachTenantPush_${collection}`
  if (globalThis[key]) clearTimeout(globalThis[key])
  globalThis[key] = setTimeout(() => {
    pushTenantCollection(collection, payload).catch((err) => {
      if (err?.code === 'DATABASE_REQUIRED') return
      if (err?.code === 'READ_ONLY_COMPANY') {
        window.dispatchEvent(new CustomEvent('bach:company-read-only-write-blocked'))
        return
      }
      console.warn('[tenant-sync]', collection, err.message)
    })
  }, delayMs)
}
