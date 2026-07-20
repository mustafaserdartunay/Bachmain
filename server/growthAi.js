import {
  assertAiProxyAuthorized,
  getOpenAiApiKey,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'

function guardAiRequest(reqHeaders = {}) {
  assertAiProxyAuthorized(reqHeaders)
  const ip = String(reqHeaders['x-forwarded-for'] || reqHeaders['x-real-ip'] || 'anon').split(',')[0].trim()
  hitAiRateLimit(ip)
}

const DEFAULT_MODELS = [
  { id: 'gpt-5.5', label: 'GPT-5.5' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
]

function brandSystemAddon(brand = {}) {
  const parts = [
    'Sen BachMain AI Growth Center pazarlama asistanısın.',
    'Türkçe yaz. Satış artışı, müşteri kazanımı ve dönüşüm odaklı ol.',
    brand.companyName ? `Şirket: ${brand.companyName}` : '',
    brand.industry ? `Sektör: ${brand.industry}` : '',
    brand.voice ? `Marka tonu: ${brand.voice}` : '',
    brand.website ? `Web: ${brand.website}` : '',
    brand.language ? `Dil: ${brand.language}` : 'Dil: tr',
  ].filter(Boolean)
  return parts.join('\n')
}

export async function handleGrowthHealthRequest(reqHeaders = {}) {
  const apiKey = getOpenAiApiKey(resolveRequestApiKey({}, reqHeaders))
  return {
    ok: true,
    hasApiKey: Boolean(apiKey),
    source: process.env.OPENAI_API_KEY && getOpenAiApiKey() ? 'env' : apiKey ? 'request' : 'none',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
    module: 'ai-growth-center',
  }
}

export async function handleGrowthModelsRequest(reqHeaders = {}) {
  const apiKey = getOpenAiApiKey(resolveRequestApiKey({}, reqHeaders))
  if (!apiKey) {
    return { ok: true, models: DEFAULT_MODELS, source: 'preset' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) {
      return { ok: true, models: DEFAULT_MODELS, source: 'preset', warning: `OpenAI models ${response.status}` }
    }
    const data = await response.json()
    const ids = (data.data || [])
      .map((row) => row.id)
      .filter((id) => /^gpt-|^o\d|^chatgpt/i.test(String(id)))
      .sort()

    const preferred = DEFAULT_MODELS.filter((m) => ids.includes(m.id) || true)
    const extras = ids
      .filter((id) => !preferred.some((m) => m.id === id))
      .slice(0, 40)
      .map((id) => ({ id, label: id }))

    return {
      ok: true,
      models: [...preferred, ...extras],
      source: 'openai',
      count: ids.length,
    }
  } catch (error) {
    return {
      ok: true,
      models: DEFAULT_MODELS,
      source: 'preset',
      warning: error.message || 'Model listesi alınamadı',
    }
  }
}

export async function handleGrowthChatRequest(reqBody = {}, reqHeaders = {}) {
  guardAiRequest(reqHeaders)
  const {
    messages = [],
    model,
    temperature = 0.7,
    json = false,
    brand = {},
  } = reqBody

  const apiKey = requireOpenAiApiKey(resolveRequestApiKey(reqBody, reqHeaders))
  const selectedModel = String(model || process.env.OPENAI_MODEL || 'gpt-4o').trim()

  const payload = {
    model: selectedModel,
    temperature: Number(temperature) || 0.7,
    messages: [
      { role: 'system', content: brandSystemAddon(brand) },
      ...messages.filter((item) => item?.role && item?.content),
    ],
  }

  if (json) {
    payload.response_format = { type: 'json_object' }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API hatası (${response.status}): ${errorText.slice(0, 400)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  return {
    ok: true,
    content,
    model: data.model || selectedModel,
    usage: data.usage || null,
    finishReason: data.choices?.[0]?.finish_reason || null,
  }
}
