/**
 * Web Sitesi Yöneticisi — localStorage tabanlı veri katmanı.
 * Her tenant'ın kendi site(ler)i, sayfaları ve domain bağlantısı tutulur.
 */

export const WEB_SITES_KEY = 'bach-web-sites'
export const WEB_PAGES_KEY = 'bach-web-pages'

// ── Defaults ────────────────────────────────────────────────────────
const DEFAULT_SITES = []
const DEFAULT_PAGES = []

// ── Sites ────────────────────────────────────────────────────────────

/** @returns {import('./webSiteStorage').WebSite[]} */
export function getSites() {
  try {
    const raw = localStorage.getItem(WEB_SITES_KEY)
    if (!raw) return DEFAULT_SITES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_SITES
  } catch {
    return DEFAULT_SITES
  }
}

/** @param {import('./webSiteStorage').WebSite[]} sites */
export function saveSites(sites) {
  try {
    localStorage.setItem(WEB_SITES_KEY, JSON.stringify(sites))
    window.dispatchEvent(new CustomEvent('bach:web-sites-updated'))
  } catch {
    // ignore quota
  }
}

/**
 * @param {{ name: string, domain?: string, status?: string }} data
 * @returns {import('./webSiteStorage').WebSite}
 */
export function createSite({ name, domain = '', status = 'draft' }) {
  const id = `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()
  const site = { id, name, domain: domain.trim(), status, createdAt: now, updatedAt: now }
  const sites = getSites()
  saveSites([...sites, site])
  return site
}

/** @param {string} id @param {Partial<import('./webSiteStorage').WebSite>} patch */
export function updateSite(id, patch) {
  const sites = getSites().map((s) =>
    s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
  )
  saveSites(sites)
}

/** @param {string} id */
export function deleteSite(id) {
  saveSites(getSites().filter((s) => s.id !== id))
  // Siteye ait sayfaları da sil
  savePages(getPages().filter((p) => p.siteId !== id))
}

// ── Pages ─────────────────────────────────────────────────────────────

/** @returns {import('./webSiteStorage').WebPage[]} */
export function getPages() {
  try {
    const raw = localStorage.getItem(WEB_PAGES_KEY)
    if (!raw) return DEFAULT_PAGES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_PAGES
  } catch {
    return DEFAULT_PAGES
  }
}

/** @param {import('./webSiteStorage').WebPage[]} pages */
export function savePages(pages) {
  try {
    localStorage.setItem(WEB_PAGES_KEY, JSON.stringify(pages))
    window.dispatchEvent(new CustomEvent('bach:web-pages-updated'))
  } catch {
    // ignore quota
  }
}

/** @param {{ siteId: string }} query */
export function getPagesBySite(siteId) {
  return getPages().filter((p) => p.siteId === siteId)
}

/**
 * @param {{ siteId: string, title: string, slug?: string, type?: string }} data
 * @returns {import('./webSiteStorage').WebPage}
 */
export function createPage({ siteId, title, slug, type = 'page' }) {
  const id = `page_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()
  const autoSlug = slug || slugify(title)
  const page = {
    id,
    siteId,
    title,
    slug: autoSlug,
    type,
    status: 'draft',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
  savePages([...getPages(), page])
  return page
}

/** @param {string} id @param {Partial<import('./webSiteStorage').WebPage>} patch */
export function updatePage(id, patch) {
  savePages(
    getPages().map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
    ),
  )
}

/** @param {string} id */
export function deletePage(id) {
  savePages(getPages().filter((p) => p.id !== id))
}

// ── Helpers ───────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'sayfa'
}

/**
 * @typedef {{ id: string, name: string, domain: string, status: string, createdAt: string, updatedAt: string }} WebSite
 * @typedef {{ id: string, siteId: string, title: string, slug: string, type: string, status: string, content: string, createdAt: string, updatedAt: string }} WebPage
 */
