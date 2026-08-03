/** Stable cache key helper — no secrets in payload assumed. */
export async function createHashKey(value: unknown): Promise<string> {
  const json = JSON.stringify(value, (_key, nested) => {
    if (typeof nested === 'function') return undefined
    if (typeof AbortSignal !== 'undefined' && nested instanceof AbortSignal) return undefined
    return nested
  })
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(json)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for older runtimes — not cryptographically strong; infrastructure only.
  let hash = 0
  for (let i = 0; i < json.length; i += 1) {
    hash = (hash << 5) - hash + json.charCodeAt(i)
    hash |= 0
  }
  return `h${Math.abs(hash)}`
}
