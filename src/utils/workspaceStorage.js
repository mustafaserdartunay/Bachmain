/**
 * Per-user CRM workspace in localStorage, synced to platform tenant_data.
 * New members start empty — no demo/sample rows.
 * Background live pull keeps mobile ↔ desktop clients in sync without full page reload.
 */
import {
  scheduleTenantPush,
  pullTenantCollection,
  pullTenantCollectionMeta,
  fetchTenantCollection,
  pushTenantCollection,
  isTenantPushBusy,
} from './tenantSync'

export const WORKSPACE_OWNER_KEY = 'bach-workspace-owner'
export const WORKSPACE_HYDRATED_EVENT = 'bach:workspace-hydrated'
export const WORKSPACE_CLEARED_EVENT = 'bach:workspace-cleared'
export const WORKSPACE_REMOTE_SYNC_EVENT = 'bach:workspace-remote-synced'

const LIVE_PULL_VISIBLE_MS = 3000
const LIVE_PULL_HIDDEN_MS = 15000
const SAFETY_FLUSH_MS = 60_000

/** Auth / control keys — never part of tenant workspace blob. */
const EXCLUDED_KEYS = new Set([
  'bachmain_auth_token',
  'bachmain_auth_user',
  WORKSPACE_OWNER_KEY,
  'bach-demo-data-cleanup-version',
  'bach-app-version-seen',
  'bach-app-build-seen',
  'bach-app-version-transitions',
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
  'bach-process-workspace-prefs',
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
  'bach-logistics-vehicles',
  'bach-logistics-trailers',
  'bach-logistics-pallets',
  'bach-logistics-boxes',
  'bach-logistics-packages',
  'bach-logistics-shipments',
  'bach-logistics-load-plans',
  'bach-logistics-routes',
  'bach-logistics-deliveries',
  'bach-logistics-documents',
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
  'erlenbox-sales-invoices',
  'erlenbox-incoming-e-invoices',
  'bach-org-structure',
  'bach-org-context',
]

const SESSION_KEYS = [
  'erlenbox-depo-document-draft',
  'erlenbox-production-document-draft',
  'erlenbox-voice-open-product',
  'erlenbox-voice-open-quote',
]

/** Domain listeners that refresh UI from localStorage without a page reload. */
const LIVE_REFRESH_EVENTS = [
  'bach:crm-updated',
  'bach:customers-updated',
  'bach:customer-meta-updated',
  'bach:option-lists-updated',
  'bach:quotes-updated',
  'bach:orders-updated',
  'bach:production-updated',
  'bach:depo-updated',
  'bach:products-updated',
  'bach:logistics-updated',
  'bach:omni-updated',
  'bach:personnel-updated',
  'bach:workflow-stages-updated',
  'bach:sectoral-settings-updated',
  'bach:deleted-records-updated',
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

function canSyncWithServer() {
  if (typeof window === 'undefined') return false
  if (!localStorage.getItem(WORKSPACE_OWNER_KEY)) return false
  if (!localStorage.getItem('bachmain_auth_token')) return false
  return true
}

function notifyLiveRefresh(reason = 'remote') {
  window.dispatchEvent(new CustomEvent(WORKSPACE_HYDRATED_EVENT, { detail: { reason } }))
  window.dispatchEvent(new CustomEvent(WORKSPACE_REMOTE_SYNC_EVENT, { detail: { reason } }))
  LIVE_REFRESH_EVENTS.forEach((name) => {
    window.dispatchEvent(new CustomEvent(name, { detail: { reason: 'workspace-live-sync' } }))
  })
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
  globalThis.__bachWorkspaceRestoring = true
  try {
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
    if (payload?.savedAt) globalThis.__bachLastAppliedSavedAt = payload.savedAt
    window.dispatchEvent(
      new CustomEvent(WORKSPACE_HYDRATED_EVENT, { detail: { reason: 'restore' } }),
    )
  } finally {
    globalThis.__bachWorkspaceRestoring = false
  }
}

/**
 * Soft-merge remote workspace into localStorage and refresh open screens in place.
 * Returns true when at least one key changed.
 */
export function applyRemoteWorkspace(payload, { reason = 'pull', updatedAt = null } = {}) {
  const keys = payload?.keys
  if (!keys || typeof keys !== 'object') return false

  const remoteSavedAt = payload?.savedAt || ''
  const pendingSavedAt = globalThis.__bachWorkspacePendingSavedAt || ''
  if (pendingSavedAt && remoteSavedAt && pendingSavedAt > remoteSavedAt) {
    return false
  }

  globalThis.__bachWorkspaceRestoring = true
  let changed = false
  try {
    const remoteKeys = new Set()
    Object.entries(keys).forEach(([key, value]) => {
      if (!isWorkspaceKey(key) || typeof value !== 'string') return
      remoteKeys.add(key)
      try {
        if (localStorage.getItem(key) !== value) {
          localStorage.setItem(key, value)
          changed = true
        }
      } catch {
        // quota / private mode
      }
    })

    const toRemove = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (isWorkspaceKey(key) && !remoteKeys.has(key)) toRemove.push(key)
    }
    toRemove.forEach((key) => {
      localStorage.removeItem(key)
      changed = true
    })

    if (remoteSavedAt) globalThis.__bachLastAppliedSavedAt = remoteSavedAt
    if (updatedAt) globalThis.__bachLastRemoteUpdatedAt = updatedAt

    if (changed) notifyLiveRefresh(reason)
    return changed
  } finally {
    globalThis.__bachWorkspaceRestoring = false
  }
}

export function getWorkspaceOwnerId(user) {
  if (!user) return ''
  // Membership email is the stable key across demo → paid conversion.
  const email = String(user.email || '')
    .trim()
    .toLowerCase()
  if (email.includes('@')) return `email:${email}`
  return String(user.tenantCode || user.customerId || user.id || '')
}

/**
 * Switch local CRM data to this account: clear foreign data, pull from DB.
 * New members start empty; returning members restore their email-scoped workspace
 * so purchase continues from the same place.
 */
export async function bindUserWorkspace(user) {
  const ownerId = getWorkspaceOwnerId(user)
  if (!ownerId) return

  const previous = localStorage.getItem(WORKSPACE_OWNER_KEY)
  if (previous && previous !== ownerId) {
    clearWorkspaceStorage()
  }
  localStorage.setItem(WORKSPACE_OWNER_KEY, ownerId)

  await hydrateTenantWorkspace({ ownerChanged: Boolean(previous && previous !== ownerId) })
  installWorkspaceAutoSync()
}

export async function hydrateTenantWorkspace({ ownerChanged = false } = {}) {
  try {
    const data = await fetchTenantCollection('workspace')
    const payload = data?.payload
    if (data?.updatedAt) globalThis.__bachLastRemoteUpdatedAt = data.updatedAt
    const hasKeys = payload?.keys && Object.keys(payload.keys).length > 0
    if (hasKeys) {
      restoreWorkspace(payload)
      notifyLiveRefresh('hydrate')
      return
    }

    const snap = snapshotWorkspace()
    const localCount = Object.keys(snap.keys || {}).length
    if (ownerChanged || localCount === 0) {
      // Brand-new member / switched account: empty workspace, no demo data.
      clearWorkspaceStorage()
      const owner = localStorage.getItem(WORKSPACE_OWNER_KEY)
      if (owner) localStorage.setItem(WORKSPACE_OWNER_KEY, owner)
      return
    }

    // Same membership email, empty server blob: keep local rows and push up
    // so package purchase later continues from this workspace.
    scheduleWorkspacePush(0)
  } catch (err) {
    if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503) return
    if (err?.status === 401) return
    console.warn('[workspace] hydrate failed', err?.message || err)
  }
}

