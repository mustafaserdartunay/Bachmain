/**
 * Soft-deleted records per collection — recoverable by user restore or admin intervention.
 * Synced via workspace blob (erlenbox-* key).
 */
const STORAGE_KEY = 'erlenbox-deleted-records'
export const DELETED_RECORDS_EVENT = 'bach:deleted-records-updated'

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new CustomEvent(DELETED_RECORDS_EVENT))
}

export function softDeleteRecord(collection, record, meta = {}) {
  if (!collection || !record?.id) return null
  const all = readAll()
  const bucket = { ...(all[collection] || {}) }
  bucket[record.id] = {
    record,
    deletedAt: new Date().toISOString(),
    entityLabel: meta.entityLabel || record.name || record.company || record.id,
    ...meta,
  }
  all[collection] = bucket
  writeAll(all)
  return bucket[record.id]
}

export function getDeletedRecords(collection) {
  const bucket = readAll()[collection] || {}
  return Object.values(bucket).sort((a, b) =>
    String(b.deletedAt).localeCompare(String(a.deletedAt)),
  )
}

export function getDeletedRecord(collection, id) {
  return readAll()[collection]?.[id] || null
}

export function restoreDeletedRecord(collection, id) {
  const all = readAll()
  const bucket = { ...(all[collection] || {}) }
  const entry = bucket[id]
  if (!entry) return null
  delete bucket[id]
  all[collection] = bucket
  writeAll(all)
  return entry.record
}

export function permanentlyDeleteRecord(collection, id) {
  const all = readAll()
  const bucket = { ...(all[collection] || {}) }
  const entry = bucket[id]
  if (!entry) return null
  delete bucket[id]
  all[collection] = bucket
  writeAll(all)
  return entry.record
}

export function isRecordDeleted(collection, id) {
  return Boolean(readAll()[collection]?.[id])
}
