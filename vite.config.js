import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getOpenAiApiKey } from './server/env.js'
import { handleVoiceChatRequest } from './server/voiceChat.js'
import { handleVoiceTranscribeRequest } from './server/voiceTranscribe.js'
import { handleOmniAnalyzeRequest } from './server/omniChat.js'
import { resolveChatModel, resolveTranscribeModel } from './server/openaiModels.js'
import { APP_VERSION, APP_BUILD, APP_VERSION_META } from './src/version/appVersion.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function appVersionPlugin() {
  const payload = `${JSON.stringify(
    {
      version: APP_VERSION,
      build: APP_BUILD,
      releasedAt: APP_VERSION_META.releasedAt,
    },
    null,
    2,
  )}\n`

  return {
    name: 'bach-app-version',
    buildStart() {
      const publicPath = path.resolve(__dirname, 'public/app-version.json')
      fs.writeFileSync(publicPath, payload, 'utf8')
    },
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir || path.resolve(__dirname, 'dist')
      fs.writeFileSync(path.join(outDir, 'app-version.json'), payload, 'utf8')
    },
  }
}

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
          res.end(
            JSON.stringify({
              ok: true,
              hasApiKey: Boolean(getOpenAiApiKey()),
              model: resolveChatModel(),
              transcribe: resolveTranscribeModel(),
              reasoningEffort: process.env.OPENAI_REASONING_EFFORT || 'high',
            }),
          )
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
  resolve: {
    alias: {
      '@bachmain/ui': path.resolve(__dirname, 'packages/ui/src/index.js'),
    },
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  plugins: [react(), voiceApiPlugin(), appVersionPlugin()],
  define: {
    __BACH_APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/restore-backups/**',
        '**/node_modules/**',
        '**/dist/**',
        '**/dist-static/**',
        '**/.next/**',
        '**/coverage/**',
        '**/.cache/**',
        '**/.turbo/**',
        '**/.vite/**',
        '**/.vercel/**',
        '**/*.mp4',
        '**/*.mov',
        '**/*.webm',
        '**/*.glb',
        '**/*.gltf',
        '**/*.fbx',
        '**/*.blend',
      ],
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
