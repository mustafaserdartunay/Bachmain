/**
 * Web Sitesi Yöneticisi — localStorage tabanlı veri katmanı.
 * Her tenant'ın kendi site(ler)i, sayfaları ve domain bağlantısı tutulur.
 */

export const WEB_SITES_KEY = 'bach-web-sites'
export const WEB_PAGES_KEY = 'bach-web-pages'
export const WEB_CATEGORIES_KEY = 'bach-web-categories'
export const WEB_STORE_PRODUCTS_KEY = 'bach-web-store-products'

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

export function slugify(text, fallback = 'sayfa') {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeList(key, list, eventName) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(eventName))
  } catch {
    // ignore quota
  }
}

// ── Categories ────────────────────────────────────────────────────────

/** @returns {WebCategory[]} */
export function getWebCategories() {
  return readList(WEB_CATEGORIES_KEY)
}

/** @param {WebCategory[]} categories */
export function saveWebCategories(categories) {
  writeList(WEB_CATEGORIES_KEY, categories, 'bach:web-catalog-updated')
}

/**
 * @param {{ name: string, slug?: string, parentId?: string, description?: string, image?: string, showInMenu?: boolean, showcase?: boolean }} data
 * @returns {WebCategory}
 */
export function createWebCategory({
  name,
  slug,
  parentId = '',
  description = '',
  image = '',
  showInMenu = true,
  showcase = false,
}) {
  const now = new Date().toISOString()
  const category = {
    id: uid('cat'),
    name: name.trim(),
    slug: slugify(slug || name, 'kategori'),
    parentId: parentId || '',
    description: description.trim(),
    image: image.trim(),
    showInMenu: Boolean(showInMenu),
    showcase: Boolean(showcase),
    createdAt: now,
    updatedAt: now,
  }
  saveWebCategories([...getWebCategories(), category])
  return category
}

/** @param {string} id @param {Partial<WebCategory>} patch */
export function updateWebCategory(id, patch) {
  saveWebCategories(
    getWebCategories().map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            name: patch.name != null ? String(patch.name).trim() : item.name,
            slug: patch.slug != null ? slugify(patch.slug, item.slug) : item.slug,
            updatedAt: nowIso(),
          }
        : item,
    ),
  )
}

/** @param {string} id */
export function deleteWebCategory(id) {
  saveWebCategories(
    getWebCategories()
      .filter((item) => item.id !== id)
      .map((item) => (item.parentId === id ? { ...item, parentId: '' } : item)),
  )
  saveWebStoreProducts(
    getWebStoreProducts().map((item) => (item.categoryId === id ? { ...item, categoryId: '' } : item)),
  )
}

export function getWebCategoryById(id) {
  return getWebCategories().find((item) => item.id === id) || null
}

// ── Store products ────────────────────────────────────────────────────

/** @returns {WebStoreProduct[]} */
export function getWebStoreProducts() {
  return readList(WEB_STORE_PRODUCTS_KEY)
}

/** @param {WebStoreProduct[]} products */
export function saveWebStoreProducts(products) {
  writeList(WEB_STORE_PRODUCTS_KEY, products, 'bach:web-catalog-updated')
}

/**
 * @param {{ name: string, slug?: string, sku?: string, categoryId?: string, price?: number, stock?: number, description?: string, image?: string, published?: boolean }} data
 * @returns {WebStoreProduct}
 */
export function createWebStoreProduct({
  name,
  slug,
  sku = '',
  categoryId = '',
  price = 0,
  stock = 0,
  description = '',
  image = '',
  published = true,
}) {
  const now = new Date().toISOString()
  const product = {
    id: uid('wprod'),
    name: name.trim(),
    slug: slugify(slug || name, 'urun'),
    sku: sku.trim(),
    categoryId: categoryId || '',
    price: Number(price) || 0,
    stock: Number(stock) || 0,
    description: description.trim(),
    image: image.trim(),
    published: Boolean(published),
    createdAt: now,
    updatedAt: now,
  }
  saveWebStoreProducts([...getWebStoreProducts(), product])
  return product
}

/** @param {string} id @param {Partial<WebStoreProduct>} patch */
export function updateWebStoreProduct(id, patch) {
  saveWebStoreProducts(
    getWebStoreProducts().map((item) =>
      item.id === id
        ? {
            ...item,
            ...patch,
            name: patch.name != null ? String(patch.name).trim() : item.name,
            slug: patch.slug != null ? slugify(patch.slug, item.slug) : item.slug,
            price: patch.price != null ? Number(patch.price) || 0 : item.price,
            stock: patch.stock != null ? Number(patch.stock) || 0 : item.stock,
            updatedAt: nowIso(),
          }
        : item,
    ),
  )
}

/** @param {string} id */
export function deleteWebStoreProduct(id) {
  saveWebStoreProducts(getWebStoreProducts().filter((item) => item.id !== id))
}

function nowIso() {
  return new Date().toISOString()
}

/**
 * @typedef {{ id: string, name: string, domain: string, status: string, createdAt: string, updatedAt: string }} WebSite
 * @typedef {{ id: string, siteId: string, title: string, slug: string, type: string, status: string, content: string, createdAt: string, updatedAt: string }} WebPage
 * @typedef {{ id: string, name: string, slug: string, parentId: string, description: string, image: string, showInMenu: boolean, showcase: boolean, createdAt: string, updatedAt: string }} WebCategory
 * @typedef {{ id: string, name: string, slug: string, sku: string, categoryId: string, price: number, stock: number, description: string, image: string, published: boolean, createdAt: string, updatedAt: string }} WebStoreProduct
 */
