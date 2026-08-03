export const AI_LOG_LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'SUCCESS'] as const

export type AiLogLevel = (typeof AI_LOG_LEVELS)[number]

export const AI_LOG_LEVEL_RANK: Record<AiLogLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  SUCCESS: 25,
  WARNING: 30,
  ERROR: 40,
}
