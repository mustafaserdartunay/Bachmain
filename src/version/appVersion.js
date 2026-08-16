/**
 * Bach Main sürüm şeması: BM-V{major}.{ay}{yy}[.patch]
 *
 * Örnek: BM-V1.726 → major 1, Temmuz (7) 2026
 * Aynı ay içinde ek yayın: BM-V1.726.1, BM-V1.726.2
 * Sonraki ay: BM-V1.826 (Ağustos 2026)
 */

export const APP_VERSION = 'BM-V1.826.52'

/** Deploy içeriği damgası — sürüm kodu aynı kalsa bile yenilemeyi tetikler */
export const APP_BUILD = '2026-08-16T02:10:00+03:00'

export const APP_VERSION_META = {
  code: APP_VERSION,
  major: 1,
  month: 8,
  year: 2026,
  patch: 52,
  releasedAt: '2026-08-16T02:10:00+03:00',
  build: APP_BUILD,
  label: 'Ağustos 2026',
}

/** Yerel görülen sürüm + geçiş kaydı (workspace verisine dokunmaz) */
export const VERSION_SEEN_KEY = 'bach-app-version-seen'
export const VERSION_BUILD_SEEN_KEY = 'bach-app-build-seen'
export const VERSION_TRANSITIONS_KEY = 'bach-app-version-transitions'

/**
 * @param {{ major: number, month: number, year: number, patch?: number }} parts
 */
export function formatBachVersion({ major, month, year, patch = 0 }) {
  const yy = String(year).slice(-2)
  const base = `BM-V${major}.${month}${yy}`
  return patch > 0 ? `${base}.${patch}` : base
}

/**
 * Bir sonraki ay sürümünü üretir (major aynı kalır; isteğe bağlı major artışı).
 * @param {{ major: number, month: number, year: number, patch?: number }} current
 * @param {{ bumpMajor?: boolean }} [options]
 */
export function nextMonthVersion(current, options = {}) {
  let { major, month, year } = current
  if (options.bumpMajor) major += 1
  month += 1
  if (month > 12) {
    month = 1
    year += 1
  }
  return {
    major,
    month,
    year,
    patch: 7,
    code: formatBachVersion({ major, month, year, patch: 7 }),
  }
}

/**
 * Aynı ay içinde patch artırır.
 * @param {{ major: number, month: number, year: number, patch?: number }} current
 */
export function nextPatchVersion(current) {
  const patch = (current.patch || 0) + 1
  return {
    ...current,
    patch,
    code: formatBachVersion({ ...current, patch }),
  }
}

export function parseBachVersion(code) {
  const match = String(code || '')
    .trim()
    .match(/^BM-V(\d+)\.(\d{1,2})(\d{2})(?:\.(\d+))?$/i)
  if (!match) return null
  return {
    major: Number(match[1]),
    month: Number(match[2]),
    year: 2000 + Number(match[3]),
    patch: match[4] ? Number(match[4]) : 0,
    code: formatBachVersion({
      major: Number(match[1]),
      month: Number(match[2]),
      year: 2000 + Number(match[3]),
      patch: match[4] ? Number(match[4]) : 0,
    }),
  }
}

export function readVersionTransitions() {
  try {
    const raw = localStorage.getItem(VERSION_TRANSITIONS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function recordVersionTransition(from, to, at = new Date().toISOString()) {
  if (!from || !to || from === to) return
  try {
    const list = readVersionTransitions().filter(
      (row) => !(row.from === from && row.to === to && row.at === at),
    )
    list.unshift({ from, to, at })
    localStorage.setItem(VERSION_TRANSITIONS_KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    /* ignore quota */
  }
}

/** Bu tarayıcıda görülen sürümü kaydeder; değiştiyse geçiş ekler. Workspace silmez. */
export function syncSeenVersion(version = APP_VERSION, build = APP_BUILD) {
  try {
    const seen = localStorage.getItem(VERSION_SEEN_KEY)
    if (seen && seen !== version) {
      recordVersionTransition(seen, version)
    }
    localStorage.setItem(VERSION_SEEN_KEY, version)
    localStorage.setItem(VERSION_BUILD_SEEN_KEY, build)
  } catch {
    /* ignore */
  }
}
