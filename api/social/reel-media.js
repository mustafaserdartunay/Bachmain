import { generateReelImages } from '../../server/socialMeta.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const prompt = String(req.body?.prompt || '').trim()
    if (prompt.length < 3) return res.status(400).json({ error: 'prompt gerekli' })
    const result = await generateReelImages(prompt)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'reel_media_failed' })
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, maxDuration: 60 },
}
