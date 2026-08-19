import { AppError } from '../../../../shared/errors.js'
import { userFacingNilveraError, extractNilveraMessages } from '../../statusMap.js'
import type { EDocumentEnvironment } from '../types.js'

const BASE = {
  TEST: 'https://apitest.nilvera.com',
  PRODUCTION: 'https://api.nilvera.com',
} as const

export function nilveraBaseUrl(environment: EDocumentEnvironment) {
  return BASE[environment] || BASE.TEST
}

export function maskAuthorizationHeader(value: string) {
  return String(value || '').replace(/Bearer\s+\S+/gi, 'Bearer ********')
}

export function fingerprintApiKey(apiKey: string) {
  const raw = String(apiKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '')
  if (raw.length < 8) return '****'
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`
}

function sanitizeApiKey(raw: string) {
  let value = String(raw || '').trim()
  value = value.replace(/^Bearer\s+/i, '').trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value.replace(/\s+/g, '')
}

type NilveraRequest = {
  apiKey: string
  environment: EDocumentEnvironment
  method?: string
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  accept?: string
  binary?: boolean
  retries?: number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function nilveraRequest<T = unknown>(
  input: NilveraRequest,
): Promise<{
  status: number
  data: T
  durationMs: number
  endpoint: string
}> {
  const method = (input.method || 'GET').toUpperCase()
  const url = new URL(input.path.replace(/^\//, ''), `${nilveraBaseUrl(input.environment)}/`)
  if (input.query) {
    for (const [key, value] of Object.entries(input.query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  const retries = method === 'GET' ? (input.retries ?? 3) : 1
  let lastError: unknown
  const started = Date.now()

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${sanitizeApiKey(input.apiKey)}`,
          Accept: input.accept || (input.binary ? 'application/octet-stream' : 'application/json'),
          ...(input.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
      })
      const durationMs = Date.now() - started
      const endpoint = `${method} ${url.pathname}`

      if (input.binary) {
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw toAppError(res.status, text)
        }
        const buf = Buffer.from(await res.arrayBuffer())
        return { status: res.status, data: buf as T, durationMs, endpoint }
      }

      const text = await res.text()
      let parsed: unknown = text
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        parsed = text
      }
      if (!res.ok) throw toAppError(res.status, parsed)
      return { status: res.status, data: parsed as T, durationMs, endpoint }
    } catch (err) {
      lastError = err
      const retryable =
        method === 'GET' &&
        attempt < retries &&
        !(err instanceof AppError && err.statusCode >= 400 && err.statusCode < 500)
      if (!retryable) break
      await sleep(250 * attempt)
    }
  }

  if (lastError instanceof AppError) throw lastError
  const message = lastError instanceof Error ? lastError.message : 'Nilvera bağlantı hatası'
  throw new AppError('NILVERA_UNAVAILABLE', message, 502)
}

function toAppError(status: number, body: unknown) {
  const details = extractNilveraMessages(body)
  return new AppError(
    'NILVERA_ERROR',
    userFacingNilveraError(status, body),
    status >= 400 && status < 600 ? status : 502,
    {
      providerStatus: status,
      messages: details,
    },
  )
}
