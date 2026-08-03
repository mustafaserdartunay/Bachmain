import { createAiConfig, type AiConfigPatch } from './AiConfig'
import type { AiConfig } from './defaults'

/**
 * Load AI config from a patch object (env wiring stays in ISecretStore).
 * Raw API keys are intentionally not accepted here.
 */
export function loadAiConfig(patch: AiConfigPatch = {}): AiConfig {
  return createAiConfig(patch)
}
