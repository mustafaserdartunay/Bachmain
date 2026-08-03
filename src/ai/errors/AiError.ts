import type { AiErrorCode } from '../constants/errors'

export type AiErrorDetails = Readonly<Record<string, string | number | boolean | null>>

export class AiError extends Error {
  readonly code: AiErrorCode
  readonly retryable: boolean
  readonly status?: number
  readonly providerId?: string
  readonly details?: AiErrorDetails

  constructor(
    code: AiErrorCode,
    message: string,
    options?: {
      cause?: unknown
      retryable?: boolean
      status?: number
      providerId?: string
      details?: AiErrorDetails
    },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'AiError'
    this.code = code
    this.retryable = options?.retryable ?? false
    this.status = options?.status
    this.providerId = options?.providerId
    this.details = options?.details
  }
}

export function isAiError(value: unknown): value is AiError {
  return value instanceof AiError
}
