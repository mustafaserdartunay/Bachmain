/** Local fallback when SMC API unavailable — mirrors demo packages. */
const KEY = 'bach_smc_local_v1'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}
function write(patch) {
  const next = { ...read(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:smc-local'))
  return next
}

export function localOverview() {
  const d = read()
  return {
    accounts: (d.accounts || []).length,
    content: (d.content || []).length,
    published: (d.content || []).filter((c) => c.status === 'published').length,
    queuePending: (d.queue || []).length,
    approvalsPending: (d.approvals || []).filter((a) => a.decision === 'pending').length,
    health: { metaConfigured: false, openaiConfigured: false, localFallback: true },
  }
}

export function localListContent() {
  return read().content || []
}

export function localSaveContent(item) {
  const d = read()
  const content = [item, ...(d.content || []).filter((x) => x.id !== item.id)].slice(0, 100)
  write({ content })
  return item
}

export function localSaveBrandKit(kit) {
  const d = read()
  const kits = [kit, ...(d.kits || []).filter((x) => x.id !== kit.id)]
  write({ kits })
  return kit
}

export function localListBrandKits() {
  return read().kits || []
}

export function localAddMedia(asset) {
  const d = read()
  const media = [asset, ...(d.media || [])].slice(0, 200)
  write({ media })
  return asset
}

export function localListMedia() {
  return read().media || []
}

export function buildLocalAiPackage({ feature, topic, tone, pageCount = 5 }) {
  const slides = Array.from({ length: Math.min(20, pageCount) }, (_, i) => ({
    title: `${topic} · ${i + 1}`,
    body: `Sayfa ${i + 1} metni (${tone || 'samimi'})`,
    visual: `Ürün / sahne önerisi ${i + 1}`,
    cta: i === pageCount - 1 ? 'Profildeki linke tıkla' : 'Kaydır →',
  }))
  return {
    id: `local-${Date.now()}`,
    type: feature,
    title: topic,
    status: 'draft',
    payload: {
      topic,
      tone,
      caption: `✨ ${topic}\n\n${tone || 'Profesyonel'} dilde Instagram ${feature}.\n\n👉 Daha fazlası profilde`,
      hashtags: ['#bachmain', '#instagram', '#reel', '#content'],
      altText: `${topic} görseli`,
      cta: 'Profildeki linke tıkla',
      seo: topic,
      emoji: '✨🚀📦',
      hook: `${topic} — 3 sn hook`,
      scenes: [
        { t: '0-3', shot: 'Hook', voice: topic },
        { t: '3-12', shot: 'Ürün', voice: 'Faydayı göster' },
        { t: '12-20', shot: 'CTA', voice: 'Linke tıkla' },
      ],
      slides,
      storyIdeas: [
        { type: 'poll', text: 'Hangisini tercih edersiniz?' },
        { type: 'question', text: 'Sorularınızı yazın' },
        { type: 'countdown', text: 'Lansmana geri sayım' },
        { type: 'announce', text: `${topic} duyurusu` },
      ],
      musicHint: '100–120 BPM sözsüz',
      imagePrompt: `${topic}, clean product photo, brand colors`,
      source: 'local',
    },
    createdAt: new Date().toISOString(),
  }
}
