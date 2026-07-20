import Redis from 'ioredis'
import { env } from '../config/env.js'

let redis: Redis | null = null
const memory = new Map<string, { count: number; resetAt: number }>()

export function getRedis() {
  if (!env.REDIS_URL) return null
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    })
    redis.on('error', () => {
      /* fallback to memory */
    })
  }
  return redis
}

export async function hitDistributedRateLimit(
  key: string,
  { limit = 300, windowSec = 60 }: { limit?: number; windowSec?: number } = {},
) {
  const bucket = `rl:${key}`
  const client = getRedis()
  if (client) {
    try {
      if (client.status !== 'ready') await client.connect().catch(() => null)
      const count = await client.incr(bucket)
      if (count === 1) await client.expire(bucket, windowSec)
      return count <= limit
    } catch {
      /* fall through */
    }
  }

  const now = Date.now()
  let entry = memory.get(bucket)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowSec * 1000 }
    memory.set(bucket, entry)
  }
  entry.count += 1
  return entry.count <= limit
}
