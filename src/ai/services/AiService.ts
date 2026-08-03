import type { AiConfig } from '../config/defaults'
import type { IAiCache } from '../interfaces/IAiCache'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type { IAiService } from '../interfaces/IAiService'
import type { ITokenManager } from '../interfaces/ITokenManager'
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiStreamChunk,
} from '../types/messages'
import type { ProviderRouter } from '../router/ProviderRouter'
import { withRetry } from './RetryService'
import { mapTextToStreamChunks } from './StreamService'
import type { AiEventBus } from '../events/AiEventBus'
import { createHashKey } from '../utils/hash'

export type AiServiceDeps = {
  config: AiConfig
  router: ProviderRouter
  cache: IAiCache
  tokens: ITokenManager
  logger: IAiLogger
  events: AiEventBus
}

export class AiService implements IAiService {
  private readonly config: AiConfig
  private readonly router: ProviderRouter
  private readonly cache: IAiCache
  private readonly tokens: ITokenManager
  private readonly logger: IAiLogger
  private readonly events: AiEventBus

  constructor(deps: AiServiceDeps) {
    this.config = deps.config
    this.router = deps.router
    this.cache = deps.cache
    this.tokens = deps.tokens
    this.logger = deps.logger.child('service')
    this.events = deps.events
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const cacheKey = this.cache.enabled ? await createHashKey(request) : null
    if (cacheKey) {
      const hit = await this.cache.get<AiCompletionResponse>(cacheKey)
      if (hit) {
        this.logger.debug('Cache hit', { id: hit.id })
        return { ...hit, cached: true }
      }
    }

    this.events.emit('completion:start', { providerId: request.providerId ?? this.config.provider })

    const result = await withRetry({
      policy: this.config.retry,
      logger: this.logger,
      signal: request.signal,
      label: 'completion',
      operation: async () =>
        this.router.withFallback(request.providerId, async (provider) => {
          const model =
            request.model ??
            this.config.model ??
            provider.descriptor.defaultModel
          const chatResult = await provider.chat({
            messages: request.messages,
            model,
            temperature: request.temperature ?? this.config.temperature,
            maxTokens: request.maxTokens ?? this.config.maxTokens,
            signal: request.signal,
          })
          await this.tokens.record({
            providerId: provider.id,
            model: chatResult.model,
            usage: chatResult.usage,
            at: new Date().toISOString(),
            requestId: chatResult.id,
          })
          return chatResult
        }),
    })

    const response: AiCompletionResponse = { ...result, cached: false }
    if (cacheKey && this.cache.enabled) {
      await this.cache.set(cacheKey, response, this.config.cache.ttlMs)
    }
    this.events.emit('completion:success', {
      providerId: response.providerId,
      model: response.model,
      totalTokens: response.usage.totalTokens,
    })
    this.logger.success('Completion ready', {
      providerId: response.providerId,
      model: response.model,
      totalTokens: response.usage.totalTokens,
    })
    return response
  }

  async *stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk> {
    if (!this.config.streaming.enabled) {
      const full = await this.complete({ ...request, stream: false })
      yield* mapTextToStreamChunks(full.id, full.content)
      return
    }

    this.events.emit('stream:start', { providerId: request.providerId ?? this.config.provider })

    const provider = await this.router.resolveConfigured(request.providerId)
    const model = request.model ?? this.config.model ?? provider.descriptor.defaultModel
    const iterable = provider.stream
      ? await provider.stream({
          messages: request.messages,
          model,
          temperature: request.temperature ?? this.config.temperature,
          maxTokens: request.maxTokens ?? this.config.maxTokens,
          signal: request.signal,
        })
      : mapTextToStreamChunks(`stream-${Date.now()}`, '')

    for await (const chunk of iterable) {
      yield chunk
      if (chunk.done) {
        this.events.emit('stream:end', { providerId: provider.id })
      }
    }
  }
}
