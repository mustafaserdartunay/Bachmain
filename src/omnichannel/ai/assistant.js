const POSITIVE = ['teşekkür', 'harika', 'mükemmel', 'onay', 'tamam', 'evet', 'memnun', 'güzel']
const NEGATIVE = ['gecik', 'sorun', 'iptal', 'şikayet', 'kötü', 'ertele', 'memnun değil', 'problem']
const QUOTE = ['fiyat', 'teklif', 'proforma', 'adet', 'kutu', 'kraft', 'oluklu']
const ORDER = ['sipariş', 'order', 'satın', 'teslimat', 'kargo', 'üretim']

function includesAny(text, words) {
  const lower = String(text || '').toLowerCase()
  return words.some((word) => lower.includes(word))
}

export function analyzeSentiment(text) {
  if (includesAny(text, NEGATIVE)) return 'negative'
  if (includesAny(text, POSITIVE)) return 'positive'
  return 'neutral'
}

export function summarizeThread(messages) {
  const inbound = messages.filter((m) => m.direction === 'in').slice(-5)
  if (inbound.length === 0) return 'Henüz gelen mesaj yok.'
  const topics = []
  if (inbound.some((m) => includesAny(m.body, QUOTE))) topics.push('fiyat/teklif talebi')
  if (inbound.some((m) => includesAny(m.body, ORDER))) topics.push('sipariş/teslimat')
  if (inbound.some((m) => includesAny(m.body, NEGATIVE))) topics.push('şikayet veya gecikme')
  const preview = inbound.map((m) => m.body).join(' ').slice(0, 120)
  return topics.length
    ? `Konu: ${topics.join(', ')}. Son mesajlar: ${preview}...`
    : `Son mesajlar: ${preview}...`
}

export function suggestReplies(text, channel) {
  const suggestions = []
  if (includesAny(text, QUOTE)) {
    suggestions.push('Ölçü, adet ve baskı detayını paylaşır mısınız? Size özel teklif hazırlayalım.')
    suggestions.push('Talebiniz için teklif hazırlıyorum, kısa süre içinde ileteceğim.')
  }
  if (includesAny(text, ORDER)) {
    suggestions.push('Siparişiniz üretim planına alındı. Tahmini teslim tarihini paylaşacağım.')
    suggestions.push('Sipariş durumunuzu CRM üzerinden takip edebilirsiniz.')
  }
  if (includesAny(text, NEGATIVE)) {
    suggestions.push('Yaşadığınız durum için özür dileriz. Konuyu öncelikli olarak inceliyoruz.')
  }
  if (suggestions.length === 0) {
    suggestions.push('Merhaba, talebiniz için teşekkürler. Size nasıl yardımcı olabilirim?')
    suggestions.push(channel === 'email'
      ? 'E-postanızı aldık, en kısa sürede dönüş yapacağız.'
      : 'Mesajınızı aldım, hemen dönüş yapıyorum.')
  }
  return suggestions.slice(0, 3)
}

export function suggestActions(text) {
  const actions = []
  if (includesAny(text, QUOTE)) actions.push({ type: 'quote', label: 'Teklif Oluştur', path: '/teklifler' })
  if (includesAny(text, ORDER)) actions.push({ type: 'order', label: 'Sipariş Oluştur', path: '/siparisler' })
  if (includesAny(text, ['fatura', 'proforma'])) actions.push({ type: 'invoice', label: 'Fatura Oluştur', path: '/musteriler' })
  return actions
}

export function analyzeMessage(text) {
  return {
    sentiment: analyzeSentiment(text),
    summary: summarizeThread([{ direction: 'in', body: text }]),
    replies: suggestReplies(text, 'whatsapp'),
    actions: suggestActions(text),
  }
}

export function analyzeConversation(messages) {
  const inbound = messages.filter((m) => m.direction === 'in')
  const lastInbound = inbound[inbound.length - 1]
  const combined = inbound.map((m) => m.body).join(' ')
  return {
    sentiment: analyzeSentiment(combined),
    summary: summarizeThread(messages),
    replies: suggestReplies(lastInbound?.body || combined, messages[0]?.channel),
    actions: suggestActions(combined),
  }
}
