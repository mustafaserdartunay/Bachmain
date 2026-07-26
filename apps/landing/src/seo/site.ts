/**
 * BachMain site SEO constants — single source of truth.
 * Used by Next.js Metadata API, sitemap, robots, and JSON-LD.
 */

export const SITE_URL = 'https://bachmain.com' as const
export const SITE_NAME = 'BACHMAIN' as const
export const SITE_LEGAL_NAME = 'BACHMAIN' as const
export const SITE_TAGLINE = 'Tüm Süreçler Tek Platform — Premium CRM & ERP' as const
export const SITE_LOCALE = 'tr_TR' as const
export const SITE_LANG = 'tr' as const

export const SITE_DESCRIPTION =
  'BACHMAIN; CRM, ERP, stok, üretim, finans, e-fatura, lojistik, WhatsApp ve yapay zeka modüllerini tek premium SaaS platformunda birleştirir. Tekliften tahsilata tüm iş süreçlerinizi yönetin.' as const

export const SITE_KEYWORDS = [
  'CRM',
  'ERP',
  'muhasebe yazılımı',
  'stok yönetimi',
  'üretim takibi',
  'depo yönetimi',
  'finans',
  'e-fatura',
  'lojistik',
  'insan kaynakları',
  'WhatsApp CRM',
  'B2B portal',
  'saha satış',
  'yapay zeka CRM',
  'KOBİ yazılımı',
  'BACHMAIN',
] as const

export const SITE_CONTACT = {
  email: 'destek@bachmain.com',
  phone: '+902129630020',
  phoneDisplay: '0212 963 00 20',
  addressLocality: 'İstanbul',
  addressCountry: 'TR',
} as const

export const SITE_SOCIAL = {
  instagram: 'https://www.instagram.com/bachmain',
  facebook: 'https://www.facebook.com/bachmain',
  x: 'https://x.com/bachmain',
  tiktok: 'https://www.tiktok.com/@bachmain',
  linkedin: 'https://www.linkedin.com/company/bachmain',
} as const

export const OG_IMAGE = `${SITE_URL}/assets/og-default.png` as const
export const OG_IMAGE_ALT = 'BACHMAIN — Tüm Süreçler Tek Platform' as const

export const THEME_COLOR = '#2563eb' as const
export const BACKGROUND_COLOR = '#f4f7fb' as const

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return SITE_URL
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}
