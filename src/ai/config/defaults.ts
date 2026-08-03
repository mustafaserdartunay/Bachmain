import type { AiProviderId } from '../constants/providers'
import type { AiLogLevel } from '../constants/logLevels'
import type { AiRuntimeMode } from '../types/messages'
import { DEFAULT_AI_PROVIDER_ID } from '../constants/providers'

export type AiProviderConfig = {
  enabled: boolean
  apiKeyEnv: string
  baseUrl?: string
  defaultModel: string
}

export type AiConfig = {
  provider: AiProviderId
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
  retry: {
    maxAttempts: number
    baseDelayMs: number
    maxDelayMs: number
  }
  streaming: {
    enabled: boolean
  }
  rateLimit: {
    /** Requests per minute soft cap (infrastructure only; not enforced yet). */
    requestsPerMinute: number
  }
  language: string
  voice: {
    enabled: boolean
    locale: string
  }
  cache: {
    /** Architecture ready; default inactive. */
    enabled: boolean
    ttlMs: number
  }
  logging: {
    level: AiLogLevel
  }
  mode: AiRuntimeMode
  allowInProcessProviders: boolean
  fallbackProviders: readonly AiProviderId[]
  providers: Record<AiProviderId, AiProviderConfig>
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: DEFAULT_AI_PROVIDER_ID,
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2048,
  timeoutMs: 60_000,
  retry: {
    maxAttempts: 3,
    baseDelayMs: 400,
    maxDelayMs: 8_000,
  },
  streaming: {
    enabled: true,
  },
  rateLimit: {
    requestsPerMinute: 60,
  },
  language: 'tr',
  voice: {
    enabled: false,
    locale: 'tr-TR',
  },
  cache: {
    enabled: false,
    ttlMs: 5 * 60_000,
  },
  logging: {
    level: 'INFO',
  },
  mode: 'development',
  allowInProcessProviders: typeof window === 'undefined',
  fallbackProviders: ['openai', 'openrouter', 'anthropic', 'gemini', 'ollama'],
  providers: {
    openai: {
      enabled: true,
      apiKeyEnv: 'OPENAI_API_KEY',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    },
    anthropic: {
      enabled: true,
      apiKeyEnv: 'ANTHROPIC_API_KEY',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-5-sonnet-latest',
    },
    gemini: {
      enabled: true,
      apiKeyEnv: 'GEMINI_API_KEY',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-1.5-flash',
    },
    openrouter: {
      enabled: true,
      apiKeyEnv: 'OPENROUTER_API_KEY',
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'openai/gpt-4o-mini',
    },
    ollama: {
      enabled: true,
      apiKeyEnv: 'OLLAMA_API_KEY',
      baseUrl: 'http://127.0.0.1:11434',
      defaultModel: 'llama3.1',
    },
  },
}
