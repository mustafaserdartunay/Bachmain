/**
 * OpenAI usage logging stub (server-only). PII masked in prompt excerpts.
 */
import { maskSensitiveText } from '../../shared/crypto.js'
import { logActivity } from '../audit/activityService.js'

export async function logOpenAiUsage(input: {
  companyId?: string | null
  userId?: string | null
  action: string
  model?: string
  promptTokens?: number
  completionTokens?: number
  promptExcerpt?: string
  ip?: string
}) {
  const masked = input.promptExcerpt ? maskSensitiveText(input.promptExcerpt).slice(0, 240) : undefined
  await logActivity({
    companyId: input.companyId,
    userId: input.userId,
    action: input.action || 'openai.usage',
    resource: 'openai',
    ip: input.ip,
    meta: {
      model: input.model,
      promptTokens: input.promptTokens ?? null,
      completionTokens: input.completionTokens ?? null,
      promptExcerpt: masked,
    },
  })
}
