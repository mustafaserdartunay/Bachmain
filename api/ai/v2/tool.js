import { handleToolCallRequest } from '../../../server/ai/actionEngine.js'
import { mapAiUserError } from '../../../server/ai/userErrors.js'
import { assertAiProxyAuthorized, hitAiRateLimit } from '../../../server/env.js'

export const maxDuration = 60

function clientKey(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'anon'
  )
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    assertAiProxyAuthorized(req.headers || {})
    hitAiRateLimit(clientKey(req), { limit: Number(process.env.AI_RATE_LIMIT || 60) })
    const result = await handleToolCallRequest(req.body || {}, req.headers || {})
    return res.status(200).json(result)
  } catch (error) {
    const status = Number(error.statusCode || error.status || 500)
    return res.status(status).json({ error: mapAiUserError(error) })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
