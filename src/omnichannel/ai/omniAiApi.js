import { getClientOpenAiApiKey, getVoiceApiBaseUrl } from '../../utils/voiceSettings'
import { analyzeConversation as analyzeConversationLocal } from './assistant'
import { getLearningExamplesForPrompt } from './learningStore'
import { readAiSettings } from './settings'

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const apiKey = getClientOpenAiApiKey()
  if (apiKey) headers['X-OpenAI-Key'] = apiKey
  return headers
}

function buildPayload(payload = {}) {
  const apiKey = getClientOpenAiApiKey()
  if (!apiKey) return payload
  return { ...payload, apiKey }
}

function getApiBase() {
  const base = getVoiceApiBaseUrl()
  return base || ''
}

export function buildConversationContext({ conversation, customer, lead }) {
  if (!conversation) return {}
  return {
    channel: conversation.channel,
    contactName: conversation.contactName,
    contactPhone: conversation.contactPhone,
    contactEmail: conversation.contactEmail,
    contactHandle: conversation.contactHandle,
    sentiment: conversation.sentiment,
    customer: customer
      ? {
          id: customer.id,
          companyTitle: customer.companyTitle || customer.name,
          city: customer.city,
          representative: customer.representative,
        }
      : null,
    lead: lead
      ? {
          id: lead.id,
          status: lead.status,
          source: lead.source,
        }
      : null,
  }
}

function mergeWithLocalFallback(aiResult, messages) {
  const local = analyzeConversationLocal(messages)
  return {
    ...local,
    ...aiResult,
    replySuggestions: aiResult.replies?.length ? aiResult.replies : local.replies,
    replies: aiResult.replies?.length ? aiResult.replies : local.replies,
    actions: aiResult.actions?.length ? aiResult.actions : local.actions,
    source: aiResult.source || 'local',
  }
}

export async function analyzeConversationWithAi({ messages, context }) {
  const settings = readAiSettings()
  const local = analyzeConversationLocal(messages)

  if (!settings.enabled) {
    return {
      ...local,
      replySuggestions: local.replies,
      source: 'local',
      primaryReply: local.replies[0] || '',
    }
  }

  const base = getApiBase()
  const learningExamples = getLearningExamplesForPrompt()

  try {
    const response = await fetch(`${base}/api/omni/analyze`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(
        buildPayload({
          messages,
          context,
          learningExamples,
          brandVoice: settings.brandVoice,
          companyName: settings.companyName,
          model: settings.model,
          reasoningEffort: settings.reasoningEffort,
          maxOutputTokens: settings.maxOutputTokens,
          maxThreadMessages: settings.maxThreadMessages,
          maxLearningExamples: settings.maxLearningExamples,
          speedProfile: settings.speedProfile,
        }),
      ),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error || 'AI analiz isteği başarısız.')
    }

    return mergeWithLocalFallback(data, messages)
  } catch (error) {
    return {
      ...local,
      replySuggestions: local.replies,
      primaryReply: local.replies[0] || '',
      source: 'local',
      error: error.message,
    }
  }
}

export async function checkOmniAiHealth() {
  const base = getApiBase()
  try {
    const response = await fetch(`${base}/api/omni/health`, { headers: buildHeaders() })
    if (!response.ok) return { ok: false, hasApiKey: Boolean(getClientOpenAiApiKey()) }
    const data = await response.json()
    return { ...data, hasApiKey: Boolean(data?.hasApiKey || getClientOpenAiApiKey()) }
  } catch {
    return { ok: false, hasApiKey: Boolean(getClientOpenAiApiKey()) }
  }
}
