/**
 * Explicit /api/auth/* routes for Vercel (multi-segment catch-all reliability).
 */
import { handleAuthApi, applyCors, sendJson } from '../../server/authRoutes.mjs'

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function getAuthSubpath(req) {
  const url = new URL(req.url, 'http://localhost')
  // /api/auth/register → register ; /api/auth → ''
  return url.pathname.replace(/^\/api\/auth\/?/, '') || ''
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const sub = getAuthSubpath(req)
    const path = sub ? `auth/${sub}` : 'auth'
    const body = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : {}
    const handled = await handleAuthApi(req, res, path, body)
    if (!handled) {
      return sendJson(req, res, 404, { error: 'NOT_FOUND', path })
    }
  } catch (error) {
    return sendJson(req, res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
