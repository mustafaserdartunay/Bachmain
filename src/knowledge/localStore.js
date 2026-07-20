const STORE_KEY = 'bach-knowledge-docs-v1'
const FAQ_KEY = 'bach-knowledge-faq-v1'
const SEARCH_KEY = 'bach-knowledge-search-v1'

function uid(prefix = 'kd') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)
}

export function listKnowledgeDocs() {
  return read(STORE_KEY, []).filter((d) => !d.deletedAt)
}

export function saveKnowledgeDoc(doc) {
  const rows = read(STORE_KEY, [])
  const idx = rows.findIndex((r) => r.id === doc.id)
  const next = { ...doc, updatedAt: new Date().toISOString() }
  if (idx >= 0) rows[idx] = next
  else rows.unshift(next)
  write(STORE_KEY, rows)
  window.dispatchEvent(new CustomEvent('bach:knowledge-updated'))
  return next
}

export function createKnowledgeDoc({
  title,
  contentText = '',
  category = 'general',
  docType = 'txt',
  tags = [],
  links = [],
}) {
  const now = new Date().toISOString()
  const tokens = tokenize(`${title} ${contentText}`)
  const row = {
    id: uid('kd'),
    title,
    contentText,
    category,
    docType,
    tags,
    links,
    keywords: tokens.slice(0, 12),
    summary: String(contentText).replace(/\s+/g, ' ').trim().slice(0, 280),
    language: 'tr',
    status: 'indexed',
    ocrStatus: 'none',
    indexStatus: 'ready',
    currentVersion: 1,
    versions: [{ version: 1, contentText, changelog: 'Initial', createdAt: now }],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  return saveKnowledgeDoc(row)
}

export function searchLocalKnowledge(query, limit = 10) {
  const qTokens = tokenize(query)
  const docs = listKnowledgeDocs()
  const scored = docs
    .map((d) => {
      const bag = new Set(tokenize(`${d.title} ${d.summary} ${d.contentText}`))
      let hit = 0
      for (const t of qTokens) if (bag.has(t)) hit += 1
      const score = qTokens.length ? hit / qTokens.length : 0
      return {
        documentId: d.id,
        title: d.title,
        category: d.category,
        score,
        snippet: d.summary || '',
      }
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const log = read(SEARCH_KEY, [])
  log.unshift({ query, hitCount: scored.length, at: new Date().toISOString() })
  write(SEARCH_KEY, log.slice(0, 100))
  return scored
}

export function ragLocal(query) {
  const hits = searchLocalKnowledge(query, 5)
  const prompt = `SORU: ${query}\n\nKAYNAKLAR:\n${
    hits.map((h, i) => `[${i + 1}] ${h.title}\n${h.snippet}`).join('\n\n') || '(eşleşme yok)'
  }`
  return { hits, prompt, contextCount: hits.length }
}

export function overviewLocal() {
  const docs = listKnowledgeDocs()
  const log = read(SEARCH_KEY, [])
  const freq = new Map()
  for (const row of log) freq.set(row.query, (freq.get(row.query) || 0) + 1)
  const topQueries = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([query, count]) => ({ query, count }))
  return {
    totalDocuments: docs.length,
    ocrPending: docs.filter((d) => d.ocrStatus === 'pending').length,
    missingTags: docs.filter((d) => !d.tags?.length).length,
    indexedReady: docs.filter((d) => d.indexStatus === 'ready').length,
    topQueries,
  }
}

export function listFaqLocal() {
  return read(FAQ_KEY, [])
}

export function addFaqLocal(question, answer) {
  const rows = read(FAQ_KEY, [])
  const row = {
    id: uid('faq'),
    question,
    answer,
    createdAt: new Date().toISOString(),
  }
  rows.unshift(row)
  write(FAQ_KEY, rows)
  return row
}

/** Seed a few demo docs once */
export function ensureKnowledgeSeed() {
  if (listKnowledgeDocs().length) return
  createKnowledgeDoc({
    title: 'Almanya ihracat paketleme prosedürü',
    category: 'procedures',
    tags: ['almanya', 'ihracat', 'paketleme'],
    contentText:
      'Kırmızı çikolata kutuları Almanya sevkiyatlarında çift kat oluklu mukavva ve nem emici ile paketlenir. Etiketler DE/EN dilinde basılır. 2025 yılında örnek sevkiyatlar Düsseldorf ve Hamburg depolarına yapılmıştır.',
  })
  createKnowledgeDoc({
    title: 'Kalite formu — üretim kartı OCR',
    category: 'sop',
    tags: ['kalite', 'ocr'],
    contentText:
      'Tarama sonrası kalite formları OCR ile okunur; lot no, operatör ve ölçü alanları etiketlenir.',
  })
  createKnowledgeDoc({
    title: 'Şirket gizlilik politikası',
    category: 'policies',
    tags: ['kvkk', 'gizlilik'],
    contentText:
      'AI modellerine şifre, IBAN, kart ve JWT gönderilmez. Knowledge erişimi rol ve şube bazlıdır.',
  })
  addFaqLocal('Knowledge nedir?', 'Şirket belgelerinin indekslendiği RAG bilgi katmanıdır.')
}
