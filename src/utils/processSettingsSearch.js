export function normalizeProcessSearch(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

/** Süreçler Yönetimi araması — yalnızca panel başlıkları; boş sorguda tüm bölümler görünür. */
export function matchesProcessSearch(query, terms = []) {
  const q = normalizeProcessSearch(query)
  if (!q) return true
  const haystack = (Array.isArray(terms) ? terms : [terms])
    .flatMap((term) => String(term ?? '').split(/[\s,/·]+/))
    .map(normalizeProcessSearch)
    .filter(Boolean)
  if (!haystack.length) return false
  return haystack.some((term) => term.includes(q) || q.includes(term))
}
