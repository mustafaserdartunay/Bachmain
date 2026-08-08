/** Shared OpenAI model defaults — GPT-5.5 Pro via Responses API. */

import { AI_MODEL_TIERS_V2, resolveTierModel as resolveV2Tier } from './ai/config.js'

export const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-5.5-pro'
export const DEFAULT_OPENAI_TRANSCRIBE_MODEL = 'gpt-4o-transcribe'
/** Quality-first reasoning for GPT-5.x (medium | high | xhigh for Pro). */
export const DEFAULT_OPENAI_REASONING_EFFORT = 'high'

/** Product tiers → concrete OpenAI model IDs (env overrides via server/ai/config.js). */
export const AI_MODEL_TIERS = {
  luna: AI_MODEL_TIERS_V2.luna,
  terra: AI_MODEL_TIERS_V2.terra,
  sol: AI_MODEL_TIERS_V2.sol,
  /** Voice STT/TTS slot — OpenAI transcribe until Gemini Live is wired. */
  'gemini-live': AI_MODEL_TIERS_V2['gemini-live'],
}

export const OPENAI_CHAT_MODEL_PRESETS = [
  { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (önerilen · en yüksek kalite)' },
  { id: 'gpt-5.5', label: 'GPT-5.5' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'luna', label: 'Luna (CRM · teklif · sipariş · basit komut)' },
  { id: 'terra', label: 'Terra (finans / yönetici raporu)' },
  { id: 'sol', label: 'Sol (çok karmaşık analiz)' },
]

export function resolveChatModel(override) {
  const raw = String(override || process.env.OPENAI_MODEL || DEFAULT_OPENAI_CHAT_MODEL).trim()
  const key = raw.toLowerCase()
  // Gemini Live is the voice slot; chat requests fall back to Luna.
  if (key === 'gemini-live') return String(AI_MODEL_TIERS.luna).trim()
  if (AI_MODEL_TIERS[key]) return String(AI_MODEL_TIERS[key]).trim()
  return resolveV2Tier(raw)
}

export function resolveTranscribeModel(override) {
  return String(
    override || process.env.OPENAI_WHISPER_MODEL || DEFAULT_OPENAI_TRANSCRIBE_MODEL,
  ).trim()
}

export function resolveReasoningEffort(override) {
  return String(
    override || process.env.OPENAI_REASONING_EFFORT || DEFAULT_OPENAI_REASONING_EFFORT,
  ).trim()
}

/** GPT-5 / o-series use reasoning tokens; temperature is usually ignored or rejected. */
export function isReasoningChatModel(model = '') {
  const id = String(model).toLowerCase()
  return (
    id.startsWith('gpt-5') ||
    id.startsWith('o1') ||
    id.startsWith('o3') ||
    id.startsWith('o4') ||
    id.includes('gpt-5')
  )
}

/**
 * GPT-5.5 Pro (and similar *-pro SKUs) only work on /v1/responses,
 * not /v1/chat/completions.
 */
export function usesResponsesApi(model = '') {
  const id = String(model).toLowerCase()
  return id === 'gpt-5.5-pro' || id.startsWith('gpt-5.5-pro-') || id.includes('gpt-5.5-pro')
}

function splitSystemMessages(messages = []) {
  const systemParts = []
  const input = []
  for (const item of messages) {
    if (!item?.role || item.content == null) continue
    if (item.role === 'system' || item.role === 'developer') {
      systemParts.push(String(item.content))
      continue
    }
    input.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content),
    })
  }
  return {
    instructions: systemParts.join('\n\n').trim() || undefined,
    input,
  }
}

export function buildChatCompletionBody({
  model,
  messages,
  temperature,
  json = false,
  reasoningEffort,
  maxCompletionTokens,
} = {}) {
  const selected = resolveChatModel(model)
  const body = {
    model: selected,
    messages,
  }

  if (json) {
    body.response_format = { type: 'json_object' }
  }

  if (maxCompletionTokens) {
    body.max_completion_tokens = Number(maxCompletionTokens)
  }

  if (isReasoningChatModel(selected)) {
    body.reasoning_effort = resolveReasoningEffort(reasoningEffort)
  } else if (temperature != null && temperature !== '') {
    body.temperature = Number(temperature)
  }

  return body
}

export function buildResponsesBody({
  model,
  messages,
  json = false,
  reasoningEffort,
  maxCompletionTokens,
} = {}) {
  const selected = resolveChatModel(model)
  const { instructions, input } = splitSystemMessages(messages)
  const body = {
    model: selected,
    input: input.length ? input : [{ role: 'user', content: 'Yanıt üret.' }],
    reasoning: {
      effort: resolveReasoningEffort(reasoningEffort),
    },
  }

  if (instructions) {
    body.instructions = instructions
  }

  if (json) {
    body.text = { format: { type: 'json_object' } }
    // Responses API rejects json_object unless input (not instructions) mentions "json".
    const inputHasJson = body.input.some((item) => /json/i.test(String(item?.content || '')))
    if (!inputHasJson) {
      let lastUserIdx = -1
      for (let i = body.input.length - 1; i >= 0; i -= 1) {
        if (body.input[i]?.role === 'user') {
          lastUserIdx = i
          break
        }
      }
      if (lastUserIdx >= 0) {
        const prev = String(body.input[lastUserIdx].content || '')
        body.input[lastUserIdx] = {
          ...body.input[lastUserIdx],
          content: `${prev}\n\nReturn a JSON object.`,
        }
      } else {
        body.input.push({ role: 'user', content: 'Return a JSON object.' })
      }
    }
  }

  if (maxCompletionTokens) {
    body.max_output_tokens = Number(maxCompletionTokens)
  }

  return body
}

export function extractResponsesText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text
  }

  const parts = []
  for (const item of data?.output || []) {
    if (item?.type !== 'message') continue
    for (const chunk of item.content || []) {
      if (chunk?.type === 'output_text' || chunk?.type === 'text') {
        parts.push(String(chunk.text || ''))
      }
    }
  }
  return parts.join('').trim()
}

/**
 * Unified OpenAI text call:
 * - gpt-5.5-pro → Responses API
 * - other models → Chat Completions
 */
export async function createOpenAiCompletion({
  apiKey,
  model,
  messages,
  temperature,
  json = false,
  reasoningEffort,
  maxCompletionTokens,
} = {}) {
  const selectedModel = resolveChatModel(model)
  const useResponses = usesResponsesApi(selectedModel)

  const url = useResponses
    ? 'https://api.openai.com/v1/responses'
    : 'https://api.openai.com/v1/chat/completions'

  const body = useResponses
    ? buildResponsesBody({
        model: selectedModel,
        messages,
        json,
        reasoningEffort,
        maxCompletionTokens,
      })
    : buildChatCompletionBody({
        model: selectedModel,
        messages,
        temperature,
        json,
        reasoningEffort,
        maxCompletionTokens,
      })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API hatası (${response.status}): ${errorText.slice(0, 400)}`)
  }

  const data = await response.json()
  const content = useResponses
    ? extractResponsesText(data)
    : String(data.choices?.[0]?.message?.content || '')

  return {
    content,
    model: data.model || selectedModel,
    usage: data.usage || null,
    finishReason: useResponses ? data.status || null : data.choices?.[0]?.finish_reason || null,
    endpoint: useResponses ? 'responses' : 'chat.completions',
    raw: data,
  }
}
