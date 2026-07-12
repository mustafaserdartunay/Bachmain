const CLEANUP_VERSION_KEY = 'bach-demo-data-cleanup-version'
const CLEANUP_VERSION = '2026-07-12-no-demo-workspace-v2'

const LOCAL_STORAGE_KEYS_TO_REMOVE = [
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
]

const SESSION_STORAGE_KEYS_TO_REMOVE = [
  'erlenbox-depo-document-draft',
  'erlenbox-production-document-draft',
  'erlenbox-voice-open-product',
  'erlenbox-voice-open-quote',
]

function removeStorageKeys(storage, keys) {
  keys.forEach((key) => storage.removeItem(key))
}

function deleteProductMediaDb() {
  if (typeof indexedDB === 'undefined') return
  try {
    indexedDB.deleteDatabase('erlenbox-product-storage')
  } catch {
    // IndexedDB cleanup is best-effort; localStorage is the source of product rows.
  }
}

/**
 * One-time wipe of leftover demo/sample CRM rows on this browser.
 * Per-account data is then restored from tenant DB after login.
 */
export function cleanupDemoDataOnce() {
  try {
    if (localStorage.getItem(CLEANUP_VERSION_KEY) === CLEANUP_VERSION) return
    removeStorageKeys(localStorage, LOCAL_STORAGE_KEYS_TO_REMOVE)
    removeStorageKeys(sessionStorage, SESSION_STORAGE_KEYS_TO_REMOVE)
    deleteProductMediaDb()
    localStorage.setItem(CLEANUP_VERSION_KEY, CLEANUP_VERSION)
    window.dispatchEvent(new CustomEvent('bach:demo-data-cleaned'))
  } catch {
    // If browser storage is unavailable, the app still starts with empty code defaults.
  }
}
