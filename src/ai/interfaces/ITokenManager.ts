import type { AiProviderId } from '../constants/providers'
import type { AiUsage } from '../types/messages'

export type TokenLedgerEntry = {
  providerId: AiProviderId
  model: string
  usage: AiUsage
  at: string
  requestId?: string
}

export interface ITokenManager {
  record(entry: TokenLedgerEntry): Promise<void>
  summarize(providerId?: AiProviderId): Promise<{
    promptTokens: number
    completionTokens: number
    totalTokens: number
    entries: number
  }>
  reset(providerId?: AiProviderId): Promise<void>
}
