import {
  assertAiProxyAuthorized,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'
import { createOpenAiCompletion, resolveChatModel } from './openaiModels.js'

function guardAiRequest(reqHeaders = {}) {
  assertAiProxyAuthorized(reqHeaders)
  const ip = String(reqHeaders['x-forwarded-for'] || reqHeaders['x-real-ip'] || 'anon')
    .split(',')[0]
    .trim()
  hitAiRateLimit(ip)
}

const BASE_SYSTEM_PROMPT = `Sen Erlenbox ambalaj/kutu üretimi firmasının omnichannel müşteri iletişim asistanısın.
WhatsApp, Instagram, Messenger, e-posta ve TikTok lead kanallarından gelen müşteri mesajlarına profesyonel Türkçe yanıtlar üretirsin.

Yanıtını HER ZAMAN şu JSON formatında ver:
{
  "summary": "Konuşmanın 1-2 cümlelik özeti",
  "sentiment": "positive" | "neutral" | "negative",
  "primaryReply": "Müşteriye gönderilecek en iyi tek yanıt (doğal, samimi, profesyonel)",
  "replies": ["alternatif yanıt 1", "alternatif yanıt 2"],
  "actions": [
    { "type": "quote", "label": "Teklif Oluştur", "path": "/teklifler" },
    { "type": "order", "label": "Sipariş Oluştur", "path": "/siparisler" }
  ],
  "confidence": 0.0 ile 1.0 arası güven skoru
}

Kurallar:
- Kraft kutu, oluklu mukavva, baskılı kutu, teklif, sipariş, teslimat konularında uzman davran.
- Eksik bilgi varsa (ölçü, adet, baskı) kibarca sor.
- Olumsuz mesajlarda empati göster, çözüm odaklı ol.
- Yanıtlar kısa ve kanala uygun olsun (WhatsApp/IG kısa, e-posta biraz daha resmi).
- Sadece geçerli JSON döndür, markdown kullanma.
- actions dizisini yalnızca gerçekten uygunsa doldur; yoksa boş bırak.
- Önceki başarılı yanıt örneklerini referans al ve marka tonunu koru.`

function buildSystemPrompt({
  brandVoice,
  companyName,
  learningExamples = [],
  maxLearningExamples = 6,
}) {
  let prompt = BASE_SYSTEM_PROMPT
  if (companyName) prompt += `\n\nFirma adı: ${companyName}`
  if (brandVoice) prompt += `\nMarka sesi: ${brandVoice}`

  if (learningExamples.length > 0) {
    prompt += '\n\nÖğrenilmiş başarılı yanıt örnekleri (bunlardan ilham al):'
    learningExamples.slice(0, maxLearningExamples).forEach((ex, i) => {
      prompt += `\n${i + 1}. Müşteri: "${ex.customerMessage?.slice(0, 120) || '—'}" → Yanıt: "${ex.reply?.slice(0, 200) || ex.finalText?.slice(0, 200) || '—'}"`
    })
  }

  return prompt
}

function formatThreadForModel(messages = [], maxThreadMessages = 12) {
  return messages
    .filter((m) => m?.body && m.type === 'text')
    .slice(-maxThreadMessages)
    .map((m) => ({
      role: m.direction === 'in' ? 'user' : 'assistant',
      content: `[${m.channel || 'kanal'}] ${m.senderName || (m.direction === 'in' ? 'Müşteri' : 'Temsilci')}: ${m.body}`,
    }))
}

function resolveOmniModel(model) {
  const fromRequest = String(model || '').trim()
  if (fromRequest) return resolveChatModel(fromRequest)
  return resolveChatModel(process.env.OPENAI_OMNI_MODEL || 'gpt-4o-mini')
}

function resolveOmniReasoningEffort(override) {
  const raw = String(override || process.env.OPENAI_OMNI_REASONING_EFFORT || 'low').trim()
  return raw || 'low'
}

function resolveOmniMaxTokens(override) {
  const parsed = Number(override || process.env.OPENAI_OMNI_MAX_TOKENS || 512)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 2048) : 512
}

export async function runOmniAnalyze({
  messages = [],
  context = {},
  learningExamples = [],
  apiKey,
  model,
  brandVoice = '',
  companyName = 'Erlenbox',
  reasoningEffort,
  maxOutputTokens,
  maxThreadMessages = 12,
  maxLearningExamples = 6,
}) {
  const resolvedKey = requireOpenAiApiKey(apiKey)
  const selectedModel = resolveOmniModel(model)
  const thread = formatThreadForModel(messages, maxThreadMessages)
  const effort = resolveOmniReasoningEffort(reasoningEffort)
  const maxTokens = resolveOmniMaxTokens(maxOutputTokens)

  if (thread.length === 0) {
    return {
      summary: 'Henüz metin mesajı yok.',
      sentiment: 'neutral',
      primaryReply: 'Merhaba, size nasıl yardımcı olabilirim?',
      replies: ['Merhaba, talebiniz için teşekkürler. Size nasıl yardımcı olabilirim?'],
      actions: [],
      confidence: 0.5,
      source: 'openai',
      model: selectedModel,
    }
  }

  const systemPrompt = buildSystemPrompt({
    brandVoice,
    companyName,
    learningExamples,
    maxLearningExamples,
  })

  const result = await createOpenAiCompletion({
    apiKey: resolvedKey,
    model: selectedModel,
    temperature: 0.35,
    json: true,
    reasoningEffort: effort,
    maxCompletionTokens: maxTokens,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt}\n\nMüşteri/CRM bağlamı:\n${JSON.stringify(context, null, 2)}`,
      },
      ...thread,
      {
        role: 'user',
        content:
          'Yukarıdaki konuşmaya göre JSON formatında özet, duygu analizi, birincil yanıt, alternatif yanıtlar ve uygun CRM aksiyonlarını üret.',
      },
    ],
  })

  const content = result.content || '{}'

  try {
    const parsed = JSON.parse(content)
    const replies = Array.isArray(parsed.replies) ? parsed.replies.filter(Boolean) : []
    const primary = String(parsed.primaryReply || replies[0] || '').trim()

    return {
      summary: String(parsed.summary || 'Konuşma analiz edildi.'),
      sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      primaryReply: primary,
      replies:
        primary && !replies.includes(primary)
          ? [primary, ...replies].slice(0, 4)
          : replies.slice(0, 4),
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75,
      source: 'openai',
      model: result.model || selectedModel,
    }
  } catch {
    return {
      summary: content.slice(0, 200),
      sentiment: 'neutral',
      primaryReply: content.slice(0, 500),
      replies: [content.slice(0, 500)],
      actions: [],
      confidence: 0.5,
      source: 'openai',
      model: result.model || selectedModel,
    }
  }
}

export async function handleOmniAnalyzeRequest(reqBody, reqHeaders = {}) {
  guardAiRequest(reqHeaders)
  const {
    messages = [],
    context = {},
    learningExamples = [],
    brandVoice = '',
    companyName = 'Erlenbox',
    model,
    reasoningEffort,
    maxOutputTokens,
    maxThreadMessages,
    maxLearningExamples,
  } = reqBody || {}

  return runOmniAnalyze({
    messages,
    context,
    learningExamples,
    brandVoice,
    companyName,
    apiKey: resolveRequestApiKey(reqBody, reqHeaders),
    model,
    reasoningEffort,
    maxOutputTokens,
    maxThreadMessages,
    maxLearningExamples,
  })
}
