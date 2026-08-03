import type { IAiCache } from '../interfaces/IAiCache'

/** Default cache — architecture wired, inactive. */
export class NoopAiCache implements IAiCache {
  readonly enabled = false

  async get<T>(_key: string): Promise<T | null> {
    return null
  }

  async set<T>(_key: string, _value: T, _ttlMs?: number): Promise<void> {
    return
  }

  async delete(_key: string): Promise<void> {
    return
  }

  async clear(): Promise<void> {
    return
  }
}
