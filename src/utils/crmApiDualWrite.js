/**
 * CRM dual-write scaffolding (Phase 4).
 * Default OFF — enable with VITE_CRM_DUAL_WRITE=1.
 * Always keeps localStorage as source of truth until cutover gate is approved.
 */
import { scheduleTenantPush } from './tenantSync'

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
  const mode = String(import.meta.env.VITE_CRM_READ_SOURCE || 'local').trim().toLowerCase()
  return mode === 'api' ? 'api' : 'local'
}
