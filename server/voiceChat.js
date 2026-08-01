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

const SYSTEM_PROMPT = `Sen BACHMAIN CRM için Türkçe konuşan yapay zeka asistanısın. Kullanıcının isteğini anlayıp sistemi kontrol ederek işlemleri otomatik yaparsın.

Yanıtını HER ZAMAN şu JSON formatında ver:
{
  "message": "Kullanıcıya söylenecek kısa Türkçe cevap",
  "actions": [
    { "type": "navigate", "path": "/teklifler" },
    { "type": "create_customer", "payload": { "companyTitle": "...", "contact": "...", "phone": "...", "email": "...", "city": "...", "representative": "..." } },
    { "type": "create_product", "payload": { "name": "...", "stockCode": "...", "salesPriceExcl": 0, "vatRate": 20, "category": "Kraft Kutular" } },
    { "type": "create_quote", "payload": { "title": "...", "customer": "...", "contact": "...", "items": [{ "product": "...", "quantity": 1, "unitPrice": 0, "vatRate": 20 }] } },
    { "type": "create_task", "payload": { "title": "...", "customer": "...", "assignee": "...", "priority": "Normal", "status": "Bekliyor", "category": "Genel", "description": "...", "dueDate": "2026-07-10" } },
    { "type": "create_appointment", "payload": { "title": "...", "customer": "...", "contact": "...", "date": "2026-07-10", "startTime": "10:00", "endTime": "11:00", "location": "...", "notes": "..." } },
    { "type": "create_note", "payload": { "content": "...", "title": "..." } }
  ]
}

Kullanılabilir sayfa yolları:
- / (ana sayfa / dashboard)
- /musteriler, /musteriler/yeni
- /teklifler, /siparisler
- /stok/urunler, /depo, /uretim
- /nakit/kasa-bankalar/cash-main (kasa)
- /crm, /crm/gorevler, /crm/randevular
- /mesajlar, /saha-satis
- /giderler/liste, /ik/personeller
- /ayarlar, /profil

Kurallar:
- Kullanıcı bir şey yapmamı istediğinde mümkünse actions ile uygula; sadece sohbet ise actions boş bırak.
- Eksik kritik bilgi varsa actions boş bırak, message ile net sor.
- Müşteri, ürün, teklif, görev, randevu veya not oluştururken payload'ı doldur.
- Birden fazla işlem gerekiyorsa actions dizisine sırayla ekle (önce navigate gerekirse ekle).
- Sadece geçerli JSON döndür, markdown kullanma.
- Tutarları ve sayıları number olarak ver.
- Tarihleri YYYY-MM-DD formatında ver.
- Türkçe konuş, samimi ve kısa ol.
- Bağlamdaki mevcut müşteri/ürün/görev listesini referans alarak doğru kayıtları hedefle.`

export async function runVoiceChat({ messages, context, apiKey, model }) {
  const resolvedKey = requireOpenAiApiKey(apiKey)
  const selectedModel = resolveChatModel(model)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolvedKey}`,
    },
    body: JSON.stringify(
      buildChatCompletionBody({
        model: selectedModel,
        temperature: 0.2,
        json: true,
        reasoningEffort: 'high',
        maxCompletionTokens: 4096,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nUygulama bağlamı:\n${JSON.stringify(context, null, 2)}`,
          },
          ...messages,
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
    return {
      message: String(parsed.message || 'Tamam.'),
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      raw: parsed,
      model: data.model || selectedModel,
    }
  } catch {
    return {
      message: content,
      actions: [],
      raw: null,
      model: data.model || selectedModel,
    }
  }
}

export async function handleVoiceChatRequest(reqBody, reqHeaders = {}) {
  guardAiRequest(reqHeaders)
  const { messages = [], context = {} } = reqBody || {}

  return runVoiceChat({
    messages: messages.filter((item) => item?.role && item?.content),
    context,
    apiKey: resolveRequestApiKey(reqBody, reqHeaders),
    model: resolveChatModel(reqBody?.model),
  })
}
