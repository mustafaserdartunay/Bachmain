/** Instagram connection + reel drafts for AI Growth (local demo). */

const CONNECTION_KEY = 'bach_ai_growth_instagram_v1'
const REELS_KEY = 'bach_ai_growth_reels_v1'
export const INSTAGRAM_UPDATED_EVENT = 'bach:ai-growth-instagram'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(INSTAGRAM_UPDATED_EVENT))
}

export function readInstagramConnection() {
  return (
    readJson(CONNECTION_KEY, null) || {
      connected: false,
      username: '',
      displayName: '',
      connectedAt: null,
      mode: 'demo',
    }
  )
}

export function connectInstagramDemo({ username, displayName } = {}) {
  const handle = String(username || '')
    .trim()
    .replace(/^@/, '')
  if (!handle) throw new Error('Instagram kullanıcı adı gerekli')
  const next = {
    connected: true,
    username: handle,
    displayName: String(displayName || handle).trim() || handle,
    connectedAt: new Date().toISOString(),
    mode: 'demo',
  }
  writeJson(CONNECTION_KEY, next)
  return next
}

export function disconnectInstagram() {
  const next = {
    connected: false,
    username: '',
    displayName: '',
    connectedAt: null,
    mode: 'demo',
  }
  writeJson(CONNECTION_KEY, next)
  return next
}

export function listReelDrafts() {
  return readJson(REELS_KEY, { items: [] }).items || []
}

export function saveReelDraft(reel) {
  const items = listReelDrafts()
  const row = {
    id: reel.id || `reel-${Date.now()}`,
    createdAt: reel.createdAt || new Date().toISOString(),
    status: reel.status || 'draft',
    ...reel,
  }
  const next = { items: [row, ...items.filter((x) => x.id !== row.id)].slice(0, 50) }
  writeJson(REELS_KEY, next)
  return row
}

/** Deterministic example when OpenAI is unavailable — shows the flow. */
export function buildDemoReelPackage({ topic, tone, durationSec }) {
  const title = topic?.trim() || 'Kraft kutu kampanyası'
  const seconds = Number(durationSec) || 20
  return {
    topic: title,
    tone: tone || 'Samimi ve satış odaklı',
    durationSec: seconds,
    hook: `${title} — 3 saniyede dikkat çek`,
    caption: `✨ ${title}\n\nKısa demo reel: ürünü göster, faydayı söyle, CTA ile bitir.\n\n👉 Profildeki linkten incele\n\n#bachmain #reeldemo #${title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]+/gi, '')
      .slice(0, 24)}`,
    hashtags: ['#reels', '#instagram', '#bachmain', '#demo', '#isletme'],
    scenes: [
      {
        t: '0–3 sn',
        shot: 'Yakın plan ürün / logo',
        voice: `Dur! ${title} ile farkı gör.`,
      },
      {
        t: '3–10 sn',
        shot: 'Ürün kullanımı / atölye',
        voice: 'Nasıl çalıştığını hızlıca göster.',
      },
      {
        t: '10–16 sn',
        shot: 'Sonuç / müşteri yüzü',
        voice: 'Sonuç: zaman ve maliyet tasarrufu.',
      },
      {
        t: `${Math.max(16, seconds - 4)}–${seconds} sn`,
        shot: 'CTA ekranı',
        voice: 'Kaydet, paylaş, DM at — demo yayın.',
      },
    ],
    musicHint: 'Trending, 100–120 BPM, sözsüz',
    cta: 'Profildeki linke tıkla',
    exampleNote: 'Bu paket örnek akıştır. Meta Graph API yayını henüz bağlı değil.',
  }
}
