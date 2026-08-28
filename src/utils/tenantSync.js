/**
 * Sync selected CRM collections to platform Postgres (tenant_data).
 * Falls back silently when DATABASE_URL is not configured on the API.
 *
 * Phase 4 dual-write: enable via VITE_CRM_DUAL_WRITE=1 (see crmApiDualWrite.js).
 * Cutover checklist: docs/54_CRM_TENANT_CUTOVER.md
 *
 * Workspace PUTs are serialized per collection: concurrent callers coalesce to the
 * latest snapshot so a stale older PUT cannot finish last and wipe fresher CRM rows.
 */
import { getStoredSession } from './platformAuth'

const API_BASE = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'
const TENANT_TIMEOUT_MS = 12_000

const pendingTimers = new Map()
const pendingPayloads = new Map()
const inFlight = new Set()
/** @type {Map<string, Promise<unknown>>} */
const pushChains = new Map()
/** Latest payload (or factory) waiting to be sent for each collection. */
const latestPayloads = new Map()

async function fetchWithTimeout(url, options = {}, timeoutMs = TENANT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error?.name === 'AbortError') {
      const err = new Error('İstek zaman aşımına uğradı')
      err.code = 'TIMEOUT'
      throw err
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function tenantFetch(path, { method = 'GET', body } = {}) {
  const { token } = getStoredSession()
  if (!token) throw new Error('Oturum yok')
  const res = await fetchWithTimeout(`${API_BASE}/tenant/${path}`, {
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

/** Drop debounced timer so flush can send immediately with the latest snapshot. */
export function cancelScheduledTenantPush(collection) {
  if (!collection) return
  if (pendingTimers.has(collection)) {
    clearTimeout(pendingTimers.get(collection))
    pendingTimers.delete(collection)
  }
  pendingPayloads.delete(collection)
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

function resolvePayload(payload) {
  return typeof payload === 'function' ? payload() : payload
}

function payloadSavedAt(body) {
  return String(body?.savedAt || '')
}

/**
 * Serialized PUT with coalesce: wait for prior pushes, always send the newest
 * claimed body, and re-loop if a newer snapshot arrived during the request.
 */
export async function pushTenantCollection(collection, payload) {
  latestPayloads.set(collection, payload)

  const previous = pushChains.get(collection) || Promise.resolve()
  const run = previous
    .catch(() => {})
    .then(async () => {
      let lastResult = { skipped: true, reason: 'empty' }

      while (latestPayloads.has(collection)) {
        const raw = latestPayloads.get(collection)
        latestPayloads.delete(collection)
        let body
        try {
          body = resolvePayload(raw)
        } catch (err) {
          console.warn('[tenant-sync] payload resolve failed', collection, err?.message || err)
          continue
        }
        if (!body) continue

        inFlight.add(collection)
        try {
          const result = await tenantFetch(collection, { method: 'PUT', body })
          lastResult = result

          // Newer write landed mid-flight — loop and push again.
          if (latestPayloads.has(collection)) continue

          window.dispatchEvent(
            new CustomEvent('bach:tenant-push-ok', {
              detail: {
                collection,
                updatedAt: result?.updatedAt || null,
                payload: body,
                savedAt: payloadSavedAt(body),
              },
            }),
          )
          return result
        } catch (err) {
          if (err?.code === 'DATABASE_REQUIRED') {
            return { skipped: true, reason: 'database' }
          }
          if (err?.code === 'READ_ONLY_COMPANY') {
            window.dispatchEvent(new CustomEvent('bach:company-read-only-write-blocked'))
            return { skipped: true, reason: 'read-only' }
          }
          // Keep latest for a retrying caller; re-queue this body if nothing newer.
          if (!latestPayloads.has(collection)) {
            latestPayloads.set(collection, body)
          }
          throw err
        } finally {
          inFlight.delete(collection)
        }
      }

      return lastResult
    })

  pushChains.set(collection, run)
  return run
}

/** Debounced push helper for localStorage-backed stores. */
export function scheduleTenantPush(collection, payload, delayMs = 800) {
  pendingPayloads.set(collection, payload)
  if (pendingTimers.has(collection)) clearTimeout(pendingTimers.get(collection))
  pendingTimers.set(
    collection,
    setTimeout(() => {
      pendingTimers.delete(collection)
      const raw = pendingPayloads.get(collection)
      pendingPayloads.delete(collection)
      if (!raw) return
      pushTenantCollection(collection, raw).catch((err) => {
        if (err?.code === 'DATABASE_REQUIRED') return
        console.warn('[tenant-sync]', collection, err.message)
      })
    }, delayMs),
  )
}
