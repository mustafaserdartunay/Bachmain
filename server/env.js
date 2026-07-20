import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(rootDir, '.env.local') })

const PLACEHOLDER_KEYS = new Set([
  '',
  'undefined',
  'null',
  'sk-your-key-here',
  'your-api-key-here',
])

export function isProductionRuntime() {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
    || String(process.env.VERCEL_ENV || '').toLowerCase() === 'production'
}

export function assertAiServerEnv() {
  if (!isProductionRuntime()) return
  if (!getOpenAiApiKey()) {
    throw new Error('OPENAI_API_KEY is required in production')
  }
}

export function getOpenAiApiKey(fallbackKey = '') {
  const fromEnv = String(process.env.OPENAI_API_KEY || '').trim()
  // Zero Trust: never trust browser-supplied keys in production
  const fromFallback = isProductionRuntime() ? '' : String(fallbackKey || '').trim()
  const candidate = fromEnv || fromFallback

  if (PLACEHOLDER_KEYS.has(candidate)) return ''
  return candidate
}

export function requireOpenAiApiKey(fallbackKey = '') {
  const apiKey = getOpenAiApiKey(fallbackKey)
  if (!apiKey) {
    throw new Error(
      isProductionRuntime()
        ? 'OpenAI API anahtarı sunucu ortamında tanımlı değil (OPENAI_API_KEY).'
        : 'OpenAI API anahtarı tanımlı değil. Proje kökünde .env dosyasına OPENAI_API_KEY=sk-... ekleyin veya Ayarlar > Sesli AI bölümünden anahtarı girin.',
    )
  }
  return apiKey
}

/**
 * Client-supplied keys are ignored in production (Defense in Depth).
 * In development they remain allowed for local Bring-Your-Own-Key testing.
 */
export function resolveRequestApiKey(reqBody = {}, reqHeaders = {}) {
  if (isProductionRuntime()) return ''
  const raw = reqBody?.apiKey || reqHeaders['x-openai-key'] || reqHeaders['X-OpenAI-Key'] || ''
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

/** Optional shared secret gate for AI proxies (AI_PROXY_SECRET). */
export function assertAiProxyAuthorized(reqHeaders = {}) {
  const required = String(process.env.AI_PROXY_SECRET || '').trim()
  if (!required) return true
  const provided = String(
    reqHeaders['x-ai-proxy-secret']
    || reqHeaders['X-Ai-Proxy-Secret']
    || reqHeaders.authorization?.replace(/^Bearer\s+/i, '')
    || '',
  ).trim()
  if (provided && provided === required) return true
  const err = new Error('AI proxy unauthorized')
  err.statusCode = 401
  throw err
}

const rateBuckets = new Map()

export function hitAiRateLimit(key = 'anon', { limit = 60, windowMs = 60_000 } = {}) {
  const now = Date.now()
  const bucketKey = String(key || 'anon')
  let entry = rateBuckets.get(bucketKey)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    rateBuckets.set(bucketKey, entry)
  }
  entry.count += 1
  if (entry.count > limit) {
    const err = new Error('AI rate limit exceeded')
    err.statusCode = 429
    throw err
  }
  return true
}
