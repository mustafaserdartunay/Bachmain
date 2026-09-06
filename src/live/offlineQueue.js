const DB_NAME = 'bach-live-gps-queue'
const STORE = 'samples'
const VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('INDEXEDDB_UNAVAILABLE'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'idempotencyKey' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueOfflineSample(sample) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ ...sample, queuedAt: Date.now() })
    tx.oncomplete = () => resolve(sample)
    tx.onerror = () => reject(tx.error)
  })
}

export async function peekOfflineQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      const rows = Array.isArray(req.result) ? req.result : []
      rows.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)))
      resolve(rows)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function removeOfflineSample(idempotencyKey) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(idempotencyKey)
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error)
  })
}

export async function flushOfflineQueue(sender) {
  const rows = await peekOfflineQueue()
  const sent = []
  for (const row of rows) {
    await sender(row)
    await removeOfflineSample(row.idempotencyKey)
    sent.push(row.idempotencyKey)
  }
  return sent
}
