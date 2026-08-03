import type { AiProviderId } from '../constants/providers'
import { AI_PROVIDER_IDS } from '../constants/providers'
import type { AiConfig, AiProviderConfig } from './defaults'
import { DEFAULT_AI_CONFIG } from './defaults'
import type { AiLogLevel } from '../constants/logLevels'
import { AI_LOG_LEVELS } from '../constants/logLevels'

function isProviderId(value: string): value is AiProviderId {
  return (AI_PROVIDER_IDS as readonly string[]).includes(value)
}

function isLogLevel(value: string): value is AiLogLevel {
  return (AI_LOG_LEVELS as readonly string[]).includes(value)
}

function mergeProvider(
  base: AiProviderConfig,
  patch?: Partial<AiProviderConfig>,
): AiProviderConfig {
  if (!patch) return { ...base }
  return {
    enabled: patch.enabled ?? base.enabled,
    apiKeyEnv: patch.apiKeyEnv ?? base.apiKeyEnv,
    baseUrl: patch.baseUrl ?? base.baseUrl,
    defaultModel: patch.defaultModel ?? base.defaultModel,
  }
}

export type AiConfigPatch = Partial<
  Omit<AiConfig, 'providers' | 'retry' | 'streaming' | 'rateLimit' | 'voice' | 'cache' | 'logging' | 'fallbackProviders'>
> & {
  retry?: Partial<AiConfig['retry']>
  streaming?: Partial<AiConfig['streaming']>
  rateLimit?: Partial<AiConfig['rateLimit']>
  voice?: Partial<AiConfig['voice']>
  cache?: Partial<AiConfig['cache']>
  logging?: Partial<AiConfig['logging']>
  fallbackProviders?: readonly AiProviderId[]
  providers?: Partial<Record<AiProviderId, Partial<AiProviderConfig>>>
}

/** Deep-merge patch onto defaults. Never accepts raw API keys in config. */
export function createAiConfig(patch: AiConfigPatch = {}): AiConfig {
  const provider =
    patch.provider && isProviderId(patch.provider) ? patch.provider : DEFAULT_AI_CONFIG.provider

  const loggingLevel =
    patch.logging?.level && isLogLevel(patch.logging.level)
      ? patch.logging.level
      : DEFAULT_AI_CONFIG.logging.level

  const providers = { ...DEFAULT_AI_CONFIG.providers }
  for (const id of AI_PROVIDER_IDS) {
    providers[id] = mergeProvider(DEFAULT_AI_CONFIG.providers[id], patch.providers?.[id])
  }

  return {
    provider,
    model: patch.model ?? DEFAULT_AI_CONFIG.model,
    temperature: patch.temperature ?? DEFAULT_AI_CONFIG.temperature,
    maxTokens: patch.maxTokens ?? DEFAULT_AI_CONFIG.maxTokens,
    timeoutMs: patch.timeoutMs ?? DEFAULT_AI_CONFIG.timeoutMs,
    retry: {
      maxAttempts: patch.retry?.maxAttempts ?? DEFAULT_AI_CONFIG.retry.maxAttempts,
      baseDelayMs: patch.retry?.baseDelayMs ?? DEFAULT_AI_CONFIG.retry.baseDelayMs,
      maxDelayMs: patch.retry?.maxDelayMs ?? DEFAULT_AI_CONFIG.retry.maxDelayMs,
    },
    streaming: {
      enabled: patch.streaming?.enabled ?? DEFAULT_AI_CONFIG.streaming.enabled,
    },
    rateLimit: {
      requestsPerMinute:
        patch.rateLimit?.requestsPerMinute ?? DEFAULT_AI_CONFIG.rateLimit.requestsPerMinute,
    },
    language: patch.language ?? DEFAULT_AI_CONFIG.language,
    voice: {
      enabled: patch.voice?.enabled ?? DEFAULT_AI_CONFIG.voice.enabled,
      locale: patch.voice?.locale ?? DEFAULT_AI_CONFIG.voice.locale,
    },
    cache: {
      enabled: patch.cache?.enabled ?? DEFAULT_AI_CONFIG.cache.enabled,
      ttlMs: patch.cache?.ttlMs ?? DEFAULT_AI_CONFIG.cache.ttlMs,
    },
    logging: { level: loggingLevel },
    mode: patch.mode ?? DEFAULT_AI_CONFIG.mode,
    allowInProcessProviders:
      patch.allowInProcessProviders ?? DEFAULT_AI_CONFIG.allowInProcessProviders,
    fallbackProviders: patch.fallbackProviders ?? DEFAULT_AI_CONFIG.fallbackProviders,
    providers,
  }
}

/** Safe snapshot for diagnostics — no secrets. */
export function serializeAiConfigPublic(config: AiConfig): Record<string, unknown> {
  return {
    provider: config.provider,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeoutMs: config.timeoutMs,
    retry: config.retry,
    streaming: config.streaming,
    rateLimit: config.rateLimit,
    language: config.language,
    voice: config.voice,
    cache: { enabled: config.cache.enabled, ttlMs: config.cache.ttlMs },
    logging: config.logging,
    mode: config.mode,
    allowInProcessProviders: config.allowInProcessProviders,
    fallbackProviders: config.fallbackProviders,
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([id, value]) => [
        id,
        {
          enabled: value.enabled,
          apiKeyEnv: value.apiKeyEnv,
          baseUrl: value.baseUrl,
          defaultModel: value.defaultModel,
          hasInlineKey: false,
        },
      ]),
    ),
  }
}
