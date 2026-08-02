/** Shared OpenAI model defaults — GPT-5.5 Pro via Responses API. */

export const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-5.5-pro'
export const DEFAULT_OPENAI_TRANSCRIBE_MODEL = 'gpt-4o-transcribe'
/** Quality-first reasoning for GPT-5.x (medium | high | xhigh for Pro). */
export const DEFAULT_OPENAI_REASONING_EFFORT = 'high'

export const OPENAI_CHAT_MODEL_PRESETS = [
  { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (önerilen · en yüksek kalite)' },
  { id: 'gpt-5.5', label: 'GPT-5.5' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
]

export function resolveChatModel(override) {
  return String(override || process.env.OPENAI_MODEL || DEFAULT_OPENAI_CHAT_MODEL).trim()
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

const JSON_MODE_NUDGE = 'Respond with valid JSON only.'

/** OpenAI json_object mode requires the word "json" in the request messages/input. */
export function contentMentionsJson(value) {
  return /json/i.test(String(value || ''))
}

/**
 * Ensure chat-completions `messages` include the word "json" when response_format is json_object.
 * Prefers appending to the last user message; otherwise adds a short user nudge.
 */
export function ensureJsonWordInChatMessages(messages = []) {
  const list = Array.isArray(messages) ? messages.filter((item) => item?.role && item.content != null) : []
  if (list.some((item) => contentMentionsJson(item.content))) return list

  const next = list.map((item) => ({ ...item, content: String(item.content) }))
  for (let i = next.length - 1; i >= 0; i -= 1) {
    if (next[i].role === 'user') {
      next[i] = { ...next[i], content: `${next[i].content}\n\n${JSON_MODE_NUDGE}` }
      return next
    }
  }
  if (next.length && (next[0].role === 'system' || next[0].role === 'developer')) {
    next[0] = { ...next[0], content: `${next[0].content}\n\n${JSON_MODE_NUDGE}` }
    return next
  }
  return [...next, { role: 'user', content: JSON_MODE_NUDGE }]
}

/**
 * Ensure Responses API `input` includes the word "json" (instructions alone are not enough).
 */
export function ensureJsonWordInResponsesInput(input = []) {
  const list = Array.isArray(input) ? input.map((item) => ({ ...item, content: String(item.content || '') })) : []
  if (list.some((item) => contentMentionsJson(item.content))) {
    return list.length ? list : [{ role: 'user', content: JSON_MODE_NUDGE }]
  }

  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].role === 'user') {
      list[i] = { ...list[i], content: `${list[i].content}\n\n${JSON_MODE_NUDGE}` }
      return list
    }
  }
  return [...list, { role: 'user', content: JSON_MODE_NUDGE }]
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
  const resolvedMessages = json ? ensureJsonWordInChatMessages(messages) : messages
  const body = {
    model: selected,
    messages: resolvedMessages,
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
  const resolvedInput = json
    ? ensureJsonWordInResponsesInput(input)
    : input.length
      ? input
      : [{ role: 'user', content: 'Yanıt üret.' }]

  const body = {
    model: selected,
    input: resolvedInput.length ? resolvedInput : [{ role: 'user', content: JSON_MODE_NUDGE }],
    reasoning: {
      effort: resolveReasoningEffort(reasoningEffort),
    },
  }

  if (instructions) {
    body.instructions = json && !contentMentionsJson(instructions)
      ? `${instructions}\n\n${JSON_MODE_NUDGE}`
      : instructions
  } else if (json) {
    body.instructions = JSON_MODE_NUDGE
  }

  if (json) {
    body.text = { format: { type: 'json_object' } }
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
