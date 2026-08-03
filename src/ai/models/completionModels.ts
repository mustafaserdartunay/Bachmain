import type { AiProviderId } from '../constants/providers'

/** Catalog of known default models per provider (infrastructure only). */
export const AI_DEFAULT_MODELS: Record<AiProviderId, readonly string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  openrouter: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
  ollama: ['llama3.1', 'mistral', 'qwen2.5'],
}