export async function flushWorkspaceNow() {
  try {
    const snap = snapshotWorkspace()
    globalThis.__bachWorkspacePendingSavedAt = snap.savedAt
    const result = await pushTenantCollection('workspace', snap)
    globalThis.__bachLastAppliedSavedAt = snap.savedAt
    if (result?.updatedAt) globalThis.__bachLastRemoteUpdatedAt = result.updatedAt
    globalThis.__bachWorkspacePendingSavedAt = ''
  } catch (err) {
    if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503) return
    console.warn('[workspace] flush failed', err?.message || err)
  }
}

export function scheduleWorkspacePush(delayMs = 800) {
  const snap = snapshotWorkspace()
  globalThis.__bachWorkspacePendingSavedAt = snap.savedAt
  scheduleTenantPush('workspace', snap, delayMs)
}

async function pullWorkspaceIfRemoteNewer() {
  if (!canSyncWithServer()) return false
  if (globalThis.__bachWorkspaceRestoring) return false
  if (isTenantPushBusy('workspace')) return false
  if (globalThis.__bachWorkspacePullInFlight) return false

  globalThis.__bachWorkspacePullInFlight = true
  try {
    let meta
    try {
      meta = await pullTenantCollectionMeta('workspace')
    } catch (err) {
      if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503 || err?.status === 401) {
        return false
      }
      // Older API without /meta — fall through to full pull compare via savedAt
      meta = null
    }

    const remoteUpdatedAt = meta?.updatedAt || null
    const remoteSavedAt = meta?.savedAt || null
    const lastUpdated = globalThis.__bachLastRemoteUpdatedAt || ''
    const lastSaved = globalThis.__bachLastAppliedSavedAt || ''

    if (remoteUpdatedAt && remoteUpdatedAt === lastUpdated) return false
    if (!remoteUpdatedAt && remoteSavedAt && remoteSavedAt === lastSaved) return false

    const pendingSavedAt = globalThis.__bachWorkspacePendingSavedAt || ''
    if (pendingSavedAt && remoteSavedAt && pendingSavedAt > remoteSavedAt) return false

    const payload = await pullTenantCollection('workspace')
    if (!payload?.keys) {
      if (remoteUpdatedAt) globalThis.__bachLastRemoteUpdatedAt = remoteUpdatedAt
      return false
    }
    return applyRemoteWorkspace(payload, {
      reason: 'live-pull',
      updatedAt: remoteUpdatedAt,
    })
  } catch (err) {
    if (err?.code === 'DATABASE_REQUIRED' || err?.status === 503 || err?.status === 401) {
      return false
    }
    console.warn('[workspace] live pull failed', err?.message || err)
    return false
  } finally {
    globalThis.__bachWorkspacePullInFlight = false
  }
}

