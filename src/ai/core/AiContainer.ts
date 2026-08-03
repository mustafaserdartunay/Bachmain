import type { AiConfig } from '../config/defaults'
import type { IAiCache } from '../interfaces/IAiCache'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type { IAiService } from '../interfaces/IAiService'
import type { ISecretStore } from '../interfaces/ISecretStore'
import type { ITokenManager } from '../interfaces/ITokenManager'
import type { ProviderRegistry } from '../providers/ProviderRegistry'
import type { ProviderRouter } from '../router/ProviderRouter'
import type { AiEventBus } from '../events/AiEventBus'
import type { AiLifecycle } from '../hooks/lifecycle'

export type AiContainer = {
  config: AiConfig
  logger: IAiLogger
  secrets: ISecretStore
  cache: IAiCache
  tokens: ITokenManager
  registry: ProviderRegistry
  router: ProviderRouter
  events: AiEventBus
  lifecycle: AiLifecycle
  service: IAiService
}
