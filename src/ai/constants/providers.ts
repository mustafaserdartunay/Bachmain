/**
 * Canonical provider identifiers — Open/Closed: add ids here, register providers separately.
 */

export const AI_PROVIDER_IDS = [
  'openai',
  'anthropic',
  'gemini',
  'openrouter',
  'ollama',
] as const

export type AiProviderId = (typeof AI_PROVIDER_IDS)[number]

export const DEFAULT_AI_PROVIDER_ID: AiProviderId = 'openai'

export const AI_PROVIDER_LABELS: Record<AiProviderId, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
}
