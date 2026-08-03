import type { AiLogLevel } from '../constants/logLevels'

export type AiLogContext = Readonly<Record<string, unknown>>

export interface IAiLogger {
  debug(message: string, context?: AiLogContext): void
  info(message: string, context?: AiLogContext): void
  warning(message: string, context?: AiLogContext): void
  error(message: string, context?: AiLogContext): void
  success(message: string, context?: AiLogContext): void
  child(scope: string): IAiLogger
  setLevel(level: AiLogLevel): void
}
