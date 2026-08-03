import type { AiProviderId } from '../constants/providers'
import type { ITokenManager, TokenLedgerEntry } from '../interfaces/ITokenManager'

/** Token accounting infrastructure — no user quotas yet. */
export class InMemoryTokenManager implements ITokenManager {
  private readonly entries: TokenLedgerEntry[] = []

  async record(entry: TokenLedgerEntry): Promise<void> {
    this.entries.push(entry)
  }

  async summarize(providerId?: AiProviderId): Promise<{
    promptTokens: number
    completionTokens: number
    totalTokens: number
    entries: number
  }> {
    const filtered = providerId
      ? this.entries.filter((entry) => entry.providerId === providerId)
      : this.entries
    return filtered.reduce(
      (acc, entry) => {
        acc.promptTokens += entry.usage.promptTokens
        acc.completionTokens += entry.usage.completionTokens
        acc.totalTokens += entry.usage.totalTokens
        acc.entries += 1
        return acc
      },
      { promptTokens: 0, completionTokens: 0, totalTokens: 0, entries: 0 },
    )
  }

  async reset(providerId?: AiProviderId): Promise<void> {
    if (!providerId) {
      this.entries.length = 0
      return
    }
    for (let i = this.entries.length - 1; i >= 0; i -= 1) {
      if (this.entries[i]?.providerId === providerId) this.entries.splice(i, 1)
    }
  }
}
