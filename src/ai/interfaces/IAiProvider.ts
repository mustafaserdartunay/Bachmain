import type { AiProviderDescriptor, AiProviderChatInput, AiProviderChatResult, AiProviderStreamResult } from '../types/provider'
import type { AiProviderId } from '../constants/providers'

export interface IAiProvider {
  readonly id: AiProviderId
  readonly descriptor: AiProviderDescriptor
  isConfigured(): Promise<boolean>
  chat(input: AiProviderChatInput): Promise<AiProviderChatResult>
  stream?(input: AiProviderChatInput): Promise<AiProviderStreamResult>
}
