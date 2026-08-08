/**
 * Bach AI V2 — client helpers for Intent / Tool endpoints.
 * Legacy `/api/voice/*` remains the default Header path until Realtime ships fully.
 */

import { executeVoiceActions } from '../../utils/voiceActions'

export async function sendAiV2Intent({
  text,
  confirmed = false,
  context = {},
  auth = {},
} = {}) {
  const response = await fetch('/api/ai/v2/intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth.userId ? { 'X-User-Id': String(auth.userId) } : {}),
      ...(auth.companyId ? { 'X-Company-Id': String(auth.companyId) } : {}),
      ...(auth.branchId ? { 'X-Branch-Id': String(auth.branchId) } : {}),
    },
    body: JSON.stringify({ text, confirmed, context, auth }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Intent isteği başarısız.')
  }
  return data
}

export async function sendAiV2Tool({ tool, slots = {}, confirmed = false, auth = {} } = {}) {
  const response = await fetch('/api/ai/v2/tool', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth.userId ? { 'X-User-Id': String(auth.userId) } : {}),
      ...(auth.companyId ? { 'X-Company-Id': String(auth.companyId) } : {}),
    },
    body: JSON.stringify({ tool, slots, confirmed, auth }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Tool isteği başarısız.')
  }
  return data
}

/** Run returned clientAction list through existing localStorage voice executor. */
export async function applyAiV2Actions(actions, navigate) {
  if (!Array.isArray(actions) || actions.length === 0) return []
  return executeVoiceActions(actions, { navigate })
}
