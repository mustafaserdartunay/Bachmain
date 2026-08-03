/**
 * Bach AI Core — headless foundation.
 * UI must only import service APIs from this barrel; no AI logic in components.
 */

export { createAiCore } from './core'
export type { CreateAiCoreOptions, AiContainer } from './core'

export { createAiConfig, serializeAiConfigPublic, DEFAULT_AI_CONFIG, loadAiConfig } from './config'
export type { AiConfig, AiConfigPatch, AiProviderConfig } from './config'

export { AiLogger } from './logger'
export type { AiLoggerOptions } from './logger'

export { AiError, isAiError } from './errors'
export * from './errors/errorFactory'

export type * from './types'
export type * from './interfaces'

export {
  AI_PROVIDER_IDS,
  DEFAULT_AI_PROVIDER_ID,
  AI_PROVIDER_LABELS,
  AI_LOG_LEVELS,
  AI_ERROR_CODES,
} from './constants'
export type { AiProviderId, AiLogLevel, AiErrorCode } from './constants'

export { ProviderRegistry, AbstractAiProvider, createDefaultProviderRegistry } from './providers'
export { ProviderRouter } from './router'
export { AiService, withRetry, mapTextToStreamChunks, collectStream, EnvSecretStore, FetchHttpClient } from './services'
export { NoopAiCache, MemoryAiCache } from './cache'
export { AiEventBus } from './events'
export { composeMiddlewares } from './middlewares'
export type { AiMiddleware } from './middlewares'
export { AiLifecycle } from './hooks'
export { buildSystemPrompt, BACH_AI_CORE_SYSTEM_PROMPT } from './prompts'
export { AI_DEFAULT_MODELS } from './models'
export { redactSecrets, redactUnknown, createHashKey } from './utils'
