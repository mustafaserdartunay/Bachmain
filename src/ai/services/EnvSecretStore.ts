import type { AiProviderId } from '../constants/providers'
import type { ISecretStore } from '../interfaces/ISecretStore'

export type EnvSecretStoreOptions = {
  /** Map provider → env var name. Values read only on server-like runtimes. */
  envNames: Readonly<Record<AiProviderId, string>>
  lookup?: (envName: string) => string | undefined
}

/**
 * Reads API keys from environment. Never serializes values.
 * In browser without custom lookup, returns null (keys must not ship to client).
 */
export class EnvSecretStore implements ISecretStore {
  private readonly envNames: Readonly<Record<AiProviderId, string>>
  private readonly lookup: (envName: string) => string | undefined

  constructor(options: EnvSecretStoreOptions) {
    this.envNames = options.envNames
    this.lookup =
      options.lookup ??
      ((name) => {
        const runtime = globalThis as {
          process?: { env?: Record<string, string | undefined> }
        }
        return runtime.process?.env?.[name]
      })
  }

  async getApiKey(providerId: AiProviderId): Promise<string | null> {
    const envName = this.envNames[providerId]
    const value = this.lookup(envName)?.trim()
    return value ? value : null
  }

  async hasApiKey(providerId: AiProviderId): Promise<boolean> {
    return (await this.getApiKey(providerId)) !== null
  }
}
