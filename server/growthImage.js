import {
  assertAiProxyAuthorized,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'

function guardAiRequest(reqHeaders = {}) {
  assertAiProxyAuthorized(reqHeaders)
  const ip = String(reqHeaders['x-forwarded-for'] || reqHeaders['x-real-ip'] || 'anon')
    .split(',')[0]
    .trim()
  hitAiRateLimit(ip)
}

function dataUrlFromImagePayload(data) {
  const row = data?.data?.[0] || {}
  if (row.b64_json) return `data:image/jpeg;base64,${row.b64_json}`
  if (row.url) return String(row.url)
  return ''
}

async function generateOnce(apiKey, body) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`openai-image ${response.status}: ${raw.slice(0, 280)}`)
  const image = dataUrlFromImagePayload(JSON.parse(raw))
  if (!image) throw new Error('image-empty')
  return { image, model: body.model }
}

export async function handleGrowthImageRequest(reqBody = {}, reqHeaders = {}) {
  guardAiRequest(reqHeaders)
  const prompt = String(reqBody.prompt || '')
    .trim()
    .slice(0, 4000)
  if (prompt.length < 8) {
    const error = new Error('prompt-short')
    error.statusCode = 400
    throw error
  }
  const apiKey = requireOpenAiApiKey(resolveRequestApiKey(reqBody, reqHeaders))
  try {
    return {
      ok: true,
      ...(await generateOnce(apiKey, {
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt,
        n: 1,
        size: reqBody.size || '1536x1024',
        quality: reqBody.quality || 'medium',
        output_format: 'jpeg',
      })),
    }
  } catch {
    const fallback = await generateOnce(apiKey, {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'b64_json',
    })
    return { ok: true, ...fallback }
  }
}
