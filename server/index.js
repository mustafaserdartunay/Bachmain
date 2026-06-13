import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { getOpenAiApiKey } from './env.js'
import { handleVoiceChatRequest } from './voiceChat.js'
import { handleVoiceTranscribeRequest } from './voiceTranscribe.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 4173)
const distPath = path.join(__dirname, '..', 'dist')

app.use(express.json({ limit: '15mb' }))

app.get('/api/voice/health', (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(getOpenAiApiKey()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    transcribe: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
  })
})

app.post('/api/voice/transcribe', async (req, res) => {
  try {
    const result = await handleVoiceTranscribeRequest(req.body, req.headers)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ses tanıma hatası' })
  }
})

app.post('/api/voice/chat', async (req, res) => {
  try {
    const result = await handleVoiceChatRequest(req.body, req.headers)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Sesli asistan hatası' })
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
