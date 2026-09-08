const cache = new Map()

/**
 * Parse localStorage JSON once per unchanged raw string.
 * Repeated CRM reads were re-parsing the same customer/order/kasa blobs.
 */
export function readCachedJson(key, fallback, mapFn) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null || raw === '') return fallback
    const token = mapFn ? `${key}::map` : key
    const hit = cache.get(token)
    if (hit && hit.raw === raw) return hit.value
    const parsed = JSON.parse(raw)
    const value = mapFn ? mapFn(parsed) : parsed
    cache.set(token, { raw, value })
    return value
  } catch {
    cache.delete(key)
    if (mapFn) cache.delete(`${key}::map`)
    return fallback
  }
}

export function writeCachedJson(key, value) {
  const raw = JSON.stringify(value)
  cache.set(key, { raw, value })
  cache.delete(`${key}::map`)
  localStorage.setItem(key, raw)
}

export function invalidateStorageCache(key) {
  if (!key) {
    cache.clear()
    return
  }
  cache.delete(key)
  cache.delete(`${key}::map`)
}
