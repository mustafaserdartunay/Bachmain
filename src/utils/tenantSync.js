/**
 * Sync selected CRM collections to platform Postgres (tenant_data).
 * Falls back silently when DATABASE_URL is not configured on the API.
 *
 * Phase 4 dual-write: enable via VITE_CRM_DUAL_WRITE=1 (see crmApiDualWrite.js).
 * Cutover checklist: docs/54_CRM_TENANT_CUTOVER.md
 */
import { getStoredSession } from './platformAuth'

const API_BASE = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'

const pendingTimers = new Map()
const pendingPayloads = new Map()
const inFlight = new Set()

async function tenantFetch(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!token) throw new Error('Oturum yok')
  const res = await fetch(`${API_BASE}/tenant/${path}`, {
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

export function isTenantPushBusy(collection) {
  if (!collection) return pendingTimers.size > 0 || inFlight.size > 0
  return pendingTimers.has(collection) || inFlight.has(collection)
}

export async function pullTenantCollection(collection) {
  const data = await tenantFetch(collection)
  return data.payload
}

export async function fetchTenantCollection(collection) {
  return tenantFetch(collection)
}

export async function pullTenantCollectionMeta(collection) {
  return tenantFetch(`${collection}/meta`)
}

export async function pushTenantCollection(collection, payload) {
  inFlight.add(collection)
  try {
    return await tenantFetch(collection, { method: 'PUT', body: payload })
  } finally {
    inFlight.delete(collection)
  }
}

/** Debounced push helper for localStorage-backed stores. */
export function scheduleTenantPush(collection, payload, delayMs = 800) {
  const nextPayload = typeof payload === 'function' ? payload() : payload
  pendingPayloads.set(collection, nextPayload)
  if (pendingTimers.has(collection)) clearTimeout(pendingTimers.get(collection))
  pendingTimers.set(
    collection,
    setTimeout(() => {
      pendingTimers.delete(collection)
      const body = pendingPayloads.get(collection)
      pendingPayloads.delete(collection)
      pushTenantCollection(collection, body)
        .then((result) => {
          window.dispatchEvent(
            new CustomEvent('bach:tenant-push-ok', {
              detail: { collection, updatedAt: result?.updatedAt || null, payload: body },
            }),
          )
        })
        .catch((err) => {
          if (err?.code === 'DATABASE_REQUIRED') return
          if (err?.code === 'READ_ONLY_COMPANY') {
            window.dispatchEvent(new CustomEvent('bach:company-read-only-write-blocked'))
            return
          }
          console.warn('[tenant-sync]', collection, err.message)
        })
    }, delayMs),
  )
}
