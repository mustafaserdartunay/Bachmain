/**
 * Bach AI V2 — OpenAI Realtime ephemeral session factory.
 * API key never leaves the server; client gets short-lived session credentials.
 */

import { getOpenAiApiKey, requireOpenAiApiKey, resolveRequestApiKey } from '../env.js'
import { MODEL_ROUTER, VOICE_CONFIG } from './config.js'

const REALTIME_SYSTEM = `Sen Bach AI'sın. Türkçe, kısa ve doğal konuş.
Kullanıcı CRM/ERP komutları verir. Gereksiz uzun açıklama yapma.
Riskli işlemlerde (teklif gönderme, sipariş, fatura) önce onay iste.
Doğrudan SQL veya veritabanı erişimi yok; tool çağrıları kullan.
Örnek: "Tamam, hazırlıyorum." sonra tool sonucu ile "Teklif hazır."`

export async function createRealtimeSession({
  apiKey,
  model,
  companyId = null,
  userId = null,
  complex = false,
} = {}) {
  const key = requireOpenAiApiKey(apiKey)
  const selected = model || (complex ? MODEL_ROUTER.realtimeComplex : MODEL_ROUTER.realtime)

  // OpenAI Realtime client secrets / sessions API
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: selected,
      voice: 'alloy',
      modalities: ['audio', 'text'],
      instructions: REALTIME_SYSTEM,
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: VOICE_CONFIG.finalSilenceTimeoutMs,
      },
      input_audio_transcription: { model: 'gpt-4o-transcribe' },
      tools: [
        {
          type: 'function',
          name: 'run_bach_action',
          description: 'Bachmain CRM/ERP aksiyonu çalıştır (teklif, cari, stok, sipariş).',
          parameters: {
            type: 'object',
            properties: {
              intent: { type: 'string' },
              slots: { type: 'object' },
              confirmed: { type: 'boolean' },
            },
            required: ['intent'],
          },
        },
      ],
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.message || `Realtime session failed (${response.status})`
    const err = new Error(
      response.status === 429
        ? 'Şu anda bağlantıda bir yoğunluk var. Tekrar deneyelim.'
        : message,
    )
    err.statusCode = response.status >= 400 && response.status < 600 ? response.status : 500
    throw err
  }

  return {
    ok: true,
    model: selected,
    companyId,
    userId,
    session: data,
    clientSecret: data?.client_secret?.value || data?.client_secret || null,
    expiresAt: data?.client_secret?.expires_at || data?.expires_at || null,
    voiceConfig: {
      finalSilenceTimeoutMs: VOICE_CONFIG.finalSilenceTimeoutMs,
      sessionTimeoutMs: VOICE_CONFIG.sessionTimeoutMs,
    },
  }
}

export async function handleRealtimeSessionRequest(reqBody = {}, reqHeaders = {}) {
  const apiKey = resolveRequestApiKey(reqBody, reqHeaders)
  // Prefer server env key
  getOpenAiApiKey(apiKey)
  return createRealtimeSession({
    apiKey,
    model: reqBody.model,
    complex: Boolean(reqBody.complex),
    companyId: reqBody.auth?.companyId || reqHeaders['x-company-id'] || null,
    userId: reqBody.auth?.userId || reqHeaders['x-user-id'] || null,
  })
}
