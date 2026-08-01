/** Shared OpenAI model defaults — best quality package for BachMain. */

export const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-5.5'
export const DEFAULT_OPENAI_TRANSCRIBE_MODEL = 'gpt-4o-transcribe'
/** Quality-first reasoning for GPT-5.x (none | low | medium | high | xhigh). */
export const DEFAULT_OPENAI_REASONING_EFFORT = 'high'

export const OPENAI_CHAT_MODEL_PRESETS = [
  { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (en yüksek kalite)' },
  { id: 'gpt-5.5', label: 'GPT-5.5 (önerilen)' },
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
 * Build a Chat Completions body with quality-first defaults for frontier models.
 */
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
