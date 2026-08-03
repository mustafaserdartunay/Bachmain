import type { AiLogLevel } from '../constants/logLevels'
import { AI_LOG_LEVEL_RANK } from '../constants/logLevels'
import type { AiLogContext, IAiLogger } from '../interfaces/IAiLogger'
import { redactUnknown } from '../utils/redact'

export type AiLoggerOptions = {
  level: AiLogLevel
  mode: 'development' | 'production'
  scope?: string
  sink?: (entry: {
    level: AiLogLevel
    message: string
    scope: string
    context?: AiLogContext
    at: string
  }) => void
}

export class AiLogger implements IAiLogger {
  private level: AiLogLevel
  private readonly mode: 'development' | 'production'
  private readonly scope: string
  private readonly sink: NonNullable<AiLoggerOptions['sink']>

  constructor(options: AiLoggerOptions) {
    this.level = options.level
    this.mode = options.mode
    this.scope = options.scope ?? 'ai'
    this.sink =
      options.sink ??
      ((entry) => {
        if (this.mode === 'production' && entry.level === 'DEBUG') return
        const payload = entry.context ? redactUnknown(entry.context) : undefined
        const line = `[BachAI:${entry.scope}] ${entry.level} ${entry.message}`
        if (entry.level === 'ERROR') {
          console.error(line, payload ?? '')
        } else if (entry.level === 'WARNING') {
          console.warn(line, payload ?? '')
        } else {
          console.info(line, payload ?? '')
        }
      })
  }

  setLevel(level: AiLogLevel): void {
    this.level = level
  }

  child(scope: string): IAiLogger {
    return new AiLogger({
      level: this.level,
      mode: this.mode,
      scope: `${this.scope}.${scope}`,
      sink: this.sink,
    })
  }

  debug(message: string, context?: AiLogContext): void {
    this.write('DEBUG', message, context)
  }

  info(message: string, context?: AiLogContext): void {
    this.write('INFO', message, context)
  }

  warning(message: string, context?: AiLogContext): void {
    this.write('WARNING', message, context)
  }

  error(message: string, context?: AiLogContext): void {
    this.write('ERROR', message, context)
  }

  success(message: string, context?: AiLogContext): void {
    this.write('SUCCESS', message, context)
  }

  private write(level: AiLogLevel, message: string, context?: AiLogContext): void {
    if (AI_LOG_LEVEL_RANK[level] < AI_LOG_LEVEL_RANK[this.level]) return
    this.sink({
      level,
      message,
      scope: this.scope,
      context,
      at: new Date().toISOString(),
    })
  }
}
