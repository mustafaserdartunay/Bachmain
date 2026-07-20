import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { maskSensitiveText } from '../../shared/crypto.js'

export type ModelProviderId = 'openai' | 'anthropic' | 'gemini' | 'azure_openai' | 'local'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type GatewayChatResult = {
  provider: ModelProviderId
  model: string
  content: string
  promptTokens: number
  completionTokens: number
  estimatedCostUsd: number
  stub?: boolean
}

const USD_PER_1K = {
  'gpt-4o': { in: 0.005, out: 0.015 },
  'gpt-4o-mini': { in: 0.00015, out: 0.0006 },
} as const

function estimateCost(model: string, promptTokens: number, completionTokens: number) {
  const rates = USD_PER_1K[model as keyof typeof USD_PER_1K] || USD_PER_1K['gpt-4o-mini']
  return (promptTokens / 1000) * rates.in + (completionTokens / 1000) * rates.out
}

export function listProviders() {
  return [
    {
      id: 'openai' as const,
      label: 'OpenAI',
      configured: Boolean(env.OPENAI_API_KEY),
      models: ['gpt-4o', 'gpt-4o-mini'],
    },
    {
      id: 'anthropic' as const,
      label: 'Anthropic Claude',
      configured: Boolean(process.env.ANTHROPIC_API_KEY),
      models: ['claude-3-5-sonnet', 'claude-3-5-haiku'],
    },
    {
      id: 'gemini' as const,
      label: 'Google Gemini',
      configured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY),
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    },
    {
      id: 'azure_openai' as const,
      label: 'Azure OpenAI',
      configured: Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT),
      models: ['gpt-4o', 'gpt-4o-mini'],
    },
    {
      id: 'local' as const,
      label: 'Yerel LLM',
      configured: Boolean(process.env.LOCAL_LLM_URL),
      models: ['local-default'],
    },
  ]
}

function maskMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => ({ ...m, content: maskSensitiveText(m.content) }))
}

async function callOpenAi(model: string, messages: ChatMessage[]): Promise<GatewayChatResult> {
  const key = env.OPENAI_API_KEY
  if (!key) throw new AppError('AI_NOT_CONFIGURED', 'OPENAI_API_KEY tanımlı değil', 503)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: maskMessages(messages),
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new AppError('AI_PROVIDER_ERROR', `OpenAI hata: ${response.status}`, 502, {
      body: text.slice(0, 400),
    })
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const promptTokens = data.usage?.prompt_tokens || 0
  const completionTokens = data.usage?.completion_tokens || 0
  return {
    provider: 'openai',
    model,
    content: data.choices?.[0]?.message?.content || '',
    promptTokens,
    completionTokens,
    estimatedCostUsd: estimateCost(model, promptTokens, completionTokens),
  }
}

/** Stub for providers not yet wired with production keys */
function stubProvider(
  provider: ModelProviderId,
  model: string,
  messages: ChatMessage[],
): GatewayChatResult {
  const last = messages.filter((m) => m.role === 'user').at(-1)?.content || ''
  return {
    provider,
    model,
    content: `[AIOS stub · ${provider}/${model}] Anahtar yapılandırılmadı. Maskelenmiş özet: ${maskSensitiveText(last).slice(0, 200)}`,
    promptTokens: Math.ceil(last.length / 4),
    completionTokens: 40,
    estimatedCostUsd: 0,
    stub: true,
  }
}

export async function gatewayChat(input: {
  provider: ModelProviderId
  model: string
  messages: ChatMessage[]
}): Promise<GatewayChatResult> {
  const { provider, model, messages } = input
  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) return stubProvider(provider, model, messages)
    return callOpenAi(model, messages)
  }
  // Anthropic / Gemini / Azure / local — adapters land in AIOS-3; stub keeps architecture stable
  return stubProvider(provider, model, messages)
}
