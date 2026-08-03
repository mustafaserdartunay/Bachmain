import type { AiProviderId } from '../constants/providers'
import type { AiChatMessage, AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from './messages'

export type AiProviderCapabilities = {
  chat: boolean
  stream: boolean
  tools: boolean
}

export type AiProviderDescriptor = {
  id: AiProviderId
  label: string
  defaultModel: string
  capabilities: AiProviderCapabilities
}

export type AiProviderChatInput = {
  messages: readonly AiChatMessage[]
  model: string
  temperature: number
  maxTokens: number
  signal?: AbortSignal
}

export type AiProviderChatResult = Omit<AiCompletionResponse, 'cached'>

export type AiProviderStreamResult = AsyncIterable<AiStreamChunk>

export type { AiCompletionRequest, AiCompletionResponse }
