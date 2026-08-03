import type { IAiLogger } from '../interfaces/IAiLogger'
import { isAiError } from '../errors/AiError'
import { AiError } from '../errors/AiError'
import { exponentialBackoffMs, sleep } from '../utils/sleep'

export type RetryPolicy = {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
}

export type RetryOptions<T> = {
  policy: RetryPolicy
  logger?: IAiLogger
  signal?: AbortSignal
  label?: string
  operation: (attempt: number) => Promise<T>
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

function defaultShouldRetry(error: unknown): boolean {
  if (isAiError(error)) return error.retryable
  return false
}

export async function withRetry<T>(options: RetryOptions<T>): Promise<T> {
  const { policy, operation, logger, signal, label = 'ai-operation' } = options
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry
  let lastError: unknown

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new AiError('ABORTED', 'Operation aborted', { retryable: false })
    }
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      const canRetry = attempt < policy.maxAttempts && shouldRetry(error, attempt)
      logger?.warning(`${label} failed`, {
        attempt,
        maxAttempts: policy.maxAttempts,
        retry: canRetry,
        code: isAiError(error) ? error.code : 'UNKNOWN',
      })
      if (!canRetry) break
      await sleep(exponentialBackoffMs(attempt, policy.baseDelayMs, policy.maxDelayMs), signal)
    }
  }

  if (isAiError(lastError)) throw lastError
  throw new AiError('UNKNOWN', `${label} failed after retries`, { cause: lastError, retryable: false })
}
