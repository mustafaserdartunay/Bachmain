import { handleGrowthHealthRequest } from '../../server/growthAi.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const result = await handleGrowthHealthRequest(req.headers || {})
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Health check failed' })
  }
}
