import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getOpenAiApiKey } from './server/env.js'
import { handleVoiceChatRequest } from './server/voiceChat.js'
import { handleVoiceTranscribeRequest } from './server/voiceTranscribe.js'
import { handleOmniAnalyzeRequest } from './server/omniChat.js'

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

function readRequestHeaders(req) {
  return Object.fromEntries(
    Object.entries(req.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  )
}

function voiceApiPlugin() {
  return {
    name: 'voice-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/voice/health' || req.url === '/api/omni/health') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            ok: true,
            hasApiKey: Boolean(getOpenAiApiKey()),
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            transcribe: 'whisper-1',
          }))
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        if (req.url === '/api/voice/chat') {
          try {
            const body = await readJsonBody(req)
            const result = await handleVoiceChatRequest(body, readRequestHeaders(req))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Sesli asistan hatası' }))
          }
          return
        }

        if (req.url === '/api/voice/transcribe') {
          try {
            const body = await readJsonBody(req)
            const result = await handleVoiceTranscribeRequest(body, readRequestHeaders(req))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Ses tanıma hatası' }))
          }
          return
        }

        if (req.url === '/api/omni/analyze') {
          try {
            const body = await readJsonBody(req)
            const result = await handleOmniAnalyzeRequest(body, readRequestHeaders(req))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Omnichannel AI hatası' }))
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  plugins: [react(), voiceApiPlugin()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      ignored: ['**/restore-backups/**'],
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
