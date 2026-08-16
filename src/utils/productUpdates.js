/**
 * Product updates: features (versioned), training videos, package notices.
 * Unread badges persist per-user in localStorage.
 */
const PLATFORM_API = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'
const CACHE_KEY = 'bachmain_product_updates_cache_v1'
const SEEN_KEY = 'bach:product-updates-seen-v1'

export const UNREAD_PILL_CLASS =
  'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(255,59,48,0.55)]'

export const UPDATE_CHANNELS = {
  feature: 'feature',
  training: 'training',
  package: 'package',
}

const FALLBACK = {
  version: '2.1.0',
  items: [
    {
      id: 'ann_seed_1',
      channel: 'feature',
      code: 'BM-2.1.0',
      version: '2.1.0',
      title: 'Müşteri Ekstre PDF Yenilendi',
      detail: 'Ekstre PDF artık logo ve IBAN bilgilerinizle oluşturuluyor.',
      body: 'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.',
      badge: 'Yeni',
      date: '05.06.2026',
      publishedAt: '2026-06-05T10:00:00.000Z',
    },
    {
      id: 'ann_seed_edu_1',
      channel: 'training',
      code: 'EDU-0001',
      title: 'Teklif listesi ve müşteri sütunları',
      detail: 'Teklifler sayfasında liste ve müşteri adı sütununun kullanımı.',
      body: 'Bu eğitimde teklif listesini, durum filtresini ve müşteri adının nasıl okunacağını gösteriyoruz.',
      videoUrl: '',
      videoTitle: 'Teklif listesi eğitimi',
      badge: 'Yeni',
      date: '15.08.2026',
      publishedAt: '2026-08-15T10:00:00.000Z',
    },
    {
      id: 'ann_seed_pkg_1',
      channel: 'package',
      code: 'PKG-0001',
      title: 'Professional paket fiyat güncellemesi',
      detail: 'Professional aylık paket fiyatı güncellendi.',
      body: 'Professional aylık paket fiyatı güncellendi. Mevcut abonelikler dönem sonuna kadar eski fiyattan devam eder.',
      planName: 'Professional',
      priceFrom: 4900,
      priceTo: 5400,
      priceNote: 'Mevcut abonelikler dönem sonuna kadar eski fiyattan devam eder.',
      badge: 'Fiyat',
      date: '10.08.2026',
      publishedAt: '2026-08-10T10:00:00.000Z',
    },
  ],
}

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
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function readUpdatesCache() {
  const cached = readJson(CACHE_KEY, null)
  if (cached?.items) return cached
  return FALLBACK
}

function writeUpdatesCache(payload) {
  writeJson(CACHE_KEY, { ...payload, at: Date.now() })
}

function readSeenMap() {
  const raw = readJson(SEEN_KEY, {})
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw
}

function writeSeenMap(map) {
  writeJson(SEEN_KEY, map)
}

export function getUnreadIds(items = [], channel) {
  const seen = readSeenMap()
  const seenSet = new Set(seen[channel] || [])
  return items
    .filter((item) => item.channel === channel && item.id && !seenSet.has(item.id))
    .map((item) => item.id)
}

export function countUnread(items = [], channel) {
  return getUnreadIds(items, channel).length
}

export function markChannelSeen(items = [], channel) {
  const seen = readSeenMap()
  const ids = items.filter((item) => item.channel === channel && item.id).map((item) => item.id)
  seen[channel] = [...new Set([...(seen[channel] || []), ...ids])]
  writeSeenMap(seen)
  window.dispatchEvent(new CustomEvent('bach:product-updates-seen', { detail: { channel } }))
}

export function filterChannel(items = [], channel) {
  return items.filter((item) => (item.channel || 'feature') === channel)
}

export async function fetchProductUpdates(channel) {
  const query = channel ? `?channel=${encodeURIComponent(channel)}` : ''
  const res = await fetch(`${PLATFORM_API}/announcements${query}`, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const items = Array.isArray(data.items) ? data.items : []
  const payload = {
    version: data.version || FALLBACK.version,
    items,
    counts: data.counts || {},
  }
  if (!channel && items.length) writeUpdatesCache(payload)
  return payload
}
