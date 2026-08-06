/**
 * Müşteri listesi sesli komut ayrıştırıcı (TR).
 * Örn: "beşbin lira tahsilat yap, ön ödeme alındı"
 */

const DIGIT_WORDS = {
  sifir: 0,
  sıfır: 0,
  bir: 1,
  iki: 2,
  uc: 3,
  üç: 3,
  dort: 4,
  dört: 4,
  bes: 5,
  beş: 5,
  alti: 6,
  altı: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  yirmi: 20,
  otuz: 30,
  kirk: 40,
  kırk: 40,
  elli: 50,
  altmis: 60,
  altmış: 60,
  yetmis: 70,
  yetmiş: 70,
  seksen: 80,
  doksan: 90,
}

const MULTIPLIERS = {
  yuz: 100,
  yüz: 100,
  bin: 1000,
  milyon: 1_000_000,
}

function normalizeText(raw) {
  return String(raw || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[’']/g, '')
    .replace(/[,;]/g, ' , ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNumericToken(token) {
  const cleaned = token.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** "beş bin", "ikiyüzelli", "5 bin", "5000" → number */
export function parseTurkishAmount(text) {
  const normalized = normalizeText(text)
  if (!normalized) return null

  // Digits first: 5.000 / 5000 / 5,5
  const digitMatch = normalized.match(/(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(?:tl|₺|lira)?/)
  if (digitMatch) {
    const raw = digitMatch[1].replace(/\s/g, '')
    if (raw.includes(',') && !raw.includes('.')) {
      const n = Number(raw.replace(',', '.'))
      if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100
    }
    const asInt = Number(raw.replace(/\./g, ''))
    if (Number.isFinite(asInt) && asInt > 0) {
      // "5 bin" pattern after digits
      const after = normalized.slice(digitMatch.index + digitMatch[0].length)
      if (/^\s*bin\b/.test(after)) return asInt * 1000
      if (/^\s*milyon\b/.test(after)) return asInt * 1_000_000
      return asInt
    }
  }

  // Compound glued: beşbin, ikibin, yüzbin
  const glued = normalized.replace(/\s+/g, '')
  const gluedMatch = glued.match(
    /((?:bir|iki|uc|üç|dort|dört|bes|beş|alti|altı|yedi|sekiz|dokuz|on|yirmi|otuz|kirk|kırk|elli|altmis|altmış|yetmis|yetmiş|seksen|doksan|yuz|yüz)*)(bin|milyon)?/,
  )

  const tokens = normalized
    .replace(/(bin|milyon|yüz|yuz)/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean)

  let total = 0
  let current = 0
  let sawWord = false

  for (const token of tokens) {
    if (token === 'lira' || token === 'tl' || token === '₺' || token === 'Türk') continue
    if (DIGIT_WORDS[token] != null) {
      current += DIGIT_WORDS[token]
      sawWord = true
      continue
    }
    if (MULTIPLIERS[token] != null) {
      const mult = MULTIPLIERS[token]
      if (current === 0) current = 1
      if (mult === 1000 || mult === 1_000_000) {
        total += current * mult
        current = 0
      } else {
        current *= mult
      }
      sawWord = true
      continue
    }
    const numeric = parseNumericToken(token)
    if (numeric != null) {
      current += numeric
      sawWord = true
    }
  }

  total += current
  if (sawWord && total > 0) return total

  // Fallback glued parse e.g. beşbin
  if (glued.includes('bin') || glued.includes('milyon')) {
    let t = glued
    let amount = 0
    if (t.includes('milyon')) {
      const [left, right] = t.split('milyon')
      amount += (parseWordChunk(left) || 1) * 1_000_000
      t = right || ''
    }
    if (t.includes('bin')) {
      const [left, right] = t.split('bin')
      amount += (parseWordChunk(left) || 1) * 1000
      t = right || ''
    }
    amount += parseWordChunk(t) || 0
    if (amount > 0) return amount
  }

  return null
}

function parseWordChunk(chunk) {
  if (!chunk) return 0
  let value = 0
  let current = 0
  // Split known words greedily
  let rest = chunk
  const keys = Object.keys(DIGIT_WORDS)
    .concat(Object.keys(MULTIPLIERS))
    .sort((a, b) => b.length - a.length)

  while (rest.length) {
    let matched = false
    for (const key of keys) {
      if (rest.startsWith(key)) {
        if (DIGIT_WORDS[key] != null) {
          current += DIGIT_WORDS[key]
        } else if (MULTIPLIERS[key] != null) {
          const mult = MULTIPLIERS[key]
          if (current === 0) current = 1
          if (mult === 100) current *= 100
          else {
            value += current * mult
            current = 0
          }
        }
        rest = rest.slice(key.length)
        matched = true
        break
      }
    }
    if (!matched) break
  }
  return value + current
}

/** JS \\b is ASCII-only — use explicit TR word edges. */
function hasWord(text, pattern) {
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${pattern})(?=$|[^\\p{L}\\p{N}_])`, 'iu')
  return re.test(text)
}

function detectMethod(text) {
  if (hasWord(text, 'havale|eft|banka|virman')) return 'Banka'
  if (hasWord(text, 'çek|cek')) return 'Çek'
  if (hasWord(text, 'senet')) return 'Senet'
  if (hasWord(text, 'nakit|kasa')) return 'Nakit'
  return 'Nakit'
}

function detectAction(text) {
  if (hasWord(text, 'tahsilat|tahsil') || /alacak\s*tahsil|para\s*al/i.test(text)) {
    return 'collection'
  }
  if (/borç\s*öde|borc\s*ode|para\s*ver/i.test(text)) return 'payment'
  if (hasWord(text, 'öde|ode')) return 'payment'
  // "ödeme yap" = payment; bare "ön ödeme alındı" is description-only
  if (hasWord(text, 'ödeme|odeme')) {
    if (hasWord(text, 'yap|et|yapın|yapalım|yapalim')) return 'payment'
    if (!/ön\s+ödeme|on\s+odeme/i.test(text)) return 'payment'
  }
  if (hasWord(text, 'yap|yapın|yapalim|yapalım') && parseTurkishAmount(text)) {
    return 'collection'
  }
  return null
}

function extractDescription(text, action) {
  const normalized = normalizeText(text)
  const actionWords =
    action === 'payment'
      ? 'odeme|ödeme|ode|öde'
      : 'tahsilat|tahsil'

  // "..., ön ödeme alındı" / "açıklama ön ödeme"
  const afterComma = normalized.split(/\s*,\s*/).slice(1).join(', ').trim()
  if (afterComma) {
    return cleanDescription(afterComma)
  }

  const aciklama = normalized.match(/(?:aciklama|açıklama)\s*[:\-]?\s*(.+)$/)
  if (aciklama?.[1]) return cleanDescription(aciklama[1])

  const afterAction = normalized.match(
    new RegExp(`(?:${actionWords})\\s*(?:yap|et|olsun|al|alın|alindi|alındı)?\\s*[,:]?\\s*(.+)$`),
  )
  if (afterAction?.[1]) {
    const rest = cleanDescription(afterAction[1])
    // Avoid treating amount leftovers as description
    if (rest && !/^(lira|tl|₺|nakit|banka|havale|eft|çek|cek|senet)$/i.test(rest)) {
      // Drop if rest is only amount words
      if (parseTurkishAmount(rest) && rest.split(' ').length <= 3 && !/[a-zçğıöşü]/i.test(rest.replace(/\d/g, ''))) {
        return ''
      }
      // If rest still starts with amount phrase, strip it
      const stripped = rest
        .replace(/^[\d.\s]+(?:bin|milyon|lira|tl)?\s*/i, '')
        .replace(/^(?:bin|milyon)\s*(?:lira|tl)?\s*/i, '')
      return cleanDescription(stripped)
    }
  }

  return ''
}

function cleanDescription(value) {
  return String(value || '')
    .replace(/^(yap|et|olsun|lütfen|lutfen)\s+/i, '')
    .replace(/\s+(yap|et|olsun)$/i, '')
    .replace(/\b(lira|tl|₺)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * @returns {{
 *   ok: boolean,
 *   action?: 'collection'|'payment',
 *   amount?: number,
 *   method?: string,
 *   description?: string,
 *   error?: string,
 *   raw: string,
 * }}
 */
export function parseCustomerVoiceCommand(transcript) {
  const raw = String(transcript || '').trim()
  const text = normalizeText(raw)
  if (!text) {
    return { ok: false, error: 'Ses algılanamadı.', raw }
  }

  const action = detectAction(text)
  const amount = parseTurkishAmount(text)
  const method = detectMethod(text)

  if (!action) {
    return {
      ok: false,
      error: 'Komut anlaşılmadı. Örn: “beş bin lira tahsilat yap, ön ödeme alındı”',
      raw,
    }
  }

  if (!amount || amount <= 0) {
    return {
      ok: false,
      action,
      error: 'Tutar algılanamadı. Örn: “beş bin lira tahsilat yap”',
      raw,
    }
  }

  let description = extractDescription(text, action)
  if (!description) {
    description =
      action === 'payment' ? 'Sesli komut ile ödeme' : 'Sesli komut ile tahsilat'
  }

  // Prefer user-provided descriptive phrase over generic; if extract got action leftovers, fix
  if (/^(yap|et|nakit|banka|havale)$/i.test(description)) {
    description =
      action === 'payment' ? 'Sesli komut ile ödeme' : 'Sesli komut ile tahsilat'
  }

  return {
    ok: true,
    action,
    amount,
    method,
    description,
    raw,
  }
}

export default parseCustomerVoiceCommand
