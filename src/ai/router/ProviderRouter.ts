import type { AiProviderId } from '../constants/providers'
import type { IAiProvider } from '../interfaces/IAiProvider'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type { ProviderRegistry } from '../providers/ProviderRegistry'
import { isAiError } from '../errors/AiError'
import { notConfiguredError } from '../errors/errorFactory'

export type ProviderRouterOptions = {
  registry: ProviderRegistry
  primary: AiProviderId
  fallbacks: readonly AiProviderId[]
  logger: IAiLogger
}

export class ProviderRouter {
  private readonly registry: ProviderRegistry
  private readonly primary: AiProviderId
  private readonly fallbacks: readonly AiProviderId[]
  private readonly logger: IAiLogger

  constructor(options: ProviderRouterOptions) {
    this.registry = options.registry
    this.primary = options.primary
    this.fallbacks = options.fallbacks
    this.logger = options.logger.child('router')
  }

  resolve(preferred?: AiProviderId): IAiProvider {
    const ordered = this.uniqueOrder(preferred)
    for (const id of ordered) {
      if (!this.registry.has(id)) continue
      return this.registry.get(id)
    }
    throw notConfiguredError('No AI providers registered')
  }

  async resolveConfigured(preferred?: AiProviderId): Promise<IAiProvider> {
    const ordered = this.uniqueOrder(preferred)
    for (const id of ordered) {
      if (!this.registry.has(id)) continue
      const provider = this.registry.get(id)
      if (await provider.isConfigured()) return provider
      this.logger.debug('Provider not configured, trying next', { providerId: id })
    }
    throw notConfiguredError('No configured AI provider available')
  }

  async withFallback<T>(
    preferred: AiProviderId | undefined,
    run: (provider: IAiProvider) => Promise<T>,
  ): Promise<T> {
    const ordered = this.uniqueOrder(preferred)
    let lastError: unknown
    for (const id of ordered) {
      if (!this.registry.has(id)) continue
      const provider = this.registry.get(id)
      if (!(await provider.isConfigured())) continue
      try {
        return await run(provider)
      } catch (error) {
        lastError = error
        const retryable = isAiError(error) ? error.retryable : false
        this.logger.warning('Provider call failed; evaluating fallback', {
          providerId: id,
          retryable,
          code: isAiError(error) ? error.code : 'UNKNOWN',
        })
        if (!retryable && isAiError(error) && error.code === 'INVALID_KEY') {
          continue
        }
        if (!retryable && isAiError(error) && error.code === 'CLIENT_FORBIDDEN') {
          throw error
        }
        continue
      }
    }
    if (isAiError(lastError)) throw lastError
    throw notConfiguredError('All providers failed or unavailable')
  }

  private uniqueOrder(preferred?: AiProviderId): AiProviderId[] {
    const list = [preferred, this.primary, ...this.fallbacks].filter(
      (id): id is AiProviderId => Boolean(id),
    )
    return [...new Set(list)]
  }
}
