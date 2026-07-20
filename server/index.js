import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  assertAiProxyAuthorized,
  assertAiServerEnv,
  getOpenAiApiKey,
  hitAiRateLimit,
  isProductionRuntime,
} from './env.js'
import { handleVoiceChatRequest } from './voiceChat.js'
import { handleVoiceTranscribeRequest } from './voiceTranscribe.js'
import { handleOmniAnalyzeRequest } from './omniChat.js'
import {
  handleGrowthChatRequest,
  handleGrowthHealthRequest,
  handleGrowthModelsRequest,
} from './growthAi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 4173)
const distPath = path.join(__dirname, '..', 'dist')

try {
  assertAiServerEnv()
} catch (error) {
  if (isProductionRuntime()) {
    console.error(error.message)
    process.exit(1)
  }
  console.warn(error.message)
}

app.use(express.json({ limit: '15mb' }))

function clientKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'anon'
}

function guardAi(req) {
  assertAiProxyAuthorized(req.headers)
  hitAiRateLimit(clientKey(req), { limit: Number(process.env.AI_RATE_LIMIT || 60) })
}

function sendAiError(res, error) {
  const status = Number(error.statusCode || error.status || 500)
  res.status(status).json({ error: error.message || 'AI hatası' })
}

app.get('/api/voice/health', (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(getOpenAiApiKey()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    transcribe: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    clientKeysAllowed: !isProductionRuntime(),
  })
})

app.post('/api/voice/transcribe', async (req, res) => {
  try {
    guardAi(req)
    const result = await handleVoiceTranscribeRequest(req.body, req.headers)
    res.json(result)
  } catch (error) {
    sendAiError(res, error)
  }
})

app.post('/api/voice/chat', async (req, res) => {
  try {
    guardAi(req)
    const result = await handleVoiceChatRequest(req.body, req.headers)
    res.json(result)
  } catch (error) {
    sendAiError(res, error)
  }
})

app.get('/api/omni/health', (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(getOpenAiApiKey()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    clientKeysAllowed: !isProductionRuntime(),
  })
})

app.post('/api/omni/analyze', async (req, res) => {
  try {
    guardAi(req)
    const result = await handleOmniAnalyzeRequest(req.body, req.headers)
    res.json(result)
  } catch (error) {
    sendAiError(res, error)
  }
})

app.get('/api/growth/health', async (req, res) => {
  try {
    res.json(await handleGrowthHealthRequest(req.headers))
  } catch (error) {
    sendAiError(res, error)
  }
})

app.get('/api/growth/models', async (req, res) => {
  try {
    guardAi(req)
    res.json(await handleGrowthModelsRequest(req.headers))
  } catch (error) {
    sendAiError(res, error)
  }
})

app.post('/api/growth/chat', async (req, res) => {
  try {
    guardAi(req)
    res.json(await handleGrowthChatRequest(req.body, req.headers))
  } catch (error) {
    sendAiError(res, error)
  }
})

app.use(express.static(distPath))

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`Erlenbox online: http://localhost:${port}`)
  if (!getOpenAiApiKey()) {
    console.warn('Uyarı: OPENAI_API_KEY tanımlı değil. .env dosyası oluşturun veya Ayarlar > Sesli AI bölümünden anahtar girin.')
  }
})
