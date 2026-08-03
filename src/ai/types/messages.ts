export type { AiProviderId } from '../constants/providers'
export type { AiLogLevel } from '../constants/logLevels'
export type { AiErrorCode } from '../constants/errors'

export type AiMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export type AiChatMessage = {
  role: AiMessageRole
  content: string
  name?: string
}

export type AiCompletionRequest = {
  messages: readonly AiChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  providerId?: import('../constants/providers').AiProviderId
  signal?: AbortSignal
  metadata?: Readonly<Record<string, string | number | boolean>>
}

export type AiUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export type AiCompletionResponse = {
  id: string
  providerId: import('../constants/providers').AiProviderId
  model: string
  content: string
  usage: AiUsage
  finishReason: 'stop' | 'length' | 'content_filter' | 'error' | 'unknown'
  raw?: unknown
  cached?: boolean
}

export type AiStreamChunk = {
  id: string
  delta: string
  done: boolean
  usage?: AiUsage
}

export type AiRuntimeMode = 'development' | 'production'

export type AiEnvironment = {
  mode: AiRuntimeMode
  /** When true, provider HTTP may run in-process. Browser defaults to false. */
  allowInProcessProviders: boolean
}
