import {
  readAiGrowthSettings,
  recordAiGrowthUsage,
} from './aiGrowthSettings'

function headersWithKey(apiKey) {
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['X-OpenAI-Key'] = apiKey
  return headers
}

async function parseError(response) {
  try {
    const data = await response.json()
    return data.error || data.message || `İstek başarısız (${response.status})`
  } catch {
    return `İstek başarısız (${response.status})`
  }
}

export async function fetchAiGrowthHealth() {
  const settings = readAiGrowthSettings()
  const response = await fetch('/api/growth/health', {
    method: 'GET',
    headers: headersWithKey(settings.apiKey),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function fetchAiGrowthModels() {
  const settings = readAiGrowthSettings()
  const response = await fetch('/api/growth/models', {
    method: 'GET',
    headers: headersWithKey(settings.apiKey),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export async function testAiGrowthConnection({ apiKey, model } = {}) {
  const settings = readAiGrowthSettings()
  const response = await fetch('/api/growth/chat', {
    method: 'POST',
    headers: headersWithKey(apiKey ?? settings.apiKey),
    body: JSON.stringify({
      feature: 'connection_test',
      model: model || settings.model,
      apiKey: apiKey ?? settings.apiKey,
      messages: [
        { role: 'user', content: 'Bağlantı testi: yalnızca "ok" yaz.' },
      ],
      temperature: 0,
    }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  const data = await response.json()
  if (data.usage) {
    recordAiGrowthUsage({
      model: data.model || settings.model,
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      feature: 'connection_test',
    })
  }
  return data
}

export async function runAiGrowthGenerate({
  feature,
  systemPrompt,
  userPrompt,
  model,
  temperature = 0.7,
  json = false,
}) {
  const settings = readAiGrowthSettings()
  const response = await fetch('/api/growth/chat', {
    method: 'POST',
    headers: headersWithKey(settings.apiKey),
    body: JSON.stringify({
      feature,
      model: model || settings.model,
      apiKey: settings.apiKey,
      temperature,
      json,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt },
      ],
      brand: {
        voice: settings.brandVoice,
        industry: settings.industry,
        companyName: settings.companyName,
        website: settings.website,
        language: settings.language,
      },
    }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  const data = await response.json()
  if (data.usage) {
    recordAiGrowthUsage({
      model: data.model || settings.model,
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      feature,
    })
  }
  return data
}
