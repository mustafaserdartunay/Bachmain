import {
  assertAiProxyAuthorized,
  getOpenAiApiKey,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'
import {
  OPENAI_CHAT_MODEL_PRESETS,
  createOpenAiCompletion,
  resolveChatModel,
} from './openaiModels.js'

function guardAiRequest(reqHeaders = {}) {
  assertAiProxyAuthorized(reqHeaders)
  const ip = String(reqHeaders['x-forwarded-for'] || reqHeaders['x-real-ip'] || 'anon')
    .split(',')[0]
    .trim()
  hitAiRateLimit(ip)
}

const DEFAULT_MODELS = OPENAI_CHAT_MODEL_PRESETS

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
    defaultModel: resolveChatModel(),
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
      return {
        ok: true,
        models: DEFAULT_MODELS,
        source: 'preset',
        warning: `OpenAI models ${response.status}`,
      }
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
  const { messages = [], model, temperature = 0.7, json = false, brand = {} } = reqBody

  const apiKey = requireOpenAiApiKey(resolveRequestApiKey(reqBody, reqHeaders))
  const selectedModel = resolveChatModel(model)

  const result = await createOpenAiCompletion({
    apiKey,
    model: selectedModel,
    temperature: Number(temperature) || 0.7,
    json: Boolean(json),
    reasoningEffort: 'high',
    maxCompletionTokens: 8192,
    messages: [
      { role: 'system', content: brandSystemAddon(brand) },
      ...messages.filter((item) => item?.role && item?.content),
    ],
  })

  return {
    ok: true,
    content: result.content || '',
    model: result.model || selectedModel,
    usage: result.usage || null,
    finishReason: result.finishReason || null,
  }
}
