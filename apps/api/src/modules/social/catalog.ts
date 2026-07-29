export const SMC_TEMPLATE_SEEDS = [
  { slug: 'yeni-urun', title: 'Yeni Ürün', category: 'product' },
  { slug: 'kampanya', title: 'Kampanya', category: 'campaign' },
  { slug: 'bayram', title: 'Bayram', category: 'seasonal' },
  { slug: 'kurumsal', title: 'Kurumsal', category: 'brand' },
  { slug: 'uretim', title: 'Üretim', category: 'ops' },
  { slug: 'fabrika', title: 'Fabrika', category: 'ops' },
  { slug: 'depo', title: 'Depo', category: 'ops' },
  { slug: 'lojistik', title: 'Lojistik', category: 'ops' },
  { slug: 'basari-hikayesi', title: 'Başarı Hikayesi', category: 'story' },
  { slug: 'musteri-yorumu', title: 'Müşteri Yorumu', category: 'social_proof' },
  { slug: 'fuar', title: 'Fuar', category: 'event' },
  { slug: 'etkinlik', title: 'Etkinlik', category: 'event' },
] as const

export const SMC_RECURRENCE_OPTIONS = [
  'once',
  'daily',
  'weekdays',
  'weekends',
  'weekly',
  'monthly',
  'yearly',
  'every_2_days',
  'every_3_days',
  'every_7_days',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'first_monday',
  'last_friday',
  'cron',
  'custom',
] as const

/** Content publish (SC-0) */
export const META_CONTENT_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_show_list',
  'pages_read_engagement',
  'business_management',
] as const

/** Messaging + inbox (SC-1 / Message Center) — App Review required */
export const META_MESSAGING_SCOPES = [
  'instagram_manage_messages',
  'instagram_manage_comments',
  'pages_messaging',
  'pages_manage_metadata',
  'pages_read_user_content',
] as const

/** WhatsApp Business Cloud — Embedded Signup / Business Management */
export const META_WHATSAPP_SCOPES = [
  'whatsapp_business_management',
  'whatsapp_business_messaging',
  'business_management',
] as const

export const META_PLATFORM_SCOPES = {
  instagram: [...META_CONTENT_SCOPES, ...META_MESSAGING_SCOPES],
  facebook: [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_metadata',
    'business_management',
  ],
  messenger: ['pages_messaging', 'pages_manage_metadata', 'pages_show_list'],
  whatsapp: [...META_WHATSAPP_SCOPES],
  all: Array.from(
    new Set([
      ...META_CONTENT_SCOPES,
      ...META_MESSAGING_SCOPES,
      'pages_manage_posts',
      'pages_manage_metadata',
      ...META_WHATSAPP_SCOPES,
    ]),
  ),
} as const

/** @deprecated use META_PLATFORM_SCOPES.instagram — kept for SC-0 publish */
export const META_OAUTH_SCOPES = META_CONTENT_SCOPES.join(',')

export type SocialPlatform = 'instagram' | 'facebook' | 'messenger' | 'whatsapp'

export const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'messenger', 'whatsapp'] as const
