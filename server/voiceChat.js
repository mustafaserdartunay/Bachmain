import { requireOpenAiApiKey, resolveRequestApiKey } from './env.js'

const SYSTEM_PROMPT = `Sen Erlenbox ERP için Türkçe konuşan sesli asistanısın. Kullanıcının söylediklerini anlayıp CRM işlemlerini otomatik yaparsın.

Yanıtını HER ZAMAN şu JSON formatında ver:
{
  "message": "Kullanıcıya söylenecek kısa Türkçe cevap",
  "actions": [
    { "type": "navigate", "path": "/teklifler" },
    { "type": "create_customer", "payload": { "companyTitle": "...", "contact": "...", "phone": "...", "email": "...", "city": "...", "representative": "..." } },
    { "type": "create_product", "payload": { "name": "...", "stockCode": "...", "salesPriceExcl": 0, "vatRate": 20, "category": "Kraft Kutular" } },
    { "type": "create_quote", "payload": { "title": "...", "customer": "...", "contact": "...", "items": [{ "product": "...", "quantity": 1, "unitPrice": 0, "vatRate": 20 }] } }
  ]
}

Kullanılabilir sayfa yolları:
- / (ana sayfa)
- /musteriler (müşteri listesi)
- /musteriler/yeni (yeni müşteri)
- /teklifler (teklifler)
- /siparisler (siparişler)
- /stok/urunler (ürünler)
- /kasa (kasa)
- /crm (CRM)
- /mesajlar (mesajlar)
- /ayarlar (ayarlar)

Kurallar:
- Eksik kritik bilgi varsa actions boş bırak, message ile sor.
- Müşteri, ürün veya teklif oluştururken mümkün olduğunca payload doldur.
- Birden fazla işlem gerekiyorsa actions dizisine sırayla ekle (önce navigate gerekirse ekle).
- Sadece geçerli JSON döndür, markdown kullanma.
- Tutarları sayı olarak ver (string değil).
- Türkçe konuş, samimi ve kısa ol.`

export async function runVoiceChat({ messages, context, apiKey, model = 'gpt-4o-mini' }) {
  const resolvedKey = requireOpenAiApiKey(apiKey)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resolvedKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nUygulama bağlamı:\n${JSON.stringify(context, null, 2)}`,
        },
        ...messages,
      ],
    }),
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
    }
  } catch {
    return {
      message: content,
      actions: [],
      raw: null,
    }
  }
}

export async function handleVoiceChatRequest(reqBody, reqHeaders = {}) {
  const { messages = [], context = {} } = reqBody || {}
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  return runVoiceChat({
    messages: messages.filter((item) => item?.role && item?.content),
    context,
    apiKey: resolveRequestApiKey(reqBody, reqHeaders),
    model,
  })
}
