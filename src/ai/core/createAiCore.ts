import { createAiConfig, type AiConfigPatch } from '../config/AiConfig'
import type { AiConfig } from '../config/defaults'
import { AiLogger } from '../logger/AiLogger'
import { EnvSecretStore } from '../services/EnvSecretStore'
import { InMemoryTokenManager } from '../services/TokenManager'
import { NoopAiCache } from '../cache/NoopCache'
import { MemoryAiCache } from '../cache/MemoryCache'
import { createDefaultProviderRegistry } from '../providers'
import { ProviderRouter } from '../router/ProviderRouter'
import { AiService } from '../services/AiService'
import { AiEventBus } from '../events/AiEventBus'
import { AiLifecycle } from '../hooks/lifecycle'
import type { AiContainer } from './AiContainer'
import type { ISecretStore } from '../interfaces/ISecretStore'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type { IAiCache } from '../interfaces/IAiCache'
import type { ITokenManager } from '../interfaces/ITokenManager'

export type CreateAiCoreOptions = {
  config?: AiConfigPatch
  secrets?: ISecretStore
  logger?: IAiLogger
  cache?: IAiCache
  tokens?: ITokenManager
}

/**
 * Headless AI Core factory — UI must call this service layer only.
 * Does not register routes, menus, or components.
 */
export async function createAiCore(options: CreateAiCoreOptions = {}): Promise<AiContainer> {
  const config: AiConfig = createAiConfig(options.config)
  const logger =
    options.logger ??
    new AiLogger({
      level: config.logging.level,
      mode: config.mode,
      scope: 'core',
    })

  const secrets =
    options.secrets ??
    new EnvSecretStore({
      envNames: {
        openai: config.providers.openai.apiKeyEnv,
        anthropic: config.providers.anthropic.apiKeyEnv,
        gemini: config.providers.gemini.apiKeyEnv,
        openrouter: config.providers.openrouter.apiKeyEnv,
        ollama: config.providers.ollama.apiKeyEnv,
      },
    })

  const cache =
    options.cache ??
    (config.cache.enabled ? new MemoryAiCache() : new NoopAiCache())

  const tokens = options.tokens ?? new InMemoryTokenManager()
  const events = new AiEventBus()
  const lifecycle = new AiLifecycle()

  const registry = await createDefaultProviderRegistry({
    config,
    secretStore: secrets,
    logger,
  })

  for (const provider of registry.list()) {
    events.emit('provider:registered', { providerId: provider.id })
  }

  const router = new ProviderRouter({
    registry,
    primary: config.provider,
    fallbacks: config.fallbackProviders,
    logger,
  })

  const service = new AiService({
    config,
    router,
    cache,
    tokens,
    logger,
    events,
  })

  lifecycle.onDispose(async () => {
    events.clear()
    await cache.clear()
    await tokens.reset()
  })

  logger.info('Bach AI Core initialized', {
    provider: config.provider,
    providers: registry.list().map((p) => p.id),
    cacheEnabled: cache.enabled,
    allowInProcessProviders: config.allowInProcessProviders,
  })

  return {
    config,
    logger,
    secrets,
    cache,
    tokens,
    registry,
    router,
    events,
    lifecycle,
    service,
  }
}
