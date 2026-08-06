/**
 * Soft-deleted records per collection — recoverable by user restore or admin intervention.
 * Synced via workspace blob (erlenbox-* key).
 *
 * "Kalıcı sil" kullanıcıya geri getirilemez görünür; kayıt `erlenbox-purged-records`
 * kasasına alınır — teknik destek / yönetim tarafı geri getirebilir.
 */
const STORAGE_KEY = 'erlenbox-deleted-records'
const PURGED_STORAGE_KEY = 'erlenbox-purged-records'
export const DELETED_RECORDS_EVENT = 'bach:deleted-records-updated'
export const PURGED_RECORDS_EVENT = 'bach:purged-records-updated'

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

function readPurgedAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PURGED_STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writePurgedAll(map) {
  localStorage.setItem(PURGED_STORAGE_KEY, JSON.stringify(map))
  window.dispatchEvent(new CustomEvent(PURGED_RECORDS_EVENT))
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

/**
 * Kullanıcıya kalıcı sil gibi görünür; kaydı yönetim kasasına taşır.
 */
export function vaultPurgedRecord(collection, entry, meta = {}) {
  const record = entry?.record
  const id = record?.id
  if (!collection || !id) return null
  const all = readPurgedAll()
  const bucket = { ...(all[collection] || {}) }
  bucket[id] = {
    record,
    deletedAt: entry.deletedAt || null,
    entityLabel: entry.entityLabel || record.name || record.company || id,
    purgedAt: new Date().toISOString(),
    recoverableByAdmin: true,
    ...meta,
  }
  all[collection] = bucket
  writePurgedAll(all)
  return bucket[id]
}

export function getPurgedRecords(collection) {
  const bucket = readPurgedAll()[collection] || {}
  return Object.values(bucket).sort((a, b) =>
    String(b.purgedAt || '').localeCompare(String(a.purgedAt || '')),
  )
}

export function getPurgedRecord(collection, id) {
  return readPurgedAll()[collection]?.[id] || null
}

/** Yönetim / teknik destek: kasadan kaydı alıp soft-delete listesine geri koyar. */
export function adminRestorePurgedRecord(collection, id) {
  const all = readPurgedAll()
  const bucket = { ...(all[collection] || {}) }
  const entry = bucket[id]
  if (!entry?.record) return null
  delete bucket[id]
  all[collection] = bucket
  writePurgedAll(all)
  return softDeleteRecord(collection, entry.record, {
    entityLabel: entry.entityLabel,
    restoredFromPurgeAt: new Date().toISOString(),
    previousPurgedAt: entry.purgedAt,
  })
}

export function permanentlyDeleteRecord(collection, id) {
  const all = readAll()
  const bucket = { ...(all[collection] || {}) }
  const entry = bucket[id]
  if (!entry) return null
  vaultPurgedRecord(collection, entry, { sourceKind: 'deleted' })
  delete bucket[id]
  all[collection] = bucket
  writeAll(all)
  return entry.record
}

export function isRecordDeleted(collection, id) {
  return Boolean(readAll()[collection]?.[id])
}
