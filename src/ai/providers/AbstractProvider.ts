import type { AiProviderId } from '../constants/providers'
import { AI_PROVIDER_LABELS } from '../constants/providers'
import type { IAiProvider } from '../interfaces/IAiProvider'
import type { IHttpClient } from '../interfaces/IHttpClient'
import type { ISecretStore } from '../interfaces/ISecretStore'
import type { IAiLogger } from '../interfaces/IAiLogger'
import type {
  AiProviderCapabilities,
  AiProviderChatInput,
  AiProviderChatResult,
  AiProviderDescriptor,
  AiProviderStreamResult,
} from '../types/provider'
import { clientForbiddenError, notConfiguredError } from '../errors/errorFactory'
import { mapTextToStreamChunks } from '../services/StreamService'

export type AbstractProviderDeps = {
  secretStore: ISecretStore
  http: IHttpClient
  logger: IAiLogger
  allowInProcessProviders: boolean
  baseUrl: string
  defaultModel: string
}

export abstract class AbstractAiProvider implements IAiProvider {
  abstract readonly id: AiProviderId
  protected readonly secretStore: ISecretStore
  protected readonly http: IHttpClient
  protected readonly logger: IAiLogger
  protected readonly allowInProcessProviders: boolean
  protected readonly baseUrl: string
  protected readonly defaultModel: string

  constructor(deps: AbstractProviderDeps) {
    this.secretStore = deps.secretStore
    this.http = deps.http
    this.logger = deps.logger.child('provider')
    this.allowInProcessProviders = deps.allowInProcessProviders
    this.baseUrl = deps.baseUrl.replace(/\/$/, '')
    this.defaultModel = deps.defaultModel
  }

  abstract get capabilities(): AiProviderCapabilities

  get descriptor(): AiProviderDescriptor {
    return {
      id: this.id,
      label: AI_PROVIDER_LABELS[this.id],
      defaultModel: this.defaultModel,
      capabilities: this.capabilities,
    }
  }

  async isConfigured(): Promise<boolean> {
    return this.secretStore.hasApiKey(this.id)
  }

  async chat(input: AiProviderChatInput): Promise<AiProviderChatResult> {
    this.assertRuntimeAllowed()
    const apiKey = await this.requireApiKey()
    return this.doChat(input, apiKey)
  }

  async stream(input: AiProviderChatInput): Promise<AiProviderStreamResult> {
    this.assertRuntimeAllowed()
    if (!this.capabilities.stream) {
      const result = await this.chat(input)
      return mapTextToStreamChunks(result.id, result.content)
    }
    const apiKey = await this.requireApiKey()
    return this.doStream(input, apiKey)
  }

  protected abstract doChat(input: AiProviderChatInput, apiKey: string): Promise<AiProviderChatResult>

  protected async doStream(
    input: AiProviderChatInput,
    apiKey: string,
  ): Promise<AiProviderStreamResult> {
    const result = await this.doChat(input, apiKey)
    return mapTextToStreamChunks(result.id, result.content)
  }

  protected assertRuntimeAllowed(): void {
    if (!this.allowInProcessProviders) {
      throw clientForbiddenError(
        'In-process provider calls are disabled. Use a server gateway; API keys must not run in the browser.',
      )
    }
  }

  protected async requireApiKey(): Promise<string> {
    const key = await this.secretStore.getApiKey(this.id)
    if (!key) {
      throw notConfiguredError(`Missing API key for provider ${this.id}`, this.id)
    }
    return key
  }
}
