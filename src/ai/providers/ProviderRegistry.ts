import type { IAiProvider } from '../interfaces/IAiProvider'
import type { AiProviderId } from '../constants/providers'
import { AiError } from '../errors/AiError'

export class ProviderRegistry {
  private readonly providers = new Map<AiProviderId, IAiProvider>()

  register(provider: IAiProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: AiProviderId): IAiProvider {
    const provider = this.providers.get(id)
    if (!provider) {
      throw new AiError('UNSUPPORTED', `Provider not registered: ${id}`, { retryable: false })
    }
    return provider
  }

  has(id: AiProviderId): boolean {
    return this.providers.has(id)
  }

  list(): IAiProvider[] {
    return [...this.providers.values()]
  }
}
