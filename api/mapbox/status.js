import { handleOptions, rateLimit, sendJson, statusPayload } from './_lib.js'

export default function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }
  if (!rateLimit(req, 120))
    return sendJson(res, 429, { error: 'RATE_LIMIT', message: 'Çok fazla istek' })
  return sendJson(res, 200, statusPayload())
}
