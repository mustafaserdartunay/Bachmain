/**
 * MDM duplicate helpers for CRM SPA (works offline against local profiles).
 * When platform session + API available, prefers POST /v1/mdm/duplicates.
 */
import { getCustomerProfiles } from '../data/customerProfiles'
import { getStoredSession } from './platformAuth'

const API_BASE =
  import.meta.env.VITE_PLATFORM_API_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('bachmain.com')
    ? 'https://api.bachmain.com'
    : '')

function normalizeTax(v) {
  return String(v || '')
    .replace(/\D/g, '')
    .trim()
}

function normalizePhone(v) {
  return String(v || '')
    .replace(/\D/g, '')
    .replace(/^90/, '')
    .trim()
}

function normalizeEmail(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
}

function normalizeName(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/\b(ltd|limited|a\.?\s*ş\.?|as|sanayi|ticaret|tic)\b/gi, '')
    .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a, b) {
  if (!a || !b) return 0
  if (a === b) return 1
  const bigrams = (s) => {
    const out = new Map()
    for (let i = 0; i < s.length - 1; i += 1) {
      const g = s.slice(i, i + 2)
      out.set(g, (out.get(g) || 0) + 1)
    }
    return out
  }
  const A = bigrams(a)
  const B = bigrams(b)
  let inter = 0
  for (const [g, c] of A) inter += Math.min(c, B.get(g) || 0)
  return (2 * inter) / (a.length + b.length - 2 || 1)
}

export function findLocalCustomerDuplicates(input, { excludeId } = {}) {
  const tax = normalizeTax(input.taxNo || input.vergiNo)
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone || input.telefon)
  const name = normalizeName(input.name || input.firmaAdi || input.unvan)

  return getCustomerProfiles()
    .filter((row) => row && row.id !== excludeId)
    .map((row) => {
      const reasons = []
      let score = 0
      if (tax && normalizeTax(row.taxNo || row.vergiNo) === tax) {
        score += 0.55
        reasons.push('tax_no')
      }
      if (email && normalizeEmail(row.email) === email) {
        score += 0.35
        reasons.push('email')
      }
      const rowPhone = normalizePhone(row.phone || row.telefon)
      if (phone && phone.length >= 7 && rowPhone === phone) {
        score += 0.3
        reasons.push('phone')
      }
      const nameSim = similarity(name, normalizeName(row.name || row.firmaAdi || row.unvan))
      if (nameSim >= 0.72) {
        score += nameSim * 0.4
        reasons.push('name')
      }
      return {
        id: row.id,
        name: row.name || row.firmaAdi || row.unvan,
        email: row.email,
        phone: row.phone || row.telefon,
        taxNo: row.taxNo || row.vergiNo,
        score: Math.min(1, Number(score.toFixed(3))),
        reasons,
        source: 'localStorage',
      }
    })
    .filter((r) => r.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

/** Sunucu yanıt vermezse kaydetme akışı beklemede kalmasın. */
const DUPLICATE_LOOKUP_TIMEOUT_MS = 3000

/** Best-effort: API first, fall back to local. Never throws, never hangs. */
export async function checkCustomerDuplicates(input, opts = {}) {
  const local = findLocalCustomerDuplicates(input, opts)
  const { token } = getStoredSession?.() || {}
  if (!API_BASE || !token) return { matches: local, source: 'local' }

  const abort = typeof AbortController === 'undefined' ? null : new AbortController()
  const timer = abort ? setTimeout(() => abort.abort(), DUPLICATE_LOOKUP_TIMEOUT_MS) : null

  try {
    const res = await fetch(`${String(API_BASE).replace(/\/$/, '')}/v1/mdm/duplicates`, {
      method: 'POST',
      credentials: 'include',
      signal: abort?.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        entityType: 'customer',
        name: input.name || input.firmaAdi || input.unvan,
        email: input.email,
        phone: input.phone || input.telefon,
        taxNo: input.taxNo || input.vergiNo,
      }),
    })
    if (!res.ok) return { matches: local, source: 'local' }
    const data = await res.json()
    const apiMatches = (data.matches || []).map((m) => ({ ...m, source: 'api' }))
    const byId = new Map()
    for (const m of [...apiMatches, ...local]) {
      const prev = byId.get(m.id)
      if (!prev || m.score > prev.score) byId.set(m.id, m)
    }
    return {
      matches: [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 20),
      source: 'api+local',
    }
  } catch {
    return { matches: local, source: 'local' }
  } finally {
    if (timer) clearTimeout(timer)
  }
}
