import { maskSensitiveText } from '../../shared/crypto.js'

const STOP = new Set([
  've',
  'veya',
  'ile',
  'bir',
  'bu',
  'şu',
  'the',
  'and',
  'or',
  'for',
  'to',
  'of',
  'a',
  'an',
])

export function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

/** Split content into ~800 char chunks with overlap */
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const clean = String(text || '').trim()
  if (!clean) return []
  const chunks: string[] = []
  let i = 0
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size))
    i += Math.max(1, size - overlap)
  }
  return chunks
}

/** Deterministic stub embedding from token bag (KP-0; replace with real model in KP-2) */
export function stubEmbedding(tokens: string[], dims = 32): number[] {
  const vec = new Array(dims).fill(0)
  for (const t of tokens) {
    let h = 0
    for (let i = 0; i < t.length; i += 1) h = (h * 31 + t.charCodeAt(i)) >>> 0
    vec[h % dims] += 1
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}

export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

export function lexicalScore(queryTokens: string[], contentTokens: string[]): number {
  if (!queryTokens.length) return 0
  const set = new Set(contentTokens)
  let hit = 0
  for (const t of queryTokens) if (set.has(t)) hit += 1
  return hit / queryTokens.length
}

export function detectLanguage(text: string): string {
  const t = String(text || '')
  if (/[äöüß]/i.test(t) || /\b(der|die|das|und)\b/i.test(t)) return 'de'
  if (/\b(the|and|with|for)\b/i.test(t) && !/[ğüşıöç]/i.test(t)) return 'en'
  return 'tr'
}

export function extractKeywords(text: string, limit = 12): string[] {
  const freq = new Map<string, number>()
  for (const t of tokenize(text)) freq.set(t, (freq.get(t) || 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k)
}

export function summarize(text: string, max = 280): string {
  const masked = maskSensitiveText(
    String(text || '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
  if (masked.length <= max) return masked
  return `${masked.slice(0, max - 1)}…`
}
