import { handleVoiceTranscribeRequest } from '../../server/voiceTranscribe.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const result = await handleVoiceTranscribeRequest(req.body || {}, req.headers || {})
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Ses tanıma hatası' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}
