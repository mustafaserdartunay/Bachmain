import { handleGrowthChatRequest } from '../../server/growthAi.js'

export const maxDuration = 300

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const result = await handleGrowthChatRequest(req.body || {}, req.headers || {})
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'AI Growth hatası' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}
