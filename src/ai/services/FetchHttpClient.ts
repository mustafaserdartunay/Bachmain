import type { AiHttpRequest, AiHttpResponse, IHttpClient } from '../interfaces/IHttpClient'
import { jsonError, mapHttpStatusToAiError, networkError, timeoutError } from '../errors/errorFactory'
import type { AiProviderId } from '../constants/providers'

export type FetchHttpClientOptions = {
  defaultTimeoutMs: number
  providerId?: AiProviderId
  fetchImpl?: typeof fetch
}

export class FetchHttpClient implements IHttpClient {
  private readonly defaultTimeoutMs: number
  private readonly providerId?: AiProviderId
  private readonly fetchImpl: typeof fetch

  constructor(options: FetchHttpClientOptions) {
    this.defaultTimeoutMs = options.defaultTimeoutMs
    this.providerId = options.providerId
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis)
  }

  async request(input: AiHttpRequest): Promise<AiHttpResponse> {
    const timeoutMs = input.timeoutMs ?? this.defaultTimeoutMs
    const controller = new AbortController()
    const onAbort = () => controller.abort()
    input.signal?.addEventListener('abort', onAbort, { once: true })
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await this.fetchImpl(input.url, {
        method: input.method ?? 'POST',
        headers: { ...input.headers },
        body: input.body,
        signal: controller.signal,
      })
      const text = await response.text()
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })
      return {
        status: response.status,
        ok: response.ok,
        text,
        headers,
      }
    } catch (error) {
      if (controller.signal.aborted) {
        throw timeoutError(`Request timed out after ${timeoutMs}ms`, this.providerId)
      }
      throw networkError('Network request failed', error, this.providerId)
    } finally {
      clearTimeout(timer)
      input.signal?.removeEventListener('abort', onAbort)
    }
  }
}

export function assertOkJson<T>(
  response: AiHttpResponse,
  providerId: AiProviderId,
  parse: (text: string) => T,
): T {
  if (!response.ok) {
    throw mapHttpStatusToAiError(response.status, response.text, providerId)
  }
  try {
    return parse(response.text)
  } catch (error) {
    throw jsonError('Failed to parse provider JSON', error, providerId)
  }
}
