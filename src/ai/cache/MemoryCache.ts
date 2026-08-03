import type { IAiCache } from '../interfaces/IAiCache'

/** Active in-memory cache — only used when config.cache.enabled is true. */
export class MemoryAiCache implements IAiCache {
  readonly enabled = true
  private readonly store = new Map<string, { expiresAt: number; value: unknown }>()

  async get<T>(key: string): Promise<T | null> {
    const hit = this.store.get(key)
    if (!hit) return null
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key)
      return null
    }
    return hit.value as T
  }

  async set<T>(key: string, value: T, ttlMs = 300_000): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }
}
