import {
  assertAiProxyAuthorized,
  hitAiRateLimit,
  requireOpenAiApiKey,
  resolveRequestApiKey,
} from './env.js'
import { buildChatCompletionBody, resolveChatModel } from './openaiModels.js'

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

function buildSystemPrompt({ brandVoice, companyName, learningExamples = [] }) {
  let prompt = BASE_SYSTEM_PROMPT
  if (companyName) prompt += `\n\nFirma adı: ${companyName}`
  if (brandVoice) prompt += `\nMarka sesi: ${brandVoice}`

  if (learningExamples.length > 0) {
    prompt += '\n\nÖğrenilmiş başarılı yanıt örnekleri (bunlardan ilham al):'
    learningExamples.slice(0, 12).forEach((ex, i) => {
      prompt += `\n${i + 1}. Müşteri: "${ex.customerMessage?.slice(0, 120) || '—'}" → Yanıt: "${ex.reply?.slice(0, 200) || ex.finalText?.slice(0, 200) || '—'}"`
    })
  }

  return prompt
}

function formatThreadForModel(messages = []) {
  return messages
    .filter((m) => m?.body && m.type === 'text')
    .slice(-20)
    .map((m) => ({
      role: m.direction === 'in' ? 'user' : 'assistant',
      content: `[${m.channel || 'kanal'}] ${m.senderName || (m.direction === 'in' ? 'Müşteri' : 'Temsilci')}: ${m.body}`,
    }))
}

export async function runOmniAnalyze({
  messages = [],
  context = {},
  learningExamples = [],
  apiKey,
  model,
  brandVoice = '',
  companyName = 'Erlenbox',
}) {
  const resolvedKey = requireOpenAiApiKey(apiKey)
  const selectedModel = resolveChatModel(model)
  const thread = formatThreadForModel(messages)

  if (thread.length === 0) {
    return {
      summary: 'Henüz metin mesajı yok.',
      sentiment: 'neutral',
      primaryReply: 'Merhaba, size nasıl yardımcı olabilirim?',
      replies: ['Merhaba, talebiniz için teşekkürler. Size nasıl yardımcı olabilirim?'],
      actions: [],
      confidence: 0.5,
      source: 'openai',
    }
  }

  const systemPrompt = buildSystemPrompt({ brandVoice, companyName, learningExamples })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolvedKey}`,
    },
    body: JSON.stringify(
      buildChatCompletionBody({
        model: selectedModel,
        temperature: 0.4,
        json: true,
        reasoningEffort: 'high',
        maxCompletionTokens: 4096,
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
      }),
    ),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API hatası (${response.status}): ${errorText.slice(0, 240)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'

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
  } = reqBody || {}

  return runOmniAnalyze({
    messages,
    context,
    learningExamples,
    brandVoice,
    companyName,
    apiKey: resolveRequestApiKey(reqBody, reqHeaders),
    model: resolveChatModel(model),
  })
}
