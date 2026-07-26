/**
 * CRM dual-write scaffolding (Phase 4).
 * Default OFF — enable with VITE_CRM_DUAL_WRITE=1.
 * Always keeps localStorage as source of truth until cutover gate is approved.
 */
import { scheduleTenantPush, pullTenantCollection } from './tenantSync'

export function isCrmDualWriteEnabled() {
  return String(import.meta.env.VITE_CRM_DUAL_WRITE || '').trim() === '1'
}

/**
 * After a successful local write, optionally mirror to platform tenant API.
 * Failures are logged; local data is never rolled back (no data loss).
 */
export function dualWriteCollection(collection, payload) {
  if (!isCrmDualWriteEnabled()) return
  try {
    scheduleTenantPush(collection, payload)
  } catch (err) {
    console.warn('[crm-dual-write]', collection, err?.message || err)
  }
}

/**
 * Read preference during cutover experiments.
 * 'local' (default) | 'api' — API-first only after explicit gate.
 */
export function crmReadSource() {
  const mode = String(import.meta.env.VITE_CRM_READ_SOURCE || 'local')
    .trim()
    .toLowerCase()
  return mode === 'api' ? 'api' : 'local'
}

/**
 * Pull a tenant collection from API and optionally seed empty local keys.
 * Never overwrites non-empty local data unless `force` is true.
 */
export async function hydrateCollectionFromApi(collection, { localKey, force = false } = {}) {
  if (crmReadSource() !== 'api' && !force) return null
  try {
    const payload = await pullTenantCollection(collection)
    if (payload == null) return null
    if (localKey && typeof localStorage !== 'undefined') {
      const existing = localStorage.getItem(localKey)
      if (!force && existing && existing !== '[]' && existing !== '{}') return payload
      localStorage.setItem(localKey, JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('bach:crm-updated'))
    }
    return payload
  } catch (err) {
    console.warn('[crm-hydrate]', collection, err?.message || err)
    return null
  }
}

/** Compare local vs API row counts for cutover verification. */
export async function diffCollectionCounts(collection, localValue) {
  try {
    const remote = await pullTenantCollection(collection)
    const localCount = Array.isArray(localValue)
      ? localValue.length
      : localValue && typeof localValue === 'object'
        ? Object.keys(localValue).length
        : 0
    const remoteCount = Array.isArray(remote)
      ? remote.length
      : remote && typeof remote === 'object'
        ? Object.keys(remote).length
        : 0
    return { collection, localCount, remoteCount, delta: localCount - remoteCount }
  } catch (err) {
    return { collection, error: err?.message || String(err) }
  }
}
