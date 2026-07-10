import { getOpenAiApiKey } from '../../server/env.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.status(200).json({
    ok: true,
    hasApiKey: Boolean(getOpenAiApiKey()),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  })
}
