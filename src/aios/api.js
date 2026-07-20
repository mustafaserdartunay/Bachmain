/**
 * AIOS gateway client — prefers platform API when session exists; falls back to local stub.
 */
import { getStoredSession } from '../utils/platformAuth'
import { appendChatLocal, stubChatReply } from './localStore'

const API_BASE =
  import.meta.env.VITE_PLATFORM_API_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')
    ? 'https://api.bachmain.com'
    : '')

export async function gatewayChatClient({ agentId, messages, provider, model }) {
  const { token } = getStoredSession()
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''

  appendChatLocal({ role: 'user', content: lastUser, agentId })

  if (token && API_BASE) {
    try {
      const res = await fetch(`${String(API_BASE).replace(/\/$/, '')}/v1/aios/gateway/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId, messages, provider, model }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.content || data.reply || data.message || JSON.stringify(data)
        appendChatLocal({
          role: 'assistant',
          content,
          agentId,
          meta: {
            provider: data.provider,
            model: data.model,
            promptTokens: data.promptTokens,
            completionTokens: data.completionTokens,
            estimatedCostUsd: data.estimatedCostUsd,
            stub: data.stub,
            runId: data.runId,
          },
        })
        return { ok: true, ...data, content, source: 'api' }
      }
    } catch {
      /* fall through to stub */
    }
  }

  const stub = stubChatReply(lastUser, agentId)
  appendChatLocal({
    role: 'assistant',
    content: stub.content,
    agentId,
    meta: stub,
  })
  return { ok: true, ...stub, source: 'local' }
}
