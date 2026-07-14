/**
 * CRM entitlement helpers — maps sidebar/routes to billing module codes.
 */

export const ROUTE_MODULE_MAP = {
  '/': 'dashboard_basic',
  '/musteriler': 'crm',
  '/tedarikciler': 'crm',
  '/siparisler': 'orders',
  '/teklifler': 'quotes',
  '/satis': 'sales',
  '/satis-faturalari': 'sales',
  '/uretim': 'production',
  '/stok': 'stock',
  '/stok/urunler': 'stock',
  '/stok/depolar': 'warehouse',
  '/kasa': 'finance',
  '/finans': 'finance',
  '/gorevler': 'tasks',
  '/takvim': 'calendar',
  '/randevu': 'appointments',
  '/notlar': 'notes',
  '/mesajlar': 'whatsapp',
  '/whatsapp': 'whatsapp',
  '/pos': 'pos',
  '/b2b': 'b2b',
  '/saha-satis': 'field_sales',
  '/kurye': 'courier',
  '/ik': 'hr',
  '/raporlar': 'reporting',
}

/** Core paths always visible even without entitlements list (profile, billing, settings shell). */
export const ALWAYS_ALLOWED_PATHS = new Set([
  '/profil',
  '/profil/paketim',
  '/profil/paket-satin-al',
  '/profil/odeme',
  '/hesap/lisans',
  '/deneme-bitti',
  '/kurulum',
  '/ayarlar',
  '/giris',
  '/kayit',
])

export function hasModule(entitlements, code) {
  if (!code) return true
  if (!Array.isArray(entitlements) || entitlements.length === 0) {
    // Until entitlements hydrate, allow core navigation (avoid blank sidebar)
    return true
  }
  return entitlements.includes(code) || entitlements.includes('all')
}

export function canAccessPath(entitlements, pathname) {
  if (!pathname) return true
  if (ALWAYS_ALLOWED_PATHS.has(pathname)) return true
  if (pathname.startsWith('/profil') || pathname.startsWith('/ayarlar') || pathname.startsWith('/hesap')) {
    return true
  }
  const exact = ROUTE_MODULE_MAP[pathname]
  if (exact) return hasModule(entitlements, exact)
  // prefix match
  const entry = Object.entries(ROUTE_MODULE_MAP).find(([path]) => path !== '/' && pathname.startsWith(path))
  if (entry) return hasModule(entitlements, entry[1])
  return true
}

export function filterMenuByEntitlements(items, entitlements) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => {
    if (item.moduleCode) return hasModule(entitlements, item.moduleCode)
    if (item.to) return canAccessPath(entitlements, item.to)
    return true
  })
}
