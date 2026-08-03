import type { AiProviderId } from '../constants/providers'

/** Secrets never leave this interface into logs or client dumps. */
export interface ISecretStore {
  getApiKey(providerId: AiProviderId): Promise<string | null>
  hasApiKey(providerId: AiProviderId): Promise<boolean>
}