function installWorkspaceLiveSync() {
  if (typeof window === 'undefined' || globalThis.__bachWorkspaceLiveSyncInstalled) return
  globalThis.__bachWorkspaceLiveSyncInstalled = true

  let timerId = null

  const clearPullTimer = () => {
    if (timerId) {
      window.clearTimeout(timerId)
      timerId = null
    }
  }

  const scheduleNextPull = () => {
    clearPullTimer()
    if (!canSyncWithServer()) return
    const delay =
      typeof document !== 'undefined' && document.visibilityState === 'hidden'
        ? LIVE_PULL_HIDDEN_MS
        : LIVE_PULL_VISIBLE_MS
    timerId = window.setTimeout(async () => {
      await pullWorkspaceIfRemoteNewer()
      scheduleNextPull()
    }, delay)
  }

  const pullNow = () => {
    pullWorkspaceIfRemoteNewer().finally(() => scheduleNextPull())
  }

  window.addEventListener('bach:tenant-push-ok', (event) => {
    if (event.detail?.collection !== 'workspace') return
    const savedAt = event.detail?.payload?.savedAt
    if (savedAt) {
      globalThis.__bachLastAppliedSavedAt = savedAt
      if (globalThis.__bachWorkspacePendingSavedAt === savedAt) {
        globalThis.__bachWorkspacePendingSavedAt = ''
      }
    }
    if (event.detail?.updatedAt) {
      globalThis.__bachLastRemoteUpdatedAt = event.detail.updatedAt
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pullNow()
    else scheduleNextPull()
  })
  window.addEventListener('focus', pullNow)
  window.addEventListener('online', pullNow)

  scheduleNextPull()
}

export function installWorkspaceAutoSync() {
  if (typeof window === 'undefined' || globalThis.__bachWorkspaceSyncInstalled) return
  globalThis.__bachWorkspaceSyncInstalled = true

  const originalSetItem = localStorage.setItem.bind(localStorage)
  localStorage.setItem = (key, value) => {
    originalSetItem(key, value)
    if (isWorkspaceKey(key) && !globalThis.__bachWorkspaceRestoring) scheduleWorkspacePush()
  }

  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  localStorage.removeItem = (key) => {
    originalRemoveItem(key)
    if (isWorkspaceKey(key) && !globalThis.__bachWorkspaceRestoring) scheduleWorkspacePush()
  }

  window.addEventListener('bach:company-read-only-write-blocked', () => {
    hydrateTenantWorkspace()
  })

  // Periodic safety flush while tab is open
  globalThis.__bachWorkspaceFlushTimer = setInterval(() => {
    if (!canSyncWithServer()) return
    scheduleWorkspacePush(0)
  }, SAFETY_FLUSH_MS)

  window.addEventListener('beforeunload', () => {
    try {
      // best-effort sync marker; actual PUT may not finish
      scheduleWorkspacePush(0)
    } catch {
      // ignore
    }
  })

  installWorkspaceLiveSync()
}
