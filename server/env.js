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

export function getOpenAiApiKey(fallbackKey = '') {
  const fromEnv = String(process.env.OPENAI_API_KEY || '').trim()
  const fromFallback = String(fallbackKey || '').trim()
  const candidate = fromEnv || fromFallback

  if (PLACEHOLDER_KEYS.has(candidate)) return ''
  return candidate
}

export function requireOpenAiApiKey(fallbackKey = '') {
  const apiKey = getOpenAiApiKey(fallbackKey)
  if (!apiKey) {
    throw new Error(
      'OpenAI API anahtarı tanımlı değil. Proje kökünde .env dosyasına OPENAI_API_KEY=sk-... ekleyin veya Ayarlar > Sesli AI bölümünden anahtarı girin.',
    )
  }
  return apiKey
}

export function resolveRequestApiKey(reqBody = {}, reqHeaders = {}) {
  const raw = reqBody?.apiKey || reqHeaders['x-openai-key'] || reqHeaders['X-OpenAI-Key'] || ''
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}
