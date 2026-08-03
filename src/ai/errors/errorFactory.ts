import type { AiProviderId } from '../constants/providers'
import { AiError } from './AiError'

export function networkError(message: string, cause?: unknown, providerId?: AiProviderId): AiError {
  return new AiError('NETWORK', message, { cause, retryable: true, providerId })
}

export function timeoutError(message: string, providerId?: AiProviderId): AiError {
  return new AiError('TIMEOUT', message, { retryable: true, providerId })
}

export function invalidKeyError(message: string, providerId?: AiProviderId): AiError {
  return new AiError('INVALID_KEY', message, { retryable: false, status: 401, providerId })
}

export function rateLimitError(message: string, providerId?: AiProviderId, status = 429): AiError {
  return new AiError('RATE_LIMIT', message, { retryable: true, status, providerId })
}

export function providerError(
  message: string,
  providerId?: AiProviderId,
  status?: number,
  cause?: unknown,
): AiError {
  return new AiError('PROVIDER_ERROR', message, { cause, retryable: status !== undefined && status >= 500, status, providerId })
}

export function jsonError(message: string, cause?: unknown, providerId?: AiProviderId): AiError {
  return new AiError('JSON_ERROR', message, { cause, retryable: false, providerId })
}

export function unknownError(message: string, cause?: unknown, providerId?: AiProviderId): AiError {
  return new AiError('UNKNOWN', message, { cause, retryable: false, providerId })
}

export function notConfiguredError(message: string, providerId?: AiProviderId): AiError {
  return new AiError('NOT_CONFIGURED', message, { retryable: false, providerId })
}

export function clientForbiddenError(message: string): AiError {
  return new AiError('CLIENT_FORBIDDEN', message, { retryable: false })
}

export function mapHttpStatusToAiError(
  status: number,
  bodyText: string,
  providerId: AiProviderId,
): AiError {
  if (status === 401 || status === 403) {
    return invalidKeyError(`Provider rejected credentials (${status})`, providerId)
  }
  if (status === 429) {
    return rateLimitError(`Provider rate limited (${status})`, providerId, status)
  }
  if (status >= 500) {
    return providerError(`Provider server error (${status}): ${bodyText.slice(0, 200)}`, providerId, status)
  }
  return providerError(`Provider error (${status}): ${bodyText.slice(0, 200)}`, providerId, status)
}
