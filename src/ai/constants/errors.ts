export const AI_ERROR_CODES = [
  'NETWORK',
  'TIMEOUT',
  'INVALID_KEY',
  'RATE_LIMIT',
  'PROVIDER_ERROR',
  'JSON_ERROR',
  'UNKNOWN',
  'NOT_CONFIGURED',
  'UNSUPPORTED',
  'ABORTED',
  'CLIENT_FORBIDDEN',
] as const

export type AiErrorCode = (typeof AI_ERROR_CODES)[number]
