import { getClientOpenAiApiKey, getVoiceApiBaseUrl } from './voiceSettings'

function buildVoiceHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const apiKey = getClientOpenAiApiKey()
  if (apiKey) headers['X-OpenAI-Key'] = apiKey
  return headers
}

function buildVoicePayload(payload = {}) {
  const apiKey = getClientOpenAiApiKey()
  if (!apiKey) return payload
  return { ...payload, apiKey }
}

export async function checkVoiceApiHealth() {
  const base = getVoiceApiBaseUrl()
  const response = await fetch(`${base}/api/voice/health`, {
    headers: buildVoiceHeaders(),
  })
  if (!response.ok) throw new Error('Sesli asistan API erişilemiyor.')
  const health = await response.json()
  return {
    ...health,
    hasApiKey: Boolean(health?.hasApiKey || getClientOpenAiApiKey()),
  }
}

export async function sendVoiceChat({ messages, context }) {
  const base = getVoiceApiBaseUrl()
  const response = await fetch(`${base}/api/voice/chat`, {
    method: 'POST',
    headers: buildVoiceHeaders(),
    body: JSON.stringify(buildVoicePayload({ messages, context })),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Sesli asistan isteği başarısız.')
  }

  return data
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function transcribeVoiceBlob(blob, mimeType = 'audio/webm') {
  const base = getVoiceApiBaseUrl()
  const audio = await blobToBase64(blob)
  const response = await fetch(`${base}/api/voice/transcribe`, {
    method: 'POST',
    headers: buildVoiceHeaders(),
    body: JSON.stringify(buildVoicePayload({ audio, mimeType })),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Ses tanıma isteği başarısız.')
  }

  return data
}
