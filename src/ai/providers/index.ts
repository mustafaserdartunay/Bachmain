import type { AiConfig } from '../config/defaults'
import type { IHttpClient } from '../interfaces/IHttpClient'
import type { ISecretStore } from '../interfaces/ISecretStore'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type { IAiProvider } from '../interfaces/IAiProvider'
import type { AiProviderId } from '../constants/providers'
import { ProviderRegistry } from './ProviderRegistry'
import { FetchHttpClient } from '../services/FetchHttpClient'

export type CreateProvidersInput = {
  config: AiConfig
  secretStore: ISecretStore
  logger: IAiLogger
  httpFactory?: (providerId: AiProviderId) => IHttpClient
}

async function createProvider(
  id: AiProviderId,
  input: CreateProvidersInput,
  http: IHttpClient,
): Promise<IAiProvider> {
  const providerConfig = input.config.providers[id]
  const deps = {
    secretStore: input.secretStore,
    http,
    logger: input.logger,
    allowInProcessProviders: input.config.allowInProcessProviders,
    baseUrl: providerConfig.baseUrl ?? '',
    defaultModel: providerConfig.defaultModel,
  }

  switch (id) {
    case 'openai': {
      const { OpenAiProvider } = await import('./openai/OpenAiProvider')
      return new OpenAiProvider(deps)
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./anthropic/AnthropicProvider')
      return new AnthropicProvider(deps)
    }
    case 'gemini': {
      const { GeminiProvider } = await import('./gemini/GeminiProvider')
      return new GeminiProvider(deps)
    }
    case 'openrouter': {
      const { OpenRouterProvider } = await import('./openrouter/OpenRouterProvider')
      return new OpenRouterProvider(deps)
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./ollama/OllamaProvider')
      return new OllamaProvider(deps)
    }
    default: {
      const exhaustive: never = id
      throw new Error(`Unhandled provider: ${String(exhaustive)}`)
    }
  }
}

/** Lazy-loads provider modules (code splitting / tree-shaking friendly). */
export async function createDefaultProviderRegistry(
  input: CreateProvidersInput,
): Promise<ProviderRegistry> {
  const registry = new ProviderRegistry()
  const ids = Object.keys(input.config.providers) as AiProviderId[]

  for (const id of ids) {
    if (!input.config.providers[id].enabled) continue
    const http =
      input.httpFactory?.(id) ??
      new FetchHttpClient({
        defaultTimeoutMs: input.config.timeoutMs,
        providerId: id,
      })
    const provider = await createProvider(id, input, http)
    registry.register(provider)
  }

  return registry
}

export { AbstractAiProvider } from './AbstractProvider'
export type { AbstractProviderDeps } from './AbstractProvider'
export { ProviderRegistry } from './ProviderRegistry'
export { OpenAiProvider } from './openai/OpenAiProvider'
export { AnthropicProvider } from './anthropic/AnthropicProvider'
export { GeminiProvider } from './gemini/GeminiProvider'
export { OpenRouterProvider } from './openrouter/OpenRouterProvider'
export { OllamaProvider } from './ollama/OllamaProvider'
