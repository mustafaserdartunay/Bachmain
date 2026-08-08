/**
 * Bach AI V2 — Realtime client helper (WebRTC preferred, WS fallback note).
 * Session credentials come from POST /api/ai/realtime/session — never embed API keys.
 */

export async function fetchRealtimeSession({ complex = false, auth = {} } = {}) {
  const response = await fetch('/api/ai/realtime/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth.userId ? { 'X-User-Id': auth.userId } : {}),
      ...(auth.companyId ? { 'X-Company-Id': auth.companyId } : {}),
    },
    body: JSON.stringify({ complex, auth }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Realtime oturumu açılamadı.')
  }
  return data
}

/**
 * Minimal WebRTC peer connection bootstrap for OpenAI Realtime.
 * Full duplex audio wiring is completed when ephemeral secret is present.
 */
export async function connectRealtimeWebRtc(sessionPayload, { onEvent, onError } = {}) {
  const secret = sessionPayload?.clientSecret
  if (!secret) {
    throw new Error('Realtime client secret yok. Sunucu oturumunu kontrol edin.')
  }

  const pc = new RTCPeerConnection()
  const audioEl = typeof document !== 'undefined' ? document.createElement('audio') : null
  if (audioEl) {
    audioEl.autoplay = true
    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0]
    }
  }

  let localStream = null
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))
  } catch (error) {
    onError?.(error)
    throw error
  }

  const dataChannel = pc.createDataChannel('oai-events')
  dataChannel.addEventListener('message', (event) => {
    try {
      onEvent?.(JSON.parse(event.data))
    } catch {
      onEvent?.({ type: 'raw', data: event.data })
    }
  })

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  const model = sessionPayload.model || 'gpt-realtime-2.1-mini'
  const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    method: 'POST',
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/sdp',
    },
  })

  if (!sdpResponse.ok) {
    const errText = await sdpResponse.text()
    pc.close()
    localStream.getTracks().forEach((t) => t.stop())
    throw new Error(errText.slice(0, 200) || 'WebRTC bağlantısı başarısız.')
  }

  const answer = { type: 'answer', sdp: await sdpResponse.text() }
  await pc.setRemoteDescription(answer)

  return {
    pc,
    dataChannel,
    localStream,
    audioEl,
    async close() {
      try {
        dataChannel.close()
      } catch {
        /* ignore */
      }
      pc.close()
      localStream?.getTracks?.().forEach((t) => t.stop())
    },
  }
}

export async function runBachToolViaApi({ intent, slots, confirmed, auth }) {
  const response = await fetch('/api/ai/v2/intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth?.userId ? { 'X-User-Id': auth.userId } : {}),
      ...(auth?.companyId ? { 'X-Company-Id': auth.companyId } : {}),
    },
    body: JSON.stringify({ text: slots?.utterance || intent, confirmed, auth, context: { intent, slots } }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Aksiyon başarısız.')
  return data
}
