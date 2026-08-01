import {
  assertAiProxyAuthorized,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'
import { resolveTranscribeModel } from './openaiModels.js'

function guardAiRequest(reqHeaders = {}) {
  assertAiProxyAuthorized(reqHeaders)
  const ip = String(reqHeaders['x-forwarded-for'] || reqHeaders['x-real-ip'] || 'anon')
    .split(',')[0]
    .trim()
  hitAiRateLimit(ip)
}

function buildMultipartBody({ fields, fileName, fileBuffer, mimeType }) {
  const boundary = `----Erlenbox${Date.now()}${Math.random().toString(16).slice(2)}`
  const chunks = []

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        'utf8',
      ),
    )
  }

  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      'utf8',
    ),
  )
  chunks.push(fileBuffer)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'))

  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

export async function transcribeAudioBuffer({ buffer, mimeType = 'audio/webm', apiKey, model }) {
  const resolvedKey = requireOpenAiApiKey(apiKey)
  const selectedModel = resolveTranscribeModel(model)

  if (!buffer?.length) {
    throw new Error('Ses kaydı boş.')
  }

  const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
  const { body, contentType } = buildMultipartBody({
    fields: {
      model: selectedModel,
      language: 'tr',
    },
    fileName: `voice.${extension}`,
    fileBuffer: buffer,
    mimeType,
  })

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resolvedKey}`,
      'Content-Type': contentType,
      'Content-Length': String(body.length),
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Whisper API hatası (${response.status}): ${errorText.slice(0, 240)}`)
  }

  const data = await response.json()
  return {
    text: String(data.text || '').trim(),
    model: selectedModel,
  }
}

export async function handleVoiceTranscribeRequest(reqBody, reqHeaders = {}) {
  guardAiRequest(reqHeaders)
  const { audio, mimeType = 'audio/webm' } = reqBody || {}

  if (!audio) {
    throw new Error('Ses verisi gönderilmedi.')
  }

  const buffer = Buffer.from(String(audio), 'base64')

  return transcribeAudioBuffer({
    buffer,
    mimeType,
    apiKey: resolveRequestApiKey(reqBody, reqHeaders),
    model: resolveTranscribeModel(reqBody?.model),
  })
}
