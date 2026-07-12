/**
 * Per-user CRM workspace in localStorage, synced to platform tenant_data.
 * New members start empty — no demo/sample rows.
 */
import { scheduleTenantPush, pullTenantCollection, pushTenantCollection } from './tenantSync'

export const WORKSPACE_OWNER_KEY = 'bach-workspace-owner'
export const WORKSPACE_HYDRATED_EVENT = 'bach:workspace-hydrated'
export const WORKSPACE_CLEARED_EVENT = 'bach:workspace-cleared'

/** Auth / control keys — never part of tenant workspace blob. */
const EXCLUDED_KEYS = new Set([
  'bachmain_auth_token',
  'bachmain_auth_user',
  WORKSPACE_OWNER_KEY,
  'bach-demo-data-cleanup-version',
])

/** Known CRM storage keys (also any erlenbox-* / bach-* prefix except excluded). */
export const WORKSPACE_STORAGE_KEYS = [
  'erlenbox-created-customers',
  'erlenbox-archived-customers',
  'erlenbox-deleted-customers',
  'erlenbox-customer-list-settings',
  'erlenbox-customer-option-lists',
  'erlenbox-customer-activity',
  'erlenbox-customer-form-drafts',
  'erlenbox-products',
  'erlenbox-quotes',
  'erlenbox-orders',
  'erlenbox-production',
  'erlenbox-depo',
  'erlenbox-workflow-stages',
  'erlenbox-depo-workflow-stages',
  'erlenbox-crm-process-templates',
  'erlenbox-crm-process-templates-removed',
  'erlenbox-production-fulfillment-options',
  'bach-crm-tasks',
  'bach-crm-appointments',
  'bach-crm-agenda-notes',
  'bach-crm-process-filter',
  'erlenbox-treasury-accounts',
  'erlenbox-treasury-movements',
  'erlenbox-personnel',
  'erlenbox-field-sales',
  'erlenbox-b2b-access',
  'erlenbox-b2b-orders',
  'erlenbox-b2b-quotes',
  'erlenbox-b2b-tickets',
  'erlenbox-b2b-production',
  'bach-omni-conversations',
  'bach-omni-messages',
  'bach-omni-leads',
  'bach-omni-webhook-log',
  'bach-omni-assignments',
  'bach-courier-tracking-v1',
  'bach-team-hub-state',
  'erlenbox-company-settings',
  'erlenbox-user-profile',
  'erlenbox-tenant-registry',
  'erlenbox-deleted-records',
  'erlenbox-projects',
  'erlenbox-activity-archive-log',
  'erlenbox-doc-templates',
  'erlenbox-doc-labels',
  'erlenbox-doc-print-jobs',
]

const SESSION_KEYS = [
  'erlenbox-depo-document-draft',
  'erlenbox-production-document-draft',
  'erlenbox-voice-open-product',
  'erlenbox-voice-open-quote',
]

function isWorkspaceKey(key) {
  if (!key || EXCLUDED_KEYS.has(key)) return false
  if (WORKSPACE_STORAGE_KEYS.includes(key)) return true
  return key.startsWith('erlenbox-') || key.startsWith('bach-')
}

function deleteProductMediaDb() {
  if (typeof indexedDB === 'undefined') return
  try {
    indexedDB.deleteDatabase('erlenbox-product-storage')
  } catch {
    // best-effort
  }
}

export function snapshotWorkspace() {
  const keys = {}
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!isWorkspaceKey(key)) continue
      keys[key] = localStorage.getItem(key)
    }
  } catch {
    // storage unavailable
  }
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    keys,
  }
}

export function clearWorkspaceStorage() {
  try {
    const toRemove = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (isWorkspaceKey(key)) toRemove.push(key)
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
    SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key))
    deleteProductMediaDb()
    window.dispatchEvent(new CustomEvent(WORKSPACE_CLEARED_EVENT))
  } catch {
    // ignore
  }
}

export function restoreWorkspace(payload) {
  clearWorkspaceStorage()
  const keys = payload?.keys
  if (!keys || typeof keys !== 'object') return
  Object.entries(keys).forEach(([key, value]) => {
    if (!isWorkspaceKey(key) || typeof value !== 'string') return
    try {
      localStorage.setItem(key, value)
    } catch {
      // quota / private mode
    }
  })
  window.dispatchEvent(new CustomEvent(WORKSPACE_HYDRATED_EVENT))
}

export function getWorkspaceOwnerId(user) {
  if (!user) return ''
  return String(user.id || user.customerId || user.email || user.tenantCode || '')
}

/**
 * Switch local CRM data to this account: clear foreign data, pull from DB.
 */
export async function bindUserWorkspace(user) {
  const ownerId = getWorkspaceOwnerId(user)
  if (!ownerId) return

  const previous = localStorage.getItem(WORKSPACE_OWNER_KEY)
  if (previous && previous !== ownerId) {
    clearWorkspaceStorage()
  }
  localStorage.setItem(WORKSPACE_OWNER_KEY, ownerId)

  await hydrateTenantWorkspace()
  installWorkspaceAutoSync()
}

export async function hydrateTenantWorkspace() {
  try {
    const payload = await pullTenantCollection('workspace')
    const hasKeys = payload?.keys && Object.keys(payload.keys).length > 0
    if (hasKeys) {
      restoreWorkspace(payload)
    } else {
      // Brand-new member: empty workspace, no demo data.
      clearWorkspaceStorage()
      // Keep owner marker
      const owner = localStorage.getItem(WORKSPACE_OWNER_KEY)
      if (owner) localStorage.setItem(WORKSPACE_OWNER_KEY, owner)
    }
  } catch (err) {
    if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503) return
    if (err?.status === 401) return
    console.warn('[workspace] hydrate failed', err?.message || err)
  }
}

export async function flushWorkspaceNow() {
  try {
    await pushTenantCollection('workspace', snapshotWorkspace())
  } catch (err) {
    if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503) return
    console.warn('[workspace] flush failed', err?.message || err)
  }
}

export function scheduleWorkspacePush(delayMs = 1200) {
  scheduleTenantPush('workspace', snapshotWorkspace(), delayMs)
}

export function installWorkspaceAutoSync() {
  if (typeof window === 'undefined' || globalThis.__bachWorkspaceSyncInstalled) return
  globalThis.__bachWorkspaceSyncInstalled = true

  const originalSetItem = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (key, value) => {
    originalSetItem(key, value)
    if (isWorkspaceKey(key)) scheduleWorkspacePush()
  }

  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  localStorage.removeItem = (key) => {
    originalRemoveItem(key)
    if (isWorkspaceKey(key)) scheduleWorkspacePush()
  }

  // Periodic safety flush while tab is open
  globalThis.__bachWorkspaceFlushTimer = setInterval(() => {
    if (!localStorage.getItem(WORKSPACE_OWNER_KEY)) return
    if (!localStorage.getItem('bachmain_auth_token')) return
    scheduleWorkspacePush(0)
  }, 60_000)

  window.addEventListener('beforeunload', () => {
    try {
      // best-effort sync marker; actual PUT may not finish
      scheduleWorkspacePush(0)
    } catch {
      // ignore
    }
  })
}
