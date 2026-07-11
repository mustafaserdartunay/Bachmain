/**
 * Explicit /api/staff/* routes for Vercel multi-segment reliability.
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

function getStaffPath(req) {
  const url = new URL(req.url, 'http://localhost')
  const rest = url.pathname.replace(/^\/api\/staff\/?/, '') || ''
  return rest ? `staff/${rest}` : 'staff'
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }

  try {
    const path = getStaffPath(req)
    const body = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : {}
    const handled = await handleAuthApi(req, res, path, body)
    if (!handled) {
      return sendJson(req, res, 404, { error: 'NOT_FOUND', path })
    }
  } catch (error) {
    return sendJson(req, res, 500, { error: 'SERVER_ERROR', message: error.message })
  }
}
