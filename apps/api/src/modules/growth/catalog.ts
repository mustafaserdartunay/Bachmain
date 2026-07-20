export const GROWTH_LOCALES = ['tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'ru'] as const

export const SOCIAL_CHANNELS = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'pinterest',
  'youtube',
  'x',
  'threads',
] as const

export const ADS_PLATFORMS = [
  'google_ads',
  'meta_ads',
  'linkedin_ads',
  'tiktok_ads',
  'microsoft_ads',
] as const

export const LEAD_SOURCES = [
  'web_form',
  'qr',
  'ocr',
  'phone',
  'whatsapp',
  'instagram',
  'facebook',
  'linkedin',
  'api',
] as const

export const ANALYTICS_PIXELS = [
  'google_analytics',
  'search_console',
  'meta_pixel',
  'linkedin_pixel',
  'tiktok_pixel',
  'microsoft_clarity',
] as const

export const DEFAULT_FUNNEL_STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'mail', label: 'Mail' },
  { id: 'quote', label: 'Teklif' },
  { id: 'order', label: 'Sipariş' },
  { id: 'payment', label: 'Tahsilat' },
  { id: 'loyalty', label: 'Sadakat' },
]

export function growthCatalog() {
  return {
    locales: GROWTH_LOCALES,
    social: SOCIAL_CHANNELS,
    ads: ADS_PLATFORMS,
    leadSources: LEAD_SOURCES,
    analytics: ANALYTICS_PIXELS,
    defaultFunnelStages: DEFAULT_FUNNEL_STAGES,
    phase: 'AG-0',
  }
}
